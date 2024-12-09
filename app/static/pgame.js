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
            this.puzzleGrid = document.getElementById('puzzleGrid');
            this.availableTiles = document.getElementById('availableTiles');
            this.newGameBtn = document.getElementById('newGame');
            this.checkBtn = document.getElementById('checkSolution');
            this.timerDisplay = document.getElementById('timer');
            this.difficultyBtns = document.querySelectorAll('.difficulty-btn');

            // Новые элементы для превью
            this.togglePreviewBtn = document.getElementById('togglePreview');
            this.previewSection = document.getElementById('previewSection');
            this.previewImage = document.getElementById('previewImage');

            // Проверяем наличие всех элементов
            if (!this.puzzleGrid || !this.availableTiles || !this.newGameBtn ||
                !this.checkBtn || !this.timerDisplay || !this.togglePreviewBtn ||
                !this.previewSection || !this.previewImage) {
                throw new Error('Не найдены необходимые элементы DOM');
            }

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
            isGameActive: false,
            previewVisible: false
        };

        // Инициализация игры
        this.createGrid();
        this.setupEventListeners();
        this.startNewGame();
    }


    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkBtn.addEventListener('click', () => this.checkSolution());

        // Добавляем обработчик для кнопки превью
        this.togglePreviewBtn.addEventListener('click', () => this.togglePreview());

        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state.isGameActive) {
                    const shouldRestart = window.confirm('Начать новую игру?');
                    if (!shouldRestart) return;
                }

                this.difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });
    }

    createGrid() {
        this.puzzleGrid.innerHTML = '';
        this.state.gridCells = [];

        const totalCells = this.config.gridHeight * this.config.gridWidth;

        for (let i = 0; i < totalCells; i++) {
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
            this.puzzleGrid.appendChild(cell);
        }
    }

    togglePreview() {
        this.state.previewVisible = !this.state.previewVisible;
        this.previewSection.style.display = this.state.previewVisible ? 'block' : 'none';
        this.togglePreviewBtn.textContent = this.state.previewVisible ? 'Скрыть картинку' : 'Показать картинку';
    }


    async startNewGame() {
        try {
            this.stopTimer();
            this.state.isGameActive = true;

            // Очищаем контейнер тайлов перед запросом
            this.availableTiles.innerHTML = '';

            const response = await fetch('https://shabalin.sna.lol/api/game/new');
            if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

            const gameData = await response.json();
            if (!gameData || !gameData.grid) {
                throw new Error('Некорректные данные от сервера');
            }

            // Обновляем превью изображение
            this.updatePreviewImage();

            this.createTiles(gameData.grid);
            this.startTimer();
        } catch (error) {
            console.error('Ошибка при создании новой игры:', error);
            this.state.isGameActive = false;
            alert('Не удалось начать новую игру: ' + error.message);
        }
    }

    updatePreviewImage() {
        // Обновляем источник изображения в соответствии с текущей сложностью
        this.previewImage.src = `/static/${this.state.currentDifficulty}puzzle.jpg`;
    }

    createTiles(grid) {
        // Очищаем контейнеры
        this.availableTiles.innerHTML = '';
        this.state.gridCells.forEach(cell => cell.innerHTML = '');
        this.state.tiles = [];

        // Создаем новые тайлы
        grid.forEach((position, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;

            const originalX = (position % this.config.gridWidth) * this.config.tileSize;
            const originalY = Math.floor(position / this.config.gridWidth) * this.config.tileSize;

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
            this.availableTiles.appendChild(tile);
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
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
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

            const response = await fetch('https://shabalin.sna.lol/api/game/check', {
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
                alert(`Поздравляем! Вы собрали пазл за ${this.timerDisplay.textContent}!`);
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