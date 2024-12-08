class PuzzleGame {
    constructor() {
        this.tilesArea = document.getElementById('tilesArea');
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.newGameBtn = document.getElementById('newGame');
        this.checkSolutionBtn = document.getElementById('checkSolution');

        this.tileSize = 50;
        this.gridWidth = 9;
        this.gridHeight = 6;
        this.tiles = [];
        this.gridCells = [];

        this.initializeEventListeners();
        this.createGrid();
        this.startNewGame();
    }

    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkSolutionBtn.addEventListener('click', () => this.checkSolution());
    }

    createGrid() {
        // Создаем пустую сетку
        this.puzzleGrid.innerHTML = '';
        this.gridCells = [];

        for (let i = 0; i < this.gridHeight * this.gridWidth; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            this.setupGridCellEvents(cell);

            this.gridCells.push(cell);
            this.puzzleGrid.appendChild(cell);
        }
    }

    setupGridCellEvents(cell) {
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

            const tileId = e.dataTransfer.getData('text/plain');
            const tile = document.getElementById(tileId);

            if (tile && !cell.hasChildNodes()) {
                cell.appendChild(tile);
                cell.classList.add('filled');
            }
        });
    }

    async startNewGame() {
        try {
            const response = await fetch('http://shabalin.sna.lol/api/game/new');
            const gameData = await response.json();

            this.createTiles(gameData.grid);
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
        }
    }

    createTiles(grid) {
        // Очищаем области
        this.tilesArea.innerHTML = '';
        this.gridCells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('filled');
        });

        // Создаем новые тайлы
        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${index}`;
            tile.draggable = true;

            // Вычисляем позицию фонового изображения
            const originalX = (position % this.gridWidth) * this.tileSize;
            const originalY = Math.floor(position / this.gridWidth) * this.tileSize;

            tile.style.backgroundImage = 'url("https://shabalin.sna.lol/static/puzzle.jpg")';
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

            this.setupTileEvents(tile);

            this.tiles.push(tile);
            this.tilesArea.appendChild(tile);
        });
    }

    setupTileEvents(tile) {
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', tile.id);
            tile.classList.add('dragging');

            // Если тайл находится в ячейке сетки, освобождаем ячейку
            if (tile.parentElement.classList.contains('grid-cell')) {
                tile.parentElement.classList.remove('filled');
            }
        });

        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
        });
    }

    getCurrentGrid() {
        return this.gridCells.map(cell => {
            const tile = cell.firstChild;
            if (!tile) return null;

            const [x, y] = tile.style.backgroundPosition
                .split(' ')
                .map(pos => parseInt(pos));

            const col = Math.abs(x / this.tileSize);
            const row = Math.abs(y / this.tileSize);

            return row * this.gridWidth + col;
        });
    }

    async checkSolution() {
        const grid = this.getCurrentGrid();

        // Проверяем, все ли ячейки заполнены
        if (grid.includes(null)) {
            alert('Пожалуйста, заполните все ячейки сетки!');
            return;
        }

        try {
            const response = await fetch('http://shabalin.sna.lol/api/game/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ grid })
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