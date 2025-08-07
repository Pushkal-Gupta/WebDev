//Navbar Line Stay on Active Tab
// document.addEventListener("DOMContentLoaded", function () {
//   var navLinks = document.querySelectorAll(".navbar-nav .nav-link");

//   navLinks.forEach(function (link) {
//     link.addEventListener("click", function () {
//       navLinks.forEach(function (nav) {
//         nav.classList.remove("active");
//       });
//       this.classList.add("active");
//     });
//   });
// });

//Data
dataReload();
mobileResponsiveMaxWidth = 850;
userInfo = JSON.parse(localStorage.getItem("userInfo"));
timerData = [];
userToken = userInfo ? userInfo.userToken : null;
myAccountName = userInfo ? userInfo.myAccountName : null;
navbarMyAccountNode = null;
displayOnScreen = "";
gameStoreId = -1;
tabClickedByUser = "";
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
  tabName = "";
  flagComp = { comp: false, color: "white" };
  stockLvl = 4;
  oppNameValue = "Opponent";
  youNameValue = "You(W)";
  oppDisableStr = " ";
  originTabIndex = null;
  undoCompBool = true;
  popUpCount = 0;
  gameStartBool = false;
  handleBool = false;
  storeNavIndex = null;
  time = "";
  navIconArr = [
    { icon: "fa-regular fa-hourglass-half", animation: "fa-shake" },
    { icon: "fa-solid fa-folder-open", animation: "fa-bounce" },
    { icon: "fa-solid fa-pen-to-square", animation: "fa-fade" },
    { icon: "fa-solid fa-computer", animation: "fa-beat" },
    { icon : "fa-solid fa-circle-user", animation: "fa-beat"}
  ];
  bodyImageURL = [
    "https://img.freepik.com/free-photo/abstract-fire-desktop-wallpaper-realistic-blazing-flame-image_53876-147448.jpg?size=626&ext=jpg&ga=GA1.1.1546980028.1719792000&semt=ais_user",
  ];
  navArr = ["Time Limit", "New Game", "Analysis", "Computer", "My Account"];
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
    {display:"1 min",total:60,incr:0},
    {display:"1|1",total:60,incr:1},
    {display:"2|1",total:120,incr:1},
    {display:"3 min",total:180,incr:0},
    {display:"3|2",total:180,incr:2},
    {display:"5 min",total:300,incr:0},
    {display:"10 min",total:600,incr:0},
    {display:"15|10",total:900,incr:10},
    {display:"30 min",total:1800,incr:0},
    {display:"1 day",total:86400,incr:0},
    {display:"3 days",total:259200,incr:0},
    {display:"7 days",total:604800,incr:0},
  ];
  iconTimeArr = [
    "<div class='icon-label1'><i class='fa-solid fa-joint icon' style='color:#DAA520'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-bolt-lightning icon' style ='color:#FFEA00'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-stopwatch icon' style='color:#8DB000'></i>",
    "<div class='icon-label2'><i class='fa-solid fa-sun icon' style='color:#FDDA0D'></i>",
  ];
  baseImagePath = "images/";
  pieceImagePaths = [
    "piecesClassic/",
    "pieces/",
    "piecesVirtual/",
    "piecesCartoon/",
    "piecesWooden/",
    "piecesWooden2/",
  ];
  baseThemePath = "images/Themes/";
  themeLogoPaths = ["logo1.png", "logo2.png", "logo3.png"];
  themesValueArr = [
    {
      id: "rt0",
      name: "chess.com",
      clr1: "#EEEED2",
      clr2: "#769656",
      clr1c: "#F98A75",
      clr2c: "#BE5F35",
      clr1p: "#F6F682",
      clr2p: "#BAC949",
      clr1x: "#BAC949",
      clr2x: "#FFFA5C",
    },
    // {
    //   id: "rt0",
    //   name: "chess.com",
    //   clr1: "#EEEED2",
    //   clr2: "#69923E",
    //   clr1c: blendColors("#EEEED2", clrRed, 0.6),
    //   clr2c: blendColors("#69923E", clrRed, 0.6),
    //   clr1p: "#BACA44",
    //   clr2p: "#BACA44",
    //   clr1x: "#FFFA5C",
    //   clr2x: "#FFFA5C",
    // },
    {
      id: "rt1",
      name: "lichess.org",
      clr1: "#F0D9B7",
      clr2: "#B58763",
      clr1c: "#EA4334",
      clr2c: "#DB3423",
      clr1p: "#CFD17B",
      clr2p: "#ACA249",
      clr1x: "#87986A",
      clr2x: "#6A6F42",
    },
    {
      id: "rt2",
      name: "pastel",
      clr1: "#DEE3E6",
      clr2: "#8CA2AD",
      clr1c: "#FF9999",
      clr2c: "#D37878",
      clr1p: "#78BEDE",
      clr2p: "#5795B2",
      clr1x: "#99DFFF",
      clr2x: "#78B6D3",
    },
  ];
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
  leftBarArr = [
    [
      { txt: "Default", icon: "fa-user" },
      { txt: "Themes", icon: "fa-chess" },
      { txt: "Change Board Color", icon: "fa-palette" },
      { txt: "Change Highlighted Color", icon: "fa-highlighter" },
      { txt: "Change Check Color", icon: "fa-plus" },
      { txt: "Change Previous Moves Color", icon: "fa-circle-arrow-left" },
      { txt: "Change Piece Type", icon: "fa-chess-pawn" },
      { txt: "Add Background Image", icon: "fa-image" },
      { txt: "Show Column & Row", icon: "fa-eye", notInMobile: true},
    ],
    [
      { txt: "Default", icon: "fa-user" },
      { txt: "Highlight Previous Moves", icon: " fa-hand-point-left" },
      { txt: "Highlight Selected Piece", icon: "fa-hand-pointer" },
      { txt: "Show Legal Moves", icon: "fa-gavel" },
      { txt: "Change Valid Moves Dot", icon: "fa-circle-dot" },
    ],
    [
      { txt: "Show PGN", icon: "fa-note-sticky" },
      { txt: "Import PGN", icon: "fa-file-import" },
    ],
  ];
  leftBarArrAll = [
    { txt: "Board Settings", icon: "fa-chess-board fa-size-increase" },
    {
      txt: "Move Settings",
      icon: "fa-arrows-up-down-left-right fa-size-increase",
    },
    { txt: "Game Settings", icon: "fa-book fa-size-increase" },
  ];
  leftBarOpenStatus = [false, false, false];
  userNewMoveClick = false;
  previousHighlightData = {};
  runningTestCases = false;
}

//Routine Function Calls
routineFunctionCalls();
testStockfishServer();
testChessServer();
function routineFunctionCalls() {
  defaultFunctionSettings();
  makeDefaultUISettings1();
  makeDefaultUISettings2();
  createNavbar();
  navActions(0);
}

