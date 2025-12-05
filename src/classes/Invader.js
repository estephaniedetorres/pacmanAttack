import InvaderProjectile from './InvaderProjectile.js';

const INVADER_SCALE = 0.28;
const INVADER_SPACING = 48;
const ORBITER_MODE = true;

export default class Invader {
    constructor({ position, speedMultiplier = 1 }) {
        // Each invader has its own random horizontal direction
        const horizontalDirection = (Math.random() - 0.5) * 2; // Random between -2 and 2
        const verticalSpeed = 0.5 + Math.random() * 0.5; // Random descent speed

        this.velocity = {
            x: horizontalDirection * speedMultiplier,
            y: verticalSpeed * speedMultiplier
        };

        this.width = 30;
        this.height = 30;
        this.position = { x: position.x, y: position.y };

        // Load invader image
        this.image = new Image();
        this.image.src = './img/invader.png';
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    draw(c) {
        if (this.imageLoaded) {
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
        } else {
            // Fallback while image loads
            c.fillStyle = 'red';
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    update(c, canvasWidth) {
        this.draw(c);

        // Move based on own velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Bounce off left and right edges
        if (this.position.x <= 0 || this.position.x + this.width >= canvasWidth) {
            this.velocity.x = -this.velocity.x;
        }
    }

    shoot(invaderProjectiles) {
        invaderProjectiles.push(new InvaderProjectile({
            position: {
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height
            },
            velocity: { x: 0, y: 5 }
        }));
    }
}