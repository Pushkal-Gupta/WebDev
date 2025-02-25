function validateRegNo() {
  let year = document.getElementById("year").value;
  let degree = document.getElementById("degree").value;
  let courseType = document.getElementById("courseType").value;
  let roll = document.getElementById("roll").value;
  let regNo = document.getElementById("regNo").value;
  let result = document.getElementById("result");
  let yearRegex = /^\d{2,4}$/;
  let degreeRegex = /^[A-Z]{2,3}$/;
  let regNoRegex = /^\d{2}[A-Z]{3}\d{4}$/;
  if (!yearRegex.test(year)) {
    result.innerText =
      "Invalid Year: Enter in YY or YYYY format (e.g., 23 or 2023)";
    result.style.color = "red";
    return;
  }
  if (!degreeRegex.test(degree)) {
    result.innerText =
      "Invalid Degree: Enter 2-3 capital letters (e.g., BCE, BCT, BDS)";
    result.style.color = "red";
    return;
  }
  if (!regNoRegex.test(regNo)) {
    result.innerText = "Invalid Format: Use YYDDDXXXX (e.g., 23BCE0001)";
    result.style.color = "red";
    return;
  }
  if (roll === "0000") {
    result.innerText = "Invalid: Roll number cannot be 0000";
    result.style.color = "red";
    return;
  }
  let yearPrefix = year.slice(-2);
  if (regNo.substring(0, 2) !== yearPrefix) {
    result.innerText = "Mismatch: Year of joining does not match";
    result.style.color = "red";
    return;
  }
  if (regNo.charAt(2) !== courseType) {
    result.innerText = "Mismatch: Course Type does not match";
    result.style.color = "red";
    return;
  }
  if (regNo.substring(3, 5) !== degree.substring(1)) {
    result.innerText = "Mismatch: Last 2 letters of Degree do not match";
    result.style.color = "red";
    return;
  }
  if (regNo.substring(5) !== roll) {
    result.innerText = "Mismatch: Roll number does not match";
    result.style.color = "red";
    return;
  }
  result.innerText = "Valid Register Number!";
  result.style.color = "rgba(0, 255, 255, 0.9)";
}
