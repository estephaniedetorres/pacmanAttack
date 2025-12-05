import Player from './classes/Player.js';
import Projectile from './classes/Projectile.js';
import Particle from './classes/Particle.js';
import InvaderSpawner from './classes/InvaderSpawner.js';
import Mothership from './classes/Mothership.js';
import ScorePopup from './classes/ScorePopup.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;


// Game State
let game = { over: false, active: false };
let score = 0;
let lives = 3;
let frames = 0;
let animationId;
let lastShotTime = 0;
const shotCooldown = 200;
let invadersKilled = 0;
const MOTHERSHIP_INTERVAL = 10;
let lastLives = null;
let waveCount = 0;
let lastMothershipSpawn = 0;

// Arrays
const projectiles = [];
const invaders = []; // Changed from grids to individual invaders
const invaderProjectiles = [];
const particles = [];
const scorePopups = [];

// Spawner
let invaderSpawner;

// Player
const player = new Player(canvas);

// Powers System
const powers = {
    shield: { active: false, cooldown: 0, duration: 3000, key: 's', ready: true },
    rapidFire: { active: false, cooldown: 0, duration: 5000, key: 'f', ready: true },
};

function activatePower(type) {
    const power = powers[type];
    if (!power.ready) return;

    switch (type) {
        case 'shield':
            power.active = true;
            power.ready = false;
            player.opacity = 0.5;
            audio.shield.currentTime = 0;
            audio.shield.play();
            setTimeout(() => {
                power.active = false;
                player.opacity = 1;
                startCooldown(type, 10000);
            }, power.duration);
            break;

        case 'rapidFire':
            power.active = true;
            power.ready = false;
            setTimeout(() => {
                power.active = false;
                startCooldown(type, 15000);
            }, power.duration);
            break;
    }
}

function startCooldown(type, ms) {
    powers[type].cooldown = ms;
    const interval = setInterval(() => {
        powers[type].cooldown -= 1000;
        if (powers[type].cooldown <= 0) {
            clearInterval(interval);
            powers[type].ready = true;
        }
    }, 1000);
}

// DOM Elements
const startMenu = document.querySelector('#startMenu');
const playBtn = document.querySelector('#playBtn');
const instructionsBtn = document.querySelector('#instructionsBtn');
const instructionsModal = document.querySelector('#instructionsModal');
const closeInstructions = document.querySelector('#closeInstructions');
const restartBtn = document.querySelector('#restartBtn');
const menuBtn = document.querySelector('#menuBtn');