//Basic UI
function createNavbar() {
  const navbar = document.getElementById("navbar");
  navArr.forEach((ele, index) => {
    const li = document.createElement("li");
    li.className = "nav-item";

    const a = document.createElement("a");
    a.className = "nav-link nav-item";
    a.href = "#";
    a.id = "Navbar" + index;
    //a.onclick = () => navActions(index);
    a.onclick = () => {
      navActions(index);
      // Collapse the navbar (only if visible) This is for the hamburger on mobile
      const navbarCollapse = document.querySelector(".navbar-collapse");
      if (navbarCollapse.classList.contains("show")) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
          toggle: true
        });
      }
    };

    const icon = document.createElement("i");
    icon.className = navIconArr[index].icon;

    a.appendChild(icon);
    let txtNode = document.createTextNode(" " + ele);
    if (ele==="My Account"){
      if (myAccountName)
        txtNode = document.createTextNode(" " + myAccountName);
      navbarMyAccountNode = txtNode; 
    }
    a.appendChild(txtNode);
    li.appendChild(a);
    navbar.appendChild(li);
    // Add event listeners for hover effect
    a.addEventListener("mouseover", () => {
      icon.classList.add(navIconArr[index].animation);
    });
    a.addEventListener("mouseout", () => {
      icon.classList.remove(navIconArr[index].animation);
    });
  }); 
}
function updateMyAccountInNavbar(loginlogout=false){
  console.log("updateMyAccountInNavbar::myAccountName=",myAccountName,"::time=",time);
  if (myAccountName)
    navbarMyAccountNode.textContent = myAccountName;
  else
    navbarMyAccountNode.textContent = "My Account";
  if (!loginlogout) return;
  if (time=="")
    switchNavTab_MakeTimer();
  else
    switchNavTab_LoadGame();
}
function endCurrentGame(){
  flagComp.comp = false;
  oppNameValue = "Opponent(B)";
  youNameValue = "You(W)";
  oppDisableStr = " ";
  makeStartBoard();
  makeBoard();
  timerData = [];
  timerId = null;
  gameStoreId = -1;
  makeLeftBar();
  makeRightBar();
}
function navActions(index) {
  if (index===4){
    navActionsMyAccount();
    return;
  }
  storeNavIndex = index;
  if (index===2 && !userToken){
    showCustomAlert("Please login first");
    return;
  }
  if (gameStartBool &&(index!=2 || userToken)) {
    console.log(gameStartBool, index, userToken)
    showPopup("End this game?");
    return;
  }
  if (!handleBool && time != "" && gameStartBool) return;
  document
    .querySelectorAll(".navbar-nav .nav-link")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("Navbar" + index).classList.add("active");
  tabName = navArr[index];
  if (index == 0) {
    time = "";
    document.getElementById("leftbar").innerHTML = "";
    document.getElementById("rightbar").innerHTML = "";
    gameStartBool = false;
    clearMobileTimers();
    makeTimer();
  } else if (index == 1) {
    if (time === "") {
      document.getElementById("leftbar").innerHTML = "";
      document.getElementById("rightbar").innerHTML = "";
    }
    displayOnScreen = navArr[1];
    tabClickedByUser = navArr[1];
    endCurrentGame();
    //if (popUpCount === 0 && time != "") showPopup("Load New Theme?");
    //popUpCount++;
  }
  else if (index===2){
    navActionsAnalysis();
  }
  else if (index == 3) {
    if (time === "") {
      document.getElementById("leftbar").innerHTML = "";
      document.getElementById("rightbar").innerHTML = "";
    }
    flagComp.comp = true;
    flagComp.color = "white";
    makeStartBoard();
    makeBoard();
    makeLeftBar();
    makeRightBar();
    if (time != "") showStrengthPopup();
  } 
}
function navActionsAnalysis(){
  /*
  if (time === "" || userToken) {
    document.getElementById("leftbar").innerHTML = "";
    document.getElementById("rightbar").innerHTML = "";
  }*/
  if (userToken){
    time = "";
    timerId = null;
    gameStartBool = false;
    makeGamesPlayed();
  }
}
function navActionsMyAccount(){
  if (userToken)
    showLogoutPopup();
  else
    showLoginPopup();
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
      ele.display +
      "</button></div>"
    );
  });
  displayStr =
    "<div class='containerFrame text-center'>" +
    selectedStr +
    formArr.join("") +
    "</div><div class='col p-0 mb-2 mx-1 bg-transparent '><div id = 'info' class='row justify-content-center'></div></div>";
  document.getElementById("display").innerHTML = displayStr;
  displayOnScreen = navArr[0];
  tabClickedByUser = navArr[0];
  const existingTimers = document.getElementById("timersOnlyContainer");
  if (existingTimers) existingTimers.remove();

}
function btnTimeActions(index) {
  time = timeArr[index];
  index1 = Math.floor(index / 3);
  iconStr = iconTimeArr[index1];
  iconStr = iconStr.replace("'><i class", " justify-content-center'><i class");
  timeStr = iconStr + time.display + "</div>";
  document.getElementById("timeLimit").innerHTML = timeStr;
  if (tabName === "Computer")
    str =
      "<br><button type='button' class='p-3 btn btn-light btn-block w-100 h-100 btn-confirm' onclick = switchNavTab_LoadComputer()>Play Game</button>";
  else
    str =
      "<br><button type='button' class='p-3 btn btn-light btn-block w-100 h-100 btn-confirm' onclick = switchNavTab_LoadGame()>Play Game</button>";
  document.getElementById("info").innerHTML = str;
}
function makeCell(row, col) {
  let pieceStr = "";
  let possibleMoveStr = "";
  let extraInfoStr = "";
  let labelStr = "";
  let draggableStr = "";
  if (col === 0) {
    labelStr = colRowBool
      ? "<div class = 'p-1 label-col-box'>" + (8 - row) + "</div>"
      : window.innerWidth > mobileResponsiveMaxWidth ? "<div class = 'p-1 label-col-box'></div>" : "";
  } else labelStr = "";
  num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });
  if (Object.keys(boardArr[row][col]).length != 0) {
    draggableStr =
      ((moveCount % 2 == 0 && boardArr[row][col].color === "white") ||
        (moveCount % 2 == 1 && boardArr[row][col].color === "black")) &&
      !disableBoardForUser
        ? "draggable=true ondragstart='drag(event, " +
          row +
          ", " +
          col +
          ")' ondragend='dragEnd(event)'"
        : " draggable=false ";
    pieceStr =
      "<img src='" +
      imagePath +
      boardArr[row][col].key +
      "' id='img" +
      row +
      "-" +
      col +
      "' " +
      draggableStr +
      " onclick='hello(" +
      row +
      "," +
      col +
      ")' class='draggable-element'>";
  }
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
  if (
    pgnArr.length === 9 &&
    ((col === 0 && row === 0) || (col === 1 && row === 1))
  ) {
    console.log(
      pgnArr[pgnArr.length - 1],
      row,
      col,
      cellColor,
      highlightPreviousBool,
      highlightPieceBool,
      clr1,
      clr1p,
      clr1x,
      prevrow,
      prevcol
    );
  }
  if (underCheck.bool && underCheck.posx === row && underCheck.posy === col) {
    cellColor = (row + col) % 2 === 0 ? clr1c : clr2c;
    if (prevrow === row && prevcol === col && highlightPieceBool)
      cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  }
  return (
    labelStr +
    "<div class='" +
    (pieceStr && moveStartConditon(row, col) ? "draggable " : "") +
    "cellBox cellBorder" +
    extraInfoStr +
    "' id='cell-" +
    row +
    "-" +
    col +
    "' " +
    " draggable=false ondrop='drop(event, " +
    row +
    ", " +
    col +
    ")' ondragover='allowDrop(event)' onclick='boardClickByUser(" +
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
function highlightMoveCells() {
  let possibleMoveStr = "";
  for (let row = 0; row <= 7; row++) {
    for (let col = 0; col <= 7; col++) {
      possibleMoveStr = "";
      num = showMovesArr.findIndex(function (ele) {
        return ele.row === row && ele.col === col;
      });
      numNotShow = -1;
      if (previousHighlightData.showMovesArr)
        numNotShow = previousHighlightData.showMovesArr.findIndex(function (
          ele
        ) {
          return ele.row === row && ele.col === col;
        });
      if (num != -1 && legalBool) {
        if (Object.keys(boardArr[row][col]).length != 0) {
          possibleMoveStr =
            "<svg id='cellHighlight-" +
            row +
            "-" +
            col +
            "' xmlns='http://www.w3.org/2000/svg' class='possible-move-square' viewBox='0 0 80 80' width='80' height='80'><circle cx='40' cy='40' r=" +
            highlightDotRadius +
            " fill='rgba(256, 100, 100, 0.4)'/></svg></span>";
        } else {
          possibleMoveStr =
            "<svg id='cellHighlight-" +
            row +
            "-" +
            col +
            "' xmlns='http://www.w3.org/2000/svg' class='possible-move-square' viewBox='0 0 80 80' width='80' height='80'><circle cx='40' cy='40' r=" +
            highlightDotRadius +
            " fill='rgba(100, 100, 100, 0.4)'/></svg>";
        }
      }
      if (possibleMoveStr.length > 0)
        document
          .getElementById("cell-" + row + "-" + col)
          .insertAdjacentHTML("beforeend", possibleMoveStr);
      if (numNotShow != -1 && numNotShow != num) {
        let element = document.getElementById(
          "cellHighlight-" + row + "-" + col
        );
        if (element) element.remove();
      }
    }
  }
  highlightSelectedCell();
  if (previousHighlightData.showMovesArr) unhighlightPreviousSelectedCell();
  previousHighlightData = {};
}
function highlightSelectedCell() {
  let row = prevrow;
  let col = prevcol;
  cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  if (underCheck.bool && underCheck.posx === row && underCheck.posy === col) {
    cellColor = (row + col) % 2 === 0 ? clr1x : clr2x;
  }
  let element = document.getElementById("cell-" + row + "-" + col);
  element.setAttribute("style", "background-color:" + cellColor + ";");
}
function unhighlightPreviousSelectedCell() {
  let row = previousHighlightData.prevrow;
  let col = previousHighlightData.prevcol;
  cellColor = "";
  if (
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
  }
  let element = document.getElementById("cell-" + row + "-" + col);
  element.setAttribute("style", "background-color:" + cellColor + ";");
}
function makeBoard() {
  str = "";
  for (i = 0; i <= 7; i++) {
    str +=
      "<div class='container'><div class='row row-cols-8 justify-content-center'>";
    for (j = 0; j <= 7; j++) str += makeCell(i, j);
    str += "</div></div>";
  }
  let labelArrMap = labelArr.map(function (ele) {
    return "<div class='cellBox abcd-label'>" + ele + "</div>";
  });
  displayStr =
    "<div class = 'containerFrame'>" +
    str +
    "<div class='row row-cols-8 abcd-label-padding'>" +
    (colRowBool ? labelArrMap.join("") : "") +
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
    if (originTabIndex !== null && originTabIndex >= 0) {
      setActiveTab("Navbar" + originTabIndex);
      navActions(originTabIndex);
      originTabIndex = null;
    } else {
      // fallback to New Game
      switchNavTab_LoadGame();
    }
  }
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
  redoMoveArr = [];
  rightPgnArr = [];
  pgnStr = "";
  virtualBoardStr = "";
  labelArr = ["a", "b", "c", "d", "e", "f", "g", "h"];
  underCheck = { bool: false, posx: -1, posy: -1 };
  afterMoveInCheckBool = false;
  lastMoveUndoMoveBool = false;
  comingFromRedoMoveBool = false;
  isLoadingPGNPawnPromotionJSON = {};
  bodyImage = bodyImageURL[0];
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
    promotionBool: false,
    ambiguityBoolColSame: false,
    ambiguityBool: false,
    pawnPromotedto: "",
    castleDisable: -1,
  };
  leftBarOpenStatus = [false, false, false];
  userNewMoveClick = false;
  previousHighlightData = {};
  previousRightBarMoveNum = -1;
  disableBoardForUser = false;
  //if (!runningTestCases) console.clear();
}

//Make LeftBar
function makeLeftBar(leftBarInstance) {
  if (!time) return;
  let leftBarAllInstance = leftBarInstance ? leftBarInstance : leftBarArrAll;
  let missingPieceElement = document.getElementById("missingPiece");
  missingPieceStr = missingPieceElement ? missingPieceElement.innerHTML : "";
  leftStr =
    "<div class = 'containerLeft'><div class='btn-group-vertical w-100' role='group'>" +
    "<div class='btn-group' role='group'>" +
    "<button class = 'p-3 btn btn-light btn-block-red w-100 h-100' onclick = 'undoMoveByUser()'><i class='fa-solid fa-left-long'></i> Undo Move</button>" +
    "<button class = 'p-3 btn btn-light btn-green w-100 h-100' onclick = 'redoMoveByUser()'><i class='fa-solid fa-right-long'></i> Redo Move</button></div>" +
    "<div class = 'height-break'></div>";
  leftStr += leftBarAllInstance
    .map(function (ele, index) {
      return makeLeftDD(ele, index, leftBarOpenStatus[index]);
    })
    .join("");
  leftStr +=
    "<div id = 'missingPiece' class ='missing-piece'>" +
    missingPieceStr +
    "</div></div>";
  document.getElementById("leftbar").innerHTML = leftStr;
}
function makeLeftDD(ele, index1, isOpen) {
  let str =
    "<button class='p-3 btn btn-light left-bar-block h-100' onclick='showOptionsLeftDD(" +
    index1 +
    ",-1)' >" +
    "<i class='fas  " +
    ele.icon +
    "'></i>" +
    "&nbsp;&nbsp;" +
    ele.txt +
    (ele.txt === leftBarArrAll[index1].txt
      ? "<i class='align-right-fa-icon fas " +
        (isOpen ? "fa-caret-up" : "fa-caret-down") +
        "'></i>"
      : "") +
    (ele.txt !== leftBarArrAll[index1].txt
      ? "<i class='align-right-fa-icon fas fa-caret-up'></i>"
      : "") +
    "</button>" +
    "<div class='left-menu-container w-100' role='group' id='dd" +
    (index1 + 1) +
    "menu'>" +
    (isOpen ? makeLeftBarDDMenu(index1) : "") +
    "</div><div class = 'height-break'></div>";
  return str;
}
function makeLeftBarDDMenu(index1) {
  return leftBarArr[index1]
    .map(function (ele, index2) {
      let x = 
        "<button class='btn dd-menu-block btn-bd-secondary w-100 h-100' style='padding-left:36px' type='button' onclick='showOptionsLeftDD(" +
        index1 +
        "," +
        index2 +
        ")' >" +
        "<i class='fas  " +
        ele.icon +
        "'></i>" +
        "&nbsp;&nbsp;" +
        ele.txt +
        "</button>";
      if (window.innerWidth <= mobileResponsiveMaxWidth && ele.notInMobile) return "";
       else return x; 
    })
    .join("");
}
function closeOptionsLeftDD() {
  leftBarOpenStatus = [false, false, false];
  makeLeftBar();
}
function showOptionsLeftDD(index1, index2) {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  if (index2 === -1) {
    leftBarOpenStatus = leftBarOpenStatus.map(function (ele, index3) {
      return index3 === index1 ? !ele : false;
    });
    makeLeftBar();
  } else {
    let leftBarAllInstance = [...leftBarArrAll];
    leftBarAllInstance[index1] = leftBarArr[index1][index2];
    makeLeftBar(leftBarAllInstance);
    ddActionsNew(index1, index2);
    //makeLeftBar({ dd: index1, option: index2, strMenu: strMenu });
  }
}
function ddActionsNew(index1, index2) {
  let ddActionsFns = [
    [
      defaultBoardUI1,
      changeThemesUI,
      changeBoardColorUI,
      changeHighlightedColorUI,
      changeCheckColorUI,
      changePreviousColorUI,
      changePieceType,
      addBackgroundPicture,
      showColRow,
    ],
    [
      defaultBoardUI2,
      highlightPreviousMoveSetting,
      highlightSelectedPieceSetting,
      showLegalMoveSetting,
      changeValidMoveDot,
    ],
    [showPGN, importPGNUI],
  ];
  ddActionsFns[index1][index2]();
}

