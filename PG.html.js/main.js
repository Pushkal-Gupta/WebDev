displayStr = "";
headerStr = "";
siteArr = [
  {
    name: "PG.Quiz",
    date: "22/10/2023",
    rating: 0,
    level: 0,
    status: "Update Required",
    bootstrapVersion: "4.3.1",
    fontAwesomeVersion: "None",
    bugs: "Register Button",
  },
  {
    name: "PG.Student System",
    date: "05/03/2024",
    rating: 1,
    level: 1,
    status: "Completed",
    bootstrapVersion: "5.3.2",
    fontAwesomeVersion: "None",
    bugs: "Everything Working Fine",
  },
  {
    name: "PG.Employee System",
    date: "09/06/2024",
    rating: 2,
    level: 2,
    status: "Update Required",
    bootstrapVersion: "5.2.3",
    fontAwesomeVersion: "None",
    bugs: "Expenses,Add Expense,Dark Mode",
  },
  {
    name: "PG.Web Basics",
    date: "09/02/2024",
    rating: 3,
    level: 2,
    status: "Completed",
    bootstrapVersion: "None",
    fontAwesomeVersion: "None",
    bugs: "Everything Working Fine",
  },
  {
    name: "PG.Chess",
    date: "30/06/2024",
    rating: 4,
    level: 4,
    status: "In Progress",
    bootstrapVersion: "5.2.3",
    fontAwesomeVersion: "6.0.0",
    bugs: "Timer",
  },
  {
    name: "Not Decided",
    date: "XX/XX/2025",
    rating: 7,
    level: 5,
    status: "Not Started",
    bootstrapVersion: "5.3.3",
    fontAwesomeVersion: "6.0.0",
    bugs: "Everything Working Fine",
  },
];
siteTestArr = [];
head1Arr = [
  "Website Name",
  "Date Published",
  "Rating(1-10)",
  "Difficulty Level(1-10)",
  "Status",
  "Link",
];
head2Arr = [
  "Website Name",
  "Date Published",
  "Rating(1-10)",
  "Difficulty Level(1-10)",
  "Status",
  "BootStrap Version",
  "FontAwesome Version",
  "Bugs(Features Not Working)",
];
polArr = [1, 1, 1, 1, 1];
display();
function display() {
  headerArr = head1Arr.map(function (ele, index) {
    return (
      "<th scope='col' onclick = headActions(" + index + ")>" + ele + "</th>"
    );
  });
  headerStr =
    "<thead><tr class='table-dark'>" + headerArr.join("") + "</tr></thead>";
  displayArr = siteArr.map(function (ele, index) {
    return (
      "<tr><td>" +
      ele.name +
      "</td><td>" +
      ele.date +
      "</td><td><div class='center-content'>" +
      ele.rating +
      "</div></td ><td><div class ='center-content'>" +
      ele.level +
      "</div></td><td>" +
      ele.status +
      "</td><td><button type='button' class='btn btn-primary' onclick=goToSite(" +
      index +
      ")>Go To Site</button>" +
      "</td></tr>"
    );
  });
  displayStr =
    "<h1 class='text-center'>List of Sites</h1>" +
    "<div class='container'><table class='table table-striped'>" +
    headerStr +
    "<tbody>" +
    displayArr.join("") +
    "</tbody></table>" +
    "<button type='button' class='btn btn-info' onclick = changeView()>Change View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function headActions(index) {
  siteTestArr = [...siteArr];
  if (index === 0) {
    siteTestArr.sort(sortField0);
    if (siteTestArr[0].name === siteArr[0].name) {
      polArr[index] *= -1;
      headActions(index);
    } else {
      siteArr = siteTestArr;
      display();
    }
  } else if (index === 1) {
    siteTestArr.sort(sortField1);
    if (siteTestArr[0].date === siteArr[0].date) {
      polArr[index] *= -1;
      headActions(index);
    } else {
      siteArr = siteTestArr;
      display();
    }
  } else if (index === 2) {
    siteTestArr.sort(sortField2);
    if (siteTestArr[0].rating === siteArr[0].rating) {
      polArr[index] *= -1;
      headActions(index);
    } else {
      siteArr = siteTestArr;
      display();
    }
  } else if (index === 3) {
    siteTestArr.sort(sortField3);
    if (siteTestArr[0].level === siteArr[0].level) {
      polArr[index] *= -1;
      headActions(index);
    } else {
      siteArr = siteTestArr;
      display();
    }
  } else if (index === 4) {
    siteTestArr.sort(sortField4);
    if (siteTestArr[0].status === siteArr[0].status) {
      polArr[index] *= -1;
      headActions(index);
    } else {
      siteArr = siteTestArr;
      display();
    }
  }
  polArr[index] *= -1;
}
function sortField0(ele1, ele2) {
  return polArr[0] * ele1.name.localeCompare(ele2.name);
}
function sortField1(ele1, ele2) {
  return polArr[1] * ele1.date.localeCompare(ele2.date);
}
function sortField2(ele1, ele2) {
  return polArr[2] * (ele1.rating - ele2.rating);
}
function sortField3(ele1, ele2) {
  return polArr[3] * (ele1.level - ele2.level);
}
function sortField4(ele1, ele2) {
  return polArr[4] * ele1.status.localeCompare(ele2.status);
}
function changeView() {
  displayArr = siteArr.map(function (ele, index) {
    eleContent =
      "<p class='text-danger fw-bold'  style='display:inline'>" +
      head2Arr[0] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.name +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[1] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.date +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[2] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.rating +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[3] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.level +
      "</p><br><div class='btn-group' role='group'><button type='button' class='btn btn-success' onclick = moreDetails(" +
      index +
      ")>More Details</button><button type='button' class='btn btn-primary button-space' onclick = goToSite(" +
      index +
      ")>Go To Site</button></div>";
    return "<div class='col border p-3 bg-light'>" + eleContent + "</div>";
  });
  displayStr =
    "<h1 class='text-center'>List of Sites</h1><div class='container'><div class='row row-cols-3'>" +
    displayArr.join("") +
    "</div><br><button type='button' class='btn btn-info' onclick = originalView()>Original View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function originalView() {
  display();
}
function moreDetails(indexCheck) {
  detailContent = "";
  displayStr = "";
  displayArr = siteArr.map(function (ele, index) {
    if (indexCheck === index) {
      detailContent =
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[4] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.status +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[5] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.bootstrapVersion +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[6] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.fontAwesomeVersion +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[7] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.bugs +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[8] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.workBefore +
        "</p><br>" +
        "<p class='text-danger fw-bold'  style='display:inline'>" +
        head2Arr[9] +
        " : </p>" +
        "<p class='text-dark' style='display:inline'>" +
        ele.workEx +
        "</p><br>";
    } else {
      detailContent =
        "<div class='btn-group' role='group'><button type='button' class='btn btn-success' onclick = moreDetails(" +
        index +
        ")>More Details</button><button type='button' class='btn btn-primary button-space' onclick = goToSite(" +
        index +
        ")>Go To Site</button></div>";
    }
    eleContent =
      "<p class='text-danger fw-bold'  style='display:inline'>" +
      head2Arr[0] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.name +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[1] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.date +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[2] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.rating +
      "</p><br>" +
      "<p class='text-danger fw-bold' style='display:inline'>" +
      head2Arr[3] +
      " : </p>" +
      "<p class='text-dark' style='display:inline'>" +
      ele.level +
      "</p><br>" +
      detailContent;
    return "<div class='col border p-3 bg-light'>" + eleContent + "</div>";
  });
  displayStr +=
    "<h1 class='text-center'>List of Sites</h1><div class='container'><div class='row row-cols-3'>" +
    displayArr.join("") +
    "</div><br><button type='button' class='btn btn-info' onclick = originalView()>Original View</button></div>";
  displayEle = document.getElementById("display");
  displayEle.innerHTML = displayStr;
}
function goToSite(index) {
  if (index === 0) {
    window.location.href = "../PG.Quiz/Quiz.html";
  } else if (index === 1) {
    window.location.href = "../studentSystem.html.js/p1.html";
  } else if (index === 2) {
    window.location.href = "../employeeSystem.html.js/p2.html";
  } else if (index === 3) {
    window.location.href = "../PG.Web_Basics/index.html";
  } else if (index === 4) {
    window.location.href = "../chess.html.js/p3.html#";
  } else if (index === 5) {
    window.location.href = "../PG.html.js/main.html#";
  }
}
