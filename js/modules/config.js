// Variables globales del juego
const BOARD_CONFIG = {
    ROWS: 8,
    COLUMNS: 8,
    MOBILE_COLUMNS: 7
};

const ASSETS = {
    IMAGES: [
        'images/chritmas-doro.png',
        'images/doro-imagen.png',
        'images/doro-lemon.png',
        'images/piggy.png',
        'images/chibi-doro.png'
    ],
    POWER_UPS: {
        FILA: 'images/fila-card-power.png',
        SAME: 'images/same-card-power.png',
        DORO_MINI: 'images/doro-mini-game.gif',
        SUPER_DORO: 'images/super-doro.gif'
    },
    SOUNDS: {
        COMBO: new Audio('sounds/combos.mp3'),
        SPECIAL: new Audio('sounds/combo-momoi.mp3'),
        COIN: new Audio('sounds/coin.mp3'),
        OBSTACLE: new Audio('sounds/obstacle.mp3'),
        MATCH: new Audio('sounds/matches.mp3'),
        EXPLOSION: new Audio('sounds/explosion.mp3')
    }
};

const POWER_UP_CONFIG = {
    CHANCES: {
        FILA: 0.04,
        SAME: 0.01
    }
};

const GAME_CONFIG = {
    INITIAL_TIME: 60,
    LEVEL_TIME_BONUS: 30,
    BASE_POINTS: 10,
    POWER_UP_POINTS: 20,
    ANIMATION_DELAYS: {
        SWAP: 300,
        FILL: 600,
        COMBO: 400
    }
};

const LEVELS = {
    GOALS: [1000, 2500, 5000, 8000, 12000]
};