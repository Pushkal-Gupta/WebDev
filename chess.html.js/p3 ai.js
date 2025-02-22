//Navbar Line Stay on Active Tab
document.addEventListener("DOMContentLoaded", function () {
  var navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.forEach(function (nav) {
        nav.classList.remove("active");
      });
      this.classList.add("active");
    });
  });
});

//Data
dataReload();
function dataReload() {
  clrRed = "#ff0000";
  clrYellow = "#ffff00";
  clrDefaultArr = [
    "#ffffff",
    "#33b3a6",
    "#caf8ca",
    "#2afecb",
    blendColors("#ffffff", clrRed, 0.6),
    blendColors("#33b3a6", clrRed, 0.6),
    blendColors("#ffffff", clrYellow, 0.5),
    blendColors("#33b3a6", clrYellow, 0.5),
  ];
  //clr3 = "#69923e";
  time = "";
  navIconArr = [
    "<i class='fa-regular fa-hourglass-half'></i>",
    "<i class='fa-solid fa-folder-open'></i>",
    "<i class='fa-solid fa-chart-simple'></i>",
    "<i class='fa-solid fa-computer'></i>",
  ];
  navArr = ["Time Limit", "New Game", "Analysis", "Computer"];
  chessArr = [];
  temp = {};
  pointCountInitInit = {
    whitepawn: 8,
    whiteknight: 2,
    whitebishop: 2,
    whiterook: 2,
    whitequeen: 1,
    whiteking: 1,
    blackpawn: 8,
    blackknight: 2,
    blackbishop: 2,
    blackrook: 2,
    blackqueen: 1,
    blackking: 1,
  };
  timeArr = [
    "1 min",
    "1|1",
    "2|1",
    "3 min",
    "3|2",
    "5 min",
    "10 min",
    "15|10",
    "30 min",
    "1 day",
    "3 days",
    "7 days",
  ];
  iconTimeArr = [
    "<div class='icon-label1'><i class='fa-solid fa-joint icon' style='color:#DAA520'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-bolt-lightning icon' style ='color:#FFEA00'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-stopwatch icon' style='color:#8DB000'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-sun icon' style='color:#FDDA0D'></i>",
  ];
  baseImagePath =
    "file:///Users/pushkalgupta/Desktop/JavaScript/Project/chess.html.js/images/";
  pieceImagePaths = ["pieces/", "piecesClassic/", "piecesWooden/"];
  imagePath = baseImagePath + pieceImagePaths[0];
  pieceImageArr = [
    "pawn+white.png",
    "knight+white.png",
    "bishop+white.png",
    "rook+white.png",
    "queen+white.png",
    "king+white.png",
    "pawn+black.png",
    "knight+black.png",
    "bishop+black.png",
    "rook+black.png",
    "queen+black.png",
    "king+black.png",
  ];
  boardArrLine = [{}, {}, {}, {}, {}, {}, {}, {}];
  boardArr = boardArrLine.map(function (ele) {
    return [...boardArrLine];
  });
  timeLabelArr = ["Bullet", "Blitz", "Rapid", "Daily"];
  displayStr = "";
  leftBarArr1 = [
    "Default",
    "Change Board Color",
    "Change Highlighted Color",
    "Change Check Color",
    "Change Previous Moves Color",
    "Change Piece Type",
    "Label Column & Row",
    "Themes",
    "No More Changes",
  ];
  leftBarArr2 = [
    "Default",
    "Highlight Previous Moves",
    "Highlight Selected Piece",
    "Show Legal Moves",
    "Change Valid Moves Dot",
    "No More Changes",
  ];
  leftBarArr3 = ["Show PGN", "Import PGN", "No More Changes"];
}

//Routine Function Calls
routineFunctionCalls();
function routineFunctionCalls() {
  defaultFunctionSettings();
  makeDefaultUISettings1();
  makeDefaultUISettings2();
  createNavbar();
}

//Basic UI
function createNavbar() {
  navBarArr = navArr.map(function (ele, index) {
    return (
      "<li class='nav-item'><a class='nav-link nav-item' aria-current='page'  href = '#' id = 'Navbar" +
      index +
      "' onclick = navActions(" +
      index +
      ")>" +
      navIconArr[index] +
      " " +
      ele +
      "</a></li>"
    );
  });
  document.getElementById("navbar").innerHTML = navBarArr.join("");
}
function navActions(index) {
  makeLeftBar();
  if (index == 0) {
    document.getElementById("leftbar").innerHTML = "";
    makeTimer();
  } else if (index == 1) {
    if (time === "") document.getElementById("leftbar").innerHTML = "";
    makeStartBoard();
    makeBoard();
  } else {
    if (time === "") document.getElementById("leftbar").innerHTML = "";
    showCustomAlert("Under Maintenance");
  }
}
function makeTimer() {
  selectedStr =
    "<div class='col p-0 mb-2 mx-1 bg-transparent '><div class='row justify-content-center'><button type='button' class='p-3 btn btn-light w-100 h-100 btn-green' onclick = confirmedTime()><span id = 'timeLimit'>Select Time</span></button></div></div>";
  formArr = timeArr.map(function (ele, index) {
    str = "";
    str =
      index % 3 === 0
        ? iconTimeArr[index / 3] +
          "<label class='form-label'>" +
          timeLabelArr[index / 3] +
          "</label></div><div class='row justify-content-center'>"
        : "";
    str += index % 3 == 0 && index != 0 ? "</div>" : "";
    return (
      str +
      "<div class='col p-0 mb-2 mx-1 bg-transparent '><button type='button' class='p-3 btn btn-light btn-block w-100 h-100' onclick = btnTimeActions(" +
      index +
      ")>" +
      ele +
      "</button></div>"
    );
  });
  displayStr =
    "<div class='containerFrame text-center'>" +
    selectedStr +
    formArr.join("") +
    "</div><div class='col p-0 mb-2 mx-1 bg-transparent '><div id = 'info' class='row justify-content-center'></div></div>";
  document.getElementById("display").innerHTML = displayStr;
}
function btnTimeActions(index) {
  time = timeArr[index];
  index1 = Math.floor(index / 3);
  iconStr = iconTimeArr[index1];
  iconStr = iconStr.replace("'><i class", " justify-content-center'><i class");
  timeStr = iconStr + time + "</div>";
  document.getElementById("timeLimit").innerHTML = timeStr;
  str =
    "<br><button type='button' class='p-3 btn btn-light btn-block w-100 h-100 btn-confirm' onclick = switchNavTab_LoadGame()>Play Game</button>";
  document.getElementById("info").innerHTML = str;
}
function makeCell(row, col) {
  let pieceStr = "";
  let possibleMoveStr = "";
  let extraInfoStr = "";
  let labelStr =
    col === 0 ? "<div class = 'p-1 label-col-box'>" + (8 - row) + "</div>" : "";
  num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });
  if (Object.keys(boardArr[row][col]).length != 0)
    pieceStr =
      "<img src = '" +
      imagePath +
      boardArr[row][col].key +
      "' onclick = hello(" +
      row +
      "," +
      col +
      ")>";
  if (num != -1 && legalBool)
    if (Object.keys(boardArr[row][col]).length != 0)
      possibleMoveStr =
        "<svg xmlns='http://www.w3.org/2000/svg' class = 'possible-move-square' viewBox='0 0 80 80' width='80' height='80'><circle cx='40' cy='40' r=" +
        highlightDotRadius +
        " fill='rgba(256, 100, 100, 0.4)'/></svg>";
    else
      possibleMoveStr =
        "<svg xmlns='http://www.w3.org/2000/svg' class = 'possible-move-square' viewBox='0 0 80 80' width='80' height='80'><circle cx='40' cy='40' r=" +
        highlightDotRadius +
        " fill='rgba(100, 100, 100, 0.4)'/></svg>";
  if (row === 0 && col === 0) {
    extraInfoStr = "-top-start";
  } else if (row === 7 && col === 0) {
    extraInfoStr = "-bottom-start";
  } else if (row === 0 && col === 7) {
    extraInfoStr = "-top-end";
  } else if (row === 7 && col === 7) {
    extraInfoStr = "-bottom-end";
  }
  if (prevrow === row && prevcol === col && highlightPieceBool)
    cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  else if (
    pgnArr.length != 0 &&
    pgnArr[pgnArr.length - 1].prevrow === row &&
    pgnArr[pgnArr.length - 1].prevcol === col &&
    highlightPreviousBool
  )
    cellColor = (row + col) % 2 === 0 ? clr1p : clr2p;
  else if (
    pgnArr.length != 0 &&
    pgnArr[pgnArr.length - 1].newrow === row &&
    pgnArr[pgnArr.length - 1].newcol === col &&
    highlightPreviousBool
  )
    cellColor = (row + col) % 2 === 0 ? clr1p : clr2p;
  else cellColor = (row + col) % 2 === 0 ? clr1 : clr2;
  if (underCheck.bool && underCheck.posx === row && underCheck.posy === col) {
    cellColor = (row + col) % 2 === 0 ? clr1c : clr2c;
    if (prevrow === row && prevcol === col && highlightPieceBool)
      cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  }
  return (
    labelStr +
    "<div class= 'cellBox cellBorder" +
    extraInfoStr +
    "' onclick = boardClick(" +
    row +
    "," +
    col +
    ") style='background-color: " +
    cellColor +
    "'>" +
    pieceStr +
    possibleMoveStr +
    "</div>"
  );
}
function makeBoard() {
  str = "";
  for (i = 0; i <= 7; i++) {
    str +=
      "<div class='container'><div class='row row-cols-8 justify-content-center'>";
    for (j = 0; j <= 7; j++) str = str += makeCell(i, j);
    str += "</div></div>";
  }
  let labelArrMap = labelArr.map(function (ele) {
    return "<div class='cellBox abcd-label'>" + ele + "</div>";
  });
  displayStr =
    "<div class = 'containerFrame'>" +
    str +
    "<div class='row row-cols-8 abcd-label-padding'>" +
    labelArrMap.join("") +
    "</div></div>";
  if (time === "") {
    displayStr =
      "<div class='containerFrame'><button type='button' class='p-3 btn btn-light w-100 h-100 btn-block-red' onclick='switchNavTab_MakeTimer()'>Go To Select Time</button></div>";
  }
  document.getElementById("display").innerHTML = displayStr + virtualBoardStr;
}
function confirmedTime() {
  if (document.getElementById("timeLimit").innerHTML === "Select Time") {
    document.getElementById("timeLimit").innerHTML = "Please Select Time";
  } else if (
    document.getElementById("timeLimit").innerHTML === "Please Select Time"
  ) {
    showCustomAlert("Please Select Time");
  } else {
    switchNavTab_LoadGame();
  }
}
function makeLeftBar() {
  let arr1 = leftBarArr1.map(function (ele) {
    return "<option>" + ele + "</option>";
  });
  let arr2 = leftBarArr2.map(function (ele) {
    return "<option>" + ele + "</option>";
  });
  let arr3 = leftBarArr3.map(function (ele) {
    return "<option>" + ele + "</option>";
  });
  leftStr =
    "<div class = 'containerLeft'><div class='btn-group-vertical w-100' role='group'><div class='btn-group' role='group'><button class = 'p-3 btn btn-light btn-block-red w-100 h-100' onclick = 'undoMove()'><i class='fa-solid fa-left-long'></i> Undo Move</button><button class = 'p-3 btn btn-light btn-green w-100 h-100' onclick = 'redoMove()'><i class='fa-solid fa-right-long'></i> Redo Move</button></div><select class='p-3 btn btn-light left-bar-block w-100 h-100' id = 'dd1' onChange=dd1Actions()><option selected disabled>" +
    // "&#xf43c; " +
    leftBarArrAll[0] +
    "</option>" +
    arr1.join("") +
    "</select><div id = 'dd1menu' class = 'w-100'></div><div class = 'height-break'></div><select class='p-3 btn  btn-light left-bar-block w-100 h-100' id= 'dd2' onChange=dd2Actions()><option selected disabled>" +
    // "&#xf047; " +
    leftBarArrAll[1] +
    "</option>" +
    arr2.join("") +
    "</select><div id = 'dd2menu' class = 'w-100'></div><div class = 'height-break'></div><select class='p-3 btn btn-light left-bar-block w-100 h-100' id= 'dd3' onChange=dd3Actions()><option selected disabled>" +
    // "&#xf044; " +
    leftBarArrAll[2] +
    "</option>" +
    arr3.join("") +
    "</select><div id = 'dd3menu' class = 'w-100'></div><div class = 'height-break'></div><div id = 'missingPiece' class ='missing-piece'></div></div>";
  document.getElementById("leftbar").innerHTML = leftStr;
}
function makeStartBoard() {
  for (row = 0; row <= 7; row++) {
    for (col = 0; col <= 7; col++) {
      if (row === 1)
        boardArr[row][col] = {
          piece: "pawn",
          color: "black",
          key: pieceImageArr[6],
          points: -1,
        };
      else if (row === 6)
        boardArr[row][col] = {
          piece: "pawn",
          color: "white",
          key: pieceImageArr[0],
          points: 1,
        };
      else if (row === 0 && (col === 0 || col === 7))
        boardArr[row][col] = {
          piece: "rook",
          color: "black",
          key: pieceImageArr[9],
          points: -5,
        };
      else if (row === 0 && (col === 1 || col === 6))
        boardArr[row][col] = {
          piece: "knight",
          color: "black",
          key: pieceImageArr[7],
          points: -3,
        };
      else if (row === 0 && (col === 2 || col === 5))
        boardArr[row][col] = {
          piece: "bishop",
          color: "black",
          key: pieceImageArr[8],
          points: -3,
        };
      else if (row === 0 && col === 3)
        boardArr[row][col] = {
          piece: "queen",
          color: "black",
          key: pieceImageArr[10],
          points: -9,
        };
      else if (row === 0 && col === 4)
        boardArr[row][col] = {
          piece: "king",
          color: "black",
          key: pieceImageArr[11],
          points: -1000,
        };
      else if (row === 7 && (col === 0 || col === 7))
        boardArr[row][col] = {
          piece: "rook",
          color: "white",
          key: pieceImageArr[3],
          points: 5,
        };
      else if (row === 7 && (col === 1 || col === 6))
        boardArr[row][col] = {
          piece: "knight",
          color: "white",
          key: pieceImageArr[1],
          points: 3,
        };
      else if (row === 7 && (col === 2 || col === 5))
        boardArr[row][col] = {
          piece: "bishop",
          color: "white",
          key: pieceImageArr[2],
          points: 3,
        };
      else if (row === 7 && col === 3)
        boardArr[row][col] = {
          piece: "queen",
          color: "white",
          key: pieceImageArr[4],
          points: 9,
        };
      else if (row === 7 && col === 4)
        boardArr[row][col] = {
          piece: "king",
          color: "white",
          key: pieceImageArr[5],
          points: 1000,
        };
      else boardArr[row][col] = {};
    }
  }
  defaultFunctionSettings();
}
function defaultFunctionSettings() {
  pointCountInit = { ...pointCountInitInit };
  pointCount = { ...pointCountInit };
  castleBool = {
    shortwhite: true,
    shortblack: true,
    longwhite: true,
    longblack: true,
  };
  moveCount = 0;
  prevrow = -1;
  prevcol = -1;
  showMovesArr = [];
  pgnArr = [];
  pgnStr = "";
  virtualBoardStr = "";
  labelArr = ["a", "b", "c", "d", "e", "f", "g", "h"];
  underCheck = { bool: false, posx: -1, posy: -1 };
  afterMoveInCheckBool = false;
  isLoadingPGNPawnPromotionJSON = {};
  lastMoveJSON = {
    prevrow: -1,
    prevcol: -1,
    newrow: -1,
    newcol: -1,
    key: {},
    color: "",
    piece: "",
    checkBool: false,
    cutPiece: {},
    enPassant: false,
    castleBool: false,
    moveNumber: 1,
    pawnPromotion: false,
    ambiguityBoolColSame: false,
    ambiguityBool: false,
    pawnPromotedto: "",
    castleDisable: -1,
  };
  leftBarArrAll = ["Board Settings", "Move Settings", "Game Settings"];
  console.clear();
}

