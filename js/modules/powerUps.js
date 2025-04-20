class PowerUpManager {
    static isPowerUp(image) {
        return Object.values(ASSETS.POWER_UPS).includes(image);
    }

    static getRandomPowerUp() {
        const random = Math.random();
        if (random < POWER_UP_CONFIG.CHANCES.SAME) {
            return ASSETS.POWER_UPS.SAME;
        } else if (random < POWER_UP_CONFIG.CHANCES.SAME + POWER_UP_CONFIG.CHANCES.FILA) {
            return ASSETS.POWER_UPS.FILA;
        }
        return null;
    }

    static activatePowerUp(board, index, tipo, seleccionado) {
        let resultado;
        if (tipo === ASSETS.POWER_UPS.FILA) {
            resultado = this.activateFilaPowerUp(board, index, seleccionado);
        } else if (tipo === ASSETS.POWER_UPS.SAME) {
            resultado = this.activateSamePowerUp(board, index, seleccionado);
        } else {
            return { affectedIndices: [], points: 0 };
        }
        
        // Asegurar que el power-up también se elimine
        board[index] = null;
        resultado.affectedIndices.push(index);
        
        return resultado;
    }

    static activateFilaPowerUp(board, index, seleccionado) {
        const NUM_COLUMNAS = Math.sqrt(board.length);
        const col1 = index % NUM_COLUMNAS;
        const col2 = seleccionado % NUM_COLUMNAS;
        const fila1 = Math.floor(index / NUM_COLUMNAS);
        const fila2 = Math.floor(seleccionado / NUM_COLUMNAS);
        const esMovimientoHorizontal = Math.abs(col1 - col2) === 1;
        
        let affectedIndices = [];
        
        if (esMovimientoHorizontal) {
            // Eliminar columna
            const columnaAEliminar = col2;
            for (let fila = 0; fila < NUM_COLUMNAS; fila++) {
                affectedIndices.push(fila * NUM_COLUMNAS + columnaAEliminar);
            }
        } else {
            // Eliminar fila
            const filaAEliminar = fila2;
            const inicio = filaAEliminar * NUM_COLUMNAS;
            const fin = inicio + NUM_COLUMNAS;
            for (let i = inicio; i < fin; i++) {
                affectedIndices.push(i);
            }
        }
        
        return {
            affectedIndices,
            points: affectedIndices.length * 10
        };
    }

    static activateSamePowerUp(board, index, seleccionado) {
        let indexFichaNormal, indexPowerUp;
        if (ASSETS.IMAGES.includes(board[index])) {
            indexFichaNormal = index;
            indexPowerUp = seleccionado;
        } else {
            indexFichaNormal = seleccionado;
            indexPowerUp = index;
        }

        const fichaAEliminar = board[indexFichaNormal];
        let affectedIndices = [];

        board.forEach((ficha, i) => {
            if (ficha === fichaAEliminar) {
                affectedIndices.push(i);
            }
        });

        // Mostrar el efecto de Momoi para el power-up same-card
        EffectsManager.mostrarMomoiSpecial();

        return {
            affectedIndices,
            points: affectedIndices.length * 20
        };
    }

    static createMatchPowerUp(matchSize) {
        if (matchSize === 5) {
            return ASSETS.POWER_UPS.SUPER_DORO;
        } else if (matchSize === 4) {
            return ASSETS.POWER_UPS.DORO_MINI;
        }
        return null;
    }

    static activateMatchPowerUp(board, index, matchSize) {
        if (matchSize === 4) {
            return new Promise((resolve) => {
                const doroRunner = new DoroRunner((score) => {
                    // Por cada punto ganado en el mini-juego, eliminar una ficha adicional
                    const affectedIndices = [];
                    const NUM_COLS = Math.sqrt(board.length);
                    
                    // Buscar fichas aleatorias para eliminar basado en el puntaje
                    for (let i = 0; i < score; i++) {
                        const availableIndices = board.map((val, idx) => 
                            val && !affectedIndices.includes(idx) ? idx : null
                        ).filter(idx => idx !== null);
                        
                        if (availableIndices.length > 0) {
                            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                            affectedIndices.push(randomIndex);
                        }
                    }
                    
                    resolve({
                        affectedIndices,
                        points: score * 50 // 50 puntos por cada estrella recolectada
                    });
                });
            });
        }
        // ...resto del código para otros power-ups...
    }
}