//Make RightBar
function makeRightBar() {
  if (!time) return;
  let tableStr = "";
  let numMoves = rightPgnArr.length - 1;
  let rightPgnArrCopy = [...rightPgnArr];
  if (rightPgnArr.length === 1) rightPgnArrCopy.push(" ");
  let tableArr = rightPgnArrCopy.map(function (ele, index) {
    if (index % 2 == 0)
      return (
        "<tr><th class ='right-bar-th'>" +
        (Math.abs(index / 2) + 1) +
        "</th><td id='rightbarMove-" +
        index +
        "' class = 'right-bar-td" +
        (index === numMoves ? "-selected" : "") +
        " right-bar-td-even' onclick='rightBarMoveNumber(" +
        index +
        ")'>" +
        ele +
        "</td>"
      );
    else
      return (
        "<td id='rightbarMove-" +
        index +
        "' class = 'right-bar-td" +
        (index === numMoves ? "-selected" : "") +
        " right-bar-td-odd' onclick='rightBarMoveNumber(" +
        index +
        ")'>" +
        ele +
        "</td></tr>"
      );
  });
  let headStr =
    "<thead>" +
    "<div class='btn-group-vertical w-100' role='group'>" +
    "<div class='btn-group rounded-1' role='group'>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='copyPGN()'><i class='fa-solid fa-copy'></i></button>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='backwardFastPGN()'><i class='fa-solid fa-backward-fast'></i></button>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='backwardStepPGN()'><i class='fa-solid fa-backward-step'></i></button>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='forwardStepPGN()'><i class='fa-solid fa-forward-step'></i></button>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='forwardFastPGN()'><i class='fa-solid fa-forward-fast'></i></button>" +
    "<button class='p-3 btn btn-light btn-right-block w-100 h-100' onclick='flipBoard()'><i class='fa-solid fa-rotate'></i></button>" +
    "</div>" +
    "</div>" +
    "</thead>";
  if (rightPgnArr.length != 0) {
    tableStr =
      headStr +
      "<div class='table-container'><table class='table-dark table-block' id='showLeftBarMoves'>" +
      tableArr.join("") +
      "</table></div>";
  }
  let timerWhite = document.getElementById("timerWhite")?.innerHTML || convertTimeToDisplay(calcTimeLeft("white"));
  let timerBlack = document.getElementById("timerBlack")?.innerHTML || convertTimeToDisplay(calcTimeLeft("black"));
  let nameWhite = myAccountName ? myAccountName + "(W)" : youNameValue;
  let nameBlack = oppNameValue;
  if (flagComp.comp && flagComp.color === "white") {
    nameWhite = oppNameValue;
    nameBlack = myAccountName ? myAccountName + "(B)" : youNameValue;
  }
  const isMobile = window.innerWidth <= mobileResponsiveMaxWidth;
  let timersHTMLBlack =`
    <div id="timersOnlyContainerBlack" class='btn-group-vertical w-100' role='group'>
      <div class='btn-group' role='group'>
        <input type='text' class='btn-name-right' id='opponentName' value=${"&nbsp;&nbsp;"+nameBlack} ${oppDisableStr} placeholder='Opponent'>
        <button class = 'p-3 btn btn-light btn-right w-100 h-100' id='timerBlack' >${timerBlack}</button>
      </div>
    </div>
  `;
  let timersHTMLWhite =`
    <div id="timersOnlyContainerWhite" class='btn-group-vertical w-100' role='group'>
      <div class='btn-group' role='group'>
        <input type='text' class='btn-name-right' id='userName' value=${"&nbsp;&nbsp;"+nameWhite} placeholder='You'>
        <button class = 'p-3 btn btn-light btn-right w-100 h-100' id='timerWhite' >${timerWhite}</button>
      </div>
    </div>
  `;
  let rightStr =
    `<div class='containerRight'>
      <div id='missingPieceWhite' class='missing-piece-top'></div>
      ${isMobile ? "" : timersHTMLBlack}
      <span class='color-line-top'></span>
      ${tableStr}
      <span class='color-line-bottom'></span>
      ${isMobile ? "" : timersHTMLWhite}
      <div id='missingPieceBlack' class='missing-piece-bottom'></div>
    </div>`;
  const rightbar = document.getElementById("rightbar");
  rightbar.innerHTML = rightStr;
  const display = document.getElementById("display");
  //const existingTimers = document.getElementById("timersOnlyContainer");
  //if (existingTimers) existingTimers.remove();
  clearMobileTimers();
  console.log("tabClickedByUser:::",tabClickedByUser);
  if (isMobile) {
    if (tabClickedByUser===navArr[1]){
      //if (display && !document.getElementById("timersOnlyContainer")) {
      if (display && !document.getElementById("timersOnlyContainerBlack")) {
        //console.log("Appending::: timersHTMLBlack+timersHTMLWhite");
        //timersOnlyContainer = `<div id="timersOnlyContainer">${timersHTMLBlack} ${timersHTMLWhite}</div>`;
        //display.insertAdjacentHTML("afterend", timersOnlyContainer);
        display.insertAdjacentHTML("beforebegin", `<div id="timersOnlyContainerBlackMobile">${timersHTMLBlack}</div>`);
        display.insertAdjacentHTML("afterend", `<div id="timersOnlyContainerWhiteMobile">${timersHTMLWhite}</div>`);
      }
    }
  }
  if (rightPgnArr.length > 1) {
    document.getElementById("showLeftBarMoves").innerHTML = tableArr.join("");
  }

  // Scroll to bottom of move list
  if (rightPgnArr.length !== 0 && rightPgnArr.length !== 1) {
    let tableContainer = document.querySelector(".table-container");
    tableContainer.scrollTop = tableContainer.scrollHeight;
    missingPiecesUpdate();
  }
  previousRightBarMoveNum = rightPgnArr.length - 1;
}
function clearMobileTimers(){
  if (document.getElementById("timersOnlyContainerBlackMobile")) document.getElementById("timersOnlyContainerBlackMobile").remove(); 
  if (document.getElementById("timersOnlyContainerWhiteMobile")) document.getElementById("timersOnlyContainerWhiteMobile").remove(); 
}
function rightBarMoveNumber(moveNum) {
  let element1 = document.getElementById(
    "rightbarMove-" + previousRightBarMoveNum
  );
  element1.classList.remove("right-bar-td-selected");
  let element2 = document.getElementById("rightbarMove-" + moveNum);
  element2.classList.add("right-bar-td-selected");
  disableBoardForUser = true;
  if (moveNum <= previousRightBarMoveNum) {
    console.log("UndoMove::", previousRightBarMoveNum - moveNum);
    for (let i = 0; i < previousRightBarMoveNum - moveNum; i++) undoMove();
  } else if (moveNum > previousRightBarMoveNum) {
    console.log("redoMove::", moveNum - previousRightBarMoveNum);
    for (let i = 0; i < moveNum - previousRightBarMoveNum; i++) redoMove();
  }
  previousRightBarMoveNum = moveNum;
  if (moveNum === rightPgnArr.length - 1) {
    disableBoardForUser = false;
    makeBoard();
  }
}

//Timer data
function timerDataFn(isMoveStart) {
  if (isMoveStart && timerData.length===moveCount){
    timerData.push(Date.now());
  }
  else if (!isMoveStart && timerData.length===moveCount){
    timerData.push(Date.now());
  }
  if (isMoveStart && timerData.length===1){
    updateTimerDisplays();
    timerId = startTimerTicking(updateTimerDisplays,300);
  }
}

function startTimerTicking(updateDisplayFn,timeSlice) {
  const timerTicker = setInterval(() => {
    updateDisplayFn();
  }, timeSlice);
  return timerTicker;
}
function calcTimeLeft(color){
  colorNum = color==="white" ? 0 : 1;
  totalTime = 0;
  if (colorNum===0)
    totalTime = time.total + time.incr*(moveCount%2===0 ? moveCount/2 : (moveCount+1)/2);
  else
    totalTime = time.total + time.incr*(moveCount%2===0 ? moveCount/2 : (moveCount-1)/2);
  timeUsedArr = [];
  for (let i=1;i<timerData.length;i++){
    timeUsedArr.push(timerData[i]-timerData[i-1]);
  }
  timeUsed = 0;
  for (let i=colorNum;i<timeUsedArr.length;i=i+2)
    timeUsed+=timeUsedArr[i];
  currMoveTime = timerData.length>0 ? Date.now()-timerData[timerData.length-1] : 0;
  if (moveCount%2===colorNum)
    timeUsed = timeUsed + currMoveTime;
  timeUsed = timeUsed/1000;
  timeLeft = Math.trunc(totalTime-timeUsed);
  return timeLeft;
}

function convertTimeToDisplay(timeLeft){
  timeLeftMins = Math.trunc(timeLeft/60);
  timeLeftSecs = timeLeft-60*timeLeftMins;
  timeLeftSecs = timeLeftSecs<0 ? 0 : timeLeftSecs;
  timeLeftStr = ""+timeLeftMins+":"+(timeLeftSecs>9 ? timeLeftSecs : "0"+timeLeftSecs);
  return timeLeftStr;
}

function updateTimerDisplays(){
  timerWhiteLeft = calcTimeLeft("white");
  timerWhiteLeft = timerWhiteLeft ? timerWhiteLeft : 0;
  timerBlackLeft = calcTimeLeft("black");
  timerBlackLeft = timerBlackLeft ? timerBlackLeft : 0;
  console.log("timerWhiteLeft::",timerWhiteLeft);
  if (document.getElementById("timerWhite"))  {
    document.getElementById("timerWhite").innerHTML = convertTimeToDisplay(timerWhiteLeft);
    document.getElementById("timerBlack").innerHTML = convertTimeToDisplay(timerBlackLeft);
  }
  if (timerId &&(timerWhiteLeft<=0 || timerBlackLeft <=0)) {
    if (timerId) clearInterval(timerId);
    timerId = null;
    showPopup("Time Over");
  }
}