// Username Modal
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const startGameBtn = document.getElementById('startGameBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

// Story Modal
const storyBtn = document.getElementById('storyBtn');
const storyModal = document.getElementById('storyModal');
const startFromStory = document.getElementById('startFromStory');
const skipStory = document.getElementById('skipStory');

let currentSlide = 1;
const totalSlides = 7;

const sfx = {
    shoot: './audio/shoot.mp3',
    shield: './audio/shield.mp3',
    background: './audio/bg.mp3',
    gameOver: './audio/gameover.mp3',
    levelUp: './audio/levelup.mp3'
};

// Preload audio
const audio = {};
for (const key in sfx) {
    audio[key] = new Audio(sfx[key]);
    // Increase volume for better audibility
    if (key === 'background') {
        audio[key].volume = 0.7; // Background music louder
    } else if (key === 'shoot') {
        audio[key].volume = 0.2; // Keep shoot sound quieter
    } else {
        audio[key].volume = 0.5; // Other sounds at medium volume
    }
    if (key === 'background') audio[key].loop = true;
}

function updateHUD(score, lives, invadersKilled) {
    const scoreEl = document.querySelector('#scoreEl');
    const killsDisplay = document.querySelector('#levelDisplay');
    const livesBar = document.querySelector('#livesBar');

    if (scoreEl) scoreEl.textContent = score;

    if (killsDisplay) {
        const killsUntilMothership = MOTHERSHIP_INTERVAL - (invadersKilled % MOTHERSHIP_INTERVAL);
        if (window.mothership) {
            killsDisplay.textContent = ``;
            killsDisplay.style.color = '#ff0000';
            killsDisplay.style.animation = 'blink 0.5s infinite';
        } else if (killsUntilMothership <= 3) {
            killsDisplay.textContent = `Kills: ${invadersKilled} | Boss in ${killsUntilMothership}!`;
            killsDisplay.style.color = '#ffaa00';
            killsDisplay.style.animation = 'blink 1s infinite';
        } else {
            killsDisplay.textContent = `Kills: ${invadersKilled} | Next boss: ${killsUntilMothership}`;
            killsDisplay.style.color = '#ffffff';
            killsDisplay.style.animation = 'none';
        }
    }

    if (livesBar) {
        const maxLives = 3;
        const ratio = Math.max(lives / maxLives, 0);

        const barWidth = 50;
        const barHeight = 8;

        const off = document.createElement('canvas');
        off.width = barWidth;
        off.height = barHeight;
        const ctx = off.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, barWidth, barHeight);

        const gradient = ctx.createLinearGradient(0, 0, barWidth, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#00ff00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, barWidth, barHeight);

        const maskWidth = barWidth * (1 - ratio);
        ctx.fillStyle = '#000';
        ctx.fillRect(barWidth - maskWidth, 0, maskWidth, barHeight);

        if (lastLives !== null && lives < lastLives) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(0, 0, barWidth, barHeight);
            setTimeout(() => updateHUD(score, lives, invadersKilled), 100);
        }
        lastLives = lives;

        const scaled = document.createElement('canvas');
        const sctx = scaled.getContext('2d');
        const scale = 3;
        scaled.width = barWidth * scale;
        scaled.height = barHeight * scale;
        sctx.imageSmoothingEnabled = false;
        sctx.drawImage(off, 0, 0, barWidth * scale, barHeight * scale);

        livesBar.innerHTML = '';
        livesBar.style.display = 'inline-block';
        livesBar.style.width = `${barWidth * scale}px`;
        livesBar.style.height = `${barHeight * scale}px`;
        livesBar.style.border = '2px solid #333';
        livesBar.style.background = '#000';
        livesBar.style.imageRendering = 'pixelated';
        livesBar.appendChild(scaled);
    }
}

function drawPowersHUD(c, powers, canvasWidth) {
    const y = 30; // distance from top
    const lines = [
        'POWERS:',
        `SHIELD [S] ${powers.shield.active ? 'ACTIVE' : powers.shield.ready ? 'READY' : `${Math.ceil(powers.shield.cooldown / 1000)}s`}`,
        `RAPIDFIRE [F] ${powers.rapidFire.active ? 'ACTIVE' : powers.rapidFire.ready ? 'READY' : `${Math.ceil(powers.rapidFire.cooldown / 1000)}s`}`
    ];

    c.save();
    c.fillStyle = 'white';
    c.font = '16px monospace';

    let offsetY = 0;
    lines.forEach((line, index) => {
        // Set color per line
        if (line.startsWith('SHIELD')) {
            c.fillStyle = powers.shield.active ? '#00ff00' : powers.shield.ready ? 'lightgreen' : '#666666';
        } else if (line.startsWith('RAPIDFIRE')) {
            c.fillStyle = powers.rapidFire.active ? '#ff0000' : powers.rapidFire.ready ? 'lightgreen' : '#666666';
        } else {
            c.fillStyle = 'white';
        }

        const textWidth = c.measureText(line).width;
        const x = canvasWidth / 2 - textWidth / 2; // center
        c.fillText(line, x, y + offsetY);
        offsetY += 20;
    });

    c.restore();
}

function playShootSound() {
    const sound = audio.shoot.cloneNode(); // create a new instance
    sound.volume = 0.3;
    sound.play().catch(() => { });
}

function shootProjectile() {
    const now = Date.now();
    const cooldown = powers.rapidFire.active ? 50 : shotCooldown;
    if (now - lastShotTime < cooldown) return;

    projectiles.push(new Projectile({
        position: { x: player.position.x + player.width / 2, y: player.position.y },
        velocity: { x: 0, y: -10 }
    }));

    playShootSound();
    lastShotTime = now;
}



