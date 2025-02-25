const canvas = document.getElementById("emotionCanvas");
const ctx = canvas.getContext("2d");
const selectedMoodText = document.getElementById("selectedMood");
const emotions = [
  {
    name: "Joy",
    color: "#FFD700",
    eyes: "happy",
    mouth: "smile",
    brows: "raised",
  },
  {
    name: "Trust",
    color: "#32CD32",
    eyes: "normal",
    mouth: "neutral",
    brows: "soft",
  },
  {
    name: "Fear",
    color: "#00CED1",
    eyes: "wide",
    mouth: "open",
    brows: "arched",
  },
  {
    name: "Surprise",
    color: "#1E90FF",
    eyes: "shocked",
    mouth: "open",
    brows: "high",
  },
  {
    name: "Sadness",
    color: "#4682B4",
    eyes: "droopy",
    mouth: "sad",
    brows: "low",
  },
  {
    name: "Disgust",
    color: "#8A2BE2",
    eyes: "angry",
    mouth: "frown",
    brows: "furrowed",
  },
  {
    name: "Anger",
    color: "#DC143C",
    eyes: "furrowed",
    mouth: "angry",
    brows: "down",
  },
  {
    name: "Anticipation",
    color: "#FF8C00",
    eyes: "raised",
    mouth: "smirk",
    brows: "curved",
  },
];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 120;
function drawEmotions() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  emotions.forEach((emotion, index) => {
    const angle = (index / emotions.length) * (2 * Math.PI);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    // Face
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fillStyle = emotion.color;
    ctx.fill();
    ctx.closePath();
    drawFace(x, y, emotion.eyes, emotion.mouth, emotion.brows);
  });
}
function drawFace(x, y, eyesType, mouthType, browsType) {
  ctx.fillStyle = "#000";
  ctx.lineWidth = 2;
  //Eyebrows
  ctx.beginPath();
  if (browsType === "raised") {
    ctx.moveTo(x - 20, y - 20);
    ctx.quadraticCurveTo(x - 15, y - 30, x - 10, y - 20);
    ctx.moveTo(x + 10, y - 20);
    ctx.quadraticCurveTo(x + 15, y - 30, x + 20, y - 20);
  } else if (browsType === "furrowed") {
    ctx.moveTo(x - 20, y - 20);
    ctx.quadraticCurveTo(x - 15, y - 10, x - 10, y - 20);
    ctx.moveTo(x + 10, y - 20);
    ctx.quadraticCurveTo(x + 15, y - 10, x + 20, y - 20);
  } else if (browsType === "low") {
    ctx.moveTo(x - 20, y - 15);
    ctx.lineTo(x - 10, y - 20);
    ctx.moveTo(x + 10, y - 20);
    ctx.lineTo(x + 20, y - 15);
  } else if (browsType === "curved") {
    ctx.moveTo(x - 20, y - 15);
    ctx.quadraticCurveTo(x, y - 10, x + 20, y - 15);
  } else if (browsType === "down") {
    ctx.moveTo(x - 20, y - 25);
    ctx.lineTo(x - 10, y - 20);
    ctx.moveTo(x + 10, y - 20);
    ctx.lineTo(x + 20, y - 25);
  } else if (browsType === "high") {
    ctx.moveTo(x - 20, y - 30);
    ctx.lineTo(x - 10, y - 35);
    ctx.moveTo(x + 10, y - 35);
    ctx.lineTo(x + 20, y - 30);
  }
  ctx.stroke();
  //Eyes
  ctx.fillStyle = "#000";
  ctx.beginPath();
  if (eyesType === "happy") {
    ctx.arc(x - 15, y - 10, 5, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 5, 0, Math.PI * 2);
  } else if (eyesType === "wide") {
    ctx.arc(x - 15, y - 10, 7, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 7, 0, Math.PI * 2);
  } else if (eyesType === "shocked") {
    ctx.arc(x - 15, y - 10, 6, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 6, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.arc(x - 15, y - 10, 3, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 3, 0, Math.PI * 2);
  } else {
    ctx.arc(x - 15, y - 10, 5, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 5, 0, Math.PI * 2);
  }
  ctx.fill();
  //Mouth
  ctx.beginPath();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  if (mouthType === "smile") {
    ctx.arc(x, y + 10, 20, 0, Math.PI);
  } else if (mouthType === "neutral") {
    ctx.moveTo(x - 15, y + 15);
    ctx.lineTo(x + 15, y + 15);
  } else if (mouthType === "sad") {
    ctx.arc(x, y + 30, 20, Math.PI, Math.PI * 2);
  } else if (mouthType === "open") {
    ctx.arc(x, y + 15, 12, 0, Math.PI * 2);
  } else if (mouthType === "frown") {
    ctx.arc(x, y + 15, 20, 0, Math.PI, true);
  } else if (mouthType === "angry") {
    ctx.moveTo(x - 15, y + 20);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x + 15, y + 20);
  } else if (mouthType === "smirk") {
    ctx.moveTo(x - 5, y + 15);
    ctx.lineTo(x + 15, y + 10);
  }
  ctx.stroke();
}
canvas.addEventListener("click", function (event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  emotions.forEach((emotion, index) => {
    const angle = (index / emotions.length) * (2 * Math.PI);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
    if (distance < 50) {
      selectedMoodText.innerText = emotion.name;
    }
  });
});
drawEmotions();