//Board Logic
function boardClick(row, col) {
  console.log(prevrow, prevcol, row, col);
  if (prevrow === -1 || prevcol === -1) {
    if (
      Object.keys(boardArr[row][col]).length != 0 &&
      moveStartConditon(row, col)
    ) {
      prevrow = row;
      prevcol = col;
      showValidMoves();
      inCheckCondition(boardArr[row][col].color);
      if (boardArr[prevrow][prevcol].piece === "king") checkCastle();
      makeBoard();
    }
  } else if (prevrow === row && prevcol === col) {
    prevrow = -1;
    prevcol = -1;
    showMovesArr = [];
    makeBoard();
  } else {
    let obj = showMovesArr.find(function (ele) {
      return ele.row === row && ele.col === col;
    });
    if (obj) {
      lastMove(row, col);
      let localePgnGenerationStopBool = true;
      if (
        checkEnPassant(row, col, boardArr[prevrow][prevcol].color) &&
        pgnArr.length != 0
      ) {
        lastMoveJSON.enPassant = true;
        lastMoveJSON.cutPiece =
          boardArr[pgnArr[pgnArr.length - 1].newrow][
            pgnArr[pgnArr.length - 1].newcol
          ];
        boardArr[pgnArr[pgnArr.length - 1].newrow][
          pgnArr[pgnArr.length - 1].newcol
        ] = {};
        let pointColor =
          boardArr[prevrow][prevcol].color === "white" ? "black" : "white";
        pointUpdateCounter("pawn", pointColor);
      }
      if (
        ((boardArr[prevrow][prevcol].color === "white" && row === 0) ||
          (boardArr[prevrow][prevcol].color === "black" && row === 7)) &&
        boardArr[prevrow][prevcol].piece === "pawn"
      ) {
        if (Object.keys(isLoadingPGNPawnPromotionJSON).length === 0) {
          pawnPromotion(row, col, boardArr[prevrow][prevcol].color);
          localePgnGenerationStopBool = false;
        }
      }
      if (boardArr[prevrow][prevcol].piece === "king") {
        if (Math.abs(prevrow - row) === 0 && Math.abs(prevcol - col) === 2) {
          lastMoveJSON.castleBool = true;
          castleMove(row, col, boardArr[prevrow][prevcol].color);
        }
        lastMoveJSON.castleDisable = moveCount;
        castleBool["short" + boardArr[prevrow][prevcol].color] = false;
        castleBool["long" + boardArr[prevrow][prevcol].color] = false;
      }
      if (boardArr[prevrow][prevcol].piece === "rook") {
        let sideStr = prevcol === 0 ? "long" : "short";
        lastMoveJSON.castleDisable = moveCount;
        castleBool[sideStr + boardArr[prevrow][prevcol].color] = false;
      }
      temp = boardArr[row][col];
      boardArr[row][col] = boardArr[prevrow][prevcol];
      boardArr[prevrow][prevcol] = {};
      if (Object.keys(isLoadingPGNPawnPromotionJSON).length != 0) {
        boardArr[isLoadingPGNPawnPromotionJSON.row][
          isLoadingPGNPawnPromotionJSON.col
        ] = isLoadingPGNPawnPromotionJSON.json;
        missingPiecesUpdate();
      }
      moveCount++;
      prevrow = -1;
      prevcol = -1;
      showMovesArr = [];
      checkCheck();
      lastMoveJSON.checkBool = underCheck.bool;
      if (localePgnGenerationStopBool) {
        pgnArr.push(lastMoveJSON);
      }
      makePGN();
      makeBoard();
      if (Object.keys(temp).length != 0)
        pointUpdateCounter(temp.piece, temp.color);
      if (document.getElementById("dd3").value === leftBarArr3[0]) showPGN();
    } else if (moveStartConditon(row, col)) {
      prevrow = row;
      prevcol = col;
      showValidMoves();
      inCheckCondition(boardArr[row][col].color);
      if (boardArr[prevrow][prevcol].piece === "king") checkCastle();
      makeBoard();
    }
  }
}
function validMoves(row, col) {
  mainBool = checkBasicRules(row, col, boardArr[prevrow][prevcol].color);
  if (boardArr[prevrow][prevcol].piece === "pawn") {
    if (!pawnConditions(row, col, boardArr[prevrow][prevcol].color))
      mainBool = false;
  } else if (boardArr[prevrow][prevcol].piece === "knight") {
    if (!knightConditions(row, col)) mainBool = false;
  } else if (boardArr[prevrow][prevcol].piece === "bishop") {
    if (!bishopConditions(row, col)) mainBool = false;
  } else if (boardArr[prevrow][prevcol].piece === "rook") {
    if (!rookConditions(row, col)) mainBool = false;
  } else if (boardArr[prevrow][prevcol].piece === "queen") {
    if (!queenConditions(row, col)) mainBool = false;
  } else if (boardArr[prevrow][prevcol].piece === "king") {
    if (!kingConditions(row, col, boardArr[prevrow][prevcol].color))
      mainBool = false;
  }
  return mainBool;
}
function checkBasicRules(row, col, color) {
  let bool = true;
  bool = color === boardArr[row][col].color ? false : bool;
  bool =
    jumpConditon(row, col) || boardArr[prevrow][prevcol].piece === "knight"
      ? bool
      : false;
  bool = !moveStartConditon(prevrow, prevcol) ? false : bool;
  bool = prevrow === row && prevcol === col ? false : bool;
  return bool;
}
function moveStartConditon(localrow, localcol) {
  let color = boardArr[localrow][localcol].color;
  return (
    (moveCount % 2 === 1 && color === "black") ||
    (moveCount % 2 === 0 && color === "white")
  );
}
function jumpConditon(row, col) {
  let bool = true;
  let rowVar = prevrow < row ? prevrow : row;
  let colVar = prevcol < col ? prevcol : col;
  let step = 1;
  if (prevrow === row) {
    for (let i = 1; i < Math.abs(prevcol - col); i++) {
      if (Object.keys(boardArr[row][colVar + i]).length != 0) bool = false;
    }
  } else if (prevcol === col) {
    for (let i = 1; i < Math.abs(prevrow - row); i++) {
      if (Object.keys(boardArr[rowVar + i][col]).length != 0) bool = false;
    }
  } else if (Math.abs(prevcol - col) === Math.abs(prevrow - row)) {
    if (prevrow - row + prevcol - col === 0) {
      colVar = prevcol < col ? col : prevcol;
      step = -1;
    }
    for (let i = 1; i < Math.abs(prevrow - row); i++) {
      if (Object.keys(boardArr[rowVar + i][colVar + i * step]).length != 0)
        bool = false;
    }
  }
  if (Math.abs(prevrow - row) <= 1 && Math.abs(prevcol - col) <= 1) bool = true;
  return bool;
}
function inCheckCondition(color) {
  let rowState = -1;
  let colState = -1;
  let kUseArr = [];
  let testArr = showMovesArr;
  moveCount--;
  let isEnpassant = false;
  let enPassantPiece = {};
  for (let k = 0; k < showMovesArr.length; k++) {
    isEnpassant = checkEnPassant(
      showMovesArr[k].row,
      showMovesArr[k].col,
      boardArr[prevrow][prevcol].color
    );
    if (isEnpassant) {
      enPassantPiece =
        boardArr[pgnArr[pgnArr.length - 1].newrow][
          pgnArr[pgnArr.length - 1].newcol
        ];
      boardArr[pgnArr[pgnArr.length - 1].newrow][
        pgnArr[pgnArr.length - 1].newcol
      ] = {};
    }
    let pieceAtMovedSpot = boardArr[showMovesArr[k].row][showMovesArr[k].col];
    boardArr[showMovesArr[k].row][showMovesArr[k].col] =
      boardArr[prevrow][prevcol];
    boardArr[prevrow][prevcol] = {};
    for (i = 0; i <= 7; i++) {
      for (j = 0; j <= 7; j++) {
        if (
          boardArr[i][j] &&
          boardArr[i][j].color === color &&
          boardArr[i][j].piece === "king"
        ) {
          rowState = i;
          colState = j;
        }
      }
    }
    let prevrowState = prevrow;
    let prevcolState = prevcol;
    for (i = 0; i <= 7; i++) {
      for (j = 0; j <= 7; j++) {
        if (
          Object.keys(boardArr[i][j]).length != 0 &&
          boardArr[i][j].color != color
        ) {
          prevrow = i;
          prevcol = j;
          if (validMoves(rowState, colState, false)) {
            kUseArr.push(showMovesArr[k]);
          }
        }
      }
    }
    prevrow = prevrowState;
    prevcol = prevcolState;
    if (isEnpassant) {
      boardArr[pgnArr[pgnArr.length - 1].newrow][
        pgnArr[pgnArr.length - 1].newcol
      ] = enPassantPiece;
      isEnpassant = false;
    }
    boardArr[prevrow][prevcol] =
      boardArr[showMovesArr[k].row][showMovesArr[k].col];
    boardArr[showMovesArr[k].row][showMovesArr[k].col] = pieceAtMovedSpot;
  }
  for (let i = 0; i < kUseArr.length; i++) {
    let elem = kUseArr[i];
    testArr = testArr.filter(function (ele) {
      return !(ele.row === elem.row && ele.col === elem.col);
    });
  }
  showMovesArr = testArr;
  moveCount++;
}
function showValidMoves() {
  showMovesArr = [];
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      if (validMoves(i, j)) {
        showMovesArr.push({ row: i, col: j });
      }
    }
  }
}
function checkCheck() {
  let localeColor = moveCount % 2 === 0 ? "black" : "white";
  moveCount--;
  let prevRowState = prevrow;
  let prevColState = prevcol;
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      if (
        boardArr[i][j].color === localeColor &&
        Object.keys(boardArr[i][j]).length != 0
      ) {
        prevrow = i;
        prevcol = j;
        showValidMoves();
        for (let k = 0; k < showMovesArr.length; k++) {
          if (
            boardArr[showMovesArr[k].row][showMovesArr[k].col].piece ===
              "king" &&
            boardArr[showMovesArr[k].row][showMovesArr[k].col].color !=
              localeColor
          ) {
            underCheck = {
              bool: true,
              posx: showMovesArr[k].row,
              posy: showMovesArr[k].col,
            };
            prevrow = prevRowState;
            prevcol = prevColState;
            showMovesArr = [];
            moveCount++;
            return "Hello World";
          }
        }
      }
    }
  }
  prevrow = prevRowState;
  prevcol = prevColState;
  showMovesArr = [];
  underCheck = { bool: false, posx: -1, posy: -1 };
  moveCount++;
  return "Hello World";
}

