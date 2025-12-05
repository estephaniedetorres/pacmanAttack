export default class InvaderProjectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3;
        this.height = 10;
    }

    draw(c) {
        c.fillStyle = 'lightblue';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update(c) {
        this.draw(c);
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}