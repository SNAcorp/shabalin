class PuzzleGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.newGameBtn = document.getElementById('newGame');
        this.checkSolutionBtn = document.getElementById('checkSolution');

        this.tileSize = 50;
        this.gridWidth = 9;
        this.gridHeight = 6;
        this.tiles = [];
        this.selectedTile = null;

        this.initializeEventListeners();
        this.startNewGame();
    }

    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkSolutionBtn.addEventListener('click', () => this.checkSolution());
    }

    async startNewGame() {
        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/new');
            const gameData = await response.json();

            this.createBoard(gameData.grid);
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
        }
    }

    createBoard(grid) {
        this.gameBoard.innerHTML = '';
        this.tiles = [];

        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';

            // Вычисляем позицию фонового изображения
            const originalX = (position % this.gridWidth) * this.tileSize;
            const originalY = Math.floor(position / this.gridWidth) * this.tileSize;

            tile.style.backgroundImage = 'url("https://shabalin.sna.lol/static/puzzle.jpg")';
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

            tile.addEventListener('click', () => this.handleTileClick(index));

            this.tiles.push(tile);
            this.gameBoard.appendChild(tile);
        });
    }

    handleTileClick(index) {
        if (this.selectedTile === null) {
            // Выбираем первый тайл
            this.tiles[index].classList.add('selected');
            this.selectedTile = index;
        } else {
            // Меняем тайлы местами
            this.swapTiles(this.selectedTile, index);
            this.tiles[this.selectedTile].classList.remove('selected');
            this.selectedTile = null;
        }
    }

    swapTiles(index1, index2) {
        // Меняем местами фоновые позиции
        const tempBackground = this.tiles[index1].style.backgroundPosition;
        this.tiles[index1].style.backgroundPosition = this.tiles[index2].style.backgroundPosition;
        this.tiles[index2].style.backgroundPosition = tempBackground;
    }

    getCurrentGrid() {
        return this.tiles.map(tile => {
            const [x, y] = tile.style.backgroundPosition
                .split(' ')
                .map(pos => parseInt(pos));

            // Вычисляем оригинальную позицию тайла
            const col = Math.abs(x / this.tileSize);
            const row = Math.abs(y / this.tileSize);

            return row * this.gridWidth + col;
        });
    }

    async checkSolution() {
        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grid: this.getCurrentGrid()
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