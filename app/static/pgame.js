class PuzzleGame {
    constructor() {
        // Сначала инициализируем элементы
        this.elementsLoaded = this.initElements();

        // Только если элементы успешно загружены, инициализируем игру
        if (this.elementsLoaded) {
            this.initGame();
        } else {
            console.error('Не удалось инициализировать игру: отсутствуют необходимые элементы DOM');
        }
    }

    initElements() {
        try {
            // Получаем все необходимые DOM элементы
            this.elements = {
                availableTiles: document.getElementById('availableTiles'),
                puzzleGrid: document.getElementById('puzzleGrid'),
                newGameBtn: document.getElementById('newGame'),
                checkBtn: document.getElementById('checkSolution'),
                timerDisplay: document.getElementById('timer'),
                difficultyBtns: document.querySelectorAll('.difficulty-btn')
            };

            // Проверяем наличие всех обязательных элементов
            const requiredElements = ['availableTiles', 'puzzleGrid', 'newGameBtn', 'checkBtn', 'timerDisplay'];
            const missingElements = requiredElements.filter(key => !this.elements[key]);

            if (missingElements.length > 0) {
                console.error(`Не найдены следующие элементы: ${missingElements.join(', ')}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Ошибка инициализации элементов:', error);
            return false;
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
            currentDifficulty: 'easy', // Изменено с 'e' на более понятное значение
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

        // Устанавливаем начальную сложность
        const defaultDifficultyBtn = this.elements.difficultyBtns[0];
        if (defaultDifficultyBtn) {
            defaultDifficultyBtn.classList.add('selected');
            this.state.currentDifficulty = defaultDifficultyBtn.dataset.difficulty;
        }

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

        // Очищаем сетку
        puzzleGrid.innerHTML = '';
        this.state.gridCells = [];

        // Создаем ячейки сетки
        for (let i = 0; i < gridHeight * gridWidth; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            this.setupCellEventListeners(cell);

            this.state.gridCells.push(cell);
            puzzleGrid.appendChild(cell);
        }
    }

    setupCellEventListeners(cell) {
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
    }

    async startNewGame() {
        if (!this.elementsLoaded) {
            console.error('Нельзя начать новую игру: элементы не инициализированы');
            return;
        }

        try {
            this.stopTimer();
            this.state.isGameActive = true;

            const response = await fetch(`/api/game/new?difficulty=${this.state.currentDifficulty}`);
            if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

            const gameData = await response.json();
            this.createTiles(gameData.grid);
            this.startTimer();
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
            this.state.isGameActive = false;
            alert('Не удалось начать новую игру. Пожалуйста, попробуйте позже.');
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

            this.setupTileEventListeners(tile);

            this.state.tiles.push(tile);
            availableTiles.appendChild(tile);
        });
    }

    setupTileEventListeners(tile) {
        tile.addEventListener('dragstart', () => {
            this.state.draggedTile = tile;
            tile.classList.add('dragging');
        });

        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
            this.state.draggedTile = null;
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
        if (!this.state.isGameActive) {
            console.warn('Игра не активна');
            return;
        }

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

            if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

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
            alert('Произошла ошибка при проверке решения. Пожалуйста, попробуйте еще раз.');
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});