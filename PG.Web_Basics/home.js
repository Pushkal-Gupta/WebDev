let count = -1;
let dispStr = "";
function rev() {
  count *= -1;
  let ele = document.getElementById("sw");
  let dispOl = document.getElementById("dispOl");
  if (count < 0) {
    ele.innerHTML = "<u>weakness</u>";
    dispStr =
      "<li>Risk-Aversive Behaviour</li><li>Work-Life Balance</li><li>Self-criticism</li><li>Arts & Crafts</li>";
  } else {
    ele.innerHTML = "<u>strengths</u>";
    dispStr = "<li>Maths</li><li>Coding</li><li>Basketball</li><li>Chess</li>";
  }
  dispOl.innerHTML = dispStr;
}
