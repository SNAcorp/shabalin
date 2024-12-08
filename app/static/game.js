class MinesweeperEvents {
    static START = 'mine.start';
    static STEP = 'mine.step';
    static END = 'mine.end';
    static FLAG = 'mine.flag';
    static TIMER_TICK = 'mine.timer';
}

class Minesweeper {
    constructor() {
        this.BOARD_SIZE = 12;
        this.MINES_COUNT = 20;
        this.board = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.firstMove = true;
        this.startTime = null;
        this.timerInterval = null;
        this.currentFocus = { x: 0, y: 0 };

        this.initializeBoard();
        this.initializeDOM();
        this.initializeEventListeners();
        this.initializeCustomEventHandlers();
        this.initializeTouchControls();
    }

    initializeBoard() {
        this.board = Array(this.BOARD_SIZE).fill().map(() =>
            Array(this.BOARD_SIZE).fill(0)
        );
    }

    initializeDOM() {
        this.boardElement = document.getElementById('gameBoard');
        this.timerElement = document.getElementById('timer');
        this.minesElement = document.getElementById('mines');
        this.statsModal = document.getElementById('statsModal');
        this.gameOverModal = document.getElementById('gameOverModal');

        this.renderBoard();
        this.updateMinesCount();
    }

    initializeEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
        document.getElementById('showStats').addEventListener('click', () => this.showStats());
        document.getElementById('closeStats').addEventListener('click', () => this.hideStats());
        document.getElementById('restartGame').addEventListener('click', () => {
            this.hideGameOver();
            this.resetGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideStats();
                this.hideGameOver();
            } else {
                this.handleKeyboard(e);
            }
        });

        this.boardElement.addEventListener('contextmenu', (e) => e.preventDefault());

        // Обработчики кликов по модальным окнам
        this.statsModal.addEventListener('click', (e) => {
            if (e.target === this.statsModal) {
                this.hideStats();
            }
        });

        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) {
                this.hideGameOver();
            }
        });
    }

    initializeCustomEventHandlers() {
        document.addEventListener(MinesweeperEvents.START, (e) => {
            console.log('Game started');
            this.startTimer();
        });

        document.addEventListener(MinesweeperEvents.STEP, (e) => {
            const { x, y, value } = e.detail;
            console.log(`Step at (${x}, ${y}) with value ${value}`);

            if (value === -1) {
                this.handleGameOver(false);
            } else {
                this.checkWin();
            }
        });

        document.addEventListener(MinesweeperEvents.END, (e) => {
            const { won, time } = e.detail;
            console.log(`Game ended. Won: ${won}, Time: ${time}s`);
            this.saveStats(won);
            this.stopTimer();
            this.showGameOver(won);
        });

        document.addEventListener(MinesweeperEvents.FLAG, (e) => {
            const { x, y, flagged } = e.detail;
            console.log(`Flag ${flagged ? 'placed' : 'removed'} at (${x}, ${y})`);
            this.updateMinesCount();
        });

        document.addEventListener(MinesweeperEvents.TIMER_TICK, (e) => {
            const { time } = e.detail;
            this.timerElement.textContent = `Время: ${time}`;
        });
    }

    initializeTouchControls() {
        let touchStartTime;
        let touchTimeout;
        let lastTapTime = 0;
        let isTouchMoving = false;

        this.boardElement.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            isTouchMoving = false;
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);

            touchTimeout = setTimeout(() => {
                if (!isTouchMoving && element?.classList.contains('cell')) {
                    const x = parseInt(element.dataset.x);
                    const y = parseInt(element.dataset.y);
                    this.toggleFlag(x, y);
                }
            }, 500);
        });

        this.boardElement.addEventListener('touchmove', (e) => {
            isTouchMoving = true;
            e.preventDefault();
        }, { passive: false });

        this.boardElement.addEventListener('touchend', (e) => {
            clearTimeout(touchTimeout);
            if (isTouchMoving) return;

            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);

            if (element?.classList.contains('cell')) {
                const x = parseInt(element.dataset.x);
                const y = parseInt(element.dataset.y);
                const currentTime = Date.now();

                if (currentTime - lastTapTime < 300) {
                    this.toggleFlag(x, y);
                } else if (Date.now() - touchStartTime < 500) {
                    this.handleClick(x, y);
                }

                lastTapTime = currentTime;
            }
        });
    }

    dispatchGameEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    placeMines(firstX, firstY) {
        let minesPlaced = 0;
        const safeCells = new Set();

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const ny = firstY + dy;
                const nx = firstX + dx;
                if (ny >= 0 && ny < this.BOARD_SIZE && nx >= 0 && nx < this.BOARD_SIZE) {
                    safeCells.add(`${nx},${ny}`);
                }
            }
        }

        while (minesPlaced < this.MINES_COUNT) {
            const x = Math.floor(Math.random() * this.BOARD_SIZE);
            const y = Math.floor(Math.random() * this.BOARD_SIZE);

            if (safeCells.has(`${x},${y}`) || this.board[y][x] === -1) continue;

            this.board[y][x] = -1;
            minesPlaced++;
        }

        this.calculateNumbers();
    }

    calculateNumbers() {
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                if (this.board[y][x] === -1) continue;

                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny < 0 || ny >= this.BOARD_SIZE || nx < 0 || nx >= this.BOARD_SIZE) continue;
                        if (this.board[ny][nx] === -1) count++;
                    }
                }
                this.board[y][x] = count;
            }
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (this.revealed.has(`${x},${y}`)) {
                    cell.classList.add('revealed');
                    const value = this.board[y][x];
                    if (value === -1) {
                        cell.classList.add('mine');
                    } else if (value > 0) {
                        cell.textContent = value;
                        cell.style.color = this.getNumberColor(value);
                    }
                }

                if (this.flagged.has(`${x},${y}`)) {
                    cell.classList.add('flagged');
                }

                if (x === this.currentFocus.x && y === this.currentFocus.y) {
                    cell.classList.add('focused');
                }

                cell.addEventListener('click', () => this.handleClick(x, y));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(x, y);
                });

                fragment.appendChild(cell);
            }
        }

        this.boardElement.appendChild(fragment);
    }

    getNumberColor(number) {
        const colors = [
            null,
            '#0000FF', // 1 - синий
            '#008000', // 2 - зеленый
            '#FF0000', // 3 - красный
            '#000080', // 4 - темно-синий
            '#800000', // 5 - бордовый
            '#008080', // 6 - сине-зеленый
            '#000000', // 7 - черный
            '#808080'  // 8 - серый
        ];
        return colors[number];
    }

    handleClick(x, y) {
        if (this.gameOver || this.flagged.has(`${x},${y}`)) return;

        if (this.firstMove) {
            this.placeMines(x, y);
            this.firstMove = false;
            this.dispatchGameEvent(MinesweeperEvents.START, { x, y });
        }

        this.revealCell(x, y);
    }

    revealCell(x, y) {
        const key = `${x},${y}`;
        if (this.revealed.has(key) || this.flagged.has(key)) return;

        this.revealed.add(key);
        const value = this.board[y][x];

        this.dispatchGameEvent(MinesweeperEvents.STEP, { x, y, value });

        if (value === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny < 0 || ny >= this.BOARD_SIZE || nx < 0 || nx >= this.BOARD_SIZE) continue;
                    this.revealCell(nx, ny);
                }
            }
        }

        this.renderBoard();
    }

    toggleFlag(x, y) {
        if (this.gameOver || this.revealed.has(`${x},${y}`)) return;

        const key = `${x},${y}`;
        const flagged = !this.flagged.has(key);

        if (flagged && this.flagged.size < this.MINES_COUNT) {
            this.flagged.add(key);
        } else if (!flagged) {
            this.flagged.delete(key);
        }

        this.dispatchGameEvent(MinesweeperEvents.FLAG, { x, y, flagged });
        this.renderBoard();
    }

    handleKeyboard(e) {
        if (this.gameOver) return;

        switch (e.key) {
            case 'ArrowUp':
                this.currentFocus.y = Math.max(0, this.currentFocus.y - 1);
                break;
            case 'ArrowDown':
                this.currentFocus.y = Math.min(this.BOARD_SIZE - 1, this.currentFocus.y + 1);
                break;
            case 'ArrowLeft':
                this.currentFocus.x = Math.max(0, this.currentFocus.x - 1);
                break;
            case 'ArrowRight':
                this.currentFocus.x = Math.min(this.BOARD_SIZE - 1, this.currentFocus.x + 1);
                break;
            case ' ':
            case 'Enter':
                if (e.ctrlKey) {
                    this.toggleFlag(this.currentFocus.x, this.currentFocus.y);
                } else {
                    this.handleClick(this.currentFocus.x, this.currentFocus.y);
                }
                e.preventDefault();
                break;
        }

        this.renderBoard();
    }

    revealAll() {
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                this.revealed.add(`${x},${y}`);
            }
        }
        this.renderBoard();
    }

    handleGameOver(won) {
        this.gameOver = true;
        const time = Math.floor((Date.now() - this.startTime) / 1000);

        if (!won) {
            this.revealAll();
        }

        this.dispatchGameEvent(MinesweeperEvents.END, {
            won,
            time,
            revealed: this.revealed.size,
            totalMines: this.MINES_COUNT
        });
    }

    checkWin() {
        const totalCells = this.BOARD_SIZE * this.BOARD_SIZE;
        const revealedCount = this.revealed.size;
        const remainingCells = totalCells - revealedCount;

        if (remainingCells === this.MINES_COUNT) {
            this.handleGameOver(true);
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.dispatchGameEvent(MinesweeperEvents.TIMER_TICK, { time: elapsed });
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateMinesCount() {
        const remainingMines = this.MINES_COUNT - this.flagged.size;
        this.minesElement.textContent = `Мины: ${remainingMines}`;
    }

    resetGame() {
        this.stopTimer();
        this.board = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.firstMove = true;
        this.currentFocus = { x: 0, y: 0 };
        this.timerElement.textContent = 'Время: 0';

        this.initializeBoard();
        this.renderBoard();
        this.updateMinesCount();
    }

    showGameOver(won) {
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

        title.textContent = won ? 'Победа!' : 'Игра окончена';
        message.textContent = won ?
            `Поздравляем! Вы нашли все мины за ${elapsedTime} секунд!` :
            'Вы попали на мину. Попробуйте еще раз!';

        this.gameOverModal.style.display = 'block';
        requestAnimationFrame(() => {
            this.gameOverModal.classList.add('active');
        });
    }

    hideGameOver() {
        this.gameOverModal.classList.remove('active');
        setTimeout(() => {
            this.gameOverModal.style.display = 'none';
        }, 300);
    }

    saveStats(won) {
        try {
            const stats = JSON.parse(localStorage.getItem('minesweeperStats') || '[]');
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

            stats.push({
                date: new Date().toLocaleString(),
                result: won ? 'Победа' : 'Поражение',
                time: elapsed
            });

            // Ограничиваем количество сохраняемых игр
            if (stats.length > 50) {
                stats.shift();
            }

            localStorage.setItem('minesweeperStats', JSON.stringify(stats));
        } catch (error) {
            console.error('Ошибка при сохранении статистики:', error);
        }
    }

    showStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('minesweeperStats') || '[]');
            const content = document.getElementById('statsContent');

            if (stats.length === 0) {
                content.innerHTML = '<p>Нет сохраненных игр</p>';
            } else {
                const totalGames = stats.length;
                const wins = stats.filter(game => game.result === 'Победа').length;
                const bestTime = Math.min(...stats.filter(game => game.result === 'Победа').map(game => game.time));

                const summaryHTML = `
                    <div class="modal-header">
                        <h2>Статистика игр</h2>
                    </div>
                    <div class="modal-body">
                        <div class="stats-summary">
                            <p>Всего игр: ${totalGames}</p>
                            <p>Побед: ${wins} (${Math.round(wins/totalGames * 100)}%)</p>
                            ${wins > 0 ? `<p>Лучшее время: ${bestTime} сек</p>` : ''}
                        </div>
                        <div class="stats-content">
                            <ul class="game-list">
                                ${stats.slice().reverse().map(game => `
                                    <li class="game-item">
                                        <span class="game-date">${game.date}</span>
                                        <span class="game-result ${game.result === 'Победа' ? 'win' : 'lose'}">${game.result}</span>
                                        <span class="game-time">${game.time} сек</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="closeStats">Закрыть</button>
                    </div>
                `;

                content.innerHTML = summaryHTML;

                // Переназначаем обработчик для новой кнопки
                document.getElementById('closeStats').addEventListener('click', () => this.hideStats());
            }

            this.statsModal.style.display = 'block';
            requestAnimationFrame(() => {
                this.statsModal.classList.add('active');
            });
        } catch (error) {
            console.error('Ошибка при загрузке статистики:', error);
            content.innerHTML = '<p>Ошибка при загрузке статистики</p>';
        }
    }

    hideStats() {
        this.statsModal.classList.remove('active');
        setTimeout(() => {
            this.statsModal.style.display = 'none';
        }, 300);
    }
}

// Инициализация игры и добавление слушателей событий
document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper();

    // Примеры использования пользовательских событий
    document.addEventListener(MinesweeperEvents.START, (e) => {
        console.log('Новая игра началась!');
    });

    document.addEventListener(MinesweeperEvents.STEP, (e) => {
        const { x, y, value } = e.detail;
        console.log(`Ход: (${x}, ${y}) = ${value}`);
    });

    document.addEventListener(MinesweeperEvents.END, (e) => {
        const { won, time, revealed } = e.detail;
        console.log(`Игра завершена! ${won ? 'Победа' : 'Поражение'} за ${time} секунд. Открыто клеток: ${revealed}`);
    });

    document.addEventListener(MinesweeperEvents.FLAG, (e) => {
        const { x, y, flagged } = e.detail;
        console.log(`Флаг ${flagged ? 'установлен' : 'снят'} на (${x}, ${y})`);
    });
});