function createParticles({ object, color, fades }) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position: { x: object.position.x + object.width / 2, y: object.position.y + object.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
            radius: Math.random() * 3,
            color: color || 'pink',
            fades
        }));
    }
}

// Initialize background particles
for (let i = 0; i < 100; i++) {
    particles.push(new Particle({
        position: { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
        velocity: { x: 0, y: 0.2 },
        radius: Math.random() * 3,
        color: 'white'
    }));
}

function startGame() {
    cancelAnimationFrame(animationId);

    game.active = true;
    game.over = false;
    score = 0;
    lives = 3;
    lastLives = null;
    invadersKilled = 0;
    waveCount = 0;

    updateHUD(score, lives, invadersKilled);
    if (startMenu) startMenu.style.display = 'none';
    document.querySelector('#hud').style.display = 'block';

    player.position = { x: canvas.width / 2 - player.width / 2, y: canvas.height - player.height - 20 };
    player.opacity = 1;

    projectiles.length = 0;
    invaders.length = 0;
    invaderProjectiles.length = 0;
    scorePopups.length = 0;
    delete window.mothership;

    particles.length = 0;
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle({
            position: { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
            velocity: { x: 0, y: 0.2 },
            radius: Math.random() * 3,
            color: 'white'
        }));
    }

    frames = 0;

    // Create spawner
    invaderSpawner = new InvaderSpawner(canvas.width);

    // Spawn initial wave
    const initialWave = invaderSpawner.spawnWave(1);
    invaders.push(...initialWave);

    // SOUND: Start background music (only if not already playing)
    if (audio.background.paused) {
        audio.background.currentTime = 0;
        audio.background.play().catch(err => {
            console.log('Background music play failed:', err);
        });
    }

    animate();
}

function spawnMothership() {
    if (window.mothership) return;

    window.mothership = new Mothership(canvas.width);

    scorePopups.push(new ScorePopup({
        position: { x: canvas.width / 2, y: canvas.height / 3 },
        text: '',
        color: '#FF0000',
        life: 120
    }));
}