//Piece Logic
function pawnConditions(row, col, color) {
  let bool = false;
  num = color === "black" ? 1 : -1;
  if (
    prevcol === col &&
    prevrow + num >= 0 &&
    prevrow + num <= 7 &&
    Object.keys(boardArr[prevrow + num][col]).length === 0
  ) {
    if (
      prevrow === 1 &&
      row === 3 &&
      num === 1 &&
      Object.keys(boardArr[3][col]).length === 0
    ) {
      bool = true;
    } else if (
      prevrow === 6 &&
      row === 4 &&
      num === -1 &&
      Object.keys(boardArr[4][col]).length === 0
    ) {
      bool = true;
    } else if (prevrow + num === row) {
      bool = true;
    }
  } else if (Math.abs(prevcol - col) === 1) {
    if (prevrow + num === row && Object.keys(boardArr[row][col]).length != 0) {
      bool = true;
    } else bool = checkEnPassant(row, col, color);
  }
  return bool;
}
function checkEnPassant(row, col, color) {
  num = color === "black" ? 1 : -1;
  let json = pgnArr.length != 0 ? pgnArr[pgnArr.length - 1] : null;
  if (
    boardArr[prevrow][prevcol].piece === "pawn" &&
    json &&
    json.piece === "pawn" &&
    json.color != color &&
    Math.abs(json.prevrow - json.newrow) == 2 &&
    json.newrow === prevrow &&
    Math.abs(json.newcol - prevcol) === 1 &&
    json.newcol === col &&
    json.newrow + num === row
  ) {
    return true;
  } else return false;
}
function pawnPromotion(row, col, color) {
  virtualBoardArr = boardArrLine.map(function (ele) {
    return [...boardArrLine];
  });
  let num = color === "black" ? 6 : 0;
  let number = color === "black" ? -1 : 1;
  virtualBoardArr[row][col] = {
    piece: "queen",
    color: color,
    key: pieceImageArr[num + 4],
    points: 9 * number,
  };
  virtualBoardArr[row + number][col] = {
    piece: "rook",
    color: color,
    key: pieceImageArr[num + 3],
    points: 5 * number,
  };
  virtualBoardArr[row + 2 * number][col] = {
    piece: "bishop",
    color: color,
    key: pieceImageArr[num + 2],
    points: 3 * number,
  };
  virtualBoardArr[row + 3 * number][col] = {
    piece: "knight",
    color: color,
    key: pieceImageArr[num + 1],
    points: 3 * number,
  };
  str = "";
  for (i = 0; i <= 7; i++) {
    str +=
      "<div class='container' style='background-color: rgba(0,0,0,0.6)'><div class='row row-cols-8 justify-content-center'>";
    for (j = 0; j <= 7; j++) str = str += makeVirtualCell(i, j);
    str += "</div></div>";
  }
  let labelArrMap = labelArr.map(function (ele) {
    return "<div class='cellBox abcd-label'></div>";
  });
  virtualBoardStr =
    "<div class = 'containerFrame-virtual'>" +
    str +
    "<div class='row row-cols-8 abcd-label-padding' style = 'background-color : rgba(0,0,0,0.6)'>" +
    labelArrMap.join("") +
    "</div></div>";
  makeBoard();
}
function pawnPromotionClick(row, col) {
  virtualBoardStr = "";
  let localerow = row < 4 ? 0 : 7;
  boardArr[localerow][col] = virtualBoardArr[row][col];
  lastMoveJSON.pawnPromotion = true;
  lastMoveJSON.pawnPromotedto = virtualBoardArr[row][col].piece;
  pointCount[virtualBoardArr[row][col].color + "pawn"]--;
  pointCount[
    virtualBoardArr[row][col].color + virtualBoardArr[row][col].piece
  ]++;
  pointCountInit[
    virtualBoardArr[row][col].color + virtualBoardArr[row][col].piece
  ]++;
  missingPiecesUpdate();
  checkCheck();
  lastMoveJSON.checkBool = underCheck.bool;
  pgnArr.push(lastMoveJSON);
  makePGN();
  if (document.getElementById("dd3").value === leftBarArr3[0]) showPGN();
  makeBoard();
  virtualBoardArr = boardArrLine.map(function (ele) {
    return [...boardArrLine];
  });
}
function makeVirtualCell(row, col) {
  let pieceStr = "";
  let colorStr = "";
  let extraInfoStr = "";
  let onclickStr = "";
  let labelStr = col === 0 ? "<div class = 'p-1 label-col-box'></div>" : "";
  num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });
  if (Object.keys(virtualBoardArr[row][col]).length != 0)
    pieceStr =
      "<img src = '" +
      imagePath +
      virtualBoardArr[row][col].key +
      "' onclick = hello(" +
      row +
      "," +
      col +
      ")>";
  if (row === 0 && col === 0) {
    extraInfoStr = "-top-start";
  } else if (row === 7 && col === 0) {
    extraInfoStr = "-bottom-start";
  } else if (row === 0 && col === 7) {
    extraInfoStr = "-top-end";
  } else if (row === 7 && col === 7) {
    extraInfoStr = "-bottom-end";
  }
  if (Object.keys(virtualBoardArr[row][col]).length != 0) {
    colorStr =
      virtualBoardArr[row][col].color === "white"
        ? " gradient-circle-white'"
        : " gradient-circle-black'";
    onclickStr = " onclick = pawnPromotionClick(" + row + "," + col + ")>";
  } else {
    colorStr = "'";
    onclickStr = " >";
  }
  return (
    labelStr +
    "<div class= 'virtualBox virtualBorder" +
    extraInfoStr +
    colorStr +
    onclickStr +
    pieceStr +
    "</div>"
  );
}
function knightConditions(row, col) {
  let bool = false;
  if (
    (Math.abs(prevrow - row) === 2 && Math.abs(prevcol - col) === 1) ||
    (Math.abs(prevcol - col) === 2 && Math.abs(prevrow - row) === 1)
  ) {
    bool = true;
  }
  return bool;
}
function bishopConditions(row, col) {
  let bool = false;
  if (Math.abs(prevrow - row) === Math.abs(prevcol - col)) {
    bool = true;
  }
  return bool;
}
function rookConditions(row, col) {
  let bool = false;
  if (prevcol === col || prevrow === row) bool = true;
  return bool;
}
function queenConditions(row, col) {
  return bishopConditions(row, col) || rookConditions(row, col);
}
function kingConditions(row, col, color) {
  let bool = false;
  if (Math.abs(prevrow - row) <= 1 && Math.abs(prevcol - col) <= 1) {
    bool = true;
  }
  if (
    Math.abs(prevrow - row) === 0 &&
    Math.abs(prevcol - col) === 2 &&
    !underCheck.bool
  ) {
    if (col < prevcol) {
      if (
        Object.keys(boardArr[row][1]).length === 0 &&
        Object.keys(boardArr[row][2]).length === 0 &&
        Object.keys(boardArr[row][3]).length === 0 &&
        castleBool["long" + color]
      ) {
        bool = true;
      }
    } else if (col > prevcol) {
      if (
        Object.keys(boardArr[row][5]).length === 0 &&
        Object.keys(boardArr[row][6]).length === 0 &&
        castleBool["short" + color]
      )
        bool = true;
    }
  }
  return bool;
}
function checkCastle() {
  let bool = false;
  bool = checkCheckCastle(prevrow, 5) || checkCheckCastle(prevrow, 6);
  if (bool || underCheck.bool) {
    let index = showMovesArr.findIndex(function (ele) {
      return ele.row === prevrow && ele.col === 6;
    });
    if (index != -1) showMovesArr.splice(index, 1);
  }
  bool = checkCheckCastle(prevrow, 2) || checkCheckCastle(prevrow, 3);
  if (bool || underCheck.bool) {
    let index = showMovesArr.findIndex(function (ele) {
      return ele.row === prevrow && ele.col === 2;
    });
    if (index != -1) showMovesArr.splice(index, 1);
  }
}
function checkCheckCastle(castleRowColor, castleColColor) {
  let localeColor = moveCount % 2 === 0 ? "black" : "white";
  moveCount--;
  let prevRowState = prevrow;
  let prevColState = prevcol;
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      if (
        boardArr[i][j].color === localeColor &&
        Object.keys(boardArr[i][j]).length != 0
      ) {
        prevrow = i;
        prevcol = j;
        if (validMoves(castleRowColor, castleColColor)) {
          prevrow = prevRowState;
          prevcol = prevColState;
          moveCount++;
          return true;
        }
      }
    }
  }
  prevrow = prevRowState;
  prevcol = prevColState;
  moveCount++;
  return false;
}
function castleMove(row, col, color) {
  if (col > prevcol && castleBool["short" + color]) {
    boardArr[row][5] = boardArr[row][7];
    boardArr[row][7] = {};
  } else if (col < prevcol && castleBool["long" + color]) {
    boardArr[row][3] = boardArr[row][0];
    boardArr[row][0] = {};
  }
}

