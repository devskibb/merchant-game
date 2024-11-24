export const GameState = {
    PREPARATION: 'preparation',
    TRADING: 'trading',
    END_OF_DAY: 'endOfDay',
    BETWEEN_DAYS: 'betweenDays'
};

export class GameManager {
    constructor() {
        this.currentState = GameState.TRADING;
        this.dayNumber = 1;
        this.tradingTimeLimit = 60;
        this.currentTime = 0;
        this.money = 1000;
        this.reputation = 50;
        this.debt = 2000;
        this.interestRate = 0.1;
        
        this.dayStats = {
            salesMade: 0,
            moneyEarned: 0,
            customersServed: 0,
            customersFailed: 0
        };
    }

    update(deltaTime) {
        if (this.currentState === GameState.TRADING) {
            this.currentTime += deltaTime;
            
            const timeRemaining = Math.max(0, this.tradingTimeLimit - this.currentTime);
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            this.timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.currentTime >= this.tradingTimeLimit) {
                this.endTradingDay();
            }
        }
    }

    startTrading() {
        this.currentState = GameState.TRADING;
        this.currentTime = 0;
        this.resetDayStats();
    }

    endTradingDay() {
        this.currentState = GameState.END_OF_DAY;
        
        const interestDue = Math.ceil(this.debt * this.interestRate);
        this.debt += interestDue;
        this.money -= interestDue;
        
        this.daySummary = {
            salesMade: this.dayStats.salesMade,
            moneyEarned: this.dayStats.moneyEarned,
            interestPaid: interestDue,
            customersServed: this.dayStats.customersServed,
            customersFailed: this.dayStats.customersFailed,
            netProfit: this.dayStats.moneyEarned - interestDue
        };
    }

    startNextDay() {
        this.dayNumber++;
        this.currentState = GameState.BETWEEN_DAYS;
    }

    resetDayStats() {
        this.dayStats = {
            salesMade: 0,
            moneyEarned: 0,
            customersServed: 0,
            customersFailed: 0
        };
    }

    recordSale(amount) {
        this.dayStats.salesMade++;
        this.dayStats.moneyEarned += amount;
        this.dayStats.customersServed++;
    }

    recordFailedCustomer() {
        this.dayStats.customersFailed++;
    }
}
