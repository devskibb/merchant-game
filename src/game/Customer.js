export class Customer {
    constructor() {
        this.type = this.generateType();
        this.patience = Math.random() * 6 + 9;
        this.haggleProbability = Math.random();
        this.currentWaitTime = 0;
        this.desiredItems = [];
        this.isUndercover = Math.random() < 0.15;
        this.message = '';
        this.warningTimer = 0;
        this.symbol = this.getSymbolForType();
        
        this.x = 75;
        this.targetX = Math.min(76, this.width - 4);
        this.desiredItem = '';
        this.isLeaving = false;
        this.y = 6;
        this.targetY = 6;
        this.hasStartedLeaving = false;
        this.haggleAttempts = Math.floor(Math.random() * 3) + 1;
        this.totalHaggles = this.haggleAttempts;
        this.possibleKeys = ['Z', 'X', 'C', 'V', 'B'];
        this.currentHaggle = null;
        this.haggleTimer = 0;
        this.basePrice = 100;
        this.currentPriceMultiplier = 1.0;
    }

    generateType() {
        const types = ['blob', 'tentacle', 'crystal'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getSymbolForType() {
        switch(this.type) {
            case 'blob': return 'B';
            case 'tentacle': return 'A';
            case 'crystal': return 'C';
            default: return '?';
        }
    }

    generateMessage(item) {
        const messages = [
            `Need ${item}, quick!`,
            `Got any ${item}?`,
            `${item}, no questions asked...`,
            `Looking for ${item}...`
        ];
        this.message = messages[Math.floor(Math.random() * messages.length)];
    }

    update(deltaTime) {
        this.currentWaitTime += deltaTime;
        this.warningTimer = Math.max(0, this.warningTimer - deltaTime);
        
        if (this.x > this.targetX) {
            this.x -= deltaTime * 20;  // Move left at 20 units per second
        }
        
        if (this.currentWaitTime >= this.patience && !this.hasStartedLeaving) {
            this.isLeaving = true;
            this.hasStartedLeaving = true;
            this.message = "I'm out of here!";
            this.messageColor = 'red';
            this.targetY = 4;
            this.targetX = 85;
            return false;
        }
        
        if (this.x <= this.targetX && !this.isLeaving) {
            if (this.y < this.targetY) this.y += 0.2;
            if (this.y > this.targetY) this.y -= 0.2;
        }
        
        if (this.isLeaving) {
            this.x += deltaTime * 20;  // Move right when leaving
        }
        
        return !this.isLeaving;
    }

    startHaggle() {
        if (this.haggleAttempts > 0) {
            const randomKey = this.possibleKeys[Math.floor(Math.random() * this.possibleKeys.length)];
            
            this.currentHaggle = {
                key: randomKey,
                timeLimit: 2.0,
                priceReduction: 0.2
            };
            
            this.haggleTimer = this.currentHaggle.timeLimit;
            
            const haggleMessages = this.haggleAttempts === this.totalHaggles ?
                [`First offer: [${randomKey}]`, `That's too high! [${randomKey}]`] :
                this.haggleAttempts === 1 ?
                [`Final offer! [${randomKey}]`, `Last chance! [${randomKey}]`] :
                [`Still too high! [${randomKey}]`, `Not good enough! [${randomKey}]`];
            
            this.message = haggleMessages[Math.floor(Math.random() * haggleMessages.length)];
            return true;
        }
        return false;
    }

    updateHaggle(deltaTime, keyPressed) {
        if (this.currentHaggle) {
            this.haggleTimer -= deltaTime;
            
            if (keyPressed) {
                if (keyPressed === this.currentHaggle.key) {
                    this.haggleAttempts--;
                    this.currentHaggle = null;
                    
                    if (this.haggleAttempts > 0) {
                        this.message = "Better... but still too high!";
                        this.startHaggle();
                        return { success: true, priceMultiplier: this.currentPriceMultiplier, continue: true };
                    } else {
                        this.message = "Fine, deal!";
                        return { success: true, priceMultiplier: this.currentPriceMultiplier, continue: false };
                    }
                } else {
                    this.message = "Ha! I knew you'd cave!";
                    this.currentPriceMultiplier *= (1 - this.currentHaggle.priceReduction);
                    this.currentHaggle = null;
                    this.haggleAttempts = 0;
                    return { success: false, priceMultiplier: this.currentPriceMultiplier, continue: false };
                }
            }
        }
        return null;
    }
} 