function animate() {
    if (!game.active) return;
    animationId = requestAnimationFrame(animate);

    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    player.update(c);

    // Check if Mothership should spawn
    // Fixed: Check if mothership doesn't exist AND we've reached the kill threshold
    if (invadersKilled > 0 && invadersKilled % MOTHERSHIP_INTERVAL === 0 && !window.mothership) {
        spawnMothership();
    }

    // Update particles
    particles.forEach((particle, i) => {
        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width;
            particle.position.y = -particle.radius;
        }
        if (particle.opacity <= 0) {
            setTimeout(() => particles.splice(i, 1), 0);
        } else {
            particle.update(c);
        }
    });

    // Invader projectiles
    invaderProjectiles.forEach((invProj, index) => {
        if (invProj.position.y + invProj.height >= canvas.height) {
            setTimeout(() => invaderProjectiles.splice(index, 1), 0);
        } else invProj.update(c);

        if (
            invProj.position.y + invProj.height >= player.position.y &&
            invProj.position.x + invProj.width >= player.position.x &&
            invProj.position.x <= player.position.x + player.width
        ) {
            if (powers.shield.active) {
                createParticles({ object: player, color: 'cyan', fades: true });
                invaderProjectiles.splice(index, 1);
                return;
            }

            lives--;
            updateHUD(score, lives, invadersKilled);
            createParticles({ object: player, color: 'white', fades: true });
            invaderProjectiles.splice(index, 1);

            if (lives > 0) {
                player.opacity = 0.3;
                setTimeout(() => (player.opacity = 1), 1500);
            } else {
                player.opacity = 0;
                game.over = true;
                setTimeout(() => {
                    game.active = false;
                    showGameOverMenu();
                }, 1500);
            }
        }
    });

    // Player projectiles
    projectiles.forEach((proj, index) => {
        if (proj.position.y + proj.radius <= 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        } else {
            proj.update(c);
        }
    });

    // Update individual invaders
    invaders.forEach((invader, i) => {
        invader.update(c, canvas.width);

        // Random shooting
        if (Math.random() < 0.001) {
            invader.shoot(invaderProjectiles);
        }

        // CHECK IF INVADER REACHED BOTTOM - GAME OVER!
        if (invader.position.y >= canvas.height - 100) {
            game.over = true;
            game.active = false;
            player.opacity = 0;

            createParticles({ object: invader, color: 'red', fades: true });

            setTimeout(() => {
                showGameOverMenu();
            }, 500);

            cancelAnimationFrame(animationId);
            return;
        }

        // Check collision with projectiles
        projectiles.forEach((proj, j) => {
            if (
                proj.position.y - proj.radius <= invader.position.y + invader.height &&
                proj.position.x + proj.radius >= invader.position.x &&
                proj.position.x - proj.radius <= invader.position.x + invader.width &&
                proj.position.y + proj.radius >= invader.position.y
            ) {
                setTimeout(() => {
                    const invaderFound = invaders.find(inv => inv === invader);
                    const projectileFound = projectiles.find(p => p === proj);

                    if (invaderFound && projectileFound) {
                        score += 100;
                        invadersKilled++;
                        createParticles({ object: invader, fades: true });

                        scorePopups.push(
                            new ScorePopup({
                                position: { x: invader.position.x + invader.width / 2, y: invader.position.y },
                                text: '+100',
                                color: '#FFD700'
                            })
                        );

                        invaders.splice(i, 1);
                        projectiles.splice(j, 1);
                        updateHUD(score, lives, invadersKilled);
                    }
                }, 0);
            }
        });
    });

    // Spawn new waves if few invaders left
    const MIN_INVADERS = 10;
    if (invaders.length <= MIN_INVADERS) {
        waveCount++;
        const speedMultiplier = Math.min(1 + waveCount * 0.05, 2.0);
        const newWave = invaderSpawner.spawnWave(speedMultiplier);
        invaders.push(...newWave);
        // SOUND: optional level-up music
        // audio.levelUp.currentTime = 0;
        // audio.levelUp.play();
    }

    // Mothership Update
    if (window.mothership) {
        window.mothership.update(c, canvas.width);

        if (frames % 180 === 0) {
            window.mothership.shoot(invaderProjectiles);
        }

        projectiles.forEach((proj, i) => {
            if (
                proj.position.x >= window.mothership.position.x &&
                proj.position.x <= window.mothership.position.x + window.mothership.width &&
                proj.position.y <= window.mothership.position.y + window.mothership.height &&
                proj.position.y >= window.mothership.position.y
            ) {
                window.mothership.health--;
                projectiles.splice(i, 1);
                createParticles({ object: window.mothership, color: 'purple', fades: true });

                scorePopups.push(
                    new ScorePopup({
                        position: { x: window.mothership.position.x + window.mothership.width / 2, y: window.mothership.position.y },
                        text: '+50',
                        color: '#FF00FF'
                    })
                );

                if (window.mothership.health <= 0) {
                    score += 2000;

                    scorePopups.push(
                        new ScorePopup({
                            position: { x: window.mothership.position.x + window.mothership.width / 2, y: window.mothership.position.y },
                            text: '+2000 MOTHERSHIP DOWN!',
                            color: '#FFD700',
                            life: 180
                        })
                    );

                    explodeMothership(window.mothership);

                    // SOUND: explosion
                    if (audio.explosion) {
                        audio.explosion.currentTime = 0;
                        audio.explosion.play();
                    }

                    // IMMEDIATELY remove mothership and update spawn tracker
                    delete window.mothership;
                    lastMothershipSpawn = invadersKilled;
                }
            }
        });

        // Check if mothership reached danger zone
        if (window.mothership && window.mothership.position.y + window.mothership.height >= canvas.height * 0.8) {
            game.over = true;
            game.active = false;
            player.opacity = 0;

            createParticles({ object: window.mothership, color: 'red', fades: true });

            setTimeout(() => {
                showGameOverMenu();
            }, 500);
        }
    }

    // Player movement
    if (keys.space.pressed) shootProjectile();

    // Mouse shooting - continuous fire when holding mouse button
    if (isMouseDown && game.active && !game.over) {
        shootProjectile();
    }

    if (player.width > 0) {
        // Mouse control (takes priority when mouse is active)
        if (isMouseControlActive) {
            const targetX = mouseX - player.width / 2;
            const currentX = player.position.x;
            const distance = targetX - currentX;

            // Smooth movement towards mouse position
            if (Math.abs(distance) > 5) {
                const moveSpeed = 7;
                player.velocity.x = Math.sign(distance) * moveSpeed;
                player.rotation = Math.sign(distance) * 0.15;

                // Ensure player stays within bounds
                if (player.position.x < 0) {
                    player.position.x = 0;
                    player.velocity.x = 0;
                } else if (player.position.x + player.width > canvas.width) {
                    player.position.x = canvas.width - player.width;
                    player.velocity.x = 0;
                }
            } else {
                player.velocity.x = 0;
                player.rotation = 0;
            }
        }
        // Keyboard control (when mouse is not active)
        else if (keys.a.pressed && player.position.x >= 0) {
            player.velocity.x = -7;
            player.rotation = -0.15;
        } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
            player.velocity.x = 7;
            player.rotation = 0.15;
        } else {
            player.velocity.x = 0;
            player.rotation = 0;
        }
    }

    // Update score popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const sp = scorePopups[i];
        if (!sp) continue;
        sp.update(c);
        if (sp.isDead()) scorePopups.splice(i, 1);
    }

    drawPowersHUD(c, powers, canvas.width);
    frames++;
}

