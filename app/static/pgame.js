class PuzzleGame {
    constructor() {
        this.init();
    }

    init() {
        try {
            // Инициализация DOM элементов
            this.initializeElements();

            // Базовые настройки
            this.settings = {
                tileSize: 50,
                gridWidth: 9,
                gridHeight: 6,
                currentDifficulty: 'e'
            };

            // Состояние игры
            this.state = {
                tiles: [],
                gridCells: [],
                draggedTile: null,
                timerInterval: null,
                startTime: null,
                isGameActive: false
            };

            // Запуск игры
            this.initializeGame();
        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
        }
    }

    initializeElements() {
        // Инициализация элементов с проверками
        this.elements = {
            tiles: document.getElementById('availableTiles'),
            grid: document.getElementById('puzzleGrid'),
            newGame: document.getElementById('newGame'),
            check: document.getElementById('checkSolution'),
            timer: document.getElementById('timer'),
            difficultyBtns: document.querySelectorAll('.difficulty-btn')
        };

        // Проверка наличия всех необходимых элементов
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element && key !== 'difficultyBtns')
            .map(([key]) => key);

        if (missingElements.length > 0) {
            throw new Error(`Отсутствуют элементы: ${missingElements.join(', ')}`);
        }
    }

    initializeGame() {
        this.createGrid();
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        // Обработчики для кнопок
        this.elements.newGame.addEventListener('click', () => this.startNewGame());
        this.elements.check.addEventListener('click', () => this.checkSolution());

        // Обработчики для кнопок сложности
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state.isGameActive) {
                    const shouldRestart = window.confirm('Начать новую игру?');
                    if (!shouldRestart) return;
                }

                this.elements.difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.settings.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });

        // Обработчик для сетки
        this.elements.grid.addEventListener('dragover', (e) => e.preventDefault());
    }

    createGrid() {
        const { gridWidth, gridHeight } = this.settings;
        this.elements.grid.innerHTML = '';
        this.state.gridCells = [];

        const totalCells = gridWidth * gridHeight;

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            // Обработчики для drag&drop
            this.setupCellDragAndDrop(cell);

            this.state.gridCells.push(cell);
            this.elements.grid.appendChild(cell);
        }
    }

    setupCellDragAndDrop(cell) {
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
        try {
            this.stopTimer();
            this.state.isGameActive = true;

            const response = await fetch(`/api/game/new?difficulty=${this.settings.currentDifficulty}`);
            if (!response.ok) throw new Error('Ошибка сервера');

            const gameData = await response.json();
            await this.createTiles(gameData.grid);
            this.startTimer();
        } catch (error) {
            console.error('Ошибка запуска новой игры:', error);
            alert('Не удалось начать новую игру. Попробуйте еще раз.');
            this.state.isGameActive = false;
        }
    }

    async createTiles(grid) {
        try {
            const { tileSize, gridWidth } = this.settings;
            this.elements.tiles.innerHTML = '';
            this.state.gridCells.forEach(cell => cell.innerHTML = '');
            this.state.tiles = [];

            grid.forEach((position, index) => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.draggable = true;

                // Позиция в изображении
                const originalX = (position % gridWidth) * tileSize;
                const originalY = Math.floor(position / gridWidth) * tileSize;

                // Установка фона
                tile.style.backgroundImage = `url('/static/${this.settings.currentDifficulty}puzzle.jpg')`;
                tile.style.backgroundPosition = `-${originalX}px -${originalY}px`;

                tile.dataset.correctPosition = position;

                // Обработчики перетаскивания
                this.setupTileDragAndDrop(tile);

                this.state.tiles.push(tile);
                this.elements.tiles.appendChild(tile);
            });
        } catch (error) {
            console.error('Ошибка создания тайлов:', error);
            throw error;
        }
    }

    setupTileDragAndDrop(tile) {
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

        const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        this.elements.timer.textContent = `${minutes}:${seconds}`;
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
                    difficulty: this.settings.currentDifficulty
                })
            });

            if (!response.ok) throw new Error('Ошибка сервера');

            const result = await response.json();

            if (result.solved) {
                this.stopTimer();
                this.state.isGameActive = false;
                alert(`Поздравляем! Вы собрали пазл за ${this.elements.timer.textContent}!`);
            } else {
                alert('Пока не верно. Попробуйте еще!');
            }
        } catch (error) {
            console.error('Ошибка проверки решения:', error);
            alert('Не удалось проверить решение. Попробуйте еще раз.');
        }
    }
}

// Запуск игры после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PuzzleGame();
    } catch (error) {
        console.error('Ошибка запуска игры:', error);
        alert('Не удалось запустить игру. Пожалуйста, обновите страницу.');
    }
});