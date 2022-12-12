// JavaScript Document

/// library inclusions and setup of socket

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const csv = require("csv-parser")				// "Package" csv-parser
const fs = require('fs');						// "Package" fs (Filestring)

/// variable definitions

const clientMap = new Map();					// map of all connected clients
var disc;										// username of disconnected client
const players = new Array();					// array of all clients that are playing (because they are connected when the game is started)
var clientArray = new Array();
var activePlayer;								// username of the client that is allowed to draw
var i, k;										// iteration variables
var time, numPlayers, numRounds;				// parameters set by clients when game is started
var currentRound = 0;							// variable showing how far the game has progressed and if it shoul continue
let currentWord = "";							// word that is currently being guessed
var guessed = 0;								// amount of players that have correctly guessed the current word
var duplicatePoints = false;

// csv loading

var words = [];									// word array of all words to skribble
var usedwords = [];								// word array of all previously used words
var words3 = [0, 0, 0];							// the 3 words to deliver

fs.createReadStream("PokemonGerman4thGen.csv")
	.pipe(csv({}))
	.on("data", (data) => words.push(data))
	.on("end", () => {
		//console.log("csv is now loaded in");
	});

// send html file to client when they open the website
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/canvas_noSM8.html');							// send the html file located in the same directory as this file
	//res.sendFile(__dirname + '/canvas - test.html');						// send the html file located in the same directory as this file
});

// asynchrononous function to fill words[]
function FillWords3() {	//fill words3[]
	var filli = 0;
	while (true) {
		var temp = Math.floor(
			Math.random() * (words.length - 1));
		if (
			!(usedwords.includes(words[temp].SkribbleWort))
			&& words3[0] != words[temp].SkribbleWort
			&& words3[1] != words[temp].SkribbleWort) {

			words3[filli] = words[temp].SkribbleWort;
			filli++;
			if (filli == 3) {
				break;
			}
		}
	}
}

// function to determine which player should draw next
function nextPlayer() {											// select next player to draw
	activePlayer = players[k];
	k++;
	if (k >= players.length) {
		k = 0;
	}
	guessed = 0;
}

/// eventHandlers that are active as long as a client is connected