class DoroRunner {
    constructor(onGameEnd) {
        this.score = 0;
        this.timeLeft = 10;
        this.isJumping = false;
        this.gameLoop = null;
        this.obstacles = [];
        this.stars = [];
        this.onGameEnd = onGameEnd;
        this.container = null;
        this.runner = null;
        this.finalizado = false;
        this.lastSpawnTime = {
            obstacle: 0,
            star: 0
        };
        this.spawnRanges = {
            obstacle: {
                min: 1200,  // Mínimo 1.2 segundos entre obstáculos
                max: 2000   // Máximo 2 segundos entre obstáculos
            },
            star: {
                min: 800,   // Mínimo 0.8 segundos entre monedas
                max: 1500   // Máximo 1.5 segundos entre monedas
            }
        };
        this.timePenalty = 0.2; // Penalización de tiempo en segundos
        this.isInvulnerable = false; // Para evitar múltiples colisiones seguidas
        this.timePowerupChance = 0.3; // 30% de probabilidad de que aparezca un power-up de tiempo
        this.collisionOffset = 10; // Área de colisión más pequeña
        this.initialize();
    }

    initialize() {
        // Crear overlay y contenedor
        const overlay = document.createElement('div');
        overlay.className = 'runner-overlay';
        document.body.appendChild(overlay);

        this.container = document.createElement('div');
        this.container.className = 'doro-runner-container';
        document.body.appendChild(this.container);

        // Crear Doro
        this.runner = document.createElement('div');
        this.runner.className = 'doro-runner';
        this.container.appendChild(this.runner);

        // Crear contador de puntos
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'doro-runner-score';
        scoreDisplay.textContent = '0';
        this.container.appendChild(scoreDisplay);

        // Crear temporizador
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'doro-runner-timer';
        timerDisplay.textContent = '10';
        this.container.appendChild(timerDisplay);

        // Iniciar eventos
        this.setupEventListeners();
        this.startGame();

        // Actualizar displays
        this.updateDisplay = () => {
            scoreDisplay.textContent = this.score;
            timerDisplay.textContent = this.timeLeft.toFixed(1);
        };
    }

