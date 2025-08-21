window.onload = function () {
  const startButton = document.getElementById("start-button");
  const backToTheMenuButton = document.getElementById("back-to-the-menu");
  const gameScreen = document.getElementById("game-screen");
  const startWindow = document.getElementById("game-intro");
  const endGameWindow = document.getElementById("game-end");
  const rulesButton = document.getElementById("rules-button");
  const rulesModal = document.getElementById("rules-modal");
  const closeRulesButton = document.getElementById("close-rules-button");
  const muteBgButton = document.getElementById("mute-bg-btn");
  const backgroundSound = document.getElementById("background-sound");
  const moveASound = document.getElementById("moveA-sound");
  const moveDKSound = document.getElementById("moveDK-sound");
  const restartButton = document.getElementById("restart-button");

  let isBgMuted = false;
  let isMoveMuted = false;

  const boardSize = 11;
  const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

  const pieces = {
    A: 'A',
    D: 'D',
    K: 'K'
  };

  const initialPositions = {
    'A':
      [
        [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 5],
        [3, 0], [3, 10], [4, 0], [4, 10], [5, 0], [5, 1], [5, 9], [5, 10],
        [6, 0], [6, 10], [7, 0], [7, 10], [9, 5], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7]
      ],
    'D': [
      [3, 5],
      [4, 4],
      [4, 5],
      [4, 6], [5, 3], [5, 4], [5, 6], [5, 7], [6, 4], [6, 5], [6, 6], [7, 5]
    ],
    'K': [
      [5, 5]
    ]
  };

  let currentPlayer = 'A';
  let selectedPiece = null;

  Object.keys(initialPositions).forEach(type => {
    initialPositions[type].forEach(([row, col]) => {
      board[row][col] = pieces[type];
    });
  });

  startButton.addEventListener("click", function () {
    startGame();
  });

  backToTheMenuButton.addEventListener("click", function () {
    endGameWindow.classList.add("hidden");
    startWindow.classList.remove("hidden");
  });

  restartButton.addEventListener("click", function () {
    endGameWindow.classList.add("hidden");
    startGame();
  });

  rulesButton.addEventListener("click", () => {
    rulesModal.classList.remove("hidden");
  });

  closeRulesButton.addEventListener("click", () => {
    rulesModal.classList.add("hidden");
  });

  muteBgButton.addEventListener("click", () => {
    const isMuted = !backgroundSound.muted;

    backgroundSound.muted = isMuted;
    moveASound.muted = isMuted;
    moveDKSound.muted = isMuted;

    muteBgButton.setAttribute("data-label", isMuted ? "Unmute Sound" : "Sound off");
    muteBgButton.classList.toggle("mute", isMuted);
  });

  document.getElementById('game-screen').addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('cell')) {
      const row = parseInt(target.dataset.row);
      const col = parseInt(target.dataset.col);
      if (selectedPiece) {
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
        selectedPiece = null;
        clearHighlights();
      } else {
        if (board[row][col] && isValidTurn(board[row][col])) {
          selectedPiece = { row, col };
          highlightValidMoves(row, col);
        }
      }
    }
  });

  function startGame() {
    startWindow.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    backgroundSound.play();
    initializeGame();
    renderBoard();
    updateTurnIndicator();
  }

  function initializeGame() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        board[i][j] = null;
      }
    }

    Object.keys(initialPositions).forEach(type => {
      initialPositions[type].forEach(([row, col]) => {
        board[row][col] = pieces[type];
      });
    });

    currentPlayer = 'A';
    selectedPiece = null;
    renderBoard();
    updateTurnIndicator();
  }

  function renderBoard() {
    gameScreen.innerHTML = '';
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.dataset.row = rowIndex;
        cellElement.dataset.col = colIndex;
        if (cell) {
          cellElement.dataset.piece = cell;
          cellElement.textContent = cell;
        }
        gameScreen.appendChild(cellElement);
      });
    });
  }

  function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];

    if (!isValidTurn(piece)) {
      return;
    }

    if (isValidMove(fromRow, fromCol, toRow, toCol)) {
      board[toRow][toCol] = piece;
      board[fromRow][fromCol] = null;
      renderBoard();

      capturePieces(toRow, toCol);
      renderBoard();

      if (!isMoveMuted) {
        if (piece === 'A') {
          moveASound.play();
        } else if (piece === 'D' || piece === 'K') {
          moveDKSound.play();
        }
      }

      if (!checkEndGame()) {
        switchTurn();
      }
    }
  }

  function isValidTurn(piece) {
    if (currentPlayer === 'A') {
      return piece === 'A';
    } else {
      return piece === 'D' || piece === 'K';
    }
  }

  function switchTurn() {
    currentPlayer = currentPlayer === 'A' ? 'D' : 'A';
    updateTurnIndicator();
  }

  function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator) {
      turnIndicator.textContent = `Current Turn: ${currentPlayer}`;
    }
  }

  const specialTiles = [
    [5, 5]
  ];

  function isValidMove(fromRow, fromCol, toRow, toCol) {
    const restrictedTiles = [
      [5, 5], [0, 0], [0, 10], [10, 0], [10, 10]
    ];

    if (restrictedTiles.some(([r, c]) => r === toRow && c === toCol) && board[fromRow][fromCol] !== pieces.K) {
      return false;
    }

    if (board[toRow][toCol] !== null) {
      return false;
    }

    if (fromRow === toRow) {
      const start = Math.min(fromCol, toCol) + 1;
      const end = Math.max(fromCol, toCol);
      for (let col = start; col < end; col++) {
        if (board[fromRow][col] !== null) {
          return false;
        }
      }
      return true;
    }

    if (fromCol === toCol) {
      const start = Math.min(fromRow, toRow) + 1;
      const end = Math.max(fromRow, toRow);
      for (let row = start; row < end; row++) {
        if (board[row][fromCol] !== null) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  function highlightValidMoves(row, col) {
    clearHighlights();
    const possibleMoves = getPossibleMoves(row, col);
    possibleMoves.forEach(([r, c]) => {
      document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`).classList.add('valid-move');
    });
    document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
  }

  function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('selected', 'valid-move');
    });
  }

  function getPossibleMoves(row, col) {
    const moves = [];
    for (let i = row - 1; i >= 0 && !board[i][col]; i--) moves.push([i, col]);
    for (let i = row + 1; i < boardSize && !board[i][col]; i++) moves.push([i, col]);
    for (let i = col - 1; i >= 0 && !board[row][i]; i--) moves.push([row, i]);
    for (let i = col + 1; i < boardSize && !board[row][i]; i++) moves.push([row, i]);
    return moves;
  }

  function capturePieces(row, col) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    const currentPlayerPiece = board[row][col];
    const opponentPiece = currentPlayerPiece === pieces.A ? pieces.D : pieces.A;

    const cornerTiles = [
      [5, 5], [0, 0], [0, 10], [10, 0], [10, 10]
    ];

    directions.forEach(([dRow, dCol]) => {
      const adjRow1 = row + dRow;
      const adjCol1 = col + dCol;
      const adjRow2 = row + 2 * dRow;
      const adjCol2 = col + 2 * dCol;

      if (
        board[adjRow1]?.[adjCol1] === opponentPiece &&
        board[adjRow2]?.[adjCol2] === currentPlayerPiece
      ) {
        board[adjRow1][adjCol1] = null;
      }

      if (
        currentPlayerPiece === pieces.D &&
        board[adjRow1]?.[adjCol1] === pieces.A &&
        (board[adjRow2]?.[adjCol2] === pieces.D || board[adjRow2]?.[adjCol2] === pieces.K)
      ) {
        board[adjRow1][adjCol1] = null;
      }

      if (
        currentPlayerPiece === pieces.A &&
        board[adjRow1]?.[adjCol1] === pieces.D &&
        board[adjRow2]?.[adjCol2] === pieces.A
      ) {
        board[adjRow1][adjCol1] = null;
      }

      const adjPiece = board[adjRow1]?.[adjCol1];
      if (adjPiece === pieces.A || adjPiece === pieces.D) {
        const isNextToCorner = cornerTiles.some(([cornerRow, cornerCol]) =>
          (Math.abs(cornerRow - adjRow1) + Math.abs(cornerCol - adjCol1)) === 1
        );

        if (isNextToCorner) {
          if (
            currentPlayerPiece === pieces.A &&
            adjPiece === pieces.D
          ) {
            board[adjRow1][adjCol1] = null;
          }

          if (
            (currentPlayerPiece === pieces.D || currentPlayerPiece === pieces.K) &&
            adjPiece === pieces.A
          ) {
            board[adjRow1][adjCol1] = null;
          }
        }
      }
    });
  }

  function checkEndGame() {
    const corners = [
      [0, 0], [0, 10], [10, 0], [10, 10]
    ];

    let isGameOver = false;

    corners.forEach(([r, c]) => {
      if (board[r][c] === pieces.K) {
        endGame('Defenders have won!');
        isGameOver = true;
      }
    });

    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === pieces.K) {
          const up = board[rowIndex - 1]?.[colIndex];
          const down = board[rowIndex + 1]?.[colIndex];
          const left = board[rowIndex]?.[colIndex - 1];
          const right = board[rowIndex]?.[colIndex + 1];

          if (up === pieces.A && down === pieces.A && left === pieces.A && right === pieces.A) {
            endGame('Attackers have won!');
            isGameOver = true;
          }

          if (isOnEdge(rowIndex, colIndex)) {
            const adjacent = [up, down, left, right].filter(Boolean);
            const surroundingAttackers = adjacent.filter(piece => piece === pieces.A).length;
            if (surroundingAttackers === 3) {
              endGame('Attackers have won!');
              isGameOver = true;
            }
          }
        }
      });
    });
    return isGameOver;
  }

  function isOnEdge(row, col) {
    return row === 0 || row === boardSize - 1 || col === 0 || col === boardSize - 1;
  }

  function endGame(message) {
    const endGameMessageElement = document.getElementById('end-game-message');
    endGameMessageElement.textContent = message;
    gameScreen.classList.add('hidden');
    endGameWindow.classList.remove('hidden');
  }
};