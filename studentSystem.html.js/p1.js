pol = [1, 1, 1, 1, 1];
originalArr = [
  { name: "Bob", maths: 82, computers: 88, gender: "Male", city: "London" },
  { name: "Jack", maths: 44, computers: 55, gender: "Male", city: "Paris" },
  {
    name: "Mary",
    maths: 91,
    computers: 73,
    gender: "Female",
    city: "New York",
  },
  { name: "Dave", maths: 60, computers: 89, gender: "Male", city: "Paris" },
  {
    name: "Julia",
    maths: 58,
    computers: 60,
    gender: "Female",
    city: "New York",
  },
  { name: "Steve", maths: 42, computers: 47, gender: "Male", city: "Vellore" },
];
cityArr = ["Paris", "London", "New York", "Vellore"];
genderArr = ["Male", "Female"];
arr = [...originalArr];
buttonStr = "";
dispStr = "";
formStr = "";
buttonContentArr = [
  "Show Students",
  "Maths +1",
  "Computers +1",
  "Clear",
  "Reset",
  "Add Student",
];
buttonArr = buttonContentArr.map(
  (ele, index) =>
    "<li class='nav-item'><a class='nav-link active' aria-current='page' href='#' onclick = show(" +
    index +
    ")>" +
    ele +
    "</a></li>"
);
buttonStr =
  "<ul class='navbar-nav me-auto mb-2 mb-lg-0'>" + buttonArr.join("") + "</ul>";
