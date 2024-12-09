class PuzzleGame {
    constructor() {
        // DOM элементы
        this.tilesContainer = document.getElementById('tilesContainer');
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.newGameBtn = document.getElementById('newGame');
        this.checkSolutionBtn = document.getElementById('checkSolution');
        this.previewImage = document.getElementById('previewImage');
        this.timerDisplay = document.getElementById('timer');

        // Конфигурация игры
        this.tileSize = 50;
        this.gridWidth = 9;
        this.gridHeight = 6;

        // Состояние игры
        this.tiles = [];
        this.gridCells = [];
        this.currentDifficulty = 'easy';
        this.draggedTile = null;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;

        // Инициализация игры
        this.initializeEventListeners();
        this.createGrid();
        this.initializeDifficultySelector();
        this.startNewGame();
    }

    initializeEventListeners() {
        // Основные кнопки управления
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkSolutionBtn.addEventListener('click', () => this.checkSolution());

        // Обработка drag and drop для сетки
        this.puzzleGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    initializeDifficultySelector() {
        const difficultyCards = document.querySelectorAll('.difficulty-card');

        difficultyCards.forEach(card => {
            card.addEventListener('click', () => {
                // Проверяем, изменился ли уровень сложности
                const newDifficulty = card.dataset.difficulty;
                if (this.currentDifficulty === newDifficulty) {
                    return;
                }

                // Подтверждение смены сложности, если игра активна
                if (this.isGameActive) {
                    const confirm = window.confirm('Вы уверены, что хотите начать новую игру? Текущий прогресс будет потерян.');
                    if (!confirm) {
                        return;
                    }
                }

                // Обновляем UI и начинаем новую игру
                difficultyCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.currentDifficulty = newDifficulty;
                this.startNewGame();
            });
        });

        // Выделяем начальный уровень сложности
        const defaultCard = document.querySelector(`[data-difficulty="${this.currentDifficulty}"]`);
        if (defaultCard) {
            defaultCard.classList.add('selected');
        }
    }

    startTimer() {
        // Останавливаем предыдущий таймер, если есть
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.startTime = new Date();

        this.timerInterval = setInterval(() => {
            const currentTime = new Date();
            const diff = new Date(currentTime - this.startTime);
            const minutes = diff.getMinutes().toString().padStart(2, '0');
            const seconds = diff.getSeconds().toString().padStart(2, '0');
            this.timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        if (!this.startTime) return '00:00';
        const diff = new Date(new Date() - this.startTime);
        const minutes = diff.getMinutes().toString().padStart(2, '0');
        const seconds = diff.getSeconds().toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    createGrid() {
        this.puzzleGrid.innerHTML = '';
        this.gridCells = [];

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

                    // Проверяем, заполнена ли вся сетка
                    const isGridFull = this.gridCells.every(cell => cell.hasChildNodes());
                    if (isGridFull) {
                        this.checkSolution();
                    }
                }
            });

            this.gridCells.push(cell);
            this.puzzleGrid.appendChild(cell);
        }
    }

    async startNewGame() {
        try {
            const response = await fetch(`https://shabalin.sna.lol/api/game/new?difficulty=${this.currentDifficulty}`);
            const gameData = await response.json();

            // Обновляем превью и создаем новые тайлы
            this.previewImage.src = `https://shabalin.sna.lol/static/${gameData.image}`;
            this.createTiles(gameData.grid);

            // Сбрасываем и запускаем таймер
            this.startTimer();
            this.isGameActive = true;

        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
            alert('Произошла ошибка при создании новой игры. Пожалуйста, попробуйте еще раз.');
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

            tile.style.backgroundImage = `url("https://shabalin.sna.lol/static/puzzle_${this.currentDifficulty}.jpg")`;
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

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
            alert('Заполните все ячейки, чтобы проверить решение!');
            return;
        }

        try {
            const response = await fetch('https://shabalin.sna.lol/api/game/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grid: currentState,
                    difficulty: this.currentDifficulty
                })
            });

            const result = await response.json();

            if (result.solved) {
                this.stopTimer();
                this.isGameActive = false;
                const time = this.getElapsedTime();
                alert(`Поздравляем! Вы собрали пазл за ${time}!`);
            } else {
                alert('Пока не верно. Попробуйте еще!');
            }
        } catch (error) {
            console.error('Ошибка при проверке решения:', error);
            alert('Произошла ошибка при проверке решения. Пожалуйста, попробуйте еще раз.');
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});