//Extra Board Functionality
function lastMove(row, col) {
  lastMoveJSON = {
    prevrow: prevrow,
    prevcol: prevcol,
    newrow: row,
    newcol: col,
    key: boardArr[prevrow][prevcol],
    color: boardArr[prevrow][prevcol].color,
    piece: boardArr[prevrow][prevcol].piece,
    moveNumber: moveCount,
    checkBool: false,
    enPassant: false,
    pawnPromotion: false,
    castleBool: false,
    castleDisable: -1,
    pawnPromotedto: "",
    ambiguityBoolColSame: checkAmbiguityLastMove(row, col, "Col"),
    ambiguityBool: checkAmbiguityLastMove(row, col, "Basic"),
  };
  if (Object.keys(boardArr[row][col]).length != 0)
    lastMoveJSON.cutPiece = boardArr[row][col];
  else lastMoveJSON.cutPiece = {};
}
function checkAmbiguityLastMove(row, col, value) {
  let piece = boardArr[prevrow][prevcol].piece;
  let color = boardArr[prevrow][prevcol].color;
  if (piece === "pawn" || piece === "king") return false;
  let prevRowState = prevrow;
  let prevColState = prevcol;
  let pieceArr = [];
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      if (
        boardArr[i][j].piece === piece &&
        boardArr[i][j].color === color &&
        !(i === prevrow && j === prevcol)
      )
        pieceArr.push({ row: i, col: j });
    }
  }
  if (pieceArr.length === 0) return false;
  for (let i = 0; i < pieceArr.length; i++) {
    prevrow = pieceArr[i].row;
    prevcol = pieceArr[i].col;
    if (validMoves(row, col)) {
      if (value === "Basic") {
        prevrow = prevRowState;
        prevcol = prevColState;
        return true;
      }
      if (pieceArr[i].col === prevColState)
        if (value === "Col") {
          prevrow = prevRowState;
          prevcol = prevColState;
          return true;
        }
    }
  }
  prevrow = prevRowState;
  prevcol = prevColState;
  return false;
}
function undoMove() {
  let lastMoveJSON = pgnArr.pop();
  boardArr[lastMoveJSON.prevrow][lastMoveJSON.prevcol] = lastMoveJSON.key;
  moveCount--;
  if (lastMoveJSON.castleDisable === lastMoveJSON.moveNumber) {
    if (lastMoveJSON.piece === "king") {
      castleBool["short" + lastMoveJSON.color] = true;
      castleBool["long" + lastMoveJSON.color] = true;
    }
    if (lastMoveJSON.piece === "rook") {
      let sideStr = lastMoveJSON.prevcol === 7 ? "short" : "long";
      castleBool[sideStr + lastMoveJSON.color] = true;
    }
  }
  if (lastMoveJSON.enPassant) {
    let localeColor = lastMoveJSON.color === "white" ? "black" : "white";
    pointCount[localeColor + "pawn"]++;
    boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol] = {};
    boardArr[lastMoveJSON.prevrow][lastMoveJSON.newcol] = lastMoveJSON.cutPiece;
  } else if (lastMoveJSON.pawnPromotion) {
    boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol] = lastMoveJSON.cutPiece;
    pointCount[lastMoveJSON.cutPiece.color + lastMoveJSON.cutPiece.piece]++;
    pointCount[lastMoveJSON.color + "pawn"]++;
    pointCountInit[
      lastMoveJSON.color +
        boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol].piece
    ]--;
    pointCount[
      lastMoveJSON.color +
        boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol].piece
    ]--;
  } else if (lastMoveJSON.castleBool) {
    boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol] = {};
    if (lastMoveJSON.newcol === 6) {
      boardArr[lastMoveJSON.prevrow][7] = boardArr[lastMoveJSON.prevrow][5];
      boardArr[lastMoveJSON.prevrow][5] = {};
      castleBool["short" + lastMoveJSON.color] = true;
    } else if (lastMoveJSON.newcol === 2) {
      boardArr[lastMoveJSON.prevrow][0] = boardArr[lastMoveJSON.prevrow][3];
      boardArr[lastMoveJSON.prevrow][3] = {};
      castleBool["long" + lastMoveJSON.color] = true;
    }
  } else if (Object.keys(lastMoveJSON.cutPiece).length != 0) {
    boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol] = lastMoveJSON.cutPiece;
    pointCount[lastMoveJSON.cutPiece.color + lastMoveJSON.cutPiece.piece]++;
  } else {
    boardArr[lastMoveJSON.newrow][lastMoveJSON.newcol] = lastMoveJSON.cutPiece;
  }
  missingPiecesUpdate();
  checkCheck();
  makePGN();
  if (document.getElementById("dd3").value === leftBarArr3[0]) showPGN();
  highlightPieceBool = false;
  makeBoard();
  highlightPieceBool = true;
}

