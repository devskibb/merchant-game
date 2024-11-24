import { GameState } from './GameManager.js';

export class Display {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = 80;
        this.height = 25;
        this.buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
        this.flashTimer = 0;
        this.isFlashing = false;
        this.flashColor = '';
        this.flashingTexts = [];
        
        this.colors = {
            green: '<span style="color: #00ff00;">',
            cyan: '<span style="color: #00ffff;">',
            red: '<span style="color: #ff0000;">',
            yellow: '<span style="color: #ffff00;">',
            white: '<span style="color: #ffffff;">',
            bgYellow: '<span style="background-color: #ffff00; color: #000000;">',
            end: '</span>',
            darkgreen: '<span style="color: #008800;">',
            darkred: '<span style="color: #880000;">',
            bgBlue: '<span style="background-color: #000088; color: #ffffff;">',
            bgDarkBlue: '<span style="background-color: #000066; color: #dddddd;">'
        };
    }

    setupInput(callback) {
        document.addEventListener('keydown', (event) => {
            let key = event.key.toUpperCase();
            
            // Map special keys
            switch(event.key) {
                case ' ':
                    key = 'SPACE';
                    break;
                case 'Escape':
                    key = 'ESC';
                    break;
                case 'Enter':
                    key = 'ENTER';
                    break;
                case 'Tab':
                    key = 'TAB';
                    event.preventDefault(); // Prevent tab from changing focus
                    break;
            }
            
            callback(key);
        });
    }

    clear() {
        this.buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    }

    draw(x, y, text) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const row = this.buffer[y];
            for (let i = 0; i < text.length && x + i < this.width; i++) {
                row[x + i] = text[i];
            }
        }
    }

    drawColoredText(x, y, text, color = 'white', useCustomFont = false) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const chars = text.split('');
            for (let i = 0; i < chars.length && x + i < this.width; i++) {
                const colorStyle = this.colors[color].slice(19, -2);
                if (useCustomFont) {
                    // Complete self-contained span with both color and custom font
                    this.buffer[y][x + i] = `<span style="color: ${colorStyle}; display: inline-block; width: 1ch;"><span style="font-family: 'chars'">${chars[i]}</span></span>`;
                } else {
                    // Single span for regular characters
                    this.buffer[y][x + i] = `<span style="color: ${colorStyle}">${chars[i]}</span>`;
                }
            }
        }
    }

    drawProgressBar(x, y, width, progress, color = 'white') {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const filledWidth = Math.floor(width * progress);
            const emptyWidth = width - filledWidth;
            
            let bar = '';
            for (let i = 0; i < filledWidth; i++) {
                bar += '█';
            }
            this.drawColoredText(x, y, bar, color);
            
            let emptyBar = '';
            for (let i = 0; i < emptyWidth; i++) {
                emptyBar += '░';
            }
            this.drawColoredText(x + filledWidth, y, emptyBar, 'white');
        }
    }

    drawBox(x, y, width, height, title = '') {
        // Draw corners (without spans)
        this.buffer[y][x] = '┌';
        this.buffer[y][x + width - 1] = '┐';
        this.buffer[y + height - 1][x] = '└';
        this.buffer[y + height - 1][x + width - 1] = '┘';

        // Draw horizontal borders (without spans)
        for (let i = 1; i < width - 1; i++) {
            this.buffer[y][x + i] = '─';
            this.buffer[y + height - 1][x + i] = '─';
        }

        // Draw vertical borders (without spans)
        for (let i = 1; i < height - 1; i++) {
            this.buffer[y + i][x] = '│';
            this.buffer[y + i][x + width - 1] = '│';
        }

        // Draw title if provided
        if (title) {
            const titleText = ` ${title} `;
            for (let i = 0; i < titleText.length; i++) {
                this.buffer[y][x + 2 + i] = titleText[i];
            }
        }
    }

    getItemSymbol(item) {
        switch(item) {
            case 'Cloaking Device': return '$';
            case 'Fake ID': return '%';
            case 'Quantum Dice': return '&';
            default: return '?';
        }
    }

    drawCustomers(customers, activeCustomerIndex) {
        const queueY = 5;      
        const leavingY = 4;    
        const infoY = 6;       
        const counterX = 34;
        const gameCounterX = 36;

        // Draw the stationary counter
        this.drawColoredText(counterX - 1, 4, '█', 'white');
        this.drawColoredText(counterX, 4, '█', 'white');
        this.drawColoredText(counterX + 1, 5, '█', 'white');
        this.drawColoredText(counterX - 1, 6, '█', 'white');
        this.drawColoredText(counterX, 6, '█', 'white');

        customers.forEach((customer, i) => {
            const isActive = i === activeCustomerIndex;
            const y = customer.isLeaving ? leavingY : Math.floor(customer.y);
            const isAtCounter = Math.abs(customer.x - gameCounterX) < 0.2;
            
            // Draw customer
            const color = customer.isUndercover && customer.warningTimer > 0 ? 'red' : 
                         customer.type === 'blob' ? 'green' :
                         customer.type === 'tentacle' ? 'cyan' : 'yellow';
            
            this.drawColoredText(Math.floor(customer.x), y, customer.symbol, color, true);

            // Draw messages
            if (customer.message) {
                const flashRate = Date.now() % 500 < 250;
                
                if (customer.isLeaving) {
                    // Leaving messages appear ABOVE the customer and flash
                    let messageColor = customer.messageColor || 'white';
                    if (messageColor === 'red') {
                        messageColor = flashRate ? 'red' : 'darkred';
                    } else if (messageColor === 'green') {
                        messageColor = flashRate ? 'green' : 'darkgreen';
                    }
                    
                    this.drawColoredText(Math.floor(customer.x), y - 1, 
                        customer.message, 
                        messageColor);
                } else if (isAtCounter) {
                    if (isActive || i === 1) {  // Show for active OR next customer
                        const messageStyle = customer.currentHaggle ? 
                            (flashRate ? 'bgBlue' : 'bgDarkBlue') : 
                            (customer.messageColor || 'white');
                            
                        this.drawColoredText(Math.floor(customer.x), infoY, 
                            customer.message, 
                            messageStyle);
                    }
                }
            }
            
            // Show patience bar - simplified condition
            if (!customer.isLeaving && isAtCounter) {
                const patiencePercent = 1 - (customer.currentWaitTime / customer.patience);
                this.drawProgressBar(Math.floor(customer.x), infoY + 1, 20, patiencePercent, 
                    patiencePercent > 0.6 ? 'green' : 
                    patiencePercent > 0.3 ? 'yellow' : 'red');
            }
        });
    }

    drawInventoryItem(x, y, text, isSelected) {
        if (isSelected) {
            // Draw with yellow background, maintaining proper width
            const paddedText = text.padEnd(20, ' '); // Adjusted padding
            for (let i = 0; i < paddedText.length; i++) {
                this.buffer[y][x + i] = `${this.colors.bgYellow}${paddedText[i]}${this.colors.end}`;
            }
        } else {
            this.drawColoredText(x, y, text, 'cyan');
        }
    }

    drawShop(gameState) {
        this.clear();
        
        // Main border
        this.drawBox(0, 0, this.width, this.height, 'BLACK MARKET BAZAAR');
        
        // Inventory section
        this.drawBox(1, 1, 30, 8, 'INVENTORY');
        this.drawInventoryItem(3, 3, '$ - Cloaking Device', 
            gameState.selectedItem === 'Cloaking Device');
        this.drawInventoryItem(3, 4, '% - Fake ID', 
            gameState.selectedItem === 'Fake ID');
        this.drawInventoryItem(3, 5, '& - Quantum Dice', 
            gameState.selectedItem === 'Quantum Dice');
        
        // Customer section
        this.drawBox(32, 1, 47, 8, 'CUSTOMERS');
        if (gameState.customers && gameState.customers.length > 0) {
            this.drawCustomers(gameState.customers, gameState.activeCustomerIndex);
        }
        
        // Status section
        this.drawBox(1, 9, 78, 3, 'STATUS');
        if (gameState) {
            const moneyText = `Money: $${gameState.money}`;
            const dayText = `Day: ${gameState.dayNumber}`;
            const timeText = `Time: ${gameState.timeDisplay || "3:00"}`;
            const repText = `Reputation: ${gameState.reputation}`;
            
            let x = 3;
            const y = 10;
            
            // Check if money or reputation are flashing
            const flashingMoney = this.flashingTexts.find(f => f.text === 'money');
            const flashingRep = this.flashingTexts.find(f => f.text === 'reputation');
            
            this.drawColoredText(x, y, moneyText, flashingMoney ? flashingMoney.color : 'white');
            x += moneyText.length + 2;
            this.drawColoredText(x, y, dayText, 'white');
            x += dayText.length + 2;
            this.drawColoredText(x, y, timeText, 'white');
            x += timeText.length + 2;
            this.drawColoredText(x, y, repText, flashingRep ? flashingRep.color : 'white');
        }
        
        // Controls section
        this.drawBox(1, 12, 78, 5, 'CONTROLS');
        this.drawColoredText(3, 13, 
            '[1-3] Select Item  [SPACE] Sell  [H] Hide  [B] Bribe  [ESC] Menu', 
            'white');

        // Handle flash effect
        if (this.isFlashing) {
            this.flashTimer -= 1/30;
            if (this.flashTimer > 0) {
                this.drawFlashEffect(this.flashColor);
            } else {
                this.isFlashing = false;
            }
        }

        // Update flashing texts
        this.flashingTexts = this.flashingTexts.filter(flash => {
            flash.timer -= 1/30;
            return flash.timer > 0;
        });

        this.render();
    }

    drawFlashEffect(color) {
        // Draw a border of symbols around the customer area
        const x = 32;
        const y = 1;
        const width = 47;
        const height = 8;
        
        for (let i = x; i < x + width; i++) {
            this.drawColoredText(i, y, '!', color);
            this.drawColoredText(i, y + height - 1, '!', color);
        }
        for (let i = y; i < y + height; i++) {
            this.drawColoredText(x, i, '!', color);
            this.drawColoredText(x + width - 1, i, '!', color);
        }
    }

    startFlash(color, duration = 0.5) {
        this.isFlashing = true;
        this.flashTimer = duration;
        this.flashColor = color;
    }

    flashText(text, color, duration = 0.5) {
        this.flashingTexts.push({
            text,
            color,
            timer: duration
        });
    }

    render() {
        if (!this.container) return;
        const html = this.buffer.map(row => row.join('')).join('\n');
        this.container.innerHTML = html;
    }

    drawEndOfDay(stats) {
        this.clear();
        
        // Draw main box
        this.drawBox(0, 0, 80, 25, 'END OF DAY ' + stats.dayNumber);
        
        // Draw summary section
        const startY = 4;
        this.drawColoredText(30, startY, "=== DAY SUMMARY ===", 'yellow');
        
        this.drawColoredText(20, startY + 2, `Sales Made: ${stats.salesMade}`, 'white');
        this.drawColoredText(20, startY + 3, `Money Earned: $${stats.moneyEarned}`, 'green');
        this.drawColoredText(20, startY + 4, `Interest Paid: $${stats.interestPaid}`, 'red');
        this.drawColoredText(20, startY + 5, `Net Profit: $${stats.netProfit}`, 
            stats.netProfit >= 0 ? 'green' : 'red');
        
        this.drawColoredText(20, startY + 7, `Customers Served: ${stats.customersServed}`, 'white');
        this.drawColoredText(20, startY + 8, `Customers Lost: ${stats.customersFailed}`, 'red');
        
        // Draw current status
        this.drawColoredText(20, startY + 10, "=== CURRENT STATUS ===", 'yellow');
        this.drawColoredText(20, startY + 12, `Money: $${stats.currentMoney}`, 'green');
        this.drawColoredText(20, startY + 13, `Outstanding Debt: $${stats.currentDebt}`, 'red');
        
        // Draw controls
        this.drawColoredText(25, startY + 16, "Press [ENTER] to continue", 'white');
    }

    drawBetweenDays(stats) {
        this.clear();
        
        // Draw main layout
        this.drawBox(0, 0, 80, 25, `NIGHT MARKET - DAY ${stats.dayNumber}`);
        
        // Draw status bar at top
        this.drawColoredText(2, 1, `Money: $${stats.money}`, 'green');
        this.drawColoredText(25, 1, `Debt: $${stats.debt}`, 'red');
        
        // Draw main sections
        this.drawBox(1, 3, 38, 15, 'MARKET PRICES');
        this.drawBox(41, 3, 78, 15, 'NEWS FEED');
        
        // Sample market prices (placeholder)
        this.drawColoredText(3, 5, "Today's Market Prices:", 'yellow');
        this.drawColoredText(3, 7, "Cloaking Device: $500-600", 'white');
        this.drawColoredText(3, 8, "Fake ID: $300-400", 'white');
        this.drawColoredText(3, 9, "Quantum Dice: $700-800", 'white');
        
        // Sample news items (placeholder)
        this.drawColoredText(43, 5, "Latest News:", 'yellow');
        this.drawColoredText(43, 7, "- Police cracking down on fake IDs", 'red');
        this.drawColoredText(43, 8, "- New casino increases dice demand", 'green');
        this.drawColoredText(43, 9, "- Smuggler caught with cloaking devices", 'white');
        
        // Draw controls section
        this.drawBox(1, 19, 78, 5, 'CONTROLS');
        this.drawColoredText(3, 20, "[R] Restock Items", 'white');
        this.drawColoredText(30, 20, "[U] Upgrades", 'white');
        this.drawColoredText(55, 20, "[ENTER] Start Next Day", 'white');
        
        // Draw warning if money is low
        if (stats.money < 1000) {
            this.drawColoredText(20, 17, "WARNING: Low on funds!", 'red');
        }
    }
}