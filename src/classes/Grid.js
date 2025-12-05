import Invader from './Invader.js';

class Grid {
    constructor(level, canvasWidth, speedMultiplier = 1) {
        // Random starting X position across the screen
        this.position = {
            x: Math.random() * (canvasWidth - 400),
            y: -100
        };

        // Random horizontal direction (left or right)
        const horizontalDirection = Math.random() > 0.5 ? 1 : -1;
        const horizontalSpeed = (1 + Math.random() * 2) * horizontalDirection;
        const verticalSpeed = (0.8 + Math.random() * 0.5);

        this.velocity = { x: horizontalSpeed, y: verticalSpeed };

        this.invaders = [];

        const rows = 5;
        const cols = 10;
        const invaderWidth = 30;
        const invaderHeight = 30;

        // Create invaders in formation
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.invaders.push(new Invader({
                    position: {
                        x: this.position.x + x * (invaderWidth + 10),
                        y: this.position.y + y * (invaderHeight + 10)
                    }
                }));
            }
        }

        console.log(`Grid spawned at (${this.position.x.toFixed(0)}, ${this.position.y}) with velocity (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)}), speed: ${speedMultiplier.toFixed(2)}x`);
    }

    update(canvasWidth) {
        // Always move down and horizontally
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Bounce off left and right edges
        if (this.position.x <= 0 || this.position.x + this.width >= canvasWidth) {
            this.velocity.x = -this.velocity.x;
        }

        // Update all invaders to follow grid position
        this.invaders.forEach((invader, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;
            const invaderWidth = 30;
            const invaderHeight = 30;

            invader.position.x = this.position.x + col * (invaderWidth + 10);
            invader.position.y = this.position.y + row * (invaderHeight + 10);
        });
    }

    get width() {
        return 10 * 40; // 10 invaders * (30px width + 10px gap)
    }
}

export default Grid;