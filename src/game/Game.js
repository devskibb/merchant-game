import { Display } from './Display.js';
import { GameManager, GameState } from './GameManager.js';
import { Inventory } from './Inventory.js';
import { ITEMS, getRandomItem, getItemByKey } from './ItemDatabase.js';
import { Customer } from './Customer.js';

export class Game {
    constructor() {
        this.display = new Display();
        this.gameManager = new GameManager();
        this.playerInventory = new Inventory();
        this.customers = [];
        this.activeCustomerIndex = 0;
        this.spawnTimer = 0.2;
        this.maxCustomers = 5;
        this.selectedItem = null;
        this.queueStartX = 39;
        this.queueSpacing = 2;
        this.isHaggling = false;
        this.counterX = 36;
        this.counterY = 5;
        this.moveSpeed = 0.8;
        this.counterThreshold = 0.2;
        
        this.initializeItems();
        this.setupInput();
        this.gameManager.startTrading();
    }

    setupInput() {
        this.display.setupInput((key) => this.handleInput(key));
    }

    handleInput(key) {
        if (this.isHaggling) {
            this.handleHaggleInput(key);
            return;
        }

        switch(key) {
            case 'ENTER':
                if (this.gameManager.currentState === GameState.PREPARATION) {
                    this.gameManager.startTrading();
                }
                break;
            case 'TAB':
                if (this.customers.length > 0) {
                    this.activeCustomerIndex = (this.activeCustomerIndex + 1) % this.customers.length;
                }
                break;
            case '1':
                this.selectedItem = 'Cloaking Device';
                break;
            case '2':
                this.selectedItem = 'Fake ID';
                break;
            case '3':
                this.selectedItem = 'Quantum Dice';
                break;
            case 'SPACE':
                this.tryToSell();
                break;
        }
    }

    handleHaggleInput(key) {
        const customer = this.customers[this.activeCustomerIndex];
        if (!customer) return;
        
        console.log('=== HAGGLE INPUT ===');
        console.log('Key pressed:', key);
        console.log('Customer position:', customer.x);
        console.log('Is front customer:', this.activeCustomerIndex === 0);
        
        const result = customer.updateHaggle(1/30, key);
        if (result) {
            console.log('Haggle result:', result);
            if (!result.continue) {
                this.isHaggling = false;
                if (result.success) {
                    console.log('Haggle successful, completing sale');
                    const finalPrice = Math.floor(customer.basePrice * result.priceMultiplier);
                    this.gameManager.money += finalPrice;
                    this.completeSale(customer);
                } else {
                    console.log('Haggle failed');
                    this.failSale(customer);
                }
            }
        }
    }

    tryToSell() {
        // First, find the front non-leaving customer
        const frontNonLeavingIndex = this.customers.findIndex(c => !c.isLeaving);
        if (frontNonLeavingIndex === -1) return;  // No valid customers
        
        // Update active customer index to the front non-leaving customer
        this.activeCustomerIndex = frontNonLeavingIndex;
        
        const customer = this.customers[this.activeCustomerIndex];
        if (!customer || !this.selectedItem) return;

        console.log('=== SALE ATTEMPT ===');
        console.log('Active customer position:', customer.x);
        console.log('Counter position:', this.counterX);
        console.log('Distance to counter:', Math.abs(customer.x - this.counterX));
        console.log('Counter threshold:', this.counterThreshold);
        console.log('Is at counter?:', Math.abs(customer.x - this.counterX) <= this.counterThreshold);
        console.log('Is front customer:', frontNonLeavingIndex === 0);

        // Check: Must be at counter
        const distanceToCounter = Math.abs(customer.x - this.counterX);
        if (distanceToCounter > this.counterThreshold) {
            console.log('BLOCKED: Customer not at counter');
            console.log('Distance:', distanceToCounter);
            console.log('Threshold:', this.counterThreshold);
            return;
        }

        // Third check: Must have correct item
        if (customer.desiredItem !== this.selectedItem) {
            console.log('BLOCKED: Wrong item offered');
            customer.patience *= 0.5;
            this.gameManager.reputation -= 2;
            return;
        }

        // If we get here, we can proceed with sale/haggle
        const patiencePercent = 1 - (customer.currentWaitTime / customer.patience);
        const canStartHaggling = patiencePercent > 0.5;
        
        if (canStartHaggling && !customer.currentHaggle && 
            Math.random() < customer.haggleProbability && 
            customer.haggleAttempts > 0) {
            if (customer.startHaggle()) {
                this.isHaggling = true;
                console.log('Starting haggle');
                return;
            }
        }
        
        // If no haggle, proceed with normal sale
        this.completeSale(customer);
    }

