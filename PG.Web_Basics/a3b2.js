let currentSlide = 0;
const slides = document.querySelectorAll(".slide");
function nextSlide() {
  slides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add("active");
}
function prevSlide() {
  slides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");
}
function showContent() {
  document.querySelector(".hidden-section").style.display = "block";
}
function hideContent() {
  document.querySelector(".hidden-section").style.display = "none";
}
function generatePassword() {
  document.getElementById("password").value = Math.random()
    .toString(36)
    .slice(-8);
}
function calculateBill() {
  let type = document.getElementById("user-type").value;
  let discount = type === "employee" ? 25 : type === "student" ? 50 : 0;
  let finalPrice = 1000 * (1 - discount / 100);
  document.getElementById(
    "final-bill"
  ).textContent = `Final Fee: ₹${finalPrice}`;
}