    setupEventListeners() {
        const handleJump = () => {
            if (!this.isJumping) {
                this.jump();
            }
        };

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleJump();
            }
        });

        this.container.addEventListener('click', () => handleJump());
        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleJump();
        });
    }

    jump() {
        this.isJumping = true;
        this.runner.classList.add('jump');
        
        setTimeout(() => {
            this.runner.classList.remove('jump');
            this.isJumping = false;
        }, 500);
    }

    spawnObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'doro-obstacle';
        
        // Añadir una demora aleatoria antes de que comience la animación
        const randomDelay = Math.random() * 0.5; // Entre 0 y 0.5 segundos
        obstacle.style.animation = `move-left 2s ${randomDelay}s linear`;
        
        this.container.appendChild(obstacle);
        this.obstacles.push(obstacle);

        obstacle.addEventListener('animationend', () => {
            obstacle.remove();
            this.obstacles = this.obstacles.filter(o => o !== obstacle);
        });
    }

    spawnStar() {
        // Si tenemos suerte, generamos un power-up de tiempo en lugar de una estrella
        if (Math.random() < this.timePowerupChance) {
            this.spawnTimePowerup();
            return;
        }

        const star = document.createElement('div');
        star.className = 'doro-star';
        // Añadir una demora aleatoria igual que los obstáculos
        const randomDelay = Math.random() * 0.5;
        star.style.animation = `move-left 1.5s ${randomDelay}s linear, coin-spin 1s linear infinite`;
        
        this.container.appendChild(star);
        this.stars.push(star);

        star.addEventListener('animationend', () => {
            star.remove();
            this.stars = this.stars.filter(s => s !== star);
        });
    }

    spawnTimePowerup() {
        const powerup = document.createElement('div');
        powerup.className = 'time-powerup';
        const randomDelay = Math.random() * 0.5;
        powerup.style.animation = `move-left 1.5s ${randomDelay}s linear, powerup-pulse 1s ease-in-out infinite`;
        
        this.container.appendChild(powerup);
        this.stars.push(powerup);

        powerup.addEventListener('animationend', (e) => {
            if (e.animationName === 'move-left') {
                powerup.remove();
                this.stars = this.stars.filter(s => s !== powerup);
            }
        });
    }

    checkCollisions() {
        const runnerRect = this.runner.getBoundingClientRect();
        // Crear un área de colisión más pequeña para Doro
        const doroCollisionBox = {
            left: runnerRect.left + 15,
            right: runnerRect.right - 15,
            top: runnerRect.top + 10,
            bottom: runnerRect.bottom - 5
        };

        // Revisar colisiones con obstáculos
        this.obstacles.forEach(obstacle => {
            const obstacleRect = obstacle.getBoundingClientRect();
            const obstacleCollisionBox = {
                left: obstacleRect.left + 5,
                right: obstacleRect.right - 5,
                top: obstacleRect.top + 5,
                bottom: obstacleRect.bottom - 5
            };
            
            if (!this.isInvulnerable && this.isColliding(doroCollisionBox, obstacleCollisionBox)) {
                this.handleObstacleCollision(obstacle);
            }
        });

        // Revisar colisiones con estrellas y power-ups
        this.stars.forEach(star => {
            const starRect = star.getBoundingClientRect();
            const starCollisionBox = {
                left: starRect.left + 5,
                right: starRect.right - 5,
                top: starRect.top + 5,
                bottom: starRect.bottom - 5
            };
            
            if (this.isColliding(doroCollisionBox, starCollisionBox)) {
                this.collectStar(star);
            }
        });
    }

    handleObstacleCollision(obstacle) {
        if (this.isInvulnerable) return;
        
        // Restar tiempo
        this.timeLeft = Math.max(0, this.timeLeft - this.timePenalty);
        this.updateDisplay();

        // Efecto visual de daño en el obstáculo y Doro
        obstacle.classList.add('hit');
        this.runner.style.opacity = '0.5';
        this.isInvulnerable = true;

        // Remover el obstáculo después de la animación
        setTimeout(() => {
            obstacle.remove();
            this.obstacles = this.obstacles.filter(o => o !== obstacle);
        }, 300);

        // Recuperar después de un breve periodo
        setTimeout(() => {
            this.runner.style.opacity = '1';
            this.isInvulnerable = false;
        }, 500);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    collectStar(star) {
        // Añadir clase de animación antes de cualquier otra acción
        star.classList.add('collected');
        
        if (star.classList.contains('time-powerup')) {
            // Incrementar el tiempo si es un power-up de tiempo
            this.timeLeft = Math.min(10, this.timeLeft + 0.2);
        } else {
            this.score++;
        }
        
        this.updateDisplay();
        
        // Actualizar el contador con animación
        const scoreDisplay = document.querySelector('.doro-runner-score');
        scoreDisplay.classList.add('update');
        setTimeout(() => scoreDisplay.classList.remove('update'), 300);

        // Remover después de la animación
        setTimeout(() => {
            star.remove();
            this.stars = this.stars.filter(s => s !== star);
        }, 300);
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    startGame() {
        let lastTime = 0;

        const gameLoop = (timestamp) => {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            // Actualizar tiempos de spawn
            this.lastSpawnTime.obstacle += deltaTime;
            this.lastSpawnTime.star += deltaTime;

            // Generar obstáculos aleatoriamente
            const nextObstacleTime = Math.random() * 
                (this.spawnRanges.obstacle.max - this.spawnRanges.obstacle.min) + 
                this.spawnRanges.obstacle.min;
            
            if (this.lastSpawnTime.obstacle >= nextObstacleTime) {
                this.spawnObstacle();
                this.lastSpawnTime.obstacle = 0;
            }

            // Generar estrellas aleatoriamente
            const nextStarTime = Math.random() * 
                (this.spawnRanges.star.max - this.spawnRanges.star.min) + 
                this.spawnRanges.star.min;
            
            if (this.lastSpawnTime.star >= nextStarTime) {
                this.spawnStar();
                this.lastSpawnTime.star = 0;
            }

            this.checkCollisions();

            if (!this.finalizado) {
                this.gameLoop = requestAnimationFrame(gameLoop);
            }
        };

        this.gameLoop = requestAnimationFrame(gameLoop);

        // Temporizador del juego con precisión decimal
        const timer = setInterval(() => {
            if (!this.finalizado) {
                this.timeLeft = Math.max(0, this.timeLeft - 0.1);
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    clearInterval(timer);
                    this.endGame();
                }
            }
        }, 100); // Actualizar cada 100ms para mostrar decimales
    }

    endGame() {
        if (this.finalizado) return;
        
        this.finalizado = true;
        cancelAnimationFrame(this.gameLoop);
        
        // Limpiar con animaciones
        this.obstacles.forEach(obstacle => {
            obstacle.classList.add('hit');
        });
        
        this.stars.forEach(star => {
            star.classList.add('collected');
        });
        
        if (this.score > 0) {
            EffectsManager.reproducirSonido('special');
        }
        
        setTimeout(() => {
            this.container.remove();
            document.querySelector('.runner-overlay').remove();
            this.onGameEnd(this.score);
        }, 500);
    }
}