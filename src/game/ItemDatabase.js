export const ITEMS = {
    CLOAKING_DEVICE: {
        id: 'CLOAKING_DEVICE',
        name: 'Cloaking Device',
        symbol: '$',
        basePrice: 100,
        description: 'Military grade cloaking technology',
        rarity: 0.3,
        legalStatus: 'illegal',
    },
    FAKE_ID: {
        id: 'FAKE_ID',
        name: 'Fake ID',
        symbol: '%',
        basePrice: 50,
        description: 'Forged identification documents',
        rarity: 0.5,
        legalStatus: 'illegal',
    },
    QUANTUM_DICE: {
        id: 'QUANTUM_DICE',
        name: 'Quantum Dice',
        symbol: '&',
        basePrice: 75,
        description: 'Probability-manipulating gaming equipment',
        rarity: 0.4,
        legalStatus: 'illegal',
    }
};

export function getRandomItem() {
    const allowedItems = [
        ITEMS.CLOAKING_DEVICE,
        ITEMS.FAKE_ID,
        ITEMS.QUANTUM_DICE
    ];
    return allowedItems[Math.floor(Math.random() * allowedItems.length)];
}

export function getItemByKey(keyNumber) {
    return Object.values(ITEMS)[keyNumber - 1] || null;
} 