//Pieces Lost/ Points Update
function pointUpdateCounter(piece, color) {
  pointCount[color + piece]--;
  missingPiecesUpdate();
}
function missingPiecesUpdate() {
  let pieces = Object.keys(pointCount);
  let missingPiecesCountArr = pieces.map(function (ele) {
    return pointCountInit[ele] - pointCount[ele];
  });
  let strMap = missingPiecesCountArr.map(function (ele, index) {
    return ("<img src = '" + imagePath + pieceImageArr[index] + "'>").repeat(
      ele
    );
  });
  document.getElementById("missingPiece").innerHTML =
    strMap.join("") + pointDifference();
}
function diffPoints() {
  return boardArr.reduce(function (ans, ele) {
    return (
      ans +
      ele.reduce(function (ans1, ele1) {
        return ele1.points ? ans1 + ele1.points : ans1;
      }, 0)
    );
  }, 0);
}
function pointDifference() {
  let pointsStr = "<br>";
  let evalNumber = diffPoints();
  showCustomAlert(evalNumber);
  if (evalNumber > 0) {
    pointsStr = "<p class = 'text-white'>+" + evalNumber + "(white)</p>";
  } else if (evalNumber < 0) {
    pointsStr = "<p class = 'text-black'>+" + evalNumber + "(black)</p>";
  } else {
    pointsStr = "";
  }
  return pointsStr;
}

//PGN Encoder Decoder
function makePGN() {
  pgnStr = pgnArr.reduce(function (ans, ele) {
    let notation = "";
    let colPgn = ["a", "b", "c", "d", "e", "f", "g", "h"];
    if (ele.color === "white")
      notation += Math.floor(ele.moveNumber / 2) + 1 + ".";
    if (!ele.castleBool) {
      if (ele.piece === "knight") notation += "N";
      else if (ele.piece === "rook") notation += "R";
      else if (ele.piece === "bishop") notation += "B";
      else if (ele.piece === "king") notation += "K";
      else if (ele.piece === "queen") notation += "Q";
      if (ele.ambiguityBool)
        if (ele.ambiguityBoolColSame) notation += String(8 - ele.prevrow);
        else notation += colPgn[ele.prevcol];
      if (Object.keys(ele.cutPiece).length != 0) {
        if (ele.piece === "pawn") notation += colPgn[ele.prevcol];
        notation += "x";
      }
      notation += colPgn[ele.newcol];
      notation += String(8 - ele.newrow);
      if (ele.pawnPromotion) {
        notation += "=";
        if (ele.pawnPromotedto === "knight") notation += "N";
        else if (ele.pawnPromotedto === "rook") notation += "R";
        else if (ele.pawnPromotedto === "bishop") notation += "B";
        else if (ele.pawnPromotedto === "king") notation += "K";
        else if (ele.pawnPromotedto === "queen") notation += "Q";
      }
      if (ele.checkBool) notation += "+";
    } else if (ele.newcol === 6) {
      notation += "O-O";
    } else if (ele.newcol === 2) {
      notation += "O-O-O";
    }
    notation += " ";
    return ans + notation;
  }, " ");
}
function importGame() {
  makeStartBoard();
  pgnStr = document.getElementById("moveHistory").value;
  document.getElementById("dd3").value = leftBarArr3[0];
  showPGN();
  decodePGN();
  isLoadingPGNPawnPromotionJSON = {};
  makeBoard();
}
function decodePGN() {
  let colPgn = ["a", "b", "c", "d", "e", "f", "g", "h"];
  pgnStr = pgnStr.trim();
  let arrSplit = pgnStr.split(" ");
  for (let i = 0; i < arrSplit.length; i++) {
    let forBool = true;
    let lastMovePGN = {
      codePGN: "",
      prevrow: -1,
      prevcol: -1,
      newrow: -1,
      newcol: -1,
      key: "",
      piece: "",
      promotedtoPiecePoints: -1,
      color: i % 2 == 0 ? "white" : "black",
      moveNumber: i,
      enPassantBool: false,
      cutPieceBool: false,
      promotionBool: false,
      promotedtoPiece: "",
      checkBool: false,
      castleBool: false,
      castleType: "",
      ambiguityBool: false,
      ambiguityBoolColSame: false,
    };
    let moveStrdecodePGN = "";
    if (i % 2 === 0) {
      let arrSplitDot = arrSplit[i].split(".");
      moveStrdecodePGN = arrSplitDot[1];
    } else moveStrdecodePGN = arrSplit[i];
    if (moveStrdecodePGN === "O-O") {
      lastMovePGN.castleBool = true;
      lastMovePGN.piece = "king";
      lastMovePGN.castleType = "short";
      forBool = false;
    }
    if (moveStrdecodePGN === "O-O-O") {
      lastMovePGN.castleBool = true;
      lastMovePGN.piece = "king";
      lastMovePGN.castleType = "long";
      forBool = false;
    }
    lastMovePGN.codePGN = moveStrdecodePGN;
    if (forBool && moveStrdecodePGN) {
      let num = 1;
      if (moveStrdecodePGN[0] === "N") lastMovePGN.piece = "knight";
      else if (moveStrdecodePGN[0] === "R") lastMovePGN.piece = "rook";
      else if (moveStrdecodePGN[0] === "B") lastMovePGN.piece = "bishop";
      else if (moveStrdecodePGN[0] === "Q") lastMovePGN.piece = "queen";
      else if (moveStrdecodePGN[0] === "K") lastMovePGN.piece = "king";
      else {
        lastMovePGN.piece = "pawn";
        let indexCol = colPgn.findIndex(function (ele) {
          return ele === moveStrdecodePGN[0];
        });
        lastMovePGN.prevcol = indexCol;
      }
      lastMovePGN.key = lastMovePGN.piece + "+" + lastMovePGN.color + ".png";
      for (let j = 0; j < moveStrdecodePGN.length; j++) {
        if (moveStrdecodePGN[j] === "x") lastMovePGN.cutPieceBool = true;
        if (moveStrdecodePGN[j] === "+") lastMovePGN.checkBool = true;
        if (moveStrdecodePGN[j] === "=") {
          lastMovePGN.promotionBool = true;
          let localePointMultplierNumber =
            lastMovePGN.color === "black" ? -1 : 1;
          if (moveStrdecodePGN[j + 1] === "N") {
            lastMovePGN.promotedtoPiece = "knight";
            lastMovePGN.promotedtoPiecePoints = 3 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "R") {
            lastMovePGN.promotedtoPiece = "rook";
            lastMovePGN.promotedtoPiecePoints = 5 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "B") {
            lastMovePGN.promotedtoPiece = "bishop";
            lastMovePGN.promotedtoPiecePoints = 3 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "Q") {
            lastMovePGN.promotedtoPiece = "queen";
            lastMovePGN.promotedtoPiecePoints = 9 * localePointMultplierNumber;
          }
        }
      }
      if (
        lastMovePGN.piece != "pawn" &&
        lastMovePGN.piece != "king" &&
        moveStrdecodePGN.length >= 4
      ) {
        if (moveStrdecodePGN.length > 4 && lastMovePGN.cutPieceBool) {
          lastMovePGN.ambiguityBool = true;
        } else if (moveStrdecodePGN.length > 4 && lastMovePGN.checkBool) {
          lastMovePGN.ambiguityBool = true;
        } else if (!lastMovePGN.cutPieceBool && !lastMovePGN.checkBool)
          lastMovePGN.ambiguityBool = true;
      }
      if (lastMovePGN.ambiguityBool) {
        if (moveStrdecodePGN[1] >= "0" && moveStrdecodePGN[1] <= "9") {
          lastMovePGN.ambiguityBoolColSame = true;
          lastMovePGN.prevrow = +moveStrdecodePGN[1];
        } else {
          let indexCol = colPgn.findIndex(function (ele) {
            return ele === moveStrdecodePGN[1];
          });
          lastMovePGN.prevcol = indexCol;
        }
      }
      if (lastMovePGN.checkBool) num++;
      if (lastMovePGN.promotionBool) num += 2;
      lastMovePGN.newrow = 8 - moveStrdecodePGN[moveStrdecodePGN.length - num];
      let indexCol = colPgn.findIndex(function (ele) {
        return ele === moveStrdecodePGN[moveStrdecodePGN.length - num - 1];
      });
      lastMovePGN.newcol = indexCol;
    }
    if (lastMovePGN.piece === "pawn" && lastMovePGN.cutPieceBool) {
      if (
        Object.keys(boardArr[lastMovePGN.newrow][lastMovePGN.newcol]).length ===
        0
      )
        lastMovePGN.enPassantBool = true;
    }
    if (lastMovePGN.codePGN) {
      makeBoardViaPGN(lastMovePGN);
    }
  }
}
function makeBoardViaPGN(lastMovePGN) {
  let newMoveLoad = { prevrow: -1, prevcol: -1, newrow: -1, newcol: -1 };
  let ogprevDetails = [];
  let pieceArr = [];
  let piece = lastMovePGN.piece;
  let color = lastMovePGN.color;
  let extraDetailsColSameBool = false;
  let extraDetails = -1;
  if (lastMovePGN.ambiguityBool) {
    if (lastMovePGN.ambiguityBoolColSame) {
      extraDetails = lastMovePGN.prevrow;
      extraDetailsColSameBool = true;
    } else extraDetails = lastMovePGN.prevcol;
  }
  if (!lastMovePGN.castleBool) {
    for (let j = 0; j <= 7; j++) {
      for (let k = 0; k <= 7; k++) {
        let ele = boardArr[j][k];
        if (ele.piece === piece && ele.color === color) {
          let jsonPiece = { row: j, col: k };
          pieceArr.push(jsonPiece);
        }
      }
    }
    for (let j = 0; j < pieceArr.length; j++) {
      prevrow = pieceArr[j].row;
      prevcol = pieceArr[j].col;
      if (validMoves(lastMovePGN.newrow, lastMovePGN.newcol)) {
        ogprevDetails.push(pieceArr[j]);
      }
    }
    if (ogprevDetails.length != 1) {
      for (let j = 0; j < ogprevDetails.length; j++) {
        if (extraDetailsColSameBool) {
          if (ogprevDetails[j].row != extraDetails) {
            ogprevDetails.splice(j, 1);
          }
        } else {
          if (
            ogprevDetails[j].col != extraDetails ||
            (lastMovePGN.piece === "pawn" &&
              ogprevDetails[j].col != lastMovePGN.prevcol)
          ) {
            ogprevDetails.splice(j, 1);
          }
        }
      }
    }
    if (ogprevDetails.length === 1) {
      newMoveLoad = {
        prevrow: ogprevDetails[0].row,
        prevcol: ogprevDetails[0].col,
        newrow: lastMovePGN.newrow,
        newcol: lastMovePGN.newcol,
      };
    }
    if (lastMovePGN.promotionBool) {
      pointCount[color + "pawn"]--;
      pointCount[color + lastMovePGN.promotedtoPiece]++;
      pointCountInit[color + lastMovePGN.promotedtoPiece]++;
      isLoadingPGNPawnPromotionJSON = {
        row: lastMovePGN.newrow,
        col: lastMovePGN.newcol,
        json: {
          piece: lastMovePGN.promotedtoPiece,
          color: color,
          key: lastMovePGN.promotedtoPiece + "+" + color + ".png",
          points: lastMovePGN.promotedtoPiecePoints,
        },
      };
    } else isLoadingPGNPawnPromotionJSON = {};
  } else {
    if (lastMovePGN.castleType === "short") {
      let colorRow = color === "white" ? 7 : 0;
      newMoveLoad = {
        prevrow: colorRow,
        prevcol: 4,
        newrow: colorRow,
        newcol: 6,
      };
    }
    if (lastMovePGN.castleType === "long") {
      let colorRow = color === "white" ? 7 : 0;
      newMoveLoad = {
        prevrow: colorRow,
        prevcol: 4,
        newrow: colorRow,
        newcol: 2,
      };
    }
  }
  playMovePGN(newMoveLoad);
}
function playMovePGN(newMoveLoad) {
  console.log(newMoveLoad);
  prevrow = -1;
  prevcol = -1;
  boardClick(newMoveLoad.prevrow, newMoveLoad.prevcol);
  boardClick(newMoveLoad.newrow, newMoveLoad.newcol);
}

