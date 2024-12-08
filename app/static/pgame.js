class PuzzleGame {
    constructor() {
        this.tilesContainer = document.getElementById('tilesContainer');
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.newGameBtn = document.getElementById('newGame');
        this.checkSolutionBtn = document.getElementById('checkSolution');

        this.tileSize = 50;
        this.gridWidth = 9;
        this.gridHeight = 6;
        this.tiles = [];
        this.gridCells = [];

        this.draggedTile = null;

        this.initializeEventListeners();
        this.createGrid();
        this.startNewGame();
    }

    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkSolutionBtn.addEventListener('click', () => this.checkSolution());

        // Предотвращаем стандартное поведение драг-н-дропа для сетки
        this.puzzleGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    createGrid() {
        // Создаем пустую сетку
        for (let i = 0; i < this.gridHeight * this.gridWidth; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            // Обработчики для drag and drop
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('highlight');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('highlight');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('highlight');

                if (this.draggedTile && !cell.hasChildNodes()) {
                    cell.appendChild(this.draggedTile);
                    this.draggedTile = null;
                }
            });

            this.gridCells.push(cell);
            this.puzzleGrid.appendChild(cell);
        }
    }

    async startNewGame() {
        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/new');
            const gameData = await response.json();

            this.createTiles(gameData.grid);
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
        }
    }

    createTiles(grid) {
        this.tilesContainer.innerHTML = '';
        this.tiles = [];

        // Очищаем сетку
        this.gridCells.forEach(cell => {
            cell.innerHTML = '';
        });

        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;

            // Вычисляем позицию фонового изображения
            const originalX = (position % this.gridWidth) * this.tileSize;
            const originalY = Math.floor(position / this.gridWidth) * this.tileSize;

            tile.style.backgroundImage = 'url("https://shabalin.sna.lol/static/puzzle.jpg")';
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

            // Добавляем data-атрибут для определения правильной позиции
            tile.dataset.correctPosition = position;

            // Обработчики для drag and drop
            tile.addEventListener('dragstart', () => {
                this.draggedTile = tile;
                tile.classList.add('dragging');
            });

            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
            });

            this.tiles.push(tile);
            this.tilesContainer.appendChild(tile);
        });
    }

    getCurrentState() {
        const state = new Array(this.gridWidth * this.gridHeight).fill(null);

        this.gridCells.forEach((cell, index) => {
            const tile = cell.firstChild;
            if (tile) {
                state[index] = parseInt(tile.dataset.correctPosition);
            }
        });

        return state;
    }

    async checkSolution() {
        const currentState = this.getCurrentState();

        // Проверяем, все ли ячейки заполнены
        if (currentState.includes(null)) {
            alert('Пожалуйста, заполните все ячейки сетки!');
            return;
        }

        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grid: currentState
                })
            });

            const result = await response.json();

            if (result.solved) {
                alert('Поздравляем! Вы собрали пазл правильно!');
            } else {
                alert('Пока не верно. Попробуйте еще!');
            }
        } catch (error) {
            console.error('Ошибка при проверке решения:', error);
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});