//Game over check
function checkGameOver(){
  if (prevrow !== -1 && prevcol !== -1)
    return;
  makePGN();
  let isGameOver = true;
  pgnStr = pgnStr.trim();
  if (pgnStr[pgnStr.length-1]==='+'){
    console.log("Check");
    for (let row=0;row<8;row++){
      for (let col=0;col<8;col++){
        prevrow = row;
        prevcol = col;
        showValidMoves();
        inCheckCondition(boardArr[row][col].color);
        //console.log("showMovesArr:::",showMovesArr);
        if (showMovesArr.length>0){
          console.log("Found a move:::",row,col,showMovesArr);
          isGameOver = false;
          break;
        }
      }
      if (!isGameOver)
        break;
    }
    if (isGameOver){
      let nameWhite = myAccountName ? myAccountName+"(W)" : youNameValue;
      let nameBlack = oppNameValue;
      if (flagComp.comp && flagComp.color ==="white") {
        nameWhite = oppNameValue;
        nameBlack = myAccountName ? myAccountName+"(B)" : youNameValue;
      }
      console.log("MoveCount=",moveCount," ",nameWhite," ",nameBlack);
      let strName = moveCount%2===1 ? nameWhite : nameBlack;
      let str = "Game over. Game won by "+strName;
      showGameOverPopup(str);
      //alert("Game is Over");
    }
  }
  prevrow = -1;
  prevcol = -1;
}

