## Working features:

* game loop (with or without interaction)
* word selection (random if not during time limit)
* displaying random letters
* guessing (only if you are not drawing; only readable if wrong)
* writing word in chat after turn ended
* calculation and updating of scores (for guessers and drawer)
* showing winner at the end of the game

---

### possible **ToDo:**

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