function explodeMothership(mothership) {
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle({
            position: {
                x: mothership.position.x + Math.random() * mothership.width,
                y: mothership.position.y + Math.random() * mothership.height
            },
            velocity: {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8
            },
            radius: Math.random() * 6 + 2,
            color: ['white', 'yellow', 'pink', 'red', 'purple'][Math.floor(Math.random() * 5)],
            fades: true
        }));
    }

    let shakeTime = 20;
    const shake = setInterval(() => {
        c.setTransform(1, 0, 0, 1, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
        if (--shakeTime <= 0) {
            clearInterval(shake);
            c.setTransform(1, 0, 0, 1, 0, 0);
        }
    }, 30);
}

// Game over, reset, and event listeners remain the same as before, with audio integration:

function showGameOverMenu() {
    game.over = true;
    game.active = false;
    cancelAnimationFrame(animationId);

    // Save to leaderboard
    if (currentUsername) {
        saveToLeaderboard(currentUsername, score);
    }

    // SOUND: Play Game Over sound
    audio.gameOver.currentTime = 0;
    audio.gameOver.play();

    // SOUND: Stop background music
    audio.background.pause();
    audio.background.currentTime = 0;

    const existing = document.getElementById('gameOverOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gameOverOverlay';
    overlay.innerHTML = `
        <h2 style="color:white; font-size:28px; margin-bottom:10px;">GAME OVER</h2>
        <p style="font-size: 18px; margin-top:70px;">Final Score: ${score}</p>
        <p style="font-size: 16px; margin-top:100px;">Invaders Killed: ${invadersKilled}</p>
        <p style="font-size: 14px; margin-top:20px; color:#4CAF50;">Player: ${currentUsername}</p>
        <div>
            <button id="restartGame" style="
                padding: 10px 20px;
                margin: 10px;
                background: darkgrey;
                color: black;
                border: none;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                cursor: pointer;
            ">Play Again</button>
            <button id="viewLeaderboard" style="
                padding: 10px 20px;
                margin: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                cursor: pointer;
            ">Leaderboard</button>
            <button id="backMenu" style="
                padding: 10px 20px;
                margin: 10px;
                background: #222;
                color: white;
                border: none;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                cursor: pointer;
            ">Main Menu</button>
        </div>
    `;
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        textAlign: 'center',
        fontFamily: '"Courier New", monospace'
    });

    document.body.appendChild(overlay);

    const restartBtn = document.getElementById('restartGame');
    const viewLeaderboardBtn = document.getElementById('viewLeaderboard');
    const backBtn = document.getElementById('backMenu');

    restartBtn.addEventListener('click', () => {
        overlay.remove();
        cancelAnimationFrame(animationId);

        invaders.length = 0;
        projectiles.length = 0;
        invaderProjectiles.length = 0;
        particles.length = 0;
        delete window.mothership;

        score = 0;
        invadersKilled = 0;
        lastLives = null;
        game.over = false;

        setTimeout(() => startGame(), 500);
    });

    viewLeaderboardBtn.addEventListener('click', () => {
        displayLeaderboard();
        document.getElementById('leaderboardModal').style.display = 'flex';
    });

    backBtn.addEventListener('click', () => {
        overlay.remove();
        resetGame();
    });
}

