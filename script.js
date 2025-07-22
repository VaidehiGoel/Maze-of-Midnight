const maze = document.getElementById("maze");

// Maze Legend:
// 0 = Wall
// 1 = Path
// 2 = Start
// 3 = Goal
// 4 = Time-based tile (unlocked during allowed hours)

// Hours (24h format) when time tiles are unlocked
const timeTileActiveHours = [8, 9, 10, 11, 18, 19, 20]; // You can adjust this

// Create the maze layout (10x10)
const layout = [
  [0, 2, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 4, 1, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 4, 0, 0, 0, 0, 1, 3],
  [0, 0, 0, 1, 1, 1, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
  [0, 4, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

let playerPos = { x: 1, y: 0 }; // Start coordinates

function isTimeTileActive() {
  const currentHour = new Date().getHours();
  return timeTileActiveHours.includes(currentHour);
}

function renderMaze() {
  maze.innerHTML = "";

  for (let y = 0; y < layout.length; y++) {
    for (let x = 0; x < layout[0].length; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (x === playerPos.x && y === playerPos.y) {
        cell.classList.add("player");
      } else {
        switch (layout[y][x]) {
          case 0:
            cell.classList.add("wall");
            break;
          case 1:
            cell.classList.add("path");
            break;
          case 2:
            cell.classList.add("path");
            break;
          case 3:
            cell.classList.add("goal");
            break;
          case 4:
            if (isTimeTileActive()) {
              cell.classList.add("path");
            } else {
              cell.classList.add("time-tile");
            }
            break;
        }
      }

      maze.appendChild(cell);
    }
  }
}

function movePlayer(dx, dy) {
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;

  if (
    newX >= 0 &&
    newX < layout[0].length &&
    newY >= 0 &&
    newY < layout.length
  ) {
    const target = layout[newY][newX];
    const canEnter =
      target === 1 ||
      target === 2 ||
      target === 3 ||
      (target === 4 && isTimeTileActive());

    if (canEnter) {
      playerPos = { x: newX, y: newY };
      renderMaze();

      if (target === 3) {
        setTimeout(() => {
          alert("🎉 You reached the goal!");
        }, 100);
      }
    }
  }
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      movePlayer(0, -1);
      break;
    case "ArrowDown":
      movePlayer(0, 1);
      break;
    case "ArrowLeft":
      movePlayer(-1, 0);
      break;
    case "ArrowRight":
      movePlayer(1, 0);
      break;
  }
});

renderMaze();