//UI LeftBar Actions
function dd1Actions() {
  let value = document.getElementById("dd1").value;
  let index = leftBarArr1.findIndex(function (ele) {
    return ele === value;
  });
  if (index === 0) {
    defaultBoardUI1();
  } else if (index === 1) {
    changeBoardColorUI();
  } else if (index === 2) {
    changeHighlightedColorUI();
  } else if (index === 3) {
    changeCheckColorUI();
  } else if (index === 4) {
    changePreviousColorUI();
  } else if (index === 5) {
    changePieceType();
  } else if (index === 6) {
    showLabels();
  } else if (index === 7) {
    changeThemesUI();
  } else if (index === 8) {
    document.getElementById("dd1").value = leftBarArrAll[0];
    document.getElementById("dd1menu").innerHTML = "";
  }
  document.getElementById("dd2menu").innerHTML = "";
  document.getElementById("dd2").value = leftBarArrAll[1];
  document.getElementById("dd3menu").innerHTML = "";
  document.getElementById("dd3").value = leftBarArrAll[2];
}
function dd2Actions() {
  let value = document.getElementById("dd2").value;
  let index = leftBarArr2.findIndex(function (ele) {
    return ele === value;
  });
  if (index === 0) {
    defaultBoardUI2();
  } else if (index === 1) {
    highlightPreviousMoveSetting();
  } else if (index === 2) {
    highlightSelectedPieceSetting();
  } else if (index === 3) {
    showLegalMoveSetting();
  } else if (index === 4) {
    changeValidMoveDot();
  } else if (index === 5) {
    document.getElementById("dd2").value = leftBarArrAll[1];
    document.getElementById("dd2menu").innerHTML = "";
  }
  document.getElementById("dd1menu").innerHTML = "";
  document.getElementById("dd1").value = leftBarArrAll[0];
  document.getElementById("dd3menu").innerHTML = "";
  document.getElementById("dd3").value = leftBarArrAll[2];
}
function dd3Actions() {
  let value = document.getElementById("dd3").value;
  let index = leftBarArr3.findIndex(function (ele) {
    return ele === value;
  });
  if (index === 0) {
    showPGN();
  } else if (index === 1) {
    importPGNUI();
  } else if (index === 2) {
    document.getElementById("dd3").value = leftBarArrAll[2];
    document.getElementById("dd3menu").innerHTML = "";
  }
  document.getElementById("dd1menu").innerHTML = "";
  document.getElementById("dd1").value = leftBarArrAll[0];
  document.getElementById("dd2menu").innerHTML = "";
  document.getElementById("dd2").value = leftBarArrAll[1];
}

//LeftBar dd1
function defaultBoardUI1() {
  makeDefaultUISettings1();
  makeBoard();
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block menu-block-width-default'>Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker1' value='" +
    clr1 +
    "' disabled></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-width-default'>Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker2' value='" +
    clr2 +
    "' disabled></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width-default'>Check Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker5' value='" +
    clr1c +
    "' disabled ></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width-default'>Check Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker6' value='" +
    clr2c +
    "' disabled></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width-default'>Previous Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker7' value='" +
    clr1p +
    "' disabled></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width-default'>Previous Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker8' value='" +
    clr2p +
    "' disabled></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width-default'>Highlighted Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker3' value='" +
    clr1x +
    "') disabled></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width-default'>Highlighted Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker4' value='" +
    clr2x +
    "' disabled></input></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
}
function changeBoardColorUI() {
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block menu-block-width'>Pick Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker1' value='" +
    clr1 +
    "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-width'>Pick Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker2' value='" +
    clr2 +
    "'></input></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const colorPicker1 = document.getElementById("colorPicker1");
  const colorPicker2 = document.getElementById("colorPicker2");
  colorPicker1.addEventListener("input", () => colorChanged(1));
  colorPicker2.addEventListener("input", () => colorChanged(2));
  colorPicker1.addEventListener("focus", updateBoxShadow);
  colorPicker1.addEventListener("blur", resetBoxShadow);
  colorPicker1.addEventListener("input", updateBoxShadow);
  colorPicker2.addEventListener("focus", updateBoxShadow);
  colorPicker2.addEventListener("blur", resetBoxShadow);
  colorPicker2.addEventListener("input", updateBoxShadow);
}
function changeHighlightedColorUI() {
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width'>Pick Highlighted Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker3' value='" +
    clr1x +
    "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width'>Pick Highlighted Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker4' value='" +
    clr2x +
    "'></input></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const colorPicker3 = document.getElementById("colorPicker3");
  const colorPicker4 = document.getElementById("colorPicker4");
  colorPicker3.addEventListener("input", () => colorChanged(3));
  colorPicker4.addEventListener("input", () => colorChanged(4));
  colorPicker3.addEventListener("focus", updateBoxShadow);
  colorPicker3.addEventListener("blur", resetBoxShadow);
  colorPicker3.addEventListener("input", updateBoxShadow);
  colorPicker4.addEventListener("focus", updateBoxShadow);
  colorPicker4.addEventListener("blur", resetBoxShadow);
  colorPicker4.addEventListener("input", updateBoxShadow);
}
function changeCheckColorUI() {
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width'>Pick Check Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker5' value='" +
    clr1c +
    "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width'>Pick Check Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker6' value='" +
    clr2c +
    "'></input></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const colorPicker5 = document.getElementById("colorPicker5");
  const colorPicker6 = document.getElementById("colorPicker6");
  colorPicker5.addEventListener("input", () => colorChanged(5));
  colorPicker6.addEventListener("input", () => colorChanged(6));
  colorPicker5.addEventListener("focus", updateBoxShadow);
  colorPicker5.addEventListener("blur", resetBoxShadow);
  colorPicker5.addEventListener("input", updateBoxShadow);
  colorPicker6.addEventListener("focus", updateBoxShadow);
  colorPicker6.addEventListener("blur", resetBoxShadow);
  colorPicker6.addEventListener("input", updateBoxShadow);
}
function changePreviousColorUI() {
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width'>Pick Previous Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker7' value='" +
    clr1p +
    "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width'>Pick Previous Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker8' value='" +
    clr2p +
    "'></input></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const colorPicker7 = document.getElementById("colorPicker7");
  const colorPicker8 = document.getElementById("colorPicker8");
  colorPicker7.addEventListener("input", () => colorChanged(7));
  colorPicker8.addEventListener("input", () => colorChanged(8));
  colorPicker7.addEventListener("focus", updateBoxShadow);
  colorPicker7.addEventListener("blur", resetBoxShadow);
  colorPicker7.addEventListener("input", updateBoxShadow);
  colorPicker8.addEventListener("focus", updateBoxShadow);
  colorPicker8.addEventListener("blur", resetBoxShadow);
  colorPicker8.addEventListener("input", updateBoxShadow);
}
function colorChanged(index) {
  if (index === 1) {
    clr1 = document.getElementById("colorPicker1").value;
    clr1x = blendColors(clr1, clr2, 0.3);
    clr2x = blendColors(clr2, clr1, 0.3);
    clr1c = blendColors(clr1, clrRed, 0.6);
    clr2c = blendColors(clr2, clrRed, 0.6);
    clr1p = blendColors(clr1, clrYellow, 0.5);
    clr2p = blendColors(clr2, clrYellow, 0.5);
  } else if (index === 2) {
    clr2 = document.getElementById("colorPicker2").value;
    clr1x = blendColors(clr1, clr2, 0.3);
    clr2x = blendColors(clr2, clr1, 0.3);
    clr1c = blendColors(clr1, clrRed, 0.6);
    clr2c = blendColors(clr2, clrRed, 0.6);
    clr1p = blendColors(clr1, clrYellow, 0.5);
    clr2p = blendColors(clr2, clrYellow, 0.5);
  } else if (index === 3) {
    clr1x = document.getElementById("colorPicker3").value;
  } else if (index === 4) {
    clr2x = document.getElementById("colorPicker4").value;
  } else if (index === 5) {
    clr1c = document.getElementById("colorPicker5").value;
  } else if (index === 6) {
    clr2c = document.getElementById("colorPicker6").value;
  } else if (index === 7) {
    clr1p = document.getElementById("colorPicker7").value;
  } else if (index === 8) {
    clr2p = document.getElementById("colorPicker8").value;
  }
  makeBoard();
}
function changePieceType() {
  let menuStr =
    "<div class='btn-group-horizontal radio-piece-class justify-content-center' role='group'><input type='radio' class='btn-check' name='radio1' id='r1' autocomplete='off' checked><label class='btn btn-outline-light' for='r1'><img src = '" +
    baseImagePath +
    pieceImagePaths[0] +
    pieceImageArr[0] +
    "' class = 'radio-img-piece'></label><input type='radio' class='btn-check' name='radio1' id='r2' autocomplete='off' ><label class='btn btn-outline-light' for='r2'><img src = '" +
    baseImagePath +
    pieceImagePaths[1] +
    pieceImageArr[0] +
    "' class = 'radio-img-piece'></label><input type='radio' class='btn-check' name='radio1' id='r3' autocomplete='off' ><label class='btn btn-outline-light' for='r3'><img src = '" +
    baseImagePath +
    pieceImagePaths[2] +
    pieceImageArr[0] +
    "' class = 'radio-img-piece'></label></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const radioButtons = document.querySelectorAll('input[name="radio1"]');
  radioButtons.forEach((button) => {
    button.addEventListener("change", function () {
      pieceTypeChange(button.id);
    });
  });
}
function pieceTypeChange(id) {
  if (id === "r1") {
    imagePath = baseImagePath + pieceImagePaths[0];
  } else if (id === "r2") {
    imagePath = baseImagePath + pieceImagePaths[1];
  } else if (id === "r3") {
    imagePath = baseImagePath + pieceImagePaths[2];
  }
  makeBoard();
}