function resetGame() {

    cancelAnimationFrame(animationId);

    game.active = false;
    game.over = false;
    score = 0;
    lives = 3;
    lastLives = null;
    invadersKilled = 0;
    waveCount = 0;
    frames = 0;

    invaders.length = 0;
    projectiles.length = 0;
    invaderProjectiles.length = 0;
    scorePopups.length = 0;
    particles.length = 0;
    delete window.mothership;

    player.position = { x: canvas.width / 2 - player.width / 2, y: canvas.height - player.height - 20 };
    player.opacity = 1;
    player.velocity.x = 0;
    player.rotation = 0;

    // 🔊 SOUND: Stop background music
    audio.background.pause();
    audio.background.currentTime = 0;

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const winContainer = document.getElementById('winContainer');
    if (gameOverOverlay) gameOverOverlay.remove();
    if (winContainer) winContainer.remove();

    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (startMenu) startMenu.style.display = 'block';
    const hud = document.querySelector('#hud');
    if (hud) hud.style.display = 'none';
}

// Leaderboard System
let currentUsername = '';

// Leaderboard Functions
function getLeaderboard() {
    const data = localStorage.getItem('spaceInvadersLeaderboard');
    return data ? JSON.parse(data) : [];
}

function saveToLeaderboard(username, score) {
    let leaderboard = getLeaderboard();

    // Check if username exists
    const existingIndex = leaderboard.findIndex(entry =>
        entry.username.toLowerCase() === username.toLowerCase()
    );

    if (existingIndex !== -1) {
        // Update existing score if new score is higher
        if (score > leaderboard[existingIndex].score) {
            leaderboard[existingIndex].score = score;
            leaderboard[existingIndex].date = new Date().toISOString();
        }
    } else {
        // Add new entry
        leaderboard.push({
            username: username,
            score: score,
            date: new Date().toISOString()
        });
    }

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep top 10
    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem('spaceInvadersLeaderboard', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardList = document.getElementById('leaderboardList');

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align:center; color:#888; font-size:12px;">No scores yet!</p>';
        return;
    }

    let html = '<table style="width:100%; border-collapse: collapse; font-size:11px;">';
    html += '<tr style="border-bottom: 2px solid #555;"><th style="padding:8px; text-align:left;">RANK</th><th style="padding:8px; text-align:left;">NAME</th><th style="padding:8px; text-align:right;">SCORE</th></tr>';

    leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        html += `<tr style="border-bottom: 1px solid #333;">
            <td style="padding:8px;">${medal}</td>
            <td style="padding:8px; color:#4CAF50;">${entry.username}</td>
            <td style="padding:8px; text-align:right; color:#FFD700;">${entry.score}</td>
        </tr>`;
    });

    html += '</table>';
    leaderboardList.innerHTML = html;
}

// Story Navigation Functions
function showStorySlide(slideNumber) {
    const slides = document.querySelectorAll('.story-slide');
    slides.forEach(slide => {
        slide.classList.remove('active');
    });

    const targetSlide = document.querySelector(`.story-slide[data-slide="${slideNumber}"]`);
    if (targetSlide) {
        targetSlide.classList.add('active');
    }
}

function nextStorySlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        showStorySlide(currentSlide);
    }
}

function resetStory() {
    currentSlide = 1;
    showStorySlide(1);
}

// Event listeners for movement, shooting, and powers remain unchanged
// BUTTON & MENU LISTENERS

// Start Button - Show username input
if (playBtn) {
    playBtn.addEventListener('click', () => {
        // Always show username input modal
        startMenu.style.display = 'none';
        usernameModal.style.display = 'flex';
        usernameInput.value = ''; // Clear previous input
        usernameInput.focus();
    });
}

