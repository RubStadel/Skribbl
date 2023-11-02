# How To Use

* download node.js [here](https://nodejs.org/en "node.js downloads") and install it
* open node.js command prompt
* enter `npm install express@4 --save`
* enter `npm install socket.io --save`
* enter `npm install csv-parser --save`
* navigate to the location of this folder using `cd [directory]` to go deeper into the tree, `cd ..` to go up one step or `cd /` to return to C:
* run the server file by entering `node server.js`
* open a browser of your choice and go to port 3000 of your own IP-address using "localhost:3000" or "[IP-address]:3000"
* *(optional: - to see the transfer of data in action, open another tab/window to the same address and create a second client)*

* create your own word lists as .csv files and play with friends **(The first line of all .csv files has to be `SkribbleWort`!!!)**

---

Further reading:

> [Concept Inspiration](https://skribbl.io/ "Original game")
>
> [Get Started with socket.io](https://socket.io/get-started/chat "Small chat application and socket.io API documentation")
>
> [Canvas reference](https://www.w3schools.com/graphics/canvas\_reference.asp "Also a great place to learn about/look up all things HTML, CSS etc.")
>
> [Code Inspiration](https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ "Basic drawing functionality")
>
> [Countdown](https://stackoverflow.com/questions/8634415/recurrent-javascript-countdown "See 'Krzysztof's answer")
>
> [JS Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Map "Useful for assigning usernames to sockets (serverside)")
>
> [JS Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Promise "Needed because currently connected sockets are saved as a promise")

---

## List of Shortcuts

* *e* => toggle the eraser
* *f* => fill with current color
* *c* => clear the drawing area
* *h* => toggle history
* *i* => equip the eyedropper
* *\+* or *arrow up* => increase linewidth
* *\-* or *arrow down* => decrease linewidth

---

### **possible ToDo/Improvements:**

* [ ] improve design of scoreboard
* [ ] test functionality for late players (join after game has started)
* [ ] implement flashier presentation of final scores
* [ ] selection of which .csv to use when starting the server

---

### **Score calculation:**

active player:

* everybody guesses word: 50 Points
* nobody guesses word: 0 Points
* everything in between:
  * linear scaling, rounded down
  * 100/(numberOfPassivePlayers \* 2) Points per correct guess
  * e.g.
    * 3 passive players:
      * score = 100/(3 \* 2) Points per correct guess
      * => 100/6 = **16 Points per correct guess**

passive player:

* first to guess correctly: 300/(numberOfPassivePlayers \* 2)
* last to guess correctly: 100/(numberOfPassivePlayers \* 2)
* everything in between:
  * linear scaling
  * e.g.
    * 3 passive players:
    * first: 300/6 = **50 Points**
    * second: 200/6 = **33 Points**
    * third: 100/6 = **16 Points**

---

### **Timing of letter reveals**

* number of letters revealed = ceil(word length/2) + 1
* last letter is revealed when 10 seconds remain
* interval between letters being revealed = (time to draw - 10s)/ceil(word length/2)
  * e.g.
    * word has five letters and time to draw is 60 seconds:
    * number of letters revealed = 3 + 1 = **4**
    * interval = floor(50s/3) = **16 seconds**
