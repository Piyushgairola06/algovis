const canvas = document.getElementById("graph-canvas");
const ctx = canvas.getContext("2d");

let nodes = [];
let edges = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  nodes.push({ x, y });
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  });
}
