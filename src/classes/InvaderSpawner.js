import Invader from './Invader.js';

class InvaderSpawner {
    constructor(canvasWidth) {
        this.canvasWidth = canvasWidth;
        this.spawnCount = 0;
    }

    spawnWave(speedMultiplier = 1) {
        const invaders = [];
        const numInvaders = 5;

        for (let i = 0; i < numInvaders; i++) {
            // Random X position across the screen
            const x = Math.random() * (this.canvasWidth - 30);
            const y = -50 - (Math.random() * 200); // Spread them vertically above screen

            invaders.push(new Invader({
                position: { x, y },
                speedMultiplier
            }));
        }

        this.spawnCount++;

        return invaders;
    }
}

export default InvaderSpawner;