buttonEle = document.getElementById("button");
buttonEle.innerHTML = buttonStr;
let dispEle = document.getElementById("table");
dispEle.innerHTML = dispStr;
function display() {
  headArr = ["Name", "Maths", "Computers", "Gender", "City", "Remove", "Edit"];
  contentArr = arr.map(
    (ele, index) =>
      "<tr><td>" +
      ele.name +
      "</td><td>" +
      ele.maths +
      "</td><td>" +
      ele.computers +
      "</td><td>" +
      ele.gender +
      "</td><td>" +
      ele.city +
      "</td><td><button type='button' class='btn btn-danger' onclick = remove(" +
      index +
      ")>Remove</button></td><td><button type='button' class='btn btn-warning' onclick = edit(" +
      index +
      ")>Edit</button></td></tr>"
  );
  headerArr = headArr.map(
    (ele, index) => "<th onclick = header(" + index + ")>" + ele + "</th>"
  );
  headerStr = "<thead><tr>" + headerArr.join("") + "</tr></thead>";
  displayStr =
    "<div class='row justify-content-center'><div class='col-8'><br/>" +
    "<table class='table table-striped table-dark'>" +
    headerStr +
    "<tbody>" +
    contentArr.join("") +
    "</tbody></table>" +
    "</div></div>";
  return displayStr;
}
function show(index) {
  if (index == 0) {
    dispStr = display();
    let dispEle = document.getElementById("table");
    dispEle.innerHTML = dispStr;
    formStr = "";
    formEle = document.getElementById("form");
    formEle.innerHTML = formStr;
  } else if (index == 1) {
    useless = arr.map((ele) => ele.maths++);
    show(0);
  } else if (index == 2) {
    useless = arr.map((ele) => ele.computers++);
    show(0);
  } else if (index == 3) {
    dispStr = "";
    let dispEle = document.getElementById("table");
    dispEle.innerHTML = dispStr;
  } else if (index == 4) {
    arr = [...originalArr];
    show(0);
  } else if (index == 5) {
    if (formStr == "") {
      formStr =
        "<div class='row justify-content-center mt-3'><div class='col-8 border border-dark mb-3'><br/><form>";
      formStr += txtField1(
        "Name",
        "txt1",
        "Enter Student Name",
        "Name must be alphabet or space"
      );
      formStr += txtField1(
        "Maths Marks",
        "txt2",
        "Enter Math Marks",
        "Marks should be between 0 and 100"
      );
      formStr += txtField1(
        "Computer Marks",
        "txt3",
        "Enter Computer Marks",
        "Marks should be between 0 and 100"
      );

      formStr +=
        "<div class='input-group mb-3'><div class='input-group-prepend'><label class='input-group-text'>Gender :</label></div><select class='custom-select' id = 'dd1'><option disabled>Select Gender</option><option>" +
        genderArr[0] +
        "</option><option>" +
        genderArr[1] +
        "</option></select></div>" +
        "<div class='input-group mb-3'><div class='input-group-prepend'><label class='input-group-text'>City :</label></div><select class='custom-select' id = 'dd2'><option disabled>Select City</option><option>" +
        cityArr[0] +
        "</option><option>" +
        cityArr[1] +
        "</option><option>" +
        cityArr[2] +
        "</option><option>" +
        cityArr[3] +
        "</option></select></div>" +
        "<button type='button' class='btn btn-success' onclick = submitB(-1)>Submit</button><br>";
      formStr += "</form></div>";
      formEle = document.getElementById("form");
      console.log(formStr);
      formEle.innerHTML = formStr;
      show(3);
    }
  }
}
function remove(index) {
  arr.splice(index, 1);
  dispStr = display();
  let dispEle = document.getElementById("table");
  dispEle.innerHTML = dispStr;
}
function header(index) {
  if (index == 0) {
    arr.sort(sortField0);
  } else if (index == 1) {
    arr.sort(sortField1);
  } else if (index == 2) {
    arr.sort(sortField2);
  } else if (index == 3) {
    arr.sort(sortField3);
  } else if (index == 4) {
    arr.sort(sortField4);
  }
  pol[index] *= -1;
  show(0);
}
function sortField0(ele1, ele2) {
  if (ele1.name > ele2.name) {
    return pol[0] * 1;
  } else if (ele1.name < ele2.name) {
    return pol[0] * -1;
  } else {
    return 0;
  }
}
function sortField1(ele1, ele2) {
  return pol[1] * (ele1.maths - ele2.maths);
}
function sortField2(ele1, ele2) {
  return pol[2] * (ele1.computers - ele2.computers);
}
function sortField3(ele1, ele2) {
  if (ele1.gender > ele2.gender) {
    return pol[3] * 1;
  } else if (ele1.gender < ele2.gender) {
    return pol[3] * -1;
  } else {
    return 0;
  }
}
function sortField4(ele1, ele2) {
  if (ele1.city > ele2.city) {
    return pol[4] * 1;
  } else if (ele1.city < ele2.city) {
    return pol[4] * -1;
  } else {
    return 0;
  }
}
function submitB(index) {
  console.log("in submit");
  let name1 = document.getElementById("txt1").value;
  let math1 = document.getElementById("txt2").value;
  let comp1 = document.getElementById("txt3").value;
  let gender1 = document.getElementById("dd1").value;
  let city1 = document.getElementById("dd2").value;
  bool = true;
  math2 = +math1;
  comp2 = +comp1;
  bool = name1 == "" || math1 == "" || comp1 == "" ? false : bool;
  bool = math1 < 0 || math1 > 100 || comp1 < 0 || comp1 > 100 ? false : bool;
  bool = math1 != math2 || comp1 != comp2 ? false : bool;
  for (i = 0; i < name1.length; i++) {
    char = name1[i];
    if (
      char == " " ||
      char >= "a" ||
      char <= "z" ||
      char >= "A" ||
      char <= "Z"
    ) {
    } else {
      bool = false;
      break;
    }
  }
  if (bool) {
    if (index == -1) {
      json = {
        name: name1,
        maths: math2,
        computers: comp2,
        gender: gender1,
        city: city1,
      };
      arr.push(json);
      show(0);
    } else {
      arr[index].name = name1;
      arr[index].maths = math2;
      arr[index].computers = comp2;
      arr[index].city = city1;
      arr[index].gender = gender1;
      show(0);
    }
    formStr = "";
    formEle = document.getElementById("form");
    formEle.innerHTML = formStr;
  } else {
    alert("Bad Input");
  }
}
function txtField(label, id, value, smtxt) {
  str1 =
    "<div class='form-group'><label>" +
    label +
    "</label>" +
    "<input type='text' class='form-control' id='" +
    id +
    "' value='" +
    value +
    "'>" +
    "<small class='form-text text-muted'>" +
    smtxt +
    "</small>" +
    "</div>";
  return str1;
}
function txtField1(label, id, placeholder, smtxt) {
  str1 =
    "<div class='form-group'><label>" +
    label +
    "</label>" +
    "<input type='text' class='form-control' id='" +
    id +
    "' placeholder='" +
    placeholder +
    "'>" +
    "<small class='form-text text-muted'>" +
    smtxt +
    "</small>" +
    "</div>";
  return str1;
}
function edit(index) {
  formStr =
    "<div class='row justify-content-center mt-3'><div class='col-8 border border-dark mb-3'><br/><form>";
  formStr += txtField(
    "Name",
    "txt1",
    arr[index].name,
    "Name must be alphabet or space"
  );
  formStr += txtField(
    "Maths Marks",
    "txt2",
    arr[index].maths,
    "Marks should be between 0 and 100"
  );
  formStr += txtField(
    "Computer Marks",
    "txt3",
    arr[index].computers,
    "Marks should be between 0 and 100"
  );

  formStr +=
    "<div class='input-group mb-3'><div class='input-group-prepend'><label class='input-group-text'>Gender :</label></div><select class='custom-select' id = 'dd1'><option disabled>Select Gender</option><option" +
    (arr[index].gender == genderArr[0] ? " selected" : "") +
    ">" +
    genderArr[0] +
    "</option><option" +
    (arr[index].gender == genderArr[1] ? " selected" : "") +
    ">" +
    genderArr[1] +
    "</option></select></div>" +
    "<div class='input-group mb-3'><div class='input-group-prepend'><label class='input-group-text'>City :</label></div><select class='custom-select' id = 'dd2'><option disabled>Select City</option><option" +
    (arr[index].city == cityArr[0] ? " selected" : "") +
    ">" +
    cityArr[0] +
    "</option><option" +
    (arr[index].city == cityArr[1] ? " selected" : "") +
    ">" +
    cityArr[1] +
    "</option><option" +
    (arr[index].city === cityArr[2] ? " selected" : "") +
    ">" +
    cityArr[2] +
    "</option><option" +
    (arr[index].city === cityArr[3] ? " selected" : "") +
    ">" +
    cityArr[3] +
    "</option></select></div>" +
    "<button type='button' class='btn btn-success' onclick = submitB(" +
    index +
    ")>Confirm Change</button>";
  formStr += "</form></div>";
  formEle = document.getElementById("form");
  //console.log(formStr);
  formEle.innerHTML = formStr;
  show(3);
}
