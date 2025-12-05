export default class ScorePopup {
    constructor({ position, text, color = 'yellow', life = 60 }) {
        this.position = { x: position.x, y: position.y };
        this.text = text;
        this.color = color;
        this.opacity = 1;
        this.life = life;
        this.vy = -1.2;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.size = 22;
    }

    draw(c) {
        c.save();
        c.globalAlpha = this.opacity;
        c.fillStyle = this.color;
        c.font = `bold ${this.size}px monospace`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(0,0,0,0.9)';
        c.shadowBlur = 6;
        c.lineWidth = 3;
        c.strokeStyle = 'rgba(0,0,0,0.9)';
        c.strokeText(this.text, this.position.x, this.position.y);
        c.fillText(this.text, this.position.x, this.position.y);
        c.restore();
    }

    update(c) {
        this.position.x += this.vx;
        this.position.y += this.vy;
        this.life--;
        if (this.life < 20) this.opacity -= 0.04;
        this.draw(c);
    }

    isDead() {
        return this.life <= 0 || this.opacity <= 0;
    }
}