export default class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        this.opacity = 1;
        this.position = { x: 0, y: 0 };
        this.width = 50;
        this.height = 50;
        this.image = null;

        const image = new Image();
        image.src = './img/spaceship.png';
        image.onload = () => {
            const scale = 0.15;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: this.canvas.width / 2 - this.width / 2,
                y: this.canvas.height - this.height - 20
            };
        };

        image.onerror = () => {
            console.warn('Failed to load spaceship image, using fallback');
            this.width = 50;
            this.height = 50;
            this.position = {
                x: this.canvas.width / 2 - this.width / 2,
                y: this.canvas.height - this.height - 20
            };
        };
    }

    draw(c) {
        if (this.image) {
            c.save();
            c.globalAlpha = this.opacity;
            c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
            c.rotate(this.rotation);
            c.translate(-this.position.x - this.width / 2, -this.position.y - this.height / 2);
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
            c.restore();
        } else {
            // Draw a fallback triangle if image not loaded
            c.save();
            c.globalAlpha = this.opacity;
            c.fillStyle = 'white';
            c.beginPath();
            c.moveTo(this.position.x + this.width / 2, this.position.y);
            c.lineTo(this.position.x, this.position.y + this.height);
            c.lineTo(this.position.x + this.width, this.position.y + this.height);
            c.closePath();
            c.fill();
            c.restore();
        }
    }

    update(c) {
        this.draw(c);
        this.position.x += this.velocity.x;
    }
}