import { Game } from './game/Game.js';

class Display {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = 80;
        this.height = 25;
        this.buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    }

    clear() {
        this.buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    }

    draw(x, y, text) {
        if (typeof text === 'string') {
            for (let i = 0; i < text.length; i++) {
                if (x + i >= 0 && x + i < this.width && y >= 0 && y < this.height) {
                    this.buffer[y][x + i] = text[i];
                }
            }
        } else {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.buffer[y][x] = text;
            }
        }
    }

    drawBox(x, y, width, height, title = '') {
        // Draw corners
        this.draw(x, y, '┌');
        this.draw(x + width - 1, y, '┐');
        this.draw(x, y + height - 1, '└');
        this.draw(x + width - 1, y + height - 1, '┘');

        // Draw horizontal borders
        for (let i = 1; i < width - 1; i++) {
            this.draw(x + i, y, '─');
            this.draw(x + i, y + height - 1, '─');
        }

        // Draw vertical borders
        for (let i = 1; i < height - 1; i++) {
            this.draw(x, y + i, '│');
            this.draw(x + width - 1, y + i, '│');
        }

        // Draw title if provided
        if (title) {
            this.draw(x + 2, y, `─ ${title} `);
            for (let i = title.length + 4; i < width - 1; i++) {
                this.draw(x + i, y, '─');
            }
        }
    }

    drawCustomer(x, y, number, patience) {
        this.draw(x, y, `Customer #${number}`);
        this.draw(x, y + 1, `Patience: [${this.getPatientBar(patience)}]`);
    }

    getPatientBar(percentage) {
        const length = 20;
        const filled = Math.floor(percentage * length);
        return '='.repeat(filled) + ' '.repeat(length - filled);
    }

    drawStatus(money, day, time) {
        this.draw(3, 17, `Money: $${money}  Day: ${day}  Time: ${time}`);
    }

    drawControls() {
        this.draw(3, 20, '[1-9] Select Item  [SPACE] Sell  [TAB] Next Customer  [ESC] Menu');
    }

    render() {
        this.container.textContent = this.buffer.map(row => row.join('')).join('\n');
    }

    drawShop() {
        this.clear();
        
        // Draw main layout
        this.drawBox(0, 0, 80, 25, 'BLACK MARKET BAZAAR');
        
        // Draw sections
        this.drawBox(1, 1, 30, 15, 'INVENTORY');
        this.drawBox(32, 1, 47, 15, 'CUSTOMERS');
        this.drawBox(1, 16, 78, 3, 'STATUS');
        this.drawBox(1, 19, 78, 5, 'CONTROLS');

        // Draw sample customers
        this.drawCustomer(34, 2, 1, 0.75);
        this.drawCustomer(34, 4, 2, 0.5);

        // Draw status
        this.drawStatus(1000, 1, '2:30');

        // Draw controls
        this.drawControls();
        
        this.render();
    }
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    // Add your input handling here
    console.log(event.key);
});

// Initialize and start the game
const game = new Game();
game.start(); 