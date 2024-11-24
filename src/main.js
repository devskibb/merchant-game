import { Game } from './game/Game.js';

const game = new Game();
game.start();

// Handle clean exit
process.on('SIGINT', () => {
    console.clear();
    process.exit();
}); 