//Board Logic
async function boardClickByUser(row, col) {
  //console.log("boardClickByUser:::::");
  if (disableBoardForUser) return;
  userNewMoveClick = true;
  timerDataFn(true);
  boardClick(row, col);
  userNewMoveClick = false;
  let color = moveCount % 2 == 0 ? "white" : "black";
  //console.log(color, moveCount);
  timerDataFn(false);
  checkGameOver();
  if (color == flagComp.color && flagComp.comp) {
    timerDataFn(true);
    currFen = convert2Fen(pgnStr).pop();
    let compMove = await getBestMove(currFen);
    if (!flagComp.comp) return;
    //console.log("Computer Move:::",color,moveCount,compMove);
    compRow = "8".charCodeAt(0) - compMove.charCodeAt(1);
    compCol = compMove.charCodeAt(0) - "a".charCodeAt(0);
    boardClick(compRow, compCol);
    setTimeout(() => {}, 50);
    compRow = "8".charCodeAt(0) - compMove.charCodeAt(3);
    compCol = compMove.charCodeAt(2) - "a".charCodeAt(0);
    boardClick(compRow, compCol);
    undoCompBool = true;
    timerDataFn(false);
    checkGameOver();
  }
}
function boardClick(row, col) {
  //console.log(prevrow, prevcol, row, col);
  // closeOptionsLeftDD();
  if (!comingFromRedoMoveBool) lastMoveUndoMoveBool = false;
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
      highlightMoveCells();
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
        lastMoveJSON.promotionBool = true;
        lastMoveJSON.pawnPromotedto = isLoadingPGNPawnPromotionJSON.json.piece;
        isLoadingPGNPawnPromotionJSON = {};
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
        if (userNewMoveClick) redoMoveArr.splice(0, redoMoveArr.length);
      }
      makePGN();
      if (!localePgnGenerationStopBool) pgnArr.push(lastMoveJSON);
      makeBoard();
      if (!localePgnGenerationStopBool) pgnArr.pop();
      if (Object.keys(temp).length != 0)
        pointUpdateCounter(temp.piece, temp.color);
      //if (document.getElementById("dd3").value === leftBarArr3[0]) showPGN();
      gameStartBool = true;
      storeGameData();
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
      "<div class='container'><div class='row row-cols-8 justify-content-center'>";
    for (j = 0; j <= 7; j++) str += makeVirtualCell(i, j, false);
    str += "</div></div>";
  }
  strPiece = "";
  for (i = 0; i <= 7; i++) {
    strPiece +=
      "<div class='container'><div class='row row-cols-8 justify-content-center'>";
    for (j = 0; j <= 7; j++) strPiece += makeVirtualCell(i, j, true);
    strPiece += "</div></div>";
  }
  let labelArrMap = labelArr.map(function (ele) {
    return "<div class='virtualBox abcd-label'></div>";
  });
  virtualBoardStr =
    "<div class = 'containerFrame-virtual containerFrame-virtual-z-index-low'>" +
    str +
    "<div class='row row-cols-8 abcd-label-height-adjustment-virtual-black-cover abcd-label-padding' style='background-color: rgba(0,0,0,0.6)'>" +
    labelArrMap.join("") +
    "</div></div>";
  virtualBoardStr +=
    "<div class = 'containerFrame-virtual containerFrame-virtual-pieces-z-index-high'>" +
    strPiece +
    "<div class='row row-cols-8 abcd-label-height-adjustment-virtual-black-cover abcd-label-padding' >" +
    labelArrMap.join("") +
    "</div></div>";
  makeBoard();
}
function makeVirtualCell(row, col, showPieceBool) {
  let pieceStr = "";
  let colorStr = "";
  let extraInfoStr = "";
  let onclickStr = "";
  num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });
  if (showPieceBool && Object.keys(virtualBoardArr[row][col]).length != 0)
    pieceStr =
      "<img src = '" +
      imagePath +
      virtualBoardArr[row][col].key +
      "' height = '60' onclick = hello(" +
      row +
      "," +
      col +
      ") draggable=false>";
  if (row === 0 && col === 0) {
    extraInfoStr = "-top-start";
  } else if (row === 7 && col === 0) {
    extraInfoStr = "-bottom-start";
  } else if (row === 0 && col === 7) {
    extraInfoStr = "-top-end";
  } else if (row === 7 && col === 7) {
    extraInfoStr = "-bottom-end";
  }
  let labelStr =
    col === 0
      ? "<div class = 'p-1 label-col-box virtualBorder" +
        extraInfoStr +
        (showPieceBool ? " 'style='background-color: rgba(0,0,0,0.6)'" : " '") +
        "></div>"
      : "";
  if (showPieceBool && Object.keys(virtualBoardArr[row][col]).length != 0) {
    colorStr =
      virtualBoardArr[row][col].color === "white"
        ? " gradient-circle gradient-circle-white'"
        : " gradient-circle gradient-circle-black'";
    onclickStr = " onclick = pawnPromotionClick(" + row + "," + col + ")>";
  } else if (Object.keys(virtualBoardArr[row][col]).length != 0) {
    colorStr = "'  style='background-color: rgba(0,0,0,0.6)'";
    onclickStr = " >";
  } else if (showPieceBool) {
    colorStr = "'  ";
    onclickStr = " >";
  } else {
    colorStr = "'  style='background-color: rgba(0,0,0,0.6)'";
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
function pawnPromotionClick(row, col) {
  virtualBoardStr = "";
  let localerow = row < 4 ? 0 : 7;
  boardArr[localerow][col] = virtualBoardArr[row][col];
  lastMoveJSON.promotionBool = true;
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
  makeBoard();
  virtualBoardArr = boardArrLine.map(function (ele) {
    return [...boardArrLine];
  });
  redoMoveArr.splice(0, redoMoveArr.length);
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
      return (
        ele.row === prevrow &&
        ele.col === 6 &&
        Math.abs(prevcol - ele.col) === 2
      );
    });
    if (index != -1) showMovesArr.splice(index, 1);
  }
  bool = checkCheckCastle(prevrow, 2) || checkCheckCastle(prevrow, 3);
  if (bool || underCheck.bool) {
    let index = showMovesArr.findIndex(function (ele) {
      return (
        ele.row === prevrow &&
        ele.col === 2 &&
        Math.abs(prevcol - ele.col) === 2
      );
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
    lastMoveJSON.castleType = "short";
  } else if (col < prevcol && castleBool["long" + color]) {
    boardArr[row][3] = boardArr[row][0];
    boardArr[row][0] = {};
    lastMoveJSON.castleType = "long";
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
    promotionBool: false,
    castleBool: false,
    castleDisable: -1,
    castleType: "",
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
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  if (pgnArr.length === 0) {
    showCustomAlert("Please Play Move");
    return;
  }
  let lastMoveJSON = pgnArr.pop();
  redoMoveArr.push(lastMoveJSON);
  lastMoveUndoMoveBool = true;
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
  } else if (lastMoveJSON.promotionBool) {
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
  highlightPieceBool = false;
  makeBoard();
  highlightPieceBool = true;
  if (flagComp.comp && undoCompBool) {
    undoCompBool = false;
    undoMove();
  }
}
function redoMove() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  if (!lastMoveUndoMoveBool || redoMoveArr.length === 0) {
    showCustomAlert("Please Undo Move");
    return;
  }
  let localeLastMove = redoMoveArr.pop();
  comingFromRedoMoveBool = true;
  makeBoardViaPGN(localeLastMove);
}
function undoMoveByUser() {
  if (disableBoardForUser) {
    showCustomAlert("Please go to Last Move");
    return;
  }
  undoMove();
}
function redoMoveByUser() {
  if (disableBoardForUser) {
    showCustomAlert("Please go to Last Move");
    return;
  }
  redoMove();
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
  let strMapBlack = missingPiecesCountArr.map(function (ele, index) {
    if (index <= 5)
      return (
        "<img src = '" +
        imagePath +
        pieceImageArr[index] +
        "' height ='40' draggable=false>"
      ).repeat(ele);
  });
  let strMapWhite = missingPiecesCountArr.map(function (ele, index) {
    if (index > 5)
      return (
        "<img src = '" +
        imagePath +
        pieceImageArr[index] +
        "' height ='40' draggable=false>"
      ).repeat(ele);
  });
  document.getElementById("missingPieceBlack").innerHTML =
    strMapBlack.join("") + pointDifference("white");
  document.getElementById("missingPieceWhite").innerHTML =
    strMapWhite.join("") + pointDifference("black");
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
function pointDifference(color) {
  let pointsStr = "";
  let evalNumber = diffPoints();
  if (evalNumber > 0 && color === "white") {
    pointsStr =
      "<p class='point-diff-font-white'>&nbsp;+" +
      Math.abs(evalNumber) +
      "</p>";
  } else if (evalNumber < 0 && color === "black") {
    pointsStr =
      "<p class='point-diff-font-black'>&nbsp;+" +
      Math.abs(evalNumber) +
      "</p>";
  } else {
    pointsStr = "";
  }
  return pointsStr;
}

//PGN Encoder/Decoder
function makePGN() {
  if (disableBoardForUser) return;
  rightPgnArr = [];
  pgnStr = pgnArr.reduce(function (ans, ele) {
    let notation = "";
    let notationExtra = "";
    let colPgn = ["a", "b", "c", "d", "e", "f", "g", "h"];
    if (ele.color === "white")
      notationExtra = Math.floor(ele.moveNumber / 2) + 1 + ".";
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
      if (ele.promotionBool) {
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
    rightPgnArr.push(notation);
    notation = notationExtra + notation + " ";
    return ans + notation;
  }, " ");
  makeRightBar();
}
function importGame() {
  makeStartBoard();
  pgnStr = document.getElementById("moveHistory").value;
  let storedGame = testCases.find(function (ele) {
    return ele.name === pgnStr;
  });
  if (storedGame) pgnStr = storedGame.pgnStr;
  showPGN();
  decodePGN();
  isLoadingPGNPawnPromotionJSON = {};
  leftBarOpenStatus[2] = true;
  showOptionsLeftDD(2, 0);
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
      pawnPromotedtoPoints: -1,
      color: i % 2 == 0 ? "white" : "black",
      moveNumber: i,
      enPassantBool: false,
      cutPieceBool: false,
      promotionBool: false,
      pawnPromotedto: "",
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
            lastMovePGN.pawnPromotedto = "knight";
            lastMovePGN.pawnPromotedtoPoints = 3 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "R") {
            lastMovePGN.pawnPromotedto = "rook";
            lastMovePGN.pawnPromotedtoPoints = 5 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "B") {
            lastMovePGN.pawnPromotedto = "bishop";
            lastMovePGN.pawnPromotedtoPoints = 3 * localePointMultplierNumber;
          } else if (moveStrdecodePGN[j + 1] === "Q") {
            lastMovePGN.pawnPromotedto = "queen";
            lastMovePGN.pawnPromotedtoPoints = 9 * localePointMultplierNumber;
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
          //lastMovePGN.prevrow = +moveStrdecodePGN[1];
          lastMovePGN.prevrow = 8 - moveStrdecodePGN[1];
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
      pointCount[color + lastMovePGN.pawnPromotedto]++;
      pointCountInit[color + lastMovePGN.pawnPromotedto]++;
      isLoadingPGNPawnPromotionJSON = {
        row: lastMovePGN.newrow,
        col: lastMovePGN.newcol,
        json: {
          piece: lastMovePGN.pawnPromotedto,
          color: color,
          key: lastMovePGN.pawnPromotedto + "+" + color + ".png",
          points: lastMovePGN.pawnPromotedtoPoints,
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
    showColRow();
  } else if (index === 7) {
    changeThemesUI();
  } else if (index === 8) {
    document.getElementById("dd1").value = leftBarArrAll[0].txt;
    document.getElementById("dd1menu").innerHTML = "";
  }
  document.getElementById("dd2menu").innerHTML = "";
  document.getElementById("dd2").value = leftBarArrAll[1].txt;
  document.getElementById("dd3menu").innerHTML = "";
  document.getElementById("dd3").value = leftBarArrAll[2].txt;
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
    document.getElementById("dd2").value = leftBarArrAll[1].txt;
    document.getElementById("dd2menu").innerHTML = "";
  }
  document.getElementById("dd1menu").innerHTML = "";
  document.getElementById("dd1").value = leftBarArrAll[0].txt;
  document.getElementById("dd3menu").innerHTML = "";
  document.getElementById("dd3").value = leftBarArrAll[2].txt;
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
    document.getElementById("dd3").value = leftBarArrAll[2].txt;
    document.getElementById("dd3menu").innerHTML = "";
  }
  document.getElementById("dd1menu").innerHTML = "";
  document.getElementById("dd1").value = leftBarArrAll[0].txt;
  document.getElementById("dd2menu").innerHTML = "";
  document.getElementById("dd2").value = leftBarArrAll[1].txt;
}

//LeftBar dd1
function defaultBoardUI1() {
  setBackgroundImage("");
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
    "' disabled></input></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='colRowSwitch'> Column & Row :</label><input class='form-check-input' type='checkbox' role='switch' id='colRowSwitch' checked disabled></div></div></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
}
function changeThemesUI() {
  let radioStr = themeLogoPaths
    .map(function (ele, index) {
      return (
        "<input type='radio' class='btn-check' name='theme1' id='rt" +
        index +
        "' autocomplete='off' " +
        (imagePath === baseImagePath + ele ? "checked" : "") +
        "><label class='btn btn-outline-light' for='rt" +
        index +
        "'><button type='button' class='p-3 btn btn-light btn-theme-block' onclick='themeLogoChange(\"rt" +
        index +
        "\",true)'><i class='bi bi-sliders2 scale-sliders-icon'></i></button><img src = '" +
        baseThemePath +
        ele +
        "' width = '100' draggable=false class = 'theme-img-piece'></label></input><div class='height-break'></div>"
      );
    })
    .join("");
  let menuStr =
    "<div class='btn-group-horizontal radio-piece-class justify-content-center' role='group'>" +
    radioStr +
    "</div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const radioButtons = document.querySelectorAll('input[name="theme1"]');
  radioButtons.forEach((button) => {
    button.addEventListener("change", function () {
      themeLogoChange(button.id, false);
    });
  });
}
function themeLogoChange(id, localeThemeLoadBool) {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  setBackgroundImage("");
  let localeJson = themesValueArr.find(function (ele) {
    return ele.id === id;
  });
  clr1 = localeJson.clr1;
  clr2 = localeJson.clr2;
  clr1x = localeJson.clr1x;
  clr2x = localeJson.clr2x;
  clr1c = localeJson.clr1c;
  clr2c = localeJson.clr2c;
  clr1p = localeJson.clr1p;
  clr2p = localeJson.clr2p;
  colRowBoolInitial = true;
  colRowBool = colRowBoolInitial;
  if (localeJson.name === "pastel") {
    imagePath = baseImagePath + pieceImagePaths[2];
  } else imagePath = baseImagePath + pieceImagePaths[0];
  if (localeThemeLoadBool) {
    let menuStr =
      "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block menu-block-width-default'>Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker1' value='" +
      localeJson.clr1 +
      "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-width-default'>Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker2' value='" +
      localeJson.clr2 +
      "'></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width-default'>Check Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker5' value='" +
      localeJson.clr1c +
      "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-check-width-default'>Check Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker6' value='" +
      localeJson.clr2c +
      "'></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width-default'>Previous Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker7' value='" +
      localeJson.clr1p +
      "'></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-previous-width-default'>Previous Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker8' value='" +
      localeJson.clr2p +
      "'></input></div></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width-default'>Highlighted Color 1:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker3' value='" +
      localeJson.clr1x +
      "')></input></div><div class='input-group input-group-pkr w-100'><div class='input-group-text menu-block  menu-block-highlight-width-default'>Highlighted Color 2:</div><input type='color' class='form-control form-control-color-pkr' id='colorPicker4' value='" +
      localeJson.clr2x +
      "'></input></div><div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='colRowSwitch'> Column & Row :</label><input class='form-check-input' type='checkbox' role='switch' id='colRowSwitch' checked></div></div></div></div>";
    document.getElementById("dd1menu").innerHTML = menuStr;
    const colorPicker1 = document.getElementById("colorPicker1");
    const colorPicker2 = document.getElementById("colorPicker2");
    const colorPicker3 = document.getElementById("colorPicker3");
    const colorPicker4 = document.getElementById("colorPicker4");
    const colorPicker5 = document.getElementById("colorPicker5");
    const colorPicker6 = document.getElementById("colorPicker6");
    const colorPicker7 = document.getElementById("colorPicker7");
    const colorPicker8 = document.getElementById("colorPicker8");
    colorPicker1.addEventListener("input", () => colorChanged(1));
    colorPicker2.addEventListener("input", () => colorChanged(2));
    colorPicker3.addEventListener("input", () => colorChanged(3));
    colorPicker4.addEventListener("input", () => colorChanged(4));
    colorPicker5.addEventListener("input", () => colorChanged(5));
    colorPicker6.addEventListener("input", () => colorChanged(6));
    colorPicker7.addEventListener("input", () => colorChanged(7));
    colorPicker8.addEventListener("input", () => colorChanged(8));
    colorPicker1.addEventListener("focus", updateBoxShadow);
    colorPicker1.addEventListener("blur", resetBoxShadow);
    colorPicker1.addEventListener("input", updateBoxShadow);
    colorPicker2.addEventListener("focus", updateBoxShadow);
    colorPicker2.addEventListener("blur", resetBoxShadow);
    colorPicker2.addEventListener("input", updateBoxShadow);
    colorPicker3.addEventListener("focus", updateBoxShadow);
    colorPicker3.addEventListener("blur", resetBoxShadow);
    colorPicker3.addEventListener("input", updateBoxShadow);
    colorPicker4.addEventListener("focus", updateBoxShadow);
    colorPicker4.addEventListener("blur", resetBoxShadow);
    colorPicker4.addEventListener("input", updateBoxShadow);
    colorPicker5.addEventListener("focus", updateBoxShadow);
    colorPicker5.addEventListener("blur", resetBoxShadow);
    colorPicker5.addEventListener("input", updateBoxShadow);
    colorPicker6.addEventListener("focus", updateBoxShadow);
    colorPicker6.addEventListener("blur", resetBoxShadow);
    colorPicker6.addEventListener("input", updateBoxShadow);
    colorPicker7.addEventListener("focus", updateBoxShadow);
    colorPicker7.addEventListener("blur", resetBoxShadow);
    colorPicker7.addEventListener("input", updateBoxShadow);
    colorPicker8.addEventListener("focus", updateBoxShadow);
    colorPicker8.addEventListener("blur", resetBoxShadow);
    colorPicker8.addEventListener("input", updateBoxShadow);
    const colRowInput = document.getElementById("colRowSwitch");
    colRowInput.addEventListener("change", function () {
      if (this.checked) {
        colRowBool = true;
      } else {
        colRowBool = false;
      }
      makeBoard();
    });
  }
  makeBoard();
  makeRightBar();
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
  let radioStr = pieceImagePaths
    .map(function (ele, index) {
      return (
        "<input type='radio' class='btn-check' name='radio1' id='r" +
        index +
        "' autocomplete='off' " +
        (imagePath === baseImagePath + ele ? "checked" : "") +
        "><label class='btn btn-outline-light' for='r" +
        index +
        "'><img src = '" +
        baseImagePath +
        ele +
        pieceImageArr[0] +
        "' draggable=false class = 'radio-img-piece'></label></input><div class='height-break'></div>"
      );
    })
    .join("");
  let menuStr =
    "<div class='btn-group-horizontal radio-piece-class justify-content-center' role='group'>" +
    radioStr +
    "</div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const radioButtons = document.querySelectorAll('input[name="radio1"]');
  radioButtons.forEach((button) => {
    button.addEventListener("change", function () {
      pieceTypeChange(button.id);
    });
  });
}
function pieceTypeChange(id) {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  let index = +id.substring(1, id.length);
  imagePath = baseImagePath + pieceImagePaths[index];
  makeBoard();
  makeRightBar();
}
function showColRow() {
  let str = colRowBool ? "checked" : "";
  let menuStr =
    "<div class='btn-group-vertical w-100' role='group'><div class='input-group input-group-pkr w-100'><div class='form-check form-switch menu-block w-100'><label class='form-check-label' for='colRowSwitch'>Column & Row :</label><input class='form-check-input' type='checkbox' role='switch' id='colRowSwitch' " +
    str +
    "></div></div></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  const colRowInput = document.getElementById("colRowSwitch");
  colRowInput.addEventListener("change", function () {
    if (this.checked) {
      colRowBool = true;
    } else {
      colRowBool = false;
    }
    makeBoard();
  });
}
function addBackgroundPicture() {
  menuStr =
    "<div class='input-group input-group-pkr w-100'><input type='file' id='bgUpload' accept='image/*'/></div>";
  document.getElementById("dd1menu").innerHTML = menuStr;
  document
    .getElementById("bgUpload")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          setBackgroundImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
}
function setBackgroundImage(imageUrl) {
  document.body.style.backgroundImage = `url(${imageUrl})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
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
  if (pgnStr === "") {
    showCustomAlert("Please Play a Move First");
    showOptionsLeftDD(-1, -1);
  }
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
    "<span class = 'text-area-block w-100 justify-content-center'>Enter PGN : </span><div class='input-group'><textarea class='input-group-text text-area-block w-100' id='moveHistory'></textarea></div><button class = 'p-3 btn btn-light btn-import w-100 h-100' id='importGameBtn' onclick = 'importGame()' disabled><i class='fa-solid fa-upload'></i> Load Game</button>";
  document.getElementById("dd3menu").innerHTML = menuStr;
  const textarea = document.getElementById("moveHistory");
  textarea.addEventListener("input", adjustTextareaHeight);
  textarea.addEventListener("paste", adjustTextareaHeight);
}
function adjustTextareaHeight() {
  let maxHeightTextAreaPGN = 318;
  const textarea = document.getElementById("moveHistory");
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
  if (textarea.scrollHeight > maxHeightTextAreaPGN)
    textarea.style.height = maxHeightTextAreaPGN + "px";
  let btnElement = document.getElementById("importGameBtn");
  if (textarea && textarea.value.length > 0) btnElement.disabled = false;
  else btnElement.disabled = true;
}

//UI RightBar Actions
function copyPGN() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  const textToCopy = pgnStr;
  navigator.clipboard
    .writeText(textToCopy)
    .then(function () {
      showCustomAlert("PGN copied to clipboard successfully!");
    })
    .catch(function (err) {
      showCustomAlert("Could not copy text: ", err);
    });
}
function backwardFastPGN() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  rightBarMoveNumber(0);
  let tableContainer = document.querySelector(".table-container");
  tableContainer.scrollTop = 0;
}
function backwardStepPGN() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  if (previousRightBarMoveNum > 0)
    rightBarMoveNumber(previousRightBarMoveNum - 1);
}
function forwardStepPGN() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  if (previousRightBarMoveNum < rightPgnArr.length - 1)
    rightBarMoveNumber(previousRightBarMoveNum + 1);
}
function forwardFastPGN() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  rightBarMoveNumber(rightPgnArr.length - 1);
  let tableContainer = document.querySelector(".table-container");
  tableContainer.scrollTop = tableContainer.scrollHeight;
}
function flipBoard() {
  if (virtualBoardStr != "") {
    showCustomAlert("Please Select Piece To Promote");
    return;
  }
  let flipBoardArr = boardArrLine.map(function (ele) {
    return [...boardArrLine];
  });
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      flipBoardArr[i][j] = boardArr[7 - i][7 - j];
    }
  }
  boardArr = flipBoardArr;
  makeBoard();
}

//PGN to FEN
function convert2Fen(pgn) {
  let moves = pgn2Arr(pgn);
  let startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let fens = [];
  fens.push(startFen);
  for (let i = 0; i < moves.length; i++) {
    const chess = new Chess(fens[i]);
    fens.push(addMove2Fen(chess, fens[i], moves[i]));
  }
  return fens;
}
function pgn2Arr(pgn) {
  let moves = [];
  let token = "";
  for (let i = 0; i < pgn.length; i++) {
    let char = pgn[i];
    if (char === " ") {
      if (token.length > 0) moves.push(token);
      token = "";
    } else if (char === ".") token = "";
    else token += char;
  }
  if (token.length > 0) moves.push(token);
  return moves;
}
function addMove2Fen(chess, fen, move) {
  const result = chess.move(move, { sloppy: true });
  if (result) {
    let newFen = chess.fen();
    return newFen;
  } else {
    return "Invalid move!";
  }
}

//StockFish API Calls
function testStockfishServer(){
  console.log("calling testStockfishServer");
  const url = "https://stockfishserver.onrender.com/test/basic";
  fetch(url,{method: 'GET'});
}

async function callStockAPI(fen="", depth = stockLvl,options={}) {
  const baseServer = "https://stockfishserver.onrender.com/best-move";
  //const baseServer = "https://stockfish.online/api/s/v2.php";
  //https://stockfishserver.onrender.com/best-move?fen=rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR%20w%20KQkq%20-%200%201&depth=5
  const url = `${baseServer}?fen=${encodeURIComponent(
    fen
  )}&depth=${depth}`;
  try {
    const response = await fetch(url,{
      method: 'GET',
      signal: options.signal, 
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Stockfish API:", error);
    throw error;
    //return null;
  }
}
async function getBestMoveOld(fen) {
  const data = await callStockAPI(fen);
  if (data && data.success) {
    let bestmove = data.bestmove;
    return bestmove.slice("bestmove ".length, "bestmove ".length + 4);
  } else if (data && data.raw){
    return data.bestMove
  }
  else{
    console.error("Invalid response from Stockfish API:", data);
    return null;
  }
}

async function getBestMove(fen) {
  showCustomAlert("Fetching computer's move",false);
  const data = await getBestMoveWithRetry(fen);
  if (data && data.success) {
    hideCustomAlert();
    let bestmove = data.bestmove;
    return bestmove.slice("bestmove ".length, "bestmove ".length + 4);
  } else if (data && data.raw){
    hideCustomAlert();
    return data.bestMove;
  } else {
    console.error("Invalid response from Stockfish API:", data);
    return null;
  }
}

async function getBestMoveWithRetry(fen, timeout = 10000, maxRetries = 8, retryDelay = 10000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const result = await callStockAPI(fen, stockLvl,{ signal: controller.signal });
      clearTimeout(timeoutId);
      if (result)
        return result; 
    } catch (err) {
      console.log("Error in stockfish API call, attempt num=",attempt);
      clearTimeout(timeoutId);
      if (attempt === maxRetries) {
        throw err; 
      }
    }
    await new Promise(res => setTimeout(res, retryDelay)); // Optional delay before retry    }
  }
}
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
  colRowBoolInitial = window.innerWidth > mobileResponsiveMaxWidth; //true;
  colRowBool = colRowBoolInitial;
  imagePath = baseImagePath + pieceImagePaths[0];
}
function makeDefaultUISettings2() {
  legalBoolInitial = true;
  legalBool = legalBoolInitial;
  highlightPieceBoolInitial = true;
  highlightPieceBool = highlightPieceBoolInitial;
  highlightPreviousBoolInitial = true;
  highlightPreviousBool = highlightPreviousBoolInitial;
  highlightDotRadiusInitial = window.innerWidth > mobileResponsiveMaxWidth ? 16 : 10;
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
function showCustomAlert(message,hide=true) {
  const alertBox = document.getElementById("customAlert");
  const alertMessage = document.getElementById("customAlertMessage");
  alertMessage.textContent = message;
  alertBox.style.display = "block";
  alertBox.style.opacity = 1; // Fade in

  // Hide the alert after 2 seconds
  if (hide)
    setTimeout(function () {
      alertBox.style.opacity = 0; // Fade out
      setTimeout(function () {
        alertBox.style.display = "none";
      }, 500); // Wait for the fade out transition to complete
    }, 1000); // Display duration
}
function hideCustomAlert(){
  const alertBox = document.getElementById("customAlert");
  alertBox.style.display = "none";
}
function updateBoxShadow() {
  this.style.boxShadow = `0 0 1px 1px ${this.value}`;
}
function resetBoxShadow() {
  this.style.boxShadow = "none";
}
// Function to set a specific tab as active
function setActiveTab(tabId) {
  // Get all the nav-links within the navbar
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  // Remove 'active' class from all nav-links
  navLinks.forEach((link) => link.classList.remove("active"));
  // Find the nav-link with the id matching the specified tabId and add 'active' class
  const targetLink = document.getElementById(tabId);
  if (targetLink) {
    targetLink.classList.add("active");
  }
}
function switchNavTab_MakeTimer() {
  if (originTabIndex === null) {
    originTabIndex = navArr.indexOf(tabName);
  }
  setActiveTab("Navbar0");
  navActions(0);
}
function switchNavTab_LoadGame() {
  setActiveTab("Navbar1");
  navActions(1);
}
function switchNavTab_LoadComputer() {
  setActiveTab("Navbar3");
  navActions(3);
}
function showPopup(message) {
  const popupOverlay = document.getElementById("popupOverlay");
  const popup = document.getElementById("customPopup");
  const popupMessage = document.getElementById("popupMessage");
  popupMessage.textContent = message;
  popupOverlay.classList.add("visible");
  popup.classList.add("visible");
}
function hidePopup() {
  const popupOverlay = document.getElementById("popupOverlay");
  const popup = document.getElementById("customPopup");
  const gameOverPopup = document.getElementById("gameOverPopup");
  popupOverlay.classList.remove("visible");
  popup.classList.remove("visible");
  gameOverPopup.classList.remove("visible");
}
function showGameOverPopup(message){
  const popupOverlay = document.getElementById("popupOverlay");
  const popup = document.getElementById("gameOverPopup");
  const popupMessage = document.getElementById("gameOverMessage");
  popupMessage.textContent = message;
  popupOverlay.classList.add("visible");
  popup.classList.add("visible");
}
function showStrengthPopup() {
  const overlay = document.getElementById("strengthOverlay");
  const popup = document.getElementById("strengthPopup");
  const slider = document.getElementById("strengthSlider");
  const level = document.getElementById("levelText");
  const btns = document.querySelectorAll("#colourButtons button");

  btns.forEach((b) => b.classList.remove("selected"));

  // ── 1) build 1–8 slider, pre-select level 4 ────────────────────────────
  slider.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const seg = document.createElement("div");
    seg.textContent = i;
    if (i === 4) {
      seg.classList.add("selected");
      level.textContent = `Stockfish level ${i}`;
      if (i < 5) stockLvl = i;
      else stockLvl = (i - 2) * 2;
    }
    seg.addEventListener("click", () => {
      slider.querySelector(".selected").classList.remove("selected");
      seg.classList.add("selected");
      level.textContent = `Stockfish level ${i}`;
      if (i < 5) stockLvl = i;
      else stockLvl = (i - 2) * 2;
    });
    slider.appendChild(seg);
  }

  // ── 2) wire up clicks to re-select, close popup, and set flagComp.color ──
  userCol = "";
  btns.forEach((b) => {
    b.onclick = () => {
      // clear old
      const prev = document.querySelector("#colourButtons .selected");
      if (prev) prev.classList.remove("selected");

      // mark new
      b.classList.add("selected");
      if (b.dataset.col == "white") {
        flagComp.color = "black";
        userCol = "White";
      } else if (b.dataset.col == "black") {
        flagComp.color = "white";
        userCol = "Black";
      } else if (b.dataset.col == "random") {
        const defaultColor = Math.random() < 0.5 ? "white" : "black";
        flagComp.color = defaultColor;
        if (flagComp.color === "white") userCol = "Black";
        else userCol = "White";
      }
      // close
      hideStrengthPopup();
      timerId = null;
      timerData=[];
      flagComp.color=="white" ? oppNameValue = "Computer(W)" : oppNameValue="Computer(B)";
      flagComp.color=="white" ? youNameValue = "You(B)" : youNameValue="You(W)";
      oppDisableStr = " disabled ";
      showCustomAlert("Your color is " + userCol);
      tabClickedByUser = navArr[1];
      makeRightBar();
      if (flagComp.color === "white") boardClickByUser(4, 4);
    };
  });

  // ── 3) finally, show it ──────────────────────────────────────────────────
  overlay.classList.add("visible");
  popup.classList.add("visible");
}
function hideStrengthPopup() {
  document.getElementById("strengthOverlay").classList.remove("visible");
  document.getElementById("strengthPopup").classList.remove("visible");
}
function handleConfirm() {
  handleBool = true;
  gameStartBool = false;
  gameStoreId = -1;
  tabClickedByUser = storeNavIndex;
  endCurrentGame();
  navActions(storeNavIndex); //to end the current game
  //themeLogoChange("rt2");
  closeOptionsLeftDD();
  hidePopup();
}
function handleCancel() {
  hidePopup();
  handleBool = false;
}

// Drag and Drop
function allowDrop(event) {
  event.preventDefault();
}
function drag(event, row, col) {
  if (disableBoardForUser) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", event.target.id);
  document.body.style.cursor = "grabbing";
  if (prevrow != -1 || prevcol != -1) {
    previousHighlightData = {
      prevrow: prevrow,
      prevcol: prevcol,
      showMovesArr: [...showMovesArr],
    };
  } else previousHighlightData = {};
  prevrow = -1;
  prevcol = -1;
  boardClick(row, col);
  return false;
}
function drop(event, row, col) {
  event.preventDefault();
  document.body.style.cursor = "grab";
  let num = showMovesArr.findIndex(function (ele) {
    return ele.row === row && ele.col === col;
  });
  if (num >= 0) boardClick(row, col);
  else {
    showMovesArr.splice(0, showMovesArr.length);
    prevrow = -1;
    prevcol = -1;
    makeBoard();
  }
}
function updateBoardState(fromSquareRowCol, toSquareRowCol) {
  let [fromRow, fromCol] = fromSquareRowCol;
  let [toRow, toCol] = toSquareRowCol;

  boardArr[toRow][toCol] = boardArr[fromRow][fromCol];
  boardArr[fromRow][fromCol] = {};
}
function dragEnd(event) {
  document.body.style.cursor = "grab";
}

//Computer
let movesSimulated = { do: 0, undo: 0 };
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
function playMoveSimulator(newMoveSimulator) {
  movesSimulated.do++;
  prevrow = -1;
  prevcol = -1;
  boardClick(newMoveSimulator.start.row, newMoveSimulator.start.col);
  boardClick(newMoveSimulator.end.row, newMoveSimulator.end.col);
}
function playToDepth(boardPosition, depth, moveColor) {
  let possibleMoves = generateAllPossibleMoves(boardPosition, moveColor);
  possibleMoves.splice(2, possibleMoves.length - 2);
  if (depth === 1) {
    let selectedMove = selectBestMove(possibleMoves);
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
  let selectedMove = selectBestMove(arr);
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
  movesSimulated = { do: 0, undo: 0 };
  let newMove = playToDepth(boardArr, depth, "white");
}

//testing functions
let testCases = [
  { name: "/pp", pgnStr: " 1.e4 d5 2.exd5 c6 3.dxc6 a6 4.cxb7 a5 " },
  {
    name: "/fc",
    pgnStr:
      " 1.e4 e5 2.Nc3 Nc6 3.Nf3 Nf6 4.Nd5 Nd4 5.Ne3 Ne6 6.Nf5 Nf4 7.N5d4 N4d5 8.d3 d6 9.Bf4 Be7 10.Be2 Bf5 11.exf5 exf4 12.Ne5 dxe5 13.O-O Ne4 14.dxe4 f3 15.f6 O-O 16.fxe7 fxe2 17.exd8=R exd1=R 18.Rfxd1 Raxd8 19.Nc6 Ne7 20.Rxd8 Rxd8 21.Rd1 Rxd1+",
  },
  {
    name: "/lc",
    pgnStr:
      "1.e4 d5 2.exd5 c6 3.dxc6 a6 4.cxb7 a5 5.bxa8=B Bg4 6.Nc3 Qxd2+ 7.Qxd2",
  },
  {
    name: "/g1",
    pgnStr:
      "1.Nc3 Nc6 2.Nf3 Nf6 3.Nd4 Nd5 4.Ne4 Ne5 5.Nf5 Nf4 6.e3 e6 7.Bc4 Bc5 8.Qf3 Qf6 9.d3 d6 10.Bd2 Bd7 11.O-O-O O-O 12.Nfxd6 Nfxd3+ 13.Kb1 Nf4 14.Nf5 Ned3 15.Ned6 Nd5 16.Nd4 N3f4 17.N4f5 Nd3 18.Nd4 N5f4 19.N6f5 Qxd4 20.exd4 Bxd4 21.Qxf4 Nxf4 22.Bxe6 fxe6 23.Nxd4 Nxg2 24.Nxe6 Bxe6 25.Bh6 gxh6 26.h3 Bxh3 27.Rxh3 Rad8 28.Rdh1 Rfe8 29.R1h2 Re5 30.Rxg2+ Kh8 31.Rgh2 Rde8 32.Rh1 R8e6 33.R3h2 Re8 34.Rxh6 R5e7 35.R1h5 Re2 36.Rh2 Rxf2 37.R6h3 Rff8 38.Rd3 c5 39.b4 cxb4 40.c4 b3 41.c5 bxa2+ 42.Kb2 b5 43.cxb6 a1=N",
  },
  {
    name: "/g2",
    pgnStr:
      " 1.a4 b5 2.axb5 c5 3.Rxa7 Qa5 4.Rxa5 d5 5.Ra7 c4 6.c3 g6 7.Rb7 Bg7 8.Rc7 Nf6 9.Rd7 O-O 10.Rc7 Ng4 11.Rd7 f5 12.Rc7 e5 13.Rb7 Rd8 14.Rc7 Bh6 15.Re7 Kh8 16.Rc7 Rf8 17.Rxh7+ ",
  },
  {
    name: "/g3",
    pgnStr:
      " 1.Nc3 Nc6 2.Nf3 Nf6 3.Nd4 Nd5 4.Ne4 Ne5 5.Nf5 Nf4 6.e3 e6 7.Bc4 Bc5 8.Qf3 Qf6 9.d3 d6 10.Bd2 Bd7 11.O-O-O O-O 12.Nfxd6 Nfxd3+ 13.Kb1 Nf4 14.Nf5 Ned3 15.Ned6 Nd5 16.Nd4 N3f4 17.N4f5 Nd3 18.Nd4 N5f4 19.N6f5 Qxd4 20.exd4 Bxd4 21.Qxf4 Nxf4 22.Bxe6 fxe6 23.Nxd4 Nxg2 24.Nxe6 Bxe6 25.Bh6 gxh6 26.h3 Bxh3 27.Rxh3 Rad8 28.Rdh1 Rfe8 29.R1h2 Re5 30.Rxg2+ Kh8 31.Rgh2 Rde8 32.Rh1 R8e6 33.R3h2 Re8 34.Rxh6 R5e7 35.R1h5 Re2 36.Rh2 Rxf2 37.R6h3 Rff8 38.Rd3 c5 39.b4 cxb4 40.c4 b3 41.c5 bxa2+ 42.Kb2 b5 43.cxb6 a1=N 44.bxa7 Nb3 45.a8=N Nc5 46.Nc7 Na4+ 47.Kb3 Rb8+ 48.Kc2 Rf2+ 49.Kd1 Rb1+ ",
  },
  {
    name: "/g4",
    pgnStr:
      " 1.d4 d5 2.e4 dxe4 3.f4 exf3 4.d5 c5 5.dxc6 fxg2 6.cxb7 gxh1=Q 7.bxa8=Q Nh6 8.Na3 e5 9.Be3 Bc5 10.Qe2 O-O 11.Bd2 Nf5 12.O-O-O Qg5 13.Nf3 Qxf3 14.Qexf3 Na6 15.Bd3 Be6 16.Bxg5 Rxa8 17.Qd5 Bxd5 ",
  },
  {
    name: "/3rooks",
    pgnStr:
      "1.Nc3 Nc6 2.Nf3 Nf6 3.Nd4 Nd5 4.Ne4 Ne5 5.Nf5 Nf4 6.e3 e6 7.Bc4 Bc5 8.Qf3 Qf6 9.d3 d6 10.Bd2 Bd7 11.O-O-O O-O 12.Nfxd6 Nfxd3+ 13.Kb1 Nf4 14.Nf5 Ned3 15.Ned6 Nd5 16.Nd4 N3f4 17.N4f5 Nd3 18.Nd4 N5f4 19.N6f5 Qxd4 20.exd4 Bxd4 21.Qxf4 Nxf4 22.Bxe6 fxe6 23.Nxd4 Nxg2 24.Nxe6 Bxe6 25.Bh6 gxh6 26.h3 Bxh3 27.Rxh3 Rad8 28.Rdh1 Rfe8 29.R1h2 Re5 30.Rxg2+ Kh8 31.Rgh2 Rde8 32.Rh1 R8e6 33.R3h2 Re8 34.Rxh6 R5e7 35.R1h5 Re2 36.Rh2 Rxf2 37.R6h3 Rff8 38.Rd3 c5 39.b4 cxb4 40.c4 b3 41.c5 bxa2+ 42.Kb2 b5 43.cxb6 a1=R 44.bxa7 Rae1 45.a8=R R8e3 46.Rad8 Rfe8 47.Rhd2 R1e2 48.R8d4 R8e4 49.Rd6 Re6 50.R3d4 Re1 51.Rd1 R3e4 52.R4d3 R4e3 53.R6d5 R6e5 54.Rc3 Rf3 55.R1d3 R5e3 56.Rb3 Rg3 57.Rdc3 Ref3 58.Rdd3 Ree3 59.Ra3 Rh3 60.Rcb3 Rfg3 61.Rdc3 Ref3 62.Rd3 Re3 63.Rbc3 Rgf3",
  },
  {
    name: "/3knights",
    pgnStr:
      "1.b4 g5 2.b5 a5 3.bxa6 g4 4.h4 gxh3 5.axb7 hxg2 6.bxc8=N gxf1=N 7.Nb6 Ng3 8.Nc4 Nf5 9.Nc3 Nc6 10.Nf3 Nf6 11.Na4 Nd5 12.Nab2 Nf4 13.Nd3 Ne6 14.Nce5 Ned4 15.Nc4 Ne6 16.Nde5 Nfd4 17.Nd3 Nf5 18.Nfe5 Ncd4 19.Nf3 Nc6 20.c3 Ne3 21.Nfe5 Nc2+ 22.Kf1 N2d4 23.Nxd7 Nc2 24.Nce5 N6d4 25.Nxf7 Nc6 26.N7e5 N6d4 27.Nd7 Nc6 28.Nfe5 Ned4 29.Nf7 Ne6 30.N3e5 N2d4 31.Nd3 Nc2",
  },
  { name: "/mateQueen",
    pgnStr: "1.e4 e5 2.d4 d5 3.Bg5 Qxg5 4.f3 dxe4 5.Na3 exf3 6.c4 Bb4+ 7.Kf2 fxg2 8.Bxg2 Qf4+ 9.Bf3 Qh4+ 10.Ke3 exd4+ 11.Kd3 Bf5+ 12.Be4 Bxe4+ 13.Ke2 d3+ 14.Ke3 Qg3+ 15.Kd4 Nc6+ 16.Kxe4 Nf6+ 17.Kf5 Qe5+"
  },
  { name: "/matePawn",
    pgnStr: "1.f4 e5 2.fxe5 d6 3.exd6 Bxd6 4.Nf3 Nf6 5.d4 Nc6 6.Bg5 h6 7.Bh4 g5 8.Bf2 Ne4 9.e3 g4 10.Bh4 gxf3 11.Bxd8 f2+ 12.Ke2 Bg4+ 13.Kd3 Nb4+ 14.Kxe4 f5+"
  },
  { name: "/mateRook",
    pgnStr: "1.e4 e5 2.d4 d5 3.Bg5 Qxg5 4.f3 dxe4 5.Na3 exf3 6.c4 Bb4+ 7.Kf2 fxg2 8.Bxg2 Qf4+ 9.Bf3 Qh4+ 10.Ke3 exd4+ 11.Kd3 Bf5+ 12.Be4 Bxe4+ 13.Ke2 d3+ 14.Ke3 Qg3+ 15.Kd4 Nc6+ 16.Kxe4 Nf6+ 17.Kf5 O-O 18.b3 Rae8 19.h3 Re5+"
  },  
  { name: "/mateKnight",
    pgnStr: "1.e4 e5 2.d4 d5 3.Bg5 Qxg5 4.f3 dxe4 5.Na3 exf3 6.c4 Bb4+ 7.Kf2 fxg2 8.Bxg2 Qf4+ 9.Bf3 Qh4+ 10.Ke3 exd4+ 11.Kd3 Bf5+ 12.Be4 Bxe4+ 13.Ke2 d3+ 14.Ke3 Qg3+ 15.Kd4 Nc6+ 16.Kxe4 Nf6+ 17.Kf5 O-O 18.b3 Rae8 19.h3 Nd4+"
  },  
  { name: "/mateBishop",
    pgnStr: "1.e4 e5 2.d4 d5 3.Bg5 Qxg5 4.f3 dxe4 5.Na3 exf3 6.c4 Bb4+ 7.Kf2 fxg2 8.Bxg2 Qf4+ 9.Bf3 Qh4+ 10.Ke3 exd4+ 11.Kd3 Bf5+ 12.Be4 Bxe4+ 13.Ke2 d3+ 14.Ke3 Qg3+ 15.Kd4 Nc6+ 16.Kxe4 Nf6+ 17.Kf5 O-O 18.b3 Qh3+ 19.Kg5 Be7 20.b4 Nd5+"
  },
  { name: "/mateEnPassant",
    pgnStr: "1.e4 e6 2.d4 d5 3.e5 c5 4.c3 cxd4 5.cxd4 Bb4+ 6.Nc3 Nc6 7.Nf3 Nge7 8.Bd3 O-O 9.Bxh7+ Kxh7 10.Ng5+ Kg6 11.h4 Nxd4 12.Qg4 f5 13.h5+ Kh6 14.Nxe6+ g5 15.hxg6+"
  }
];
function runTestCases(num) {
  let results = [];
  runningTestCases = true;
  for (let i = 0; i < num; i++) results.push(runOneTestCase(testCases[i]));
}
function runOneTestCase(gameJSON) {
  makeStartBoard();
  makeBoard();
  makeRightBar();
  pgnStr = gameJSON.pgnStr.trim();
  showPGN();
  testResult = { name: gameJSON.name };
  try {
    decodePGN();
    isLoadingPGNPawnPromotionJSON = {};
    makeBoard();
  } catch (e) {
    testResult.error = e.message;
    testResult.stack = e.stack;
    testResult.decode = "Error";
    return testResult;
  }
  testResult.loadPGN =
    pgnStr.trim() === gameJSON.pgnStr.trim() ? "Matched" : "Error";
  for (let i = 0; i < 100; i++) undoMove();
  for (let i = 0; i < 100; i++) redoMove();
  testResult.undoRedo =
    pgnStr.trim() === gameJSON.pgnStr.trim() ? "Matched" : "Error";
  return testResult;
}


//Login and Signup
let isSignupMode = false;

function showLoginPopup() {
  console.log("showLoginPopup");
  isSignupMode = false;
  updatePopupMode();
  document.getElementById("loginOverlay").classList.add("visible");
  document.getElementById("loginPopup").classList.add("visible");
}

function hideLoginPopup(loginlogout=false) {
  document.getElementById("loginOverlay").classList.remove("visible");
  document.getElementById("loginPopup").classList.remove("visible");
  updateMyAccountInNavbar(loginlogout);
}

function toggleSignup(signup) {
  isSignupMode = signup;
  updatePopupMode();
}

function updatePopupMode() {
  const title = document.getElementById("popupTitle");
  const confirmInput = document.getElementById("signupConfirm");
  const mainBtn = document.getElementById("mainActionBtn");
  const toggleText = document.getElementById("toggleText");
  const toggleLink = document.getElementById("toggleLink");
  if (isSignupMode) {
    title.textContent = "Create an account";
    confirmInput.style.display = "block";
    mainBtn.textContent = "Sign Up";
    toggleText.textContent = "Already have an account?";
    toggleLink.textContent = "Login";
    toggleLink.setAttribute("onclick", "toggleSignup(false)");
  } else {
    title.textContent = "Login to continue";
    confirmInput.style.display = "none";
    mainBtn.textContent = "Login";
    toggleText.textContent = "Don't have an account?";
    toggleLink.textContent = "Sign Up";
    toggleLink.setAttribute("onclick", "toggleSignup(true)");
  }
}

async function submitLoginOrSignup() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const confirm = document.getElementById("signupConfirm").value.trim();
  if (!username || !password || (isSignupMode && !confirm)) {
    showCustomAlert("Please fill out all required fields.");
    return;
  }
  if (isSignupMode && password !== confirm) {
    showCustomAlert("Passwords do not match.");
    return;
  }
  let resData = null;
  showCustomAlert("Communicating with the server",false);
  if (isSignupMode)
    resData = await callSignupAPI(username,password);
  else
    resData = await callLoginAPI(username,password);
  if (resData && resData.success){
    userToken = resData.token;
    myAccountName = username;
    localStorage.setItem('userInfo', JSON.stringify({userToken:userToken,myAccountName:myAccountName}));
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("signupConfirm").value = "";
    hideLoginPopup(true);
  }
}

function showLogoutPopup() {
  document.getElementById("logoutOverlay").classList.add("visible");
  document.getElementById("logoutPopup").classList.add("visible");
}

function hideLogoutPopup() {
  document.getElementById("logoutOverlay").classList.remove("visible");
  document.getElementById("logoutPopup").classList.remove("visible");
  updateMyAccountInNavbar();
}

function confirmLogout() {
  userToken = null;
  myAccountName = null;
  localStorage.removeItem('userInfo');
  hideLogoutPopup();
  showCustomAlert("Logged out successfully!");
  if (displayOnScreen===navArr[2])
    navActions(0);
}
function testChessServer(){
  console.log("calling testChessServer");
  const url = "https://chessserver-w8ou.onrender.com/test/basic";
  fetch(url,{method: 'GET'});
}

async function callLoginSignupAPI(subUrl,username,password){
  const url = "https://chessserver-w8ou.onrender.com/api/"+subUrl;
  const response = await fetch(url,{
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
        username,
        password
      })  
  });
  return response;
}

async function callSignupAPI(username,password) {
  try {
    const response = await callLoginSignupAPI("signup",username,password);
    const data = await response.json();
    if (!response.ok) {
      showCustomAlert("Signup failed.");
      return data;
    }
    if (data.success){
      showCustomAlert("User account created!");
      hideLoginPopup(true);
      return data;
    }
    else {
      showCustomAlert(data.message);
      return null;      
    }
  } catch (error) {
    console.error("Error signing up new user:", error);
    showCustomAlert("Something went wrong. Please try again.");
    return null;
  }
}

async function callLoginAPI(username,password) {
  try {
    const response = await callLoginSignupAPI("login",username,password);
    const data = await response.json();
    if (!response.ok) {
      showCustomAlert("Login failed.");
      return null;
    }
    if (data.success){
      showCustomAlert(data.message);
      hideLoginPopup(true);
      return data;
    }
    else {
      showCustomAlert(data.message);
      return null;      
    }
  } catch (error) {
    console.error("Error in login:", error);
    showCustomAlert("Something went wrong. Please try again.");
    return null;
  }
}
async function storeGameData(){
  if (!userToken)
    return;
  myColor = "white";
  if (flagComp.comp && flagComp.color === "white")
    myColor = "black";
  oppComp = "Player Mode";
  if (flagComp.comp) 
    oppComp = "Computer Mode: Stockfish Level "+stockLvl;
  gameDetails = {id : gameStoreId, color : myColor, computer: oppComp, timeWhite: 0, timeBlack:0, pgn:pgnStr};
  data = await callStoreGameAPI(gameDetails);
  if (data && data.success)
    gameStoreId = data.gameId;
}
async function callStoreGameAPI(gameDetails) {
  try {
    const url = "https://chessserver-w8ou.onrender.com/api/postGame";
    const authString = "Bearer " + (userToken ? userToken : "");
    const response = await fetch(url,{
      method: 'POST',
      headers: {
        "Authorization": authString,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
          gameDetails
        })  
    });
    if (!response.ok)
      return null;
    const data = await response.json();
    return data;
  }
  catch (error){
    console.log("callStoreGameAPI:::",error);
    return null;
  }
}

async function getGamesPlayed() {
  try {
    const url = "https://chessserver-w8ou.onrender.com/api/getGames";
    const authString = "Bearer " + (userToken ? userToken : "");
    const response = await fetch(url,{
      method: 'GET',
      headers: {
        "Authorization": authString,
        "Content-Type": "application/json"
      },
    });
    if (!response.ok)
      return null;
    const data = await response.json();
    return data;
  }
  catch (error){
    console.log("callStoreGameAPI:::",error);
    return null;
  }
}
function analyseGame(index){
  showCustomAlert("Under maintenance");
}
async function makeGamesPlayed(gamesPlayed){
  if (!userToken)
    return;
  showCustomAlert("Fetching from the server",false);
  gamesPlayed = await getGamesPlayed();
  hideCustomAlert();
  if (!gamesPlayed){
    showCustomAlert("Failed to fetch");
    return;
  }
  tabClickedByUser = navArr[2];
  clearMobileTimers();
  document.getElementById("leftbar").innerHTML = "";
  document.getElementById("rightbar").innerHTML = "";
  gamePlayedStr =
    "<div class='col p-0 mb-2 mx-1 bg-transparent '><div class='row justify-content-center'><span class='p-3 btn-green w-100 h-100'><span>Games Played</span></span></div></div>";
  gameStr = "";
  gamesPlayed.games.forEach(function (game, index) {
    gameStr += `
      <div class='games-history-card mb-3 text-start p-3'>
        <div class='d-flex justify-content-between align-items-center mb-1'>
          <div><strong>Game #${index + 1}</strong> (${game.color})&nbsp;&nbsp;${game.computer}</div>
          <button class='btn btn-success btn-sm' onclick='analyseGame(${index})'>Analyse Game</button>
        </div>
        <div class='pgn-preview'>
          <code>${game.pgn}</code>
        </div>
      </div>
    `;
  });
  displayStr =
    "<div class='containerFrame text-center'>" + 
    gamePlayedStr +
    "<div class='scroll-container'>" +
    gameStr +
    "</div></div></div>";
  document.getElementById("display").innerHTML = displayStr;
  displayOnScreen = navArr[2];
}


