class PuzzleGame {
    constructor() {
        // DOM элементы
        this.availableTiles = document.getElementById('availableTiles');
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.checkBtn = document.getElementById('checkBtn');
        this.timer = document.getElementById('timer');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');

        // Конфигурация
        this.tileSize = 50;
        this.gridWidth = 9;
        this.gridHeight = 6;
        this.currentDifficulty = 'easy';

        // Состояние игры
        this.tiles = [];
        this.gridCells = [];
        this.draggedTile = null;
        this.timerInterval = null;
        this.startTime = null;
        this.isGameActive = false;

        // Инициализация
        this.initializeGame();
    }

    initializeGame() {
        this.createGrid();
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkBtn.addEventListener('click', () => this.checkSolution());

        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isGameActive && !confirm('Начать новую игру?')) {
                    return;
                }
                this.difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });

        // Предотвращаем стандартное поведение drag&drop на сетке
        this.puzzleGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    createGrid() {
        this.puzzleGrid.innerHTML = '';
        this.gridCells = [];

        for (let i = 0; i < this.gridHeight * this.gridWidth; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            cell.addEventListener('dragover', e => {
                e.preventDefault();
                cell.classList.add('highlight');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('highlight');
            });

            cell.addEventListener('drop', e => {
                e.preventDefault();
                cell.classList.remove('highlight');

                if (this.draggedTile && !cell.hasChildNodes()) {
                    cell.appendChild(this.draggedTile);
                    this.draggedTile = null;
                    this.checkAutoComplete();
                }
            });

            this.gridCells.push(cell);
            this.puzzleGrid.appendChild(cell);
        }
    }

    async startNewGame() {
        this.stopTimer();
        this.isGameActive = true;

        try {
            const response = await fetch(`https://shabalin.sna.lol/api/game/new?difficulty=${this.currentDifficulty}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const gameData = await response.json();
            this.createTiles(gameData.grid);
            this.startTimer();
        } catch (error) {
            console.error('Error starting new game:', error);
            alert('Ошибка при создании новой игры. Попробуйте еще раз.');
            this.isGameActive = false;
        }
    }

    createTiles(grid) {
        this.availableTiles.innerHTML = '';
        this.gridCells.forEach(cell => cell.innerHTML = '');
        this.tiles = [];

        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;

            // Вычисляем позицию в изображении
            const originalX = (position % this.gridWidth) * this.tileSize;
            const originalY = Math.floor(position / this.gridWidth) * this.tileSize;

            // Устанавливаем фоновое изображение
            tile.style.backgroundImage = `url('https://shabalin.sna.lol/static/${this.currentDifficulty}puzzle.jpg')`;
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

            tile.dataset.correctPosition = position;

            tile.addEventListener('dragstart', () => {
                this.draggedTile = tile;
                tile.classList.add('dragging');
            });

            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
                this.draggedTile = null;
            });

            this.tiles.push(tile);
            this.availableTiles.appendChild(tile);
        });
    }

    startTimer() {
        this.stopTimer();
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        this.timer.textContent = `${minutes}:${seconds}`;
    }

    getCurrentState() {
        return this.gridCells.map(cell => {
            const tile = cell.firstChild;
            return tile ? parseInt(tile.dataset.correctPosition) : null;
        });
    }

    checkAutoComplete() {
        const isGridFull = this.gridCells.every(cell => cell.hasChildNodes());
        if (isGridFull) {
            this.checkSolution();
        }
    }

    async checkSolution() {
        const currentState = this.getCurrentState();

        if (currentState.includes(null)) {
            alert('Заполните все ячейки!');
            return;
        }

        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grid: currentState,
                    difficulty: this.currentDifficulty
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            if (result.solved) {
                this.stopTimer();
                this.isGameActive = false;
                alert(`Поздравляем! Вы собрали пазл за ${this.timer.textContent}!`);
            } else {
                alert('Пока не верно. Попробуйте еще!');
            }
        } catch (error) {
            console.error('Error checking solution:', error);
            alert('Ошибка при проверке решения. Попробуйте еще раз.');
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});