export const ItemTier = {
    BASIC: 'basic',
    EXOTIC: 'exotic',
    LEGENDARY: 'legendary'
};

export class Inventory {
    constructor(capacity = 20) {
        this.capacity = capacity;
        this.items = new Map();
    }

    addItem(item, quantity = 1) {
        if (this.items.size >= this.capacity && !this.items.has(item)) {
            return false;
        }

        const currentQuantity = this.items.get(item) || 0;
        this.items.set(item, currentQuantity + quantity);
        return true;
    }

    getItemCount(item) {
        return this.items.get(item) || 0;
    }

    removeItem(item, quantity = 1) {
        if (!this.items.has(item) || this.items.get(item) < quantity) {
            return false;
        }

        const newQuantity = this.items.get(item) - quantity;
        if (newQuantity <= 0) {
            this.items.delete(item);
        } else {
            this.items.set(item, newQuantity);
        }
        return true;
    }
} 