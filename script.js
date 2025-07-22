const mazeElement = document.getElementById("maze");
const size = 10;

const mazeLayout = [
  "WWWPWWWWWW",
  "WPWPWPPPPW",
  "WPWWWWWPWW",
  "WPPPPWPPGW",
  "WWWPWWWPWW",
  "WPPPWPPPPW",
  "WWWWWPPPWW",
  "WSWPPWWWGW",
  "WPPPWPPPPW",
  "WWWWWWWWWW"
];

let playerPos = { x: 1, y: 1 };

function renderMaze() {
  mazeElement.innerHTML = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      const char = mazeLayout[y][x];
      if (x === playerPos.x && y === playerPos.y) {
        cell.classList.add("player");
        cell.textContent = "🧍";
      } else if (char === "W") {
        cell.classList.add("wall");
      } else if (char === "P") {
        cell.classList.add("path");
      } else if (char === "G") {
        cell.classList.add("goal");
        cell.textContent = "🏁";
      } else if (char === "S") {
        const hour = new Date().getHours();
        if (hour >= 18 || hour <= 6) {
          cell.classList.add("secret-path");
        } else {
          cell.classList.add("wall");
        }
      }
      mazeElement.appendChild(cell);
    }
  }
}

document.addEventListener("keydown", (e) => {
  const dx = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 0, ArrowDown: 0 }[e.key];
  const dy = { ArrowLeft: 0, ArrowRight: 0, ArrowUp: -1, ArrowDown: 1 }[e.key];
  if (dx !== undefined && dy !== undefined) {
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    const char = mazeLayout[newY]?.[newX];

    // Secret path is only available at night
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour <= 6;

    if (char && (char !== "W" && (char !== "S" || isNight))) {
      playerPos.x = newX;
      playerPos.y = newY;
      renderMaze();
    }
  }
});

renderMaze();
