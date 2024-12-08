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

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    placeMines(firstX, firstY) {
        let minesPlaced = 0;
        while (minesPlaced < this.MINES_COUNT) {
            const x = Math.floor(Math.random() * this.BOARD_SIZE);
            const y = Math.floor(Math.random() * this.BOARD_SIZE);

            // Предотвращаем размещение мины на первом клике и вокруг него
            if (x === firstX && y === firstY) continue;
            if (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1) continue;
            if (this.board[y][x] === -1) continue;

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
                        // Добавляем цвета для чисел
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

                this.boardElement.appendChild(cell);
            }
        }
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
            this.startTimer();
        }

        this.revealCell(x, y);
    }

    revealCell(x, y) {
        if (this.revealed.has(`${x},${y}`)) return;

        this.revealed.add(`${x},${y}`);

        if (this.board[y][x] === -1) {
            this.gameOver = true;
            this.revealAll();
            this.stopTimer();
            this.showGameOver(false);
            return;
        }

        if (this.board[y][x] === 0) {
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
        this.checkWin();
    }

    toggleFlag(x, y) {
        if (this.revealed.has(`${x},${y}`)) return;

        const key = `${x},${y}`;
        if (this.flagged.has(key)) {
            this.flagged.delete(key);
        } else {
            this.flagged.add(key);
        }

        this.renderBoard();
        this.updateMinesCount();
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

    checkWin() {
        const totalCells = this.BOARD_SIZE * this.BOARD_SIZE;
        const revealedCount = this.revealed.size;
        const remainingCells = totalCells - revealedCount;

        if (remainingCells === this.MINES_COUNT) {
            this.gameOver = true;
            this.stopTimer();
            this.showGameOver(true);
            this.saveStats(true);
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timerElement.textContent = `Время: ${elapsed}`;
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
        this.board = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.firstMove = true;
        this.currentFocus = { x: 0, y: 0 };
        this.stopTimer();
        this.timerElement.textContent = 'Время: 0';

        this.initializeBoard();
        this.renderBoard();
        this.updateMinesCount();
    }

    showGameOver(won) {
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');

        title.textContent = won ? 'Победа!' : 'Игра окончена';
        message.textContent = won ?
            'Поздравляем! Вы нашли все мины!' :
            'Вы попали на мину. Попробуйте еще раз!';

        this.gameOverModal.style.display = 'block';
    }

    hideGameOver() {
        this.gameOverModal.style.display = 'none';
    }

    saveStats(won) {
        const stats = JSON.parse(localStorage.getItem('minesweeperStats') || '[]');
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

        stats.push({
            date: new Date().toLocaleString(),
            result: won ? 'Победа' : 'Поражение',
            time: elapsed
        });

        localStorage.setItem('minesweeperStats', JSON.stringify(stats));
    }

    showStats() {
        const stats = JSON.parse(localStorage.getItem('minesweeperStats') || '[]');
        const content = document.getElementById('statsContent');

        if (stats.length === 0) {
            content.innerHTML = '<p>Нет сохраненных игр</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'stats-table';

            table.innerHTML = `
                <tr>
                    <th>Дата</th>
                    <th>Результат</th>
                    <th>Время</th>
                </tr>
                ${stats.map(game => `
                    <tr>
                        <td>${game.date}</td>
                        <td>${game.result}</td>
                        <td>${game.time} сек</td>
                    </tr>
                `).join('')}
            `;

            content.innerHTML = '';
            content.appendChild(table);
        }

        this.statsModal.style.display = 'block';
    }

    hideStats() {
        this.statsModal.style.display = 'none';
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('load', () => {
    new Minesweeper();
});