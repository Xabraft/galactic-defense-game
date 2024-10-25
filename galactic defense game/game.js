const GRID_SIZE = 6;
const SHIPS = [
    { size: 1, count: 1 },
    { size: 2, count: 2 },
    { size: 4, count: 1 }
];
const MAX_SHOTS = 30;

class Ship {
    constructor(size, x, y, isHorizontal) {
        this.size = size;
        this.x = x;
        this.y = y;
        this.isHorizontal = isHorizontal;
        this.hits = 0;
    }

    isDestroyed() {
        return this.hits === this.size;
    }

    hit() {
        this.hits++;
    }

    occupies(x, y) {
        if (this.isHorizontal) {
            return y === this.y && x >= this.x && x < this.x + this.size;
        } else {
            return x === this.x && y >= this.y && y < this.y + this.size;
        }
    }
}

class Space {
    constructor(size) {
        this.size = size;
        this.grid = this.createGrid();
        this.ships = [];
    }

    createGrid() {
        return Array(this.size).fill().map(() => Array(this.size).fill(null));
    }

    placeShips() {
        SHIPS.forEach(shipType => {
            for (let i = 0; i < shipType.count; i++) {
                this.placeShip(shipType.size);
            }
        });
    }

    placeShip(size) {
        let x, y, isHorizontal;
        do {
            x = Math.floor(Math.random() * this.size);
            y = Math.floor(Math.random() * this.size);
            isHorizontal = Math.random() < 0.5;
        } while (!this.canPlaceShip(size, x, y, isHorizontal));

        const ship = new Ship(size, x, y, isHorizontal);
        this.ships.push(ship);

        for (let i = 0; i < size; i++) {
            if (isHorizontal) {
                this.grid[y][x + i] = ship;
            } else {
                this.grid[y + i][x] = ship;
            }
        }
    }

    canPlaceShip(size, x, y, isHorizontal) {
        if (isHorizontal && x + size > this.size) return false;
        if (!isHorizontal && y + size > this.size) return false;

        for (let i = 0; i < size; i++) {
            if (isHorizontal) {
                if (this.grid[y][x + i] !== null) return false;
            } else {
                if (this.grid[y + i][x] !== null) return false;
            }
        }
        return true;
    }

    fireAt(x, y) {
        if (this.grid[y][x] instanceof Ship) {
            this.grid[y][x].hit();
            return true;
        }
        return false;
    }

    allShipsDestroyed() {
        return this.ships.every(ship => ship.isDestroyed());
    }
}

class Game {
    constructor() {
        this.space = new Space(GRID_SIZE);
        this.shotsFired = 0;
        this.setupGame();
        this.createStarfield();
    }

    setupGame() {
        this.space.placeShips();
        this.renderGrid();
        this.updateInfo();
        this.animateTitle();
    }

    renderGrid() {
        const spaceGrid = document.getElementById('space-grid');
        spaceGrid.innerHTML = '';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                spaceGrid.appendChild(cell);
            }
        }
        this.animateGridAppear();
    }

    handleCellClick(x, y) {
        if (this.shotsFired >= MAX_SHOTS) return;

        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell.textContent !== '') return;

        this.shotsFired++;
        if (this.space.fireAt(x, y)) {
            cell.textContent = '💥';
            cell.style.color = '#ff4444';
            this.animateExplosion(cell);
        } else {
            cell.textContent = 'MISS';
            cell.style.color = '#ff0000';
            cell.style.fontSize = '12px';
        }

        this.updateInfo();

        if (this.space.allShipsDestroyed()) {
            this.showVictoryMenu();
        } else if (this.shotsFired >= MAX_SHOTS) {
            this.showDefeatMenu();
        }
    }

    updateInfo() {
        document.getElementById('ships-left').textContent = this.space.ships.filter(ship => !ship.isDestroyed()).length;
        document.getElementById('shots-fired').textContent = this.shotsFired;
        
        const shotsElement = document.getElementById('shots-fired');
        if (this.shotsFired > MAX_SHOTS * 0.7) {
            shotsElement.style.color = '#ff0000';
        } else if (this.shotsFired > MAX_SHOTS * 0.5) {
            shotsElement.style.color = '#ffff00';
        }
    }

    gameOver() {
        this.animateExplosion(document.body);
        setTimeout(() => {
            this.showEndGameMenu("Système en Surchauffe!", "Trop de tirs de plasma ont surchargé le système de défense. Réinitialisez pour une nouvelle tentative.");
            this.highlightStartButton();
        }, 1000);
    }

    showVictoryMenu() {
        this.showEndGameMenu("Mission Accomplie!", `Toutes les menaces ont été neutralisées en ${this.shotsFired} tirs de plasma.`);
    }

    showDefeatMenu() {
        // Supprimez l'animation d'explosion sur tout l'écran
        // this.animateExplosion(document.body);
        
        // Affichez immédiatement le menu de défaite
        this.showEndGameMenu("Système en Surchauffe!", "Trop de tirs de plasma ont surchargé le système de défense. Réinitialisez pour une nouvelle tentative.");
        this.highlightStartButton();
    }

    showEndGameMenu(title, message) {
        const menu = document.getElementById('end-game-menu');
        const titleElement = document.getElementById('end-game-title');
        const messageElement = document.getElementById('end-game-message');

        titleElement.textContent = title;
        messageElement.textContent = message;
        menu.classList.remove('hidden');
    }

    highlightStartButton() {
        const startButton = document.getElementById('start-game');
        startButton.style.animation = 'pulse 1s infinite';
        startButton.style.boxShadow = '0 0 20px #ff0000';
    }

    animateTitle() {
        anime({
            targets: 'h1',
            opacity: [0, 1],
            translateY: [-50, 0],
            duration: 1000,
            easing: 'easeOutQuad'
        });
    }

    animateGridAppear() {
        anime({
            targets: '.cell',
            scale: [0, 1],
            opacity: [0, 1],
            delay: anime.stagger(50, {grid: [GRID_SIZE, GRID_SIZE], from: 'center'}),
            duration: 1000,
            easing: 'easeOutElastic(1, .5)'
        });
    }

    animateExplosion(element) {
        anime({
            targets: element,
            scale: [1, 1.2],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: function(anim) {
                if (element !== document.body) {
                    element.style.opacity = 1;
                    element.style.transform = 'scale(1)';
                }
            }
        });
    }

    createStarfield() {
        const stars = document.getElementById('stars');
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            star.style.animationName = 'twinkle';
            star.style.animationIterationCount = 'infinite';
            stars.appendChild(star);
        }
    }
}

// Modifiez l'écouteur d'événements pour le bouton de démarrage
document.getElementById('start-game').addEventListener('click', () => {
    const startButton = document.getElementById('start-game');
    startButton.style.animation = 'none';
    startButton.style.boxShadow = 'none';
    document.getElementById('end-game-menu').classList.add('hidden');
    new Game();
});

document.addEventListener('DOMContentLoaded', () => new Game());

document.getElementById('close-menu').addEventListener('click', () => {
    document.getElementById('end-game-menu').classList.add('hidden');
});
