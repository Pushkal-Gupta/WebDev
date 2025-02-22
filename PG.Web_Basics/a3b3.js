function validateEventForm(event) {
  event.preventDefault();

  let name = document.getElementById("name").value.trim();
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirm-password").value;
  let comments = document.getElementById("comments").value.trim();

  if (!name.match(/^[a-zA-Z\s]+$/)) {
    alert("Name must contain only letters!");
    return;
  }

  let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert("Invalid email format!");
    return;
  }

  let phonePattern = /^[0-9]{10}$/;
  if (!phonePattern.test(phone)) {
    alert("Phone number must be exactly 10 digits!");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  let eventType = document.querySelector('input[name="event-type"]:checked');
  if (!eventType) {
    alert("Please select an event type!");
    return;
  }

  let interests = document.querySelectorAll('input[name="interest"]:checked');
  if (interests.length === 0) {
    alert("Please select at least one interest!");
    return;
  }

  if (comments.length < 10) {
    alert("Comments must be at least 10 characters long!");
    return;
  }

  alert("🎉 Registration Successful!");
}
