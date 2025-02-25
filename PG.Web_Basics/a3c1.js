let mode = "single";
let player1Score = 0;
let player2Score = 0;
let computerScore = 0;
let player1Choice = "";
let player2Choice = "";
function setMode(selectedMode) {
  mode = selectedMode;
  var gameArea = document.getElementById("game-area");
  var player2Box = document.getElementById("player2-box");
  var player2ScoreBox = document.getElementById("player2-score-box");
  var computerScoreBox = document.getElementById("computer-score-box");
  if (mode === "two") {
    gameArea.classList.remove("single-mode");
    player2Box.classList.remove("hidden");
    player2ScoreBox.classList.remove("hidden");
    computerScoreBox.classList.add("hidden");
  } else {
    gameArea.classList.add("single-mode");
    player2Box.classList.add("hidden");
    player2ScoreBox.classList.add("hidden");
    computerScoreBox.classList.remove("hidden");
  }
  resetGame(true);
}
function playGame(choice, player) {
  if (mode === "single") {
    playSinglePlayer(choice);
  } else {
    playTwoPlayer(choice, player);
  }
}
function playSinglePlayer(playerChoice) {
  var choices = ["rock", "paper", "scissors"];
  var computerChoice = choices[Math.floor(Math.random() * 3)];

  document.getElementById("player1-choice").innerText =
    "You chose: " + playerChoice;
  document.getElementById("player2-choice").innerText =
    "Computer chose: " + computerChoice;

  var result = determineWinner(playerChoice, computerChoice);
  if (result === "win") player1Score++;
  if (result === "lose") computerScore++;

  updateResult(result, "single");
}
function playTwoPlayer(choice, player) {
  if (player === 1) {
    player1Choice = choice;
  } else {
    player2Choice = choice;
  }
  if (player1Choice !== "" && player2Choice !== "") {
    document.getElementById("player1-choice").innerText =
      "Player 1 chose: " + player1Choice;
    document.getElementById("player2-choice").innerText =
      "Player 2 chose: " + player2Choice;

    var result = determineWinner(player1Choice, player2Choice);
    if (result === "win") {
      player1Score++;
      updateResult("Player 1 wins!", "two");
    } else if (result === "lose") {
      player2Score++;
      updateResult("Player 2 wins!", "two");
    } else {
      updateResult("It's a draw!", "two");
    }
    player1Choice = "";
    player2Choice = "";
  }
}
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return "draw";
  if (
    (choice1 === "rock" && choice2 === "scissors") ||
    (choice1 === "paper" && choice2 === "rock") ||
    (choice1 === "scissors" && choice2 === "paper")
  ) {
    return "win";
  }
  return "lose";
}
function updateResult(result, gameMode) {
  document.getElementById("result").innerText = "Result: " + result;
  document.getElementById("player1-score").innerText = player1Score;
  document.getElementById("player2-score").innerText = player2Score;
  if (gameMode === "single") {
    document.getElementById("computer-score").innerText = computerScore;
  }
}
function resetGame(fullReset) {
  player1Choice = "";
  player2Choice = "";
  document.getElementById("player1-choice").innerText = "You chose:";
  document.getElementById("player2-choice").innerText =
    mode === "single" ? "Computer chose:" : "Player 2 chose:";
  document.getElementById("result").innerText = "Result:";
  if (fullReset) {
    player1Score = 0;
    player2Score = 0;
    computerScore = 0;
    document.getElementById("player1-score").innerText = "0";
    document.getElementById("player2-score").innerText = "0";
    document.getElementById("computer-score").innerText = "0";
  }
}
