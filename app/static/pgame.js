class PuzzleGame {
    constructor() {
        this.initElements();
        if (this.elementsLoaded) {
            this.initGame();
        }
    }

    initElements() {
        try {
            // Получаем все необходимые DOM элементы
            const elements = {
                availableTiles: document.getElementById('availableTiles'),
                puzzleGrid: document.getElementById('puzzleGrid'),
                newGameBtn: document.getElementById('newGame'),
                checkBtn: document.getElementById('checkSolution'),
                timerDisplay: document.getElementById('timer'),
                difficultyBtns: document.querySelectorAll('.difficulty-btn')
            };

            // Проверяем наличие всех элементов
            const missingElements = [];
            for (const [key, element] of Object.entries(elements)) {
                if (!element && key !== 'difficultyBtns') {
                    missingElements.push(key);
                }
            }

            if (missingElements.length > 0) {
                throw new Error(`Не найдены следующие элементы: ${missingElements.join(', ')}`);
            }

            // Если все элементы найдены, сохраняем их
            this.elements = elements;
            this.elementsLoaded = true;
        } catch (error) {
            console.error('Ошибка инициализации элементов:', error);
            this.elementsLoaded = false;
        }
    }

    initGame() {
        // Конфигурация игры
        this.config = {
            tileSize: 50,
            gridWidth: 9,
            gridHeight: 6
        };

        // Состояние игры
        this.state = {
            currentDifficulty: 'e',
            tiles: [],
            gridCells: [],
            draggedTile: null,
            timerInterval: null,
            startTime: null,
            isGameActive: false
        };

        // Инициализация игры
        this.createGrid();
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        const { newGameBtn, checkBtn, difficultyBtns } = this.elements;

        newGameBtn.addEventListener('click', () => this.startNewGame());
        checkBtn.addEventListener('click', () => this.checkSolution());

        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state.isGameActive) {
                    const shouldRestart = window.confirm('Начать новую игру?');
                    if (!shouldRestart) return;
                }

                difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });
    }

    createGrid() {
        const { puzzleGrid } = this.elements;
        const { gridWidth, gridHeight } = this.config;

        puzzleGrid.innerHTML = '';
        this.state.gridCells = [];

        for (let i = 0; i < gridHeight * gridWidth; i++) {
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

                if (this.state.draggedTile && !cell.hasChildNodes()) {
                    cell.appendChild(this.state.draggedTile);
                    this.state.draggedTile = null;
                    this.checkAutoComplete();
                }
            });

            this.state.gridCells.push(cell);
            puzzleGrid.appendChild(cell);
        }
    }

    async startNewGame() {
        try {
            this.stopTimer();
            this.state.isGameActive = true;

            const response = await fetch(`/api/game/new?difficulty=${this.state.currentDifficulty}`);
            if (!response.ok) throw new Error('Ошибка сервера');

            const gameData = await response.json();
            this.createTiles(gameData.grid);
            this.startTimer();
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
            this.state.isGameActive = false;
        }
    }

    createTiles(grid) {
        const { availableTiles } = this.elements;
        const { tileSize, gridWidth } = this.config;

        // Очищаем контейнеры
        availableTiles.innerHTML = '';
        this.state.gridCells.forEach(cell => cell.innerHTML = '');
        this.state.tiles = [];

        // Создаем новые тайлы
        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;

            const originalX = (position % gridWidth) * tileSize;
            const originalY = Math.floor(position / gridWidth) * tileSize;

            tile.style.backgroundImage = `url('/static/${this.state.currentDifficulty}puzzle.jpg')`;
            tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

            tile.dataset.correctPosition = position;

            tile.addEventListener('dragstart', () => {
                this.state.draggedTile = tile;
                tile.classList.add('dragging');
            });

            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
                this.state.draggedTile = null;
            });

            this.state.tiles.push(tile);
            availableTiles.appendChild(tile);
        });
    }

    startTimer() {
        this.stopTimer();
        this.state.startTime = Date.now();
        this.state.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.state.startTime) return;

        const { timerDisplay } = this.elements;
        const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    getCurrentState() {
        return this.state.gridCells.map(cell => {
            const tile = cell.firstChild;
            return tile ? parseInt(tile.dataset.correctPosition) : null;
        });
    }

    checkAutoComplete() {
        const isGridFull = this.state.gridCells.every(cell => cell.hasChildNodes());
        if (isGridFull) {
            this.checkSolution();
        }
    }

    async checkSolution() {
        try {
            const currentState = this.getCurrentState();

            if (currentState.includes(null)) {
                alert('Заполните все ячейки!');
                return;
            }

            const response = await fetch('/api/game/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grid: currentState,
                    difficulty: this.state.currentDifficulty
                })
            });

            if (!response.ok) throw new Error('Ошибка сервера');

            const result = await response.json();

            if (result.solved) {
                this.stopTimer();
                this.state.isGameActive = false;
                alert(`Поздравляем! Вы собрали пазл за ${this.elements.timerDisplay.textContent}!`);
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