//LeftBar dd2
function defaultBoardUI2() {
  makeDefaultUISettings2();
  makeBoard();
  let highlightStr = highlightPieceBool ? "checked" : "";
  let legalStr = legalBool ? "checked" : "";
  let previousStr = highlightPreviousBool ? "checked" : "";
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='highlightPreviousSwitch'>Previous Moves :</label><input class='form-check-input' type='checkbox' role='switch' id='highlightPreviousSwitch' " +
    previousStr +
    " disabled></div></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='highlightPieceSwitch'>Highlight Piece :</label><input class='form-check-input' type='checkbox' role='switch' id='highlightPieceSwitch' " +
    highlightStr +
    " disabled></div></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='legalMovesSwitch'>Legal Moves :</label><input class='form-check-input' type='checkbox' role='switch' id='legalMovesSwitch' " +
    legalStr +
    " disabled></div></div></div><label for='range1' class='form-label d-inline range-block'><span id='rangeValue' class='range-label'>" +
    "Value : " +
    highlightDotRadiusInitial +
    "</span></label><input type='range' class='form-range range-block' id='range1' min='0' max='30' step='1' value='" +
    highlightDotRadiusInitial +
    "' disabled>";
  document.getElementById("dd2menu").innerHTML = menuStr;
}
function changeValidMoveDot() {
  let menuStr =
    "<label for='range1' class='form-label d-inline range-block'><span id='rangeValue' class='range-label'>" +
    "Value : " +
    highlightDotRadius +
    "</span></label><input type='range' class='form-range range-block' id='range1' min='0' max='30' step='1' value='" +
    highlightDotRadius +
    "'>";
  document.getElementById("dd2menu").innerHTML = menuStr;
  const rangeInput = document.getElementById("range1");
  const rangeValueLabel = document.getElementById("rangeValue");
  rangeValueLabel.textContent = "Value : " + rangeInput.value;
  rangeInput.addEventListener("input", function () {
    rangeValueLabel.textContent = "Value : " + rangeInput.value;
    highlightDotRadius = rangeInput.value;
    makeBoard();
  });
}
function highlightPreviousMoveSetting() {
  let str = highlightPreviousBool ? "checked" : "";
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='highlightPreviousSwitch'>Previous Moves :</label><input class='form-check-input' type='checkbox' role='switch' id='highlightPreviousSwitch' " +
    str +
    "></div></div></div>";
  document.getElementById("dd2menu").innerHTML = menuStr;
  const highlightPreviousInput = document.getElementById(
    "highlightPreviousSwitch"
  );
  highlightPreviousInput.addEventListener("change", function () {
    if (this.checked) {
      highlightPreviousBool = true;
    } else {
      highlightPreviousBool = false;
    }
    makeBoard();
  });
}
function highlightSelectedPieceSetting() {
  let str = highlightPieceBool ? "checked" : "";
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='highlightPieceSwitch'>Highlight Piece :</label><input class='form-check-input' type='checkbox' role='switch' id='highlightPieceSwitch' " +
    str +
    "></div></div></div>";
  document.getElementById("dd2menu").innerHTML = menuStr;
  const highlightPieceInput = document.getElementById("highlightPieceSwitch");
  highlightPieceInput.addEventListener("change", function () {
    if (this.checked) {
      highlightPieceBool = true;
    } else {
      highlightPieceBool = false;
    }
    makeBoard();
  });
}
function showLegalMoveSetting() {
  let str = legalBool ? "checked" : "";
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='legalMovesSwitch'>Legal Moves :</label><input class='form-check-input' type='checkbox' role='switch' id='legalMovesSwitch' " +
    str +
    "></div></div></div>";
  document.getElementById("dd2menu").innerHTML = menuStr;
  const legalMovesInput = document.getElementById("legalMovesSwitch");
  legalMovesInput.addEventListener("change", function () {
    if (this.checked) {
      legalBool = true;
    } else {
      legalBool = false;
    }
    makeBoard();
  });
}

//LeftBar dd3
function showPGN() {
  let menuStr = "<p class = 'pgn-block'>" + pgnStr + "</p>";
  if (pgnStr.length != 0) {
    menuStr +=
      "<button class = 'p-3 btn btn-light btn-green w-100 h-100' id='copyPGN'><i class='fa-solid fa-copy'></i> Copy PGN</button>";
  }
  document.getElementById("dd3menu").innerHTML = menuStr;
  if (pgnStr.length != 0) {
    document.getElementById("copyPGN").addEventListener("click", function () {
      const textToCopy = pgnStr;
      navigator.clipboard
        .writeText(textToCopy)
        .then(function () {
          showCustomAlert("Text copied to clipboard successfully!");
        })
        .catch(function (err) {
          showCustomAlert("Could not copy text: ", err);
        });
    });
  }
}
function importPGNUI() {
  let menuStr =
    "<span class = 'text-area-block w-100 justify-content-center'>Enter PGN : </span><div class='input-group'><textarea class='input-group-text text-area-block w-100' id='moveHistory'></textarea></div><button class = 'p-3 btn btn-light btn-green w-100 h-100' onclick = 'importGame()'><i class='fa-solid fa-upload'></i> Load Game</button>";
  document.getElementById("dd3menu").innerHTML = menuStr;
  const textarea = document.getElementById("moveHistory");
  function adjustTextareaHeight() {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  textarea.addEventListener("input", adjustTextareaHeight);
  textarea.addEventListener("paste", adjustTextareaHeight);
  adjustTextareaHeight();
}

//UI RightBar Actions

//UI Building
function makeDefaultColors() {
  clr1 = clrDefaultArr[0];
  clr2 = clrDefaultArr[1];
  clr1x = clrDefaultArr[2];
  clr2x = clrDefaultArr[3];
  clr1c = clrDefaultArr[4];
  clr2c = clrDefaultArr[5];
  clr1p = clrDefaultArr[6];
  clr2p = clrDefaultArr[7];
}
function makeDefaultUISettings1() {
  makeDefaultColors();
  imagePath = baseImagePath + pieceImagePaths[0];
}
function makeDefaultUISettings2() {
  legalBoolInitial = true;
  legalBool = legalBoolInitial;
  highlightPieceBoolInitial = true;
  highlightPieceBool = highlightPieceBoolInitial;
  highlightPreviousBoolInitial = true;
  highlightPreviousBool = highlightPreviousBoolInitial;
  highlightDotRadiusInitial = 16;
  highlightDotRadius = highlightDotRadiusInitial;
}
function hello(a, b) {
  a++;
  b++;
}
function blendColors(colorA, colorB, amount) {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(rA + (rB - rA) * amount)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(gA + (gB - gA) * amount)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(bA + (bB - bA) * amount)
    .toString(16)
    .padStart(2, "0");
  return "#" + r + g + b;
}
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  const alertMessage = document.getElementById("customAlertMessage");

  alertMessage.textContent = message;
  alertBox.style.display = "block";
  alertBox.style.opacity = 1; // Fade in

  // Hide the alert after 2 seconds
  setTimeout(function () {
    alertBox.style.opacity = 0; // Fade out
    setTimeout(function () {
      alertBox.style.display = "none";
    }, 500); // Wait for the fade out transition to complete
  }, 1000); // Display duration
}
function updateBoxShadow() {
  this.style.boxShadow = `0 0 1px 1px ${this.value}`;
}
function resetBoxShadow() {
  this.style.boxShadow = "none";
}
function switchNavTab_MakeTimer() {
  // Get all the nav-links within the navbar
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  // Function to set a specific tab as active
  function setActiveTab(tabId) {
    // Remove 'active' class from all nav-links
    navLinks.forEach((link) => link.classList.remove("active"));

    // Find the nav-link with the id matching the specified tabId and add 'active' class
    const targetLink = document.getElementById(tabId);
    if (targetLink) {
      targetLink.classList.add("active");
    }
  }
  setActiveTab("Navbar0");
  navActions(0);
}
function switchNavTab_LoadGame() {
  // Get all the nav-links within the navbar
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  // Function to set a specific tab as active
  function setActiveTab(tabId) {
    // Remove 'active' class from all nav-links
    navLinks.forEach((link) => link.classList.remove("active"));
    // Find the nav-link with the id matching the specified tabId and add 'active' class
    const targetLink = document.getElementById(tabId);
    if (targetLink) {
      targetLink.classList.add("active");
    }
  }
  setActiveTab("Navbar1");
  navActions(1);
}

