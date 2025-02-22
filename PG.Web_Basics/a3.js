function calculateMax(event) {
  event.preventDefault();
  let nums = [
    parseFloat(num1.value),
    parseFloat(num2.value),
    parseFloat(num3.value),
  ];
  let maxNum = Math.max(...nums);
  let sortedAsc = [...nums].sort((a, b) => a - b);
  let sortedDesc = [...nums].sort((a, b) => b - a);
  result1.innerHTML = `Max: ${maxNum}, Ascending: ${sortedAsc.join(
    ", "
  )}, Descending: ${sortedDesc.join(", ")}`;
}

function checkOddEven(event) {
  event.preventDefault();
  let limit = parseInt(document.getElementById("limit").value);
  let result = "";
  for (let i = 1; i <= limit; i++) {
    result += `${i}: ${i % 2 === 0 ? "Even" : "Odd"}<br>`;
  }
  document.getElementById("result2").innerHTML = result;
}

function solveQuadratic(event) {
  event.preventDefault();
  let a = parseFloat(document.getElementById("a").value);
  let b = parseFloat(document.getElementById("b").value);
  let c = parseFloat(document.getElementById("c").value);
  let d = b * b - 4 * a * c;
  let result;
  if (d > 0) {
    let r1 = (-b + Math.sqrt(d)) / (2 * a);
    let r2 = (-b - Math.sqrt(d)) / (2 * a);
    result = `Roots are real: ${r1.toFixed(2)}, ${r2.toFixed(2)}`;
  } else if (d === 0) {
    let r = -b / (2 * a);
    result = `Roots are real & equal: ${r.toFixed(2)}`;
  } else {
    result = `No real roots (Imaginary numbers)`;
  }
  document.getElementById("result3").innerHTML = result;
}

function checkSpeed(event) {
  event.preventDefault();
  let speed = parseFloat(document.getElementById("speed").value);
  let speedLimit = 70;
  if (speed <= speedLimit) {
    document.getElementById("result4").innerHTML = "🚗 Good Safe Driving";
  } else {
    let penaltyPoints = Math.floor((speed - speedLimit) / 5);
    if (penaltyPoints > 10) {
      document.getElementById("result4").innerHTML = "🚨 License Suspended";
    } else {
      document.getElementById(
        "result4"
      ).innerHTML = `⚠️ Speed Limit Crossed, Penalty Points: ${penaltyPoints}`;
    }
  }
}
