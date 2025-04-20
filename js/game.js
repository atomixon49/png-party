class Game {
    constructor() {
        this.board = new BoardManager();
        this.puntuacion = 0;
        this.tiempoRestante = GAME_CONFIG.INITIAL_TIME;
        this.nivelActual = 1;
        this.metaActual = LEVELS.GOALS[0];
        this.timerInterval = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.initEventListeners();
        this.board.setClickHandler((index) => this.manejarClick(index));
        this.iniciarJuego();
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            const oldColumnas = this.board.NUM_COLUMNAS;
            this.board.ajustarTamañoTablero();
            if (oldColumnas !== this.board.NUM_COLUMNAS) {
                this.reiniciarJuego();
            }
        });

        const gameBoard = document.getElementById('game-board');
        gameBoard.addEventListener('click', async (e) => {
            if (!this.isGameOver) {
                const tile = e.target.closest('.tile');
                if (tile) {
                    const index = parseInt(tile.dataset.index);
                    if (!isNaN(index)) {
                        await this.manejarClick(index);
                    }
                }
            }
        });
    }

    async manejarClick(index) {
        if (this.isGameOver) return;
        
        const seleccionado = this.board.getSeleccionado();
        if (seleccionado === null) {
            this.board.setSeleccionado(index);
        } else {
            if (seleccionado === index) {
                this.board.setSeleccionado(null);
            } else if (this.board.esAdyacente(seleccionado, index)) {
                const tablero = this.board.getTablero();
                const ficha1 = tablero[seleccionado];
                const ficha2 = tablero[index];
                
                if (ficha1 === ASSETS.POWER_UPS.DORO_MINI || ficha2 === ASSETS.POWER_UPS.DORO_MINI) {
                    // Pausar el juego principal durante el mini-juego
                    this.pauseGame();
                    
                    const powerUpIndex = ficha1 === ASSETS.POWER_UPS.DORO_MINI ? seleccionado : index;
                    const resultado = await PowerUpManager.activateMatchPowerUp(tablero, powerUpIndex, 4);
                    
                    // Reanudar el juego principal después del mini-juego
                    this.resumeGame();
                    
                    this.puntuacion += resultado.points;
                    UIManager.actualizarPuntuacion(this.puntuacion);
                    
                    await Promise.all(resultado.affectedIndices.map(async i => {
                        if (tablero[i]) {
                            const tile = document.querySelector(`[data-index='${i}']`);
                            if (tile) {
                                tile.classList.add('matching');
                                await EffectsManager.mostrarEfectoCombo(i);
                            }
                        }
                    }));

                    resultado.affectedIndices.forEach(i => {
                        tablero[i] = null;
                    });
                    
                    await this.board.rellenarHuecos();
                    this.verificarMeta();
                } else if (PowerUpManager.isPowerUp(ficha1) || PowerUpManager.isPowerUp(ficha2)) {
                    const resultado = PowerUpManager.activatePowerUp(
                        tablero,
                        PowerUpManager.isPowerUp(ficha1) ? seleccionado : index,
                        PowerUpManager.isPowerUp(ficha1) ? ficha1 : ficha2,
                        PowerUpManager.isPowerUp(ficha1) ? index : seleccionado
                    );
                    
                    this.puntuacion += resultado.points;
                    UIManager.actualizarPuntuacion(this.puntuacion);
                    
                    // Reproducir el sonido inmediatamente al usar el power-up
                    EffectsManager.reproducirSonido('special');
                    
                    // Mostrar las animaciones
                    await Promise.all(resultado.affectedIndices.map(async i => {
                        if (tablero[i]) {
                            const tile = document.querySelector(`[data-index='${i}']`);
                            if (tile) {
                                tile.classList.add('matching');
                                await new Promise(resolve => setTimeout(resolve, 400));
                            }
                            await EffectsManager.mostrarEfectoCombo(i);
                        }
                    }));

                    // Limpiar el tablero
                    resultado.affectedIndices.forEach(i => {
                        tablero[i] = null;
                    });
                    
                    await this.board.rellenarHuecos();
                    this.verificarMeta();
                } else {
                    const huboCoincidencia = await this.board.intercambiar(seleccionado, index);
                    if (huboCoincidencia) {
                        this.verificarMeta();
                    }
                }
                this.board.setSeleccionado(null);
            } else {
                this.board.setSeleccionado(index);
            }
        }
    }

    iniciarJuego() {
        this.board.generarTablero();
        this.iniciarTimer();
    }

    iniciarTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.tiempoRestante--;
                UIManager.actualizarTiempo(this.tiempoRestante);

                if (this.tiempoRestante <= 0) {
                    clearInterval(this.timerInterval);
                    this.finalizarJuego();
                }
            }
        }, 1000);
    }

    pauseGame() {
        if (!this.isPaused) {
            this.isPaused = true;
            clearInterval(this.timerInterval);
        }
    }

    resumeGame() {
        if (this.isPaused) {
            this.isPaused = false;
            this.iniciarTimer();
        }
    }

    async finalizarJuego() {
        if (this.isGameOver) return; // Evitar múltiples llamadas
        this.isGameOver = true;
        
        clearInterval(this.timerInterval);
        const metaAlcanzada = this.puntuacion >= this.metaActual;
        
        try {
            await UIManager.mostrarGameOver(this.puntuacion, metaAlcanzada);
            this.isGameOver = false;
            this.reiniciarJuego();
        } catch (error) {
            console.error('Error al mostrar game over:', error);
            this.isGameOver = false;
        }
    }

    reiniciarJuego() {
        clearInterval(this.timerInterval);
        this.puntuacion = 0;
        this.tiempoRestante = GAME_CONFIG.INITIAL_TIME;
        this.nivelActual = 1;
        this.metaActual = LEVELS.GOALS[0];
        this.isGameOver = false;

        UIManager.actualizarPuntuacion(this.puntuacion);
        UIManager.actualizarTiempo(this.tiempoRestante);
        UIManager.actualizarMeta(this.metaActual);
        this.board.resetCombos();

        this.board.generarTablero();
        this.iniciarTimer();
    }

    verificarMeta() {
        if (this.puntuacion >= this.metaActual) {
            this.nivelActual++;
            if (this.nivelActual <= LEVELS.GOALS.length) {
                this.metaActual = LEVELS.GOALS[this.nivelActual - 1];
                UIManager.actualizarMeta(this.metaActual);
                UIManager.mostrarMensajeNivel(this.nivelActual, this.metaActual);
                this.tiempoRestante += GAME_CONFIG.LEVEL_TIME_BONUS;
                UIManager.actualizarTiempo(this.tiempoRestante);
            } else {
                this.finalizarJuego();
            }
        }
    }
}

// Iniciar el juego cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.iniciarTimer();
});