//move
function getPiecesofOneColor(boardPosition) {
  return boardPosition.reduce(
    function (acc, curr, row) {
      curr.reduce(function (acc, curr1, col) {
        if (curr1.color) {
          acc[curr1.color].pieces.push({
            ...curr1,
            start: { row: row, col: col },
          });
          acc[curr1.color].totalPoints += curr1.points;
        }
        return acc;
      }, acc);
      return acc;
    },
    {
      white: { pieces: [], totalPoints: 0 },
      black: { pieces: [], totalPoints: 0 },
    }
  );
}
function generateAllPossibleMoves(boardPosition, moveColor) {
  let colorWisePosition = getPiecesofOneColor(boardPosition);
  let notMoveColor = moveColor === "white" ? "black" : "white";
  let possibleMoves = [];
  colorWisePosition[moveColor].pieces.map(function (piece) {
    prevrow = piece.start.row;
    prevcol = piece.start.col;
    showValidMoves();
    prevrow = -1;
    prevcol = -1;
    showMovesArr.map(function (mv) {
      piece.end = mv;
      let oppositePiece = colorWisePosition[notMoveColor].pieces.find(function (
        ele
      ) {
        return ele.start.row === mv.row && ele.start.col === mv.col;
      });
      piece.score =
        colorWisePosition[moveColor].totalPoints -
        colorWisePosition[notMoveColor].totalPoints +
        (oppositePiece ? oppositePiece.points : 0);
      possibleMoves.push({ ...piece });
      return "";
    });
    return "";
  });
  return possibleMoves;
}
let movesSimulated = { do: 0, undo: 0 };
function playMoveSimulator(newMoveSimulator) {
  movesSimulated.do++;
  prevrow = -1;
  prevcol = -1;
  boardClick(newMoveSimulator.start.row, newMoveSimulator.start.col);
  boardClick(newMoveSimulator.end.row, newMoveSimulator.end.col);
}
function playToDepth(boardPosition, depth, moveColor) {
  let possibleMoves = generateAllPossibleMoves(boardPosition, moveColor);
  if (depth === 1) {
    let selectedMove = selectBestMove(possibleMoves);
    console.log("selectedMove", selectedMove);
    return selectedMove;
  }
  let arr = [];
  for (let i = 0; i < possibleMoves.length; i++) {
    let oneMove = possibleMoves[i];
    playMoveSimulator(oneMove);
    let notMoveColor = moveColor === "white" ? "black" : "white";
    arr.push(playToDepth(boardPosition, depth - 1, notMoveColor));
    undoSimulatedMove();
  }
  console.log(arr);
  let selectedMove = selectBestMove(arr);
  console.log("selectedMove", selectedMove);
  return selectedMove;
}
function selectBestMove(possibleMoves) {
  return possibleMoves.reduce(function (acc, curr) {
    if (curr.score > acc.score) acc = curr;
    return acc;
  });
}
function undoSimulatedMove() {
  undoMove();
  movesSimulated.undo++;
}
function autoPlay(depth) {
  let newMove = playToDepth(boardArr, depth, "white");
  console.log(movesSimulated);
  console.log(newMove);
}

//Drag and Drop

// Function to make a cell
function makeCell(row, col) {
  let pieceStr = "";
  let possibleMoveStr = "";
  let extraInfoStr = "";
  let labelStr =
    col === 0 ? "<div class='p-1 label-col-box'>" + (8 - row) + "</div>" : "";

  num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });

  if (Object.keys(boardArr[row][col]).length != 0) {
    pieceStr =
      "<img src='" +
      imagePath +
      boardArr[row][col].key +
      "' draggable='true' ondragstart='drag(event, " +
      row +
      ", " +
      col +
      ")' onclick='hello(" +
      row +
      "," +
      col +
      ")'>";
  }

  if (num != -1 && legalBool) {
    possibleMoveStr =
      "<svg xmlns='http://www.w3.org/2000/svg' class='possible-move-square' viewBox='0 0 80 80' width='80' height='80'><circle cx='40' cy='40' r=" +
      highlightDotRadius +
      " fill='rgba(100, 100, 100, 0.4)'/></svg>";
  }

  // Add cell coloring logic
  if (prevrow === row && prevcol === col && highlightPieceBool) {
    cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  } else if (
    pgnArr.length != 0 &&
    pgnArr[pgnArr.length - 1].prevrow === row &&
    pgnArr[pgnArr.length - 1].prevcol === col &&
    highlightPreviousBool
  ) {
    cellColor = (row + col) % 2 === 0 ? clr1p : clr2p;
  } else if (
    pgnArr.length != 0 &&
    pgnArr[pgnArr.length - 1].newrow === row &&
    pgnArr[pgnArr.length - 1].newcol === col &&
    highlightPreviousBool
  ) {
    cellColor = (row + col) % 2 === 0 ? clr1p : clr2p;
  } else {
    cellColor = (row + col) % 2 === 0 ? clr1 : clr2;
  }

  if (underCheck.bool && underCheck.posx === row && underCheck.posy === col) {
    cellColor = (row + col) % 2 === 0 ? clr1c : clr2c;
    if (prevrow === row && prevcol === col && highlightPieceBool) {
      cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
    }
  }

  return (
    labelStr +
    "<div class='cellBox cellBorder" +
    extraInfoStr +
    "' id='cell-" +
    row +
    "-" +
    col +
    "' ondrop='drop(event, " +
    row +
    ", " +
    col +
    ")' ondragover='allowDrop(event)' onclick='boardClick(" +
    row +
    "," +
    col +
    ")' style='background-color: " +
    cellColor +
    "'>" +
    pieceStr +
    possibleMoveStr +
    "</div>"
  );
}

// Allow drop event
function allowDrop(event) {
  event.preventDefault();
}

// Drag event to show possible moves
function drag(event, row, col) {
  event.dataTransfer.setData("text", event.target.parentElement.id);
  // Show possible moves without re-rendering the board
  showValidMovesForDragging(row, col);
}

// Drop event to finalize the move
function drop(event, row, col) {
  event.preventDefault();
  let fromSquareId = event.dataTransfer.getData("text");
  let fromSquare = document.getElementById(fromSquareId);
  let toSquare = event.target;

  if (toSquare.classList.contains("cellBox")) {
    toSquare.appendChild(fromSquare.querySelector("img"));
  } else {
    toSquare.parentElement.appendChild(fromSquare.querySelector("img"));
  }

  let fromSquareRowCol = fromSquareId.split("-").slice(1).map(Number);
  let toSquareRowCol = [row, col];

  let isValidMove = showMovesArr.some(function (ele) {
    return ele.row === row && ele.col === col;
  });

  if (isValidMove) {
    console.log(`Moved from ${fromSquareRowCol} to ${toSquareRowCol}`);
    updateBoardState(fromSquareRowCol, toSquareRowCol);
    makeBoard(); // Redraw the board after the move
  } else {
    fromSquare.appendChild(toSquare.querySelector("img"));
    showCustomAlert("Invalid Move");
  }
}

// Show valid moves for dragging
function showValidMovesForDragging(row, col) {
  prevrow = row;
  prevcol = col;
  showValidMoves();
}

// Update the board state
function updateBoardState(fromSquareRowCol, toSquareRowCol) {
  let [fromRow, fromCol] = fromSquareRowCol;
  let [toRow, toCol] = toSquareRowCol;

  boardArr[toRow][toCol] = boardArr[fromRow][fromCol];
  boardArr[fromRow][fromCol] = {};
}

function boardClick(row, col) {
  if (prevrow === -1 || prevcol === -1) {
    if (
      Object.keys(boardArr[row][col]).length != 0 &&
      moveStartConditon(row, col)
    ) {
      prevrow = row;
      prevcol = col;
      showValidMoves();
      inCheckCondition(boardArr[row][col].color);
      if (boardArr[prevrow][prevcol].piece === "king") checkCastle();
      makeBoard();
    }
  } else if (prevrow === row && prevcol === col) {
    prevrow = -1;
    prevcol = -1;
    showMovesArr = [];
    makeBoard();
  } else {
    let obj = showMovesArr.find(function (ele) {
      return ele.row === row && ele.col === col;
    });
    if (obj) {
      lastMove(row, col);
      let localePgnGenerationStopBool = true;
      if (
        checkEnPassant(row, col, boardArr[prevrow][prevcol].color) &&
        pgnArr.length != 0
      ) {
        lastMoveJSON.enPassant = true;
        lastMoveJSON.cutPiece =
          boardArr[pgnArr[pgnArr.length - 1].newrow][
            pgnArr[pgnArr.length - 1].newcol
          ];
        boardArr[pgnArr[pgnArr.length - 1].newrow][
          pgnArr[pgnArr.length - 1].newcol
        ] = {};
        let pointColor =
          boardArr[prevrow][prevcol].color === "white" ? "black" : "white";
        pointUpdateCounter("pawn", pointColor);
      }
      if (
        ((boardArr[prevrow][prevcol].color === "white" && row === 0) ||
          (boardArr[prevrow][prevcol].color === "black" && row === 7)) &&
        boardArr[prevrow][prevcol].piece === "pawn"
      ) {
        if (Object.keys(isLoadingPGNPawnPromotionJSON).length === 0) {
          pawnPromotion(row, col, boardArr[prevrow][prevcol].color);
          localePgnGenerationStopBool = false;
        }
      }
      if (boardArr[prevrow][prevcol].piece === "king") {
        if (Math.abs(prevrow - row) === 0 && Math.abs(prevcol - col) === 2) {
          lastMoveJSON.castleBool = true;
          castleMove(row, col, boardArr[prevrow][prevcol].color);
          lastMoveJSON.castleDisable = moveCount;
          castleBool["short" + boardArr[prevrow][prevcol].color] = false;
          castleBool["long" + boardArr[prevrow][prevcol].color] = false;
        }
        if (boardArr[prevrow][prevcol].piece === "rook") {
          let sideStr = prevcol === 0 ? "long" : "short";
          lastMoveJSON.castleDisable = moveCount;
          castleBool[sideStr + boardArr[prevrow][prevcol].color] = false;
        }
        let temp = boardArr[row][col];
        boardArr[row][col] = boardArr[prevrow][prevcol];
        boardArr[prevrow][prevcol] = {};
        if (Object.keys(isLoadingPGNPawnPromotionJSON).length != 0) {
          boardArr[isLoadingPGNPawnPromotionJSON.row][
            isLoadingPGNPawnPromotionJSON.col
          ] = isLoadingPGNPawnPromotionJSON.json;
          missingPiecesUpdate();
        }
        moveCount++;
        prevrow = -1;
        prevcol = -1;
        showMovesArr = [];
        checkCheck();
        lastMoveJSON.checkBool = underCheck.bool;
        if (localePgnGenerationStopBool) {
          pgnArr.push(lastMoveJSON);
        }
        makePGN();
        makeBoard();
        if (Object.keys(temp).length != 0) {
          pointUpdateCounter(temp.piece, temp.color);
        }
        if (document.getElementById("dd3").value === leftBarArr3[0]) {
          showPGN();
        }
      } else if (moveStartConditon(row, col)) {
        prevrow = row;
        prevcol = col;
        showValidMoves();
        inCheckCondition(boardArr[row][col].color);
        if (boardArr[prevrow][prevcol].piece === "king") {
          checkCastle();
        }
        makeBoard();
      }
    }
  }
}
