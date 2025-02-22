function toggleForm(formType) {
  let body = document.body;
  let signupForm = document.getElementById("signup-form");
  let loginForm = document.getElementById("login-form");

  if (formType === "signup") {
    body.classList.add("signup-theme");
    body.classList.remove("login-theme");
    signupForm.style.display = "block";
    loginForm.style.display = "none";
  } else {
    body.classList.add("login-theme");
    body.classList.remove("signup-theme");
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  }
}

function togglePasswordVisibility(id, icon) {
  let input = document.getElementById(id);
  let isPassword = input.type === "password";

  input.type = isPassword ? "text" : "password";
  icon.classList.toggle("fa-eye");
  icon.classList.toggle("fa-eye-slash");
}

function validateSignup(event) {
  event.preventDefault();

  let password = document.getElementById("signup-password").value;
  let confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  if (password.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match! ❌");
    return;
  }

  alert("Signup Successful! 🎉");
}

function validateLogin(event) {
  event.preventDefault();

  let email = document.getElementById("login-email").value;
  let password = document.getElementById("login-password").value;

  let validEmail = "pushkal.gupta2023@vitstudent.ac.in";
  let validPassword = "password";

  if (email === validEmail && password === validPassword) {
    alert("Login Successful! ✅");
  } else {
    alert("Invalid email or password! ❌");
  }
}