io.on('connection', (socket) => {

	// is executed when a socket connection is closed (e.g. user leaves page)
	socket.on('disconnect', () => {

		const clients = io.allSockets();								// list (of type Promise) of all currently connected sockets
		clients.then(													// needs to be called so that the Promise gets accepted and the included information can be accessed
			function (value) {

				for (const [key, name] of clientMap) {						// check every entry of clientMap to see if 'clients' still includes the socket.ids
					if (value.has(key)) {									// the client is still online because their socket.id is in 'clients'
						//console.log(name + ' is online');
					} else {													// the client has disconneted because their socket.id is no longer in 'clients'
						//console.log(name + ' is not online anymore');
						disc = name;										// the username belonging to the newly disconnected socket is stored so it can be forwarded to the other sockets
						clientMap.delete(key);								// update the list of users that is given to the sockets
						socket.broadcast.emit('user disconnected', disc);	// emit (forward) username of the socket that disconnected
					}
				}
			}
		)
		//console.log(disc + ' disconnected');
	});

	// sends back the currently used usernames to show users and avoid duplicated usernames
	socket.on('checkClients', () => {

		clientArray = [];												// reset clientArray
		i = 0;
		for (const [key, name] of clientMap) {							// save the names of the currently connected clients
			//console.log('online: ' + clientMap.get(key));

			clientArray[i] = name;
			i++;

		}
		//console.log(clientArray);
		socket.emit('clientList', clientArray);
	});

	// is executed when a user sets their username
	socket.on('username set', (username) => {
		socket.broadcast.emit('user connected', username);				// tell the new username to everyone except the one who set it
		clientMap.set(socket.id, username);								// assign username as value to key socket.id
		//console.log(socket.id + ' = ' + clientMap.get(socket.id));		// print out newly connected sockets id and username
		//console.log(username + ' connected');
	});

	// provide client with three (new) random words from the csv file
	socket.on('Words3', () => {
		FillWords3();
		//console.log(words3[0]);													// fill the array with 3 different words
		socket.emit('Words3back', words3);								// send the array to clients
		console.log('Words3 executed.');
	});

	// is executed when a message is sent by one of the sockets
	socket.on('chat message', (msg, sender) => {
		socket.broadcast.emit('chat message', msg, sender);				// forward the message to every socket but the sender
	});

	// forward the information that a user started drawing and the selected color and size
	socket.on('drawStart', (x, y, drawColor, drawSize) => {
		socket.broadcast.emit('drawStart', x, y, drawColor, drawSize);
	});

	// forward current location and tell clients to replicate the drawing at every step
	socket.on('drawMove', (x, y, drawSize, drawColor) => {
		socket.broadcast.emit('drawMove', x, y, drawSize, drawColor);
	});

	// forward information that drawing has ended (pen has been lifted)
	socket.on('drawStop', (x, y) => {
		socket.broadcast.emit('drawStop', x, y);
	});

	// forward that the clear button has been pressed (deletes drawing)
	socket.on('clearCanvas', () => {
		socket.broadcast.emit('clearCanvas');
	});

	// forward that the fill button has been pressed
	socket.on('fillCanvas', (fillColor) => {
		socket.broadcast.emit('fillCanvas', fillColor);
	});

	// receive current word that is sopposed to be guessed/drawn
	socket.on('WordChosen', (ChosenWord) => {
		currentWord = ChosenWord;
		usedwords.push(ChosenWord);										// store ChosenWord to avoid selecting and sending it to client again
		//console.log('ChosenWord: ' + ChosenWord);
		socket.emit('chosenWord', ChosenWord);
		socket.broadcast.emit('chosenWord', ChosenWord);

		console.log('chosenWord executed.');

	});

	// reward points to the person that was drawing in the turn that just ended
	socket.on('activePointRequest', () => {

		currentRound++;

		console.log('activePointRequest executed. \nCurrent Round: ' + currentRound);
		socket.emit('activePoints', activePlayer, guessed, currentRound);
		socket.broadcast.emit('activePoints', activePlayer, guessed, currentRound);

		if (currentRound == (numRounds * numPlayers)) {			// this was the last turn
			socket.emit('gameOver');
			socket.broadcast.emit('gameOver');
		} else {													// there are more turns to come
			nextPlayer();

			socket.emit('pausePhase', activePlayer);
			socket.broadcast.emit('pausePhase', activePlayer);

			console.log('pausePhase executed. \nactivePlayer: ' + activePlayer);
		}

	});

	// receive guess from passive player and evaluate its correctness; also check if this ended the turn and if this turn was the last one
	socket.on('guess', (word, guesser) => {
		// guess checking (case-insensitive)
		let wordLowerCase = currentWord.toLowerCase();					// convert current word to all lower case
		let guessLowerCase = word.toLowerCase();						// convert guess to all lower case

		if (guessLowerCase == wordLowerCase) {							// guess was correct				

			if (players.includes(guesser)) {
				guessed++;
			}

			socket.emit('correctGuess', guesser, guessed);
			socket.broadcast.emit('correctGuess', guesser, guessed);

			console.log('correctGuess executed.');

			if (guessed == (numPlayers - 1)) {							// everybody guessed the word, turn should end
				currentRound++;											// increment turns

				socket.emit('activePointsFull', activePlayer, currentRound);
				socket.broadcast.emit('activePointsFull', activePlayer, currentRound);

				guessed = 0;											// reset guessed for next turn

				if (currentRound == (numRounds * numPlayers)) {			// this was the last turn
					socket.emit('gameOver');
					socket.broadcast.emit('gameOver');
				} else {													// there should be a next turn
					nextPlayer();										// determine who is next to draw

					socket.emit('pausePhase', activePlayer);
					socket.broadcast.emit('pausePhase', activePlayer);

					console.log('pausePhase executed. \nactivePlayer: ' + activePlayer);

				}
				console.log('activePointsFull executed. \nCurrent Round: ' + currentRound);
			}
		} else {															// guess was incorrect
			socket.emit('chat message', word, guesser);					// let players display guess
			socket.broadcast.emit('chat message', word, guesser);
		}
	});

	// clients indicate wish to start the game
	socket.on('startGame', (numberPlayers, numberRounds, drawTime) => {

		time = drawTime;												// save time for drawing, set by client; is forwarded in 'playPhase'
		numPlayers = numberPlayers;
		numRounds = numberRounds;
		currentRound = 0;

		console.log('numPlayers: ' + numPlayers);
		console.log('numRounds: ' + numRounds);

		var numTurns = (numPlayers * numRounds * 2);
		// console.log('numTurns: ' + numTurns);
		socket.broadcast.emit('gameInfo', numPlayers, numTurns);
		socket.emit('gameInfo', numPlayers, numTurns);

		i = 0;
		for (const [key, name] of clientMap) {							// save the names of the currently connected clients
			players[i] = name;
			i++;
		}
		//console.log('players: \n' + players);
		//console.log(clientMap.size + ' clients');
		//console.log(players.length + ' players');
		//console.log(numberPlayers + ' expected players');
		k = 0;

		if (clientMap.size != numberPlayers) {
			socket.emit('playersUnequal');
			socket.broadcast.emit('playersUnequal');
		} else {
			activePlayer = players[0];									// order of active players is ascending from oldest connected client
			//console.log('activePlayer:' + activePlayer);
			//console.log('k:' + k);
			k++;
			if (k >= players.length) {
				k = 0;
			}
			//console.log('k:' + k);
			socket.emit('pausePhase', activePlayer);					// start the game with a pausePhase to select a word
			socket.broadcast.emit('pausePhase', activePlayer);

			console.log('pausePhase executed. \nactivePlayer: ' + activePlayer);

		}
	});

	// tell the clients that a playPhase of the correct length should start if the pausePhase ended 
	socket.on('nextPlay', () => {
		socket.emit('playPhase', time);
		socket.broadcast.emit('playPhase', time);						// broadcast and regular emit needed to reach everybody
	});

	// determine and announce the next client to choose a word and draw afterwards 
	socket.on('nextPause', () => {

		nextPlayer();

		socket.emit('pausePhase', activePlayer);
		socket.broadcast.emit('pausePhase', activePlayer);

		console.log('pausePhase executed. \nactivePlayer: ' + activePlayer);

	});

	// tell players that the game ended and that winner should be displayed
	socket.on('nextScores', () => {
		socket.emit('gameOver');
		socket.broadcast.emit('gameOver');
	});

	// go back to default state from which a new game can be started
	socket.on('nextIdle', () => {
		socket.emit('idle');
		socket.broadcast.emit('idle');
	});

});

/// start listening on the designated port

server.listen(3000, () => {											// start server and choose port (here: 3000)
	console.log('listening on *:3000');
});