    completeSale(customer) {
        console.log('=== COMPLETING SALE ===');
        console.log('Customer position:', customer.x);
        console.log('Final price:', customer.basePrice);
        
        const price = customer.basePrice;
        this.gameManager.money += price;
        this.gameManager.reputation += 1;
        
        this.display.flashText('money', 'green');
        this.display.flashText('reputation', 'green');
        
        customer.isLeaving = true;
        customer.hasStartedLeaving = true;
        customer.targetX = 85;
        
        console.log('Customer marked as leaving, new target:', customer.targetX);
        
        // Immediately check if next customer should become active
        const nextCustomer = this.customers[1];
        if (nextCustomer && Math.abs(nextCustomer.x - this.counterX) < this.counterThreshold) {
            this.activeCustomerIndex = 1;
        }
    }

    failSale(customer) {
        console.log('=== FAILING SALE ===');
        console.log('Customer position:', customer.x);
        
        this.gameManager.reputation -= 5;
        
        this.display.flashText('reputation', 'red');
        this.display.startFlash('red');
        
        customer.isLeaving = true;
        customer.hasStartedLeaving = true;
        customer.targetX = 85;
        
        console.log('Customer marked as leaving, new target:', customer.targetX);
        
        // Immediately check if next customer should become active
        const nextCustomer = this.customers[1];
        if (nextCustomer && Math.abs(nextCustomer.x - this.counterX) < this.counterThreshold) {
            this.activeCustomerIndex = 1;
        }
    }

    update(deltaTime) {
        this.gameManager.update();

        if (this.gameManager.currentState === GameState.TRADING) {
            console.log('Trading state active, customers:', this.customers.length);
            
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0 && this.customers.length < this.maxCustomers) {
                console.log('Spawning new customer');
                const newCustomer = new Customer();
                newCustomer.x = 80;
                newCustomer.y = this.counterY;
                newCustomer.targetY = this.counterY;
                
                if (this.customers.length === 0) {
                    newCustomer.targetX = this.counterX;
                } else {
                    const lastCustomerX = Math.max(...this.customers.map(c => c.targetX));
                    newCustomer.targetX = lastCustomerX + this.queueSpacing;
                }
                
                const availableItems = ['Cloaking Device', 'Fake ID', 'Quantum Dice'];
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                newCustomer.generateMessage(randomItem);
                newCustomer.desiredItem = randomItem;
                
                this.customers.push(newCustomer);
                this.spawnTimer = Math.random() * 0.2 + 1.5;
            }

            // First, update queue positions if needed
            let frontCustomerLeaving = this.customers[0]?.isLeaving || false;
            if (frontCustomerLeaving && this.customers.length > 1) {
                // Move everyone forward immediately when front customer starts leaving
                for (let i = 1; i < this.customers.length; i++) {
                    const customer = this.customers[i];
                    if (!customer.isLeaving) {
                        if (i === 1) {
                            customer.targetX = this.counterX;
                        } else {
                            customer.targetX = this.queueStartX + ((i - 2) * this.queueSpacing);
                        }
                    }
                }
            }

            // Then update individual customers
            for (let i = this.customers.length - 1; i >= 0; i--) {
                const customer = this.customers[i];
                
                if (customer.isLeaving) {
                    customer.x += this.moveSpeed;
                    if (customer.x >= 85) {
                        this.customers.splice(i, 1);
                    }
                    customer.update(deltaTime);  // Keep updating leaving customers
                } else {
                    // Smooth movement towards target
                    const distanceToTarget = customer.targetX - customer.x;
                    if (Math.abs(distanceToTarget) > 0.1) {
                        const moveAmount = Math.min(
                            Math.abs(distanceToTarget),
                            this.moveSpeed
                        ) * Math.sign(distanceToTarget);
                        
                        customer.x += moveAmount;
                    } else {
                        customer.x = customer.targetX;
                        // Make front customer active when at counter
                        if (i === 0 && Math.abs(customer.x - this.counterX) < this.counterThreshold) {
                            this.activeCustomerIndex = 0;
                        }
                    }

                    // Update ANY customer that has reached their position
                    if (Math.abs(customer.x - customer.targetX) < this.counterThreshold) {
                        customer.update(deltaTime);
                    }
                }
            }

            // Remove any leaving customers that are off screen
            this.customers = this.customers.filter(c => c.x < 85);
        }

        this.render();
    }

    render() {
        this.display.drawShop({
            customers: this.customers,
            activeCustomerIndex: this.activeCustomerIndex,
            selectedItem: this.selectedItem,
            money: this.gameManager.money,
            dayNumber: this.gameManager.dayNumber,
            reputation: this.gameManager.reputation
        });
    }

    initializeItems() {
        this.playerInventory.addItem('Cloaking Device', 3);
        this.playerInventory.addItem('Fake ID', 5);
        this.playerInventory.addItem('Quantum Dice', 2);
    }

    start() {
        let lastTime = Date.now();
        setInterval(() => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
        }, 1000/30);
    }

    removeCustomer(index) {
        this.customers.splice(index, 1);
        this.updateQueuePositions();
        
        if (this.customers.length === 0) {
            this.activeCustomerIndex = 0;
        } else {
            this.activeCustomerIndex = Math.min(this.activeCustomerIndex, this.customers.length - 1);
        }
    }
} 