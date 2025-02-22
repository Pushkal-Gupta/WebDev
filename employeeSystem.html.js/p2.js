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
departmentErrorStr = "<br>";
displayStr = "";
headerStr = "";
navStr = "";
eleContent = "";
formStr = "";
json = {};
sortArr = [];
radioStr = "";
empArr = [
  {
    name: "Anna",
    email: "Anna45@email.com",
    age: 27,
    dept: "Technology",
    gradCourse: "B.Tech",
    gradYear: 2015,
    gradPerf: "Good",
    postgrad: false,
    workBefore: true,
    workEx: "0-1 year",
  },
  {
    name: "Mary",
    email: "mary16@email.com",
    age: 30,
    dept: "Accounts",
    gradCourse: "B.Com",
    gradYear: 2015,
    gradPerf: "Good",
    postgrad: true,
    workBefore: false,
    workEx: "None",
  },
  {
    name: "Jack",
    email: "jack@email.com",
    age: 33,
    dept: "Operations",
    gradCourse: "BA",
    gradYear: 2015,
    gradPerf: "Average",
    postgrad: false,
    workBefore: true,
    workEx: "3+ years",
  },
  {
    name: "John",
    email: "john@email.com",
    age: 24,
    dept: "Technology",
    gradCourse: "B.Tech",
    gradYear: 2015,
    gradPerf: "Good",
    postgrad: false,
    workBefore: false,
    workEx: "None",
  },
  {
    name: "Edwards",
    email: "edwards@email.com",
    age: 29,
    dept: "Accounts",
    gradCourse: "B.Com",
    gradYear: 2015,
    gradPerf: "Excellent",
    postgrad: true,
    workBefore: true,
    workEx: "3+ years",
  },
  {
    name: "Tim",
    email: "tim001@email.com",
    age: 31,
    dept: "Operations",
    gradCourse: "BSc",
    gradYear: 2015,
    gradPerf: "Average",
    postgrad: false,
    workBefore: true,
    workEx: "0-1 year",
  },
  {
    name: "Julia",
    email: "julia@email.com",
    age: 28,
    dept: "Technology",
    gradCourse: "B.Tech",
    gradYear: 2015,
    gradPerf: "Excellent",
    postgrad: true,
    workBefore: true,
    workEx: "1-3 years",
  },
  {
    name: "Steve",
    email: "steve@email.com",
    age: 25,
    dept: "Operations",
    gradCourse: "BA",
    gradYear: 2015,
    gradPerf: "Good",
    postgrad: false,
    workBefore: true,
    workEx: "0-1 year",
  },
  {
    name: "Sam",
    email: "sam77@email.com",
    age: 33,
    dept: "HR",
    gradCourse: "BBA",
    gradYear: 2015,
    gradPerf: "Good",
    postgrad: false,
    workBefore: true,
    workEx: "1-3 years",
  },
];
expArr = [
  {
    name: "John",
    category: "Local Travel",
    billId: "NP7561",
    amount: 64,
    payment: "Self",
    approved: true,
  },
  {
    name: "Anna",
    category: "Communication",
    billId: "BN8561",
    amount: 39,
    payment: "Self",
    approved: false,
  },
  {
    name: "Edwards",
    category: "Local Travel",
    billId: "AT5461",
    amount: 58,
    payment: "Corporate Card",
    approved: true,
  },
  {
    name: "Julia",
    category: "Local Travel",
    billId: "RR5492",
    amount: 71,
    payment: "Self",
    approved: true,
  },
  {
    name: "Julia",
    category: "Out of City Travel",
    billId: "KT8785",
    amount: 277,
    payment: "Bill to Company",
    approved: true,
  },
  {
    name: "Edwards",
    category: "Others",
    billId: "UR0400",
    amount: 25,
    payment: "Corporate Card",
    approved: false,
  },
  {
    name: "Edwards",
    category: "Out of City Travel",
    billId: "CC6586",
    amount: 305,
    payment: "Corporate Card",
    approved: false,
  },
  {
    name: "Julia",
    category: "Communication",
    billId: "DL3425",
    amount: 43,
    payment: "Self",
    approved: false,
  },
  {
    name: "Julia",
    category: "Out of City Travel",
    billId: "MW65775",
    amount: 248,
    payment: "Bill to Company",
    approved: true,
  },
  {
    name: "Edwards",
    category: "Others",
    billId: "JR56732",
    amount: 52,
    payment: "Corporate Card",
    approved: true,
  },
  {
    name: "Julia",
    category: "Out of City Travel",
    billId: "BK0074",
    amount: 405,
    payment: "Bill to Company",
    approved: false,
  },
  {
    name: "Edwards",
    category: "Communication",
    billId: "JR56732",
    amount: 72,
    payment: "Corporate Card",
    approved: true,
  },
];
headEmp1Arr = ["Name", "Email", "Age", "Dept", "Graduation", "Work Ex", ""];
headEmp2Arr = [
  "Name",
  "Email",
  "Age",
  "Dept",
  "Graduation",
  "Year of Graduation",
  "Performance in Graduation",
  "Post Graduate",
  "Worked Before",
  "Work Experience",
];
navArr = [
  "Show Employees",
  "Add an Employee",
  "Departments",
  "Add a Dept",
  "Expenses",
  "Add an Expense",
];
checkArr = ["Are you a post graduate", "Do you have prior work experience"];
errorMssgArr = ["", "", "", ""];
addEditArr = [];
formArr = [
  "Employee Name",
  "Enter the Employee Name",
  "Name is Mandatory",
  "Email",
  "Enter the Email id",
  "Email is Mandatory",
  "Age",
  "Enter the Age",
  "Age is Mandatory",
  "Select the Department",
  "Graduation Degree",
  "What degree did you get in graduation",
  "Select the Graduation Year",
  "Overall Grade in Education",
  "Share some more information",
  "Years of Work Experience",
  "Choose the applicable work experience",
];
departmentArr = ["Technology", "Accounts", "Operations", "HR"];
yearArr = [
  1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002,
  2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015,
  2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028,
  2029, 2030,
];
radio1Arr = [
  { screen: "A", value: "Excellent" },
  { screen: "B", value: "Good" },
  { screen: "C", value: "Average" },
  { screen: "D", value: "Poor" },
];
radio2Arr = ["None", "0-1 year", "1-3years", "3+ years"];
polArr = [1, 1, 1, 1, 1, 1];
createNavbar();
function createNavbar() {
  navBarArr = navArr.map(function (ele, index) {
    return (
      "<li class='nav-item'><a class='nav-item nav-link' aria-current = 'page' href='#' onclick = navActions(" +
      index +
      ")>" +
      ele +
      "</a></li>"
    );
  });
  navStr =
    "<div class='collapse navbar-collapse' id='navbarNavAltMarkup'><div class='navbar-nav'><ul class='navbar-nav me-auto mb-2 mb-lg-0'>" +
    navBarArr.join("") +
    "</ul><div class='form-check form-switch' id = 'theme-switch'><input class='form-check-input' type='checkbox' role='switch' id='theme-toggle'></div></div></div>";
  navEle = document.getElementById("navbar");
  navEle.innerHTML = navStr;
}
function display() {
  headerArr = headEmp1Arr.map(function (ele, index) {
    return (
      "<th scope='col' onclick = headActions(" + index + ")>" + ele + "</th>"
    );
  });
  headerStr =
    "<thead><tr class='table-dark'>" + headerArr.join("") + "</tr></thead>";
  displayArr = empArr.map(function (ele, index) {
    return (
      "<tr><td>" +
      ele.name +
      "</td><td>" +
      ele.email +
      "</td><td>" +
      ele.age +
      "</td><td>" +
      ele.dept +
      "</td><td>" +
      ele.gradCourse +
      "</td><td>" +
      ele.workEx +
      "</td><td>" +
      "<button type='button' class='btn btn-primary' onclick=makeForm(" +
      index +
      ",{})><i class='fa fa-edit'></i></button>" +
      "<button type='button' class='btn btn-danger' onclick = remove(" +
      index +
      ")><i class='fa fa-trash' aria-hidden='true'></i></button><button type='button' class='btn btn-warning' onclick = showExpenses(" +
      index +
      ")><i class='fa fa-car'></i></i></button></td></tr>"
    );
  });
  displayStr =
    "<h1 class='text-center'>List of Persons</h1>" +
    "<div class='container'><table class='table table-striped'>" +
    headerStr +
    "<tbody>" +
    displayArr.join("") +
    "</tbody></table>" +
    "<button type='button' class='btn btn-primary' onclick = changeView()>Change View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function headActions(index) {
  if (index === 0) {
    empArr.sort(sortField0);
  } else if (index === 1) {
    empArr.sort(sortField1);
  } else if (index === 2) {
    empArr.sort(sortField2);
  } else if (index === 3) {
    empArr.sort(sortField3);
  } else if (index === 4) {
    empArr.sort(sortField4);
  } else if (index === 5) {
    empArr.sort(sortField5);
  }
  polArr[index] *= -1;
  display();
}
function sortField0(ele1, ele2) {
  if (ele1.name > ele2.name) {
    return polArr[0] * 1;
  } else if (ele1.name < ele2.name) {
    return polArr[0] * -1;
  } else {
    return 0;
  }
}
function sortField1(ele1, ele2) {
  if (ele1.email > ele2.email) {
    return polArr[1] * 1;
  } else if (ele1.email < ele2.email) {
    return polArr[1] * -1;
  } else {
    return 0;
  }
}
function sortField2(ele1, ele2) {
  return polArr[2] * (ele1.age - ele2.age);
}
function sortField3(ele1, ele2) {
  if (ele1.dept > ele2.dept) {
    return polArr[3] * 1;
  } else if (ele1.dept < ele2.dept) {
    return polArr[3] * -1;
  } else {
    return 0;
  }
}
function sortField4(ele1, ele2) {
  if (ele1.gradCourse > ele2.gradCourse) {
    return polArr[4] * 1;
  } else if (ele1.gradCourse < ele2.gradCourse) {
    return polArr[4] * -1;
  } else {
    return 0;
  }
}
function sortField5(ele1, ele2) {
  if (ele1.workEx > ele2.workEx) {
    return polArr[5] * 1;
  } else if (ele1.workEx < ele2.workEx) {
    return polArr[5] * -1;
  } else {
    return 0;
  }
}
function navActions(index) {
  if (index === 0) {
    display();
  } else if (index === 1) {
    makeForm(-1, {});
  } else if (index === 2) {
    displayDepart();
  } else if (index === 3) {
    addDepart();
  }
}
function changeView() {
  displayArr = empArr.map(function (ele, index) {
    eleContent =
      "<p class='text-danger fw-bold'  style='display:inline'>" +
      headEmp2Arr[0] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.name +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[1] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.email +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[2] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.age +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[3] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.dept +
      "</p><br><button type='button' class='btn btn-success' onclick = moreDetails(" +
      index +
      ")>More Details</button>";
    return "<div class='col border p-3 bg-light'>" + eleContent + "</div>";
  });
  displayStr =
    "<h1 class='text-center'>List of Persons</h1><div class='container'><div class='row row-cols-4'>" +
    displayArr.join("") +
    "</div><br><button type='button' class='btn btn-primary' onclick = originalView()>Original View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function originalView() {
  display();
}
function moreDetails(indexCheck) {
  detailContent = "";
  displayStr = "";
  displayArr = empArr.map(function (ele, index) {
    if (indexCheck === index) {
      detailContent =
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[4] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.gradCourse +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[5] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.gradYear +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[6] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.gradPerf +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[7] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.postgrad +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[8] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.workBefore +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        headEmp2Arr[9] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.workEx +
        "</p><br>";
    } else {
      detailContent =
        "<button type='button' class='btn btn-success' onclick = moreDetails(" +
        index +
        ")>More Details</button>";
    }
    eleContent =
      "<p class='text-danger fw-bold'  style='display:inline'>" +
      headEmp2Arr[0] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.name +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[1] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.email +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[2] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.age +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      headEmp2Arr[3] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.dept +
      "</p><br>" +
      detailContent;
    return "<div class='col border p-3 bg-light'>" + eleContent + "</div>";
  });
  displayStr +=
    "<h1 class='text-center'>List of Persons</h1><div class='container'><div class='row row-cols-4'>" +
    displayArr.join("") +
    "</div><br><button type='button' class='btn btn-primary' onclick = originalView()>Original View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function makeValuePlaceholder(json, name, placeholder) {
  return json && json[name]
    ? " value='" + json[name] + "' "
    : " placeholder = '" + placeholder + "' ";
}
function makeForm(index, json1) {
  if (Object.keys(json1).length === 0) {
    json1 = empArr[index];
  }
  dd1Arr = departmentArr.map(function (ele) {
    return (
      "<option " +
      (json1 && ele === json1.dept ? "selected" : "") +
      ">" +
      ele +
      "</option>"
    );
  });
  dd2Arr = yearArr.map(function (ele) {
    return (
      "<option " +
      (json1 && ele === json1.gradYear ? "selected" : "") +
      ">" +
      ele +
      "</option>"
    );
  });
  // r1Arr = radio1Arr.map(function (ele, indexr1) {
  //   return (
  //     "<input data-bs-theme type='radio' class='btn-check' " +
  //     (json1 && ele.value === json1.gradPerf ? "checked" : "") +
  //     " autocomplete = 'off' name='grade' value='" +
  //     ele.value +
  //     "' id='r1" +
  //     indexr1 +
  //     "'>" +
  //     "</input><label class='btn btn-outline-dark' for='r1" +
  //     indexr1 +
  //     "'>" +
  //     ele.screen +
  //     "</label>"
  //   );
  // });
  // c1Arr = checkArr.map(function (ele, indexc1) {
  //   str = "";
  //   strWorkBefore = "";
  //   strWorkBefore = indexc1 === 1 ? "onclick = checkCheckBox()" : "";
  //   if (json1 && indexc1 === 0) str = json1.postgrad ? "checked" : "";
  //   else if (json1 && indexc1 === 1) str = json1.workBefore ? "checked" : "";
  //   return (
  //     "<input data-bs-theme type='checkbox' class='btn-check' " +
  //     str +
  //     " name='check' id='cb" +
  //     indexc1 +
  //     "'>" +
  //     "<label " +
  //     strWorkBefore +
  //     " class='btn btn-outline-dark'for='cb" +
  //     indexc1 +
  //     "'>" +
  //     ele +
  //     "</label>"
  //   );
  // });
  r1Arr = radio1Arr.map(function (ele, indexr1) {
    return (
      "<input data-bs-theme type='radio' class='btn-check' " +
      (json1 && ele.value === json1.gradPerf ? "checked" : "") +
      " autocomplete='off' name='grade' value='" +
      ele.value +
      "' id='r1" +
      indexr1 +
      "'>" +
      "<label class='btn btn-outline-dark' for='r1" +
      indexr1 +
      "'>" +
      ele.screen +
      "</label>"
    );
  });

  // Function to create checkboxes based on checkArr
  c1Arr = checkArr.map(function (ele, indexc1) {
    let str = "";
    let strWorkBefore = "";
    strWorkBefore = indexc1 === 1 ? "onclick='checkCheckBox()'" : "";
    if (json1 && indexc1 === 0) str = json1.postgrad ? "checked" : "";
    else if (json1 && indexc1 === 1) str = json1.workBefore ? "checked" : "";
    return (
      "<input data-bs-theme type='checkbox' class='btn-check' " +
      str +
      " name='check' id='cb" +
      indexc1 +
      "'>" +
      "<label " +
      strWorkBefore +
      " class='btn btn-outline-dark' for='cb" +
      indexc1 +
      "'>" +
      ele +
      "</label>"
    );
  });

  addEditArr = [
    "<input type='text' class='form-control' id='txt1' " +
      makeValuePlaceholder(json1, "name", formArr[1]) +
      "'>",
    "<input type='email' class='form-control' id='txt2' " +
      makeValuePlaceholder(json1, "email", formArr[4]) +
      "'>",
    "<input type='text' class='form-control' id='txt3' " +
      makeValuePlaceholder(json1, "age", formArr[7]) +
      "'>",
    "<input type='text' class='form-control' id='txt4' " +
      makeValuePlaceholder(json1, "gradCourse", formArr[11]) +
      "'>",
  ];
  formStr =
    "<h1 class='text-center'>Add a New Employee</h1><div class = 'container'><form><div class='mb-3'><label class='form-label'>" +
    formArr[0] +
    "</label>" +
    addEditArr[0] +
    errorMssgArr[0] +
    "</div>" +
    "<div class='mb-3'><label class='form-label'>" +
    formArr[3] +
    "</label>" +
    addEditArr[1] +
    errorMssgArr[1] +
    "</div>" +
    "<div class='mb-3'><label class='form-label'>" +
    formArr[6] +
    "</label>" +
    addEditArr[2] +
    errorMssgArr[2] +
    "</div>" +
    "<div class='mb-3'><label class='form-label'>" +
    formArr[9] +
    "</label><select id = 'dd1' class='form-select'><option selected disabled>" +
    formArr[9] +
    "</option>" +
    dd1Arr.join("") +
    "</select></div>" +
    "<div class='mb-3'><label class='form-label'>" +
    formArr[10] +
    "</label>" +
    addEditArr[3] +
    "</div>" +
    "<div class='mb-3'><select id = 'dd2' class='form-select'><option selected disabled>" +
    formArr[12] +
    "</option>" +
    dd2Arr.join("") +
    "</select></div>" +
    "<div class='mb-3'><label class='form-label'>" +
    formArr[13] +
    "<div class='btn-group-horizontal' role='group'>" +
    r1Arr.join("") +
    "</div>" +
    "</label></div><div class='mb-3'><label class='form-label'>" +
    formArr[14] +
    "</label><br>" +
    "<div class='btn-group-vertical' role='group'>" +
    c1Arr.join("") +
    "</div></div><span id = 'radioContent'>" +
    ("" + checkCheckBox(true, json1)) +
    "</span>" +
    "<div class = 'mb-3'><button type='button' class='btn btn-primary' onclick = submitB(" +
    index +
    ")>Submit</button></div>" +
    "</form></div>";
  document.getElementById("display").innerHTML = formStr;
}
function checkCheckBox(marker, json1) {
  r2Arr = radio2Arr.map(function (ele, indexr2) {
    return (
      "<input type='radio' class='btn-check' " +
      (json1 && ele === json1.workEx ? "checked" : "") +
      " name='workEx' value='" +
      ele +
      "' id='r2" +
      indexr2 +
      "'>" +
      "<label class='btn btn-outline-dark' for='r2" +
      indexr2 +
      "'>" +
      ele +
      "</label>"
    );
  });
  workBeforeBool = marker
    ? !(json1 && json1.workBefore)
    : document.getElementById("cb1").checked;
  if (!workBeforeBool) {
    radioStr =
      "<div class='mb-3' id = 'workExRadioId'><label class='form-label'>" +
      formArr[15] +
      "<div class='btn-group-horizontal' role='group'>" +
      r2Arr.join("") +
      "</div>" +
      "</label>" +
      errorMssgArr[3] +
      "</div>";
  } else {
    radioStr = "";
  }
  if (!marker) document.getElementById("radioContent").innerHTML = radioStr;
  return radioStr;
}
function submitB(index) {
  if (index === -2) {
    dept1 = document.getElementById("addDept1").value;
    if (dept1 === "") {
      departmentErrorStr =
        "<div class = 'form-text text-danger'>Department is Mandatory to Enter</div>";
      addDepart();
    } else {
      departmentErrorStr = "<br>";
      departmentArr.push(dept1);
      displayDepart();
    }
  } else {
    bool = true;
    name1 = document.getElementById("txt1").value;
    email1 = document.getElementById("txt2").value;
    age1 = document.getElementById("txt3").value;
    gradCourse1 = document.getElementById("txt4").value;
    dept1 = document.getElementById("dd1").value;
    gradYear1 = document.getElementById("dd2").value;
    postGradBool = document.getElementById("cb0").checked;
    workBeforeBool = document.getElementById("cb1").checked;
    gradPerf1 = "";
    r10 = document.getElementById("r10");
    r11 = document.getElementById("r11");
    r12 = document.getElementById("r12");
    r13 = document.getElementById("r13");
    if (r10.checked) gradPerf1 = r10.value;
    if (r11.checked) gradPerf1 = r11.value;
    if (r12.checked) gradPerf1 = r12.value;
    if (r13.checked) gradPerf1 = r13.value;
    workEx1 = "";
    r20 = document.getElementById("r20");
    r21 = document.getElementById("r21");
    r22 = document.getElementById("r22");
    r23 = document.getElementById("r23");
    if (r20.checked) workEx1 = r20.value;
    if (r21.checked) workEx1 = r21.value;
    if (r22.checked) workEx1 = r22.value;
    if (r23.checked) workEx1 = r23.value;
    if (name1 === "") {
      nameStr = "<div class = 'form-text text-danger'>" + formArr[2] + "</div>";
      bool = false;
    } else {
      nameStr = "";
    }
    if (email1 === "") {
      emailStr =
        "<div class = 'form-text text-danger'>" + formArr[5] + "</div>";
      bool = false;
    } else {
      emailStr = "";
    }
    if (age1 === "") {
      ageStr = "<div class = 'form-text text-danger'>" + formArr[8] + "</div>";
      bool = false;
    } else {
      ageStr = "";
    }
    if (workEx1 === "") {
      workExStr =
        "<div class = 'form-text text-danger'>" + formArr[16] + "</div>";
      bool = false;
    } else {
      workExStr = "";
    }
    errorMssgArr = [nameStr, emailStr, ageStr, workExStr];
    json = {
      name: name1,
      email: email1,
      age: age1,
      dept: dept1,
      gradCourse: gradCourse1,
      gradYear: +gradYear1,
      gradPerf: gradPerf1,
      postgrad: postGradBool,
      workBefore: workBeforeBool,
      workEx: workEx1,
    };
    if (bool) {
      if (index === -1) empArr.push(json);
      else empArr[index] = json;
      display();
    } else {
      makeForm(index, json);
    }
  }
}
function remove(index) {
  empArr.splice(index, 1);
  display();
}
function displayDepart() {
  displayArr = departmentArr.map(function (ele) {
    return "<li class='list-group-item'>" + ele + "</li>";
  });
  displayStr =
    "<h1 class='text-center'>List of Departments</h1><div class = 'container'><ul class='list-group'>" +
    displayArr.join("") +
    "</ul></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function addDepart() {
  formStr =
    "<h1 class='text-center'>Add a Department</h1><div class = 'container'><form><div class='mb-3'><label class='form-label'>" +
    "Name of the Department" +
    "</label><input type='text' class='form-control' id='addDept1' placeholder = '" +
    "Enter Name of Department Here" +
    "'>" +
    departmentErrorStr +
    "<button type='button' class='btn btn-primary' onclick = submitB(-2)>Submit</button></div>" +
    "</form></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = formStr;
}
(() => {
  "use strict";

  const getStoredTheme = () => localStorage.getItem("theme");
  const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const setTheme = (theme) => {
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      );
    } else {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }
  };

  setTheme(getPreferredTheme());

  const showActiveTheme = (theme, focus = false) => {
    const themeToggle = document.getElementById("theme-toggle");

    if (theme === "dark") {
      themeToggle.checked = true;
    } else {
      themeToggle.checked = false;
    }

    if (focus) {
      themeToggle.focus();
    }
  };

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedTheme = getStoredTheme();
      if (storedTheme !== "light" && storedTheme !== "dark") {
        setTheme(getPreferredTheme());
      }
    });

  document.addEventListener("DOMContentLoaded", () => {
    showActiveTheme(getPreferredTheme());

    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("change", () => {
      const theme = themeToggle.checked ? "dark" : "light";
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme, true);
    });
  });
})();
function updateThemeStyles() {
  const theme = document.documentElement.getAttribute("data-bs-theme");

  // Update radio buttons
  document
    .querySelectorAll('[data-bs-theme][type="radio"]')
    .forEach((input) => {
      input.checked = input.value === json1?.gradPerf;
      input.setAttribute("data-bs-theme", theme);

      const label = document.querySelector(`label[for="${input.id}"]`);
      if (theme != "dark") {
        label.classList.add("btn-outline-light");
        label.classList.remove("btn-outline-dark");
      } else {
        label.classList.add("btn-outline-dark");
        label.classList.remove("btn-outline-light");
      }
    });

  // Update checkboxes
  document
    .querySelectorAll('[data-bs-theme][type="checkbox"]')
    .forEach((input) => {
      const index = parseInt(input.id.slice(2));
      input.checked = index === 0 ? json1?.postgrad : json1?.workBefore;
      input.setAttribute("data-bs-theme", theme);

      const label = document.querySelector(`label[for="${input.id}"]`);
      if (theme != "dark") {
        label.classList.add("btn-outline-light");
        label.classList.remove("btn-outline-dark");
      } else {
        label.classList.add("btn-outline-dark");
        label.classList.remove("btn-outline-light");
      }
    });
}

document.addEventListener("DOMContentLoaded", updateThemeStyles);
document.addEventListener("themeChange", updateThemeStyles);
