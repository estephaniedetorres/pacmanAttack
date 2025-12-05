// Configuration constants and settings for the game
export const INVADER_SCALE = 0.28;
export const MOTHERSHIP_SCALE = 1.5;
export const INVADER_SPACING = 48;
export const ORBITER_MODE = true;
export const maxLevels = 3;

export const levelConfig = {
    1: { name: 'EASY', gridSpeed: 2, invaderRows: [2, 3], invaderCols: [5, 8], spawnRate: 120, invaderCount: 10 },
    2: { name: 'MODERATE', gridSpeed: 3, invaderRows: [3, 5], invaderCols: [7, 10], spawnRate: 80, invaderCount: 22 },
    3: { name: 'HARD', gridSpeed: 4, invaderRows: [5, 7], invaderCols: [8, 12], spawnRate: 60, invaderCount: 40 }
};

export const powers = {
    shield: { active: false, cooldown: 0, duration: 3000, key: 's', ready: true },
    rapidFire: { active: false, cooldown: 0, duration: 5000, key: 'f', ready: true },
};

export function activatePower(type) {
    const power = powers[type];
    if (!power.ready) return;

    power.active = true;
    power.ready = false;

    if (type === 'shield') {
        setTimeout(() => {
            power.active = false;
            startCooldown(type, 10000);
        }, power.duration);
    } else if (type === 'rapidFire') {
        setTimeout(() => {
            power.active = false;
            startCooldown(type, 15000);
        }, power.duration);
    }
}

export function startCooldown(type, ms) {
    powers[type].cooldown = ms;
    const interval = setInterval(() => {
        powers[type].cooldown -= 1000;
        if (powers[type].cooldown <= 0) {
            clearInterval(interval);
            powers[type].ready = true;
        }
    }, 1000);
}