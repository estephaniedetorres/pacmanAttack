import Invader from './Invader.js';
import InvaderProjectile from './InvaderProjectile.js';

const MOTHERSHIP_SCALE = 1.5;

export default class Mothership extends Invader {
    constructor(canvasWidth) {
        super({ position: { x: canvasWidth / 2 - 150, y: 80 } });

        const image = new Image();
        image.src = './img/invader.jpeg';
        image.onload = () => {
            this.image = image;
            this.width = image.width * MOTHERSHIP_SCALE;
            this.height = image.height * MOTHERSHIP_SCALE;
            this.velocity = { x: 2.5, y: 0 };
            this.health = 25;
            this.cooldown = 60;
        };
    }

    update(c, canvasWidth) {
        if (!this.image) return;

        this.position.x += this.velocity.x;

        if (this.position.x + this.width >= canvasWidth) {
            this.position.x = canvasWidth - this.width;
            this.velocity.x = -Math.abs(this.velocity.x);
            this.position.y += 10;
        } else if (this.position.x <= 0) {
            this.position.x = 0;
            this.velocity.x = Math.abs(this.velocity.x);
            this.position.y += 10;
        }

        const lowHealth = this.health <= 5;
        if (lowHealth) {
            const flash = Math.sin(Date.now() / 100) > 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 0, 0, 0.1)';
            c.save();
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
            c.fillStyle = flash;
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
            c.restore();
            this.position.x += (Math.random() - 0.5) * 2;
            this.position.y += (Math.random() - 0.5) * 1;
        } else {
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }

        const barWidth = this.width;
        const barHeight = 6;
        const healthRatio = Math.max(this.health / 20, 0);
        c.fillStyle = 'red';
        c.fillRect(this.position.x, this.position.y - 10, barWidth, barHeight);
        c.fillStyle = 'lime';
        c.fillRect(this.position.x, this.position.y - 10, barWidth * healthRatio, barHeight);
        c.strokeStyle = 'black';
        c.strokeRect(this.position.x, this.position.y - 10, barWidth, barHeight);
    }

    shoot(invaderProjectiles) {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.width / 2, y: this.position.y + this.height },
            velocity: { x: 0, y: 4 }
        }));
        this.cooldown = 40;
    }
}