// Start Game Button (after username entry)
if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username.length === 0) {
            alert('Please enter a username!');
            return;
        }

        currentUsername = username;
        usernameModal.style.display = 'none';

        // Play background music with user interaction
        if (audio.background.paused) {
            audio.background.currentTime = 0;
            audio.background.play().catch(err => {
                console.log('Audio play failed:', err);
            });
        }

        startGame();
    });
}

// Allow Enter key to submit username
if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameBtn.click();
        }
    });
}

// Leaderboard Button
if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        displayLeaderboard();
        leaderboardModal.style.display = 'flex';
    });
}

// Close Leaderboard
if (closeLeaderboard) {
    closeLeaderboard.addEventListener('click', () => {
        leaderboardModal.style.display = 'none';
    });
}

if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', () => {
        leaderboardModal.style.display = 'none';
    });
}

// Close modals by clicking outside (but not story modal - it has its own logic)
window.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
    }
    if (e.target === instructionsModal) {
        instructionsModal.style.display = 'none';
    }
    // Story modal closes only via skip button
});

// Instructions Modal
if (instructionsBtn && instructionsModal) {
    instructionsBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'flex';
    });
}

if (closeInstructions && instructionsModal) {
    closeInstructions.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });
}

// Restart Button (in main HUD or Game Over overlay)
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        startGame();
    });
}

// Main Menu Button (from HUD or Game Over overlay)
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        resetGame();
    });
}

// Story Button
if (storyBtn) {
    storyBtn.addEventListener('click', () => {
        resetStory();
        storyModal.style.display = 'flex';
    });
}

// Story slide click - advance to next slide
if (storyModal) {
    storyModal.addEventListener('click', (e) => {
        // Don't advance if clicking buttons
        if (e.target.id === 'startFromStory' || e.target.id === 'skipStory') {
            return;
        }

        // Don't advance if clicking outside modal content
        if (e.target === storyModal) {
            return;
        }

        // Advance to next slide
        if (currentSlide < totalSlides) {
            nextStorySlide();
        }
    });
}

// Start game from story
if (startFromStory) {
    startFromStory.addEventListener('click', () => {
        storyModal.style.display = 'none';
        resetStory();
        // Show username input
        usernameModal.style.display = 'flex';
        usernameInput.value = '';
        usernameInput.focus();
    });
}

// Skip story - back to menu
if (skipStory) {
    skipStory.addEventListener('click', () => {
        storyModal.style.display = 'none';
        resetStory();
    });
}

const keys = { a: { pressed: false }, d: { pressed: false }, space: { pressed: false } };
addEventListener('keydown', (event) => {
    if (!game.active || game.over) return;
    const { key } = event;

    switch (key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.a.pressed = true; break;
        case 'd':
        case 'arrowright':
            keys.d.pressed = true; break;
        case ' ':
            event.preventDefault(); keys.space.pressed = true; break;
        case 's': event.preventDefault(); activatePower('shield'); break;
        case 'f': event.preventDefault(); activatePower('rapidFire'); break;
    }
});
addEventListener('keyup', (event) => {
    const { key } = event;
    switch (key.toLowerCase()) {
        case 'a': case 'arrowleft': keys.a.pressed = false; break;
        case 'd': case 'arrowright': keys.d.pressed = false; break;
        case ' ': keys.space.pressed = false; break;
    }
});

// Mouse Controls
let mouseX = canvas.width / 2;
let isMouseControlActive = false;

// Track mouse movement
canvas.addEventListener('mousemove', (event) => {
    if (!game.active || game.over) return;

    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    isMouseControlActive = true;
});

// Shoot on mouse click
canvas.addEventListener('click', (event) => {
    if (!game.active || game.over) return;

    shootProjectile();
    isMouseControlActive = true;
});

// Optional: Hold mouse button to shoot continuously
let isMouseDown = false;
canvas.addEventListener('mousedown', (event) => {
    if (!game.active || game.over) return;
    isMouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// Leave canvas - stop mouse control
canvas.addEventListener('mouseleave', () => {
    isMouseControlActive = false;
});
