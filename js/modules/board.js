// import { BOARD_CONFIG, ASSETS } from './config.js'; // Eliminado
// import { PowerUpManager } from './powerUps.js'; // Eliminado
// import { EffectsManager } from './effects.js'; // Eliminado

class BoardManager {
    constructor() {
        this.tablero = [];
        this.NUM_FILAS = BOARD_CONFIG.ROWS;
        this.NUM_COLUMNAS = BOARD_CONFIG.COLUMNS;
        this.seleccionado = null;
        this.clickHandler = null;
        this.combosConsecutivos = 0;
        this.ajustarTamañoTablero();
    }

    ajustarTamañoTablero() {
        if (window.innerWidth <= 480) {
            this.NUM_COLUMNAS = BOARD_CONFIG.MOBILE_COLUMNS;
        } else {
            this.NUM_COLUMNAS = BOARD_CONFIG.COLUMNS;
        }
        this.generarTablero();
    }

    generarTablero() {
        this.tablero = [];
        for (let i = 0; i < this.NUM_FILAS * this.NUM_COLUMNAS; i++) {
            let imagen;
            let intentos = 0;

            const powerUp = PowerUpManager.getRandomPowerUp();
            if (powerUp) {
                imagen = powerUp;
            } else {
                do {
                    imagen = ASSETS.IMAGES[Math.floor(Math.random() * ASSETS.IMAGES.length)];
                    intentos++;
                    if (intentos > 10) break;
                } while (this.generariaCoincidencia(i, imagen));
            }
            this.tablero.push(imagen);
        }
        this.renderizarTablero();
    }

    generariaCoincidencia(index, imagen) {
        return (
            (index % this.NUM_COLUMNAS >= 2 &&
             this.tablero[index-1] === imagen &&
             this.tablero[index-2] === imagen) ||
            (index >= this.NUM_COLUMNAS * 2 &&
             this.tablero[index-this.NUM_COLUMNAS] === imagen &&
             this.tablero[index-this.NUM_COLUMNAS*2] === imagen)
        );
    }

    renderizarTablero() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;
        
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.NUM_COLUMNAS}, var(--tile-size))`;
        
        this.tablero.forEach((imagen, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (imagen) {
                tile.style.backgroundImage = `url(${imagen})`;
                if (PowerUpManager.isPowerUp(imagen)) {
                    tile.dataset.powerUp = "true";
                }
            }
            tile.dataset.index = index;

            if (index === this.seleccionado) {
                tile.classList.add('selected');
            }

            gameBoard.appendChild(tile);
        });
    }

    esAdyacente(i1, i2) {
        const fila1 = Math.floor(i1 / this.NUM_COLUMNAS);
        const col1 = i1 % this.NUM_COLUMNAS;
        const fila2 = Math.floor(i2 / this.NUM_COLUMNAS);
        const col2 = i2 % this.NUM_COLUMNAS;
        return (
            (fila1 === fila2 && Math.abs(col1 - col2) === 1) ||
            (col1 === col2 && Math.abs(fila1 - fila2) === 1)
        );
    }

    async intercambiar(index1, index2) {
        const tile1 = document.querySelector(`[data-index='${index1}']`);
        const tile2 = document.querySelector(`[data-index='${index2}']`);
        
        const esMovimientoHorizontal = Math.abs(index1 % this.NUM_COLUMNAS - index2 % this.NUM_COLUMNAS) === 1;
        const col1 = index1 % this.NUM_COLUMNAS;
        const col2 = index2 % this.NUM_COLUMNAS;
        const fila1 = Math.floor(index1 / this.NUM_COLUMNAS);
        const fila2 = Math.floor(index2 / this.NUM_COLUMNAS);
        
        if (esMovimientoHorizontal) {
            tile1.classList.add(col1 < col2 ? 'swap-right' : 'swap-left');
            tile2.classList.add(col1 < col2 ? 'swap-left' : 'swap-right');
        } else {
            tile1.classList.add(fila1 < fila2 ? 'swap-down' : 'swap-up');
            tile2.classList.add(fila1 < fila2 ? 'swap-up' : 'swap-down');
        }

        const ficha1 = this.tablero[index1];
        const ficha2 = this.tablero[index2];
        
        [this.tablero[index1], this.tablero[index2]] = [this.tablero[index2], this.tablero[index1]];
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        tile1?.classList.remove('swap-right', 'swap-left', 'swap-up', 'swap-down');
        tile2?.classList.remove('swap-right', 'swap-left', 'swap-up', 'swap-down');
        
        this.renderizarTablero();
        
        const hayCoincidencias = await this.detectarCoincidencias();
        if (!hayCoincidencias) {
            [this.tablero[index1], this.tablero[index2]] = [ficha1, ficha2];
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const newTile1 = document.querySelector(`[data-index='${index1}']`);
            const newTile2 = document.querySelector(`[data-index='${index2}']`);
            
            if (esMovimientoHorizontal) {
                newTile1?.classList.add(col1 < col2 ? 'swap-left' : 'swap-right');
                newTile2?.classList.add(col1 < col2 ? 'swap-right' : 'swap-left');
            } else {
                newTile1?.classList.add(fila1 < fila2 ? 'swap-up' : 'swap-down');
                newTile2?.classList.add(fila1 < fila2 ? 'swap-down' : 'swap-up');
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            this.renderizarTablero();
        }

        return hayCoincidencias;
    }

    async rellenarHuecos() {
        const columnasAfectadas = new Set();
        
        for (let col = 0; col < this.NUM_COLUMNAS; col++) {
            for (let fila = 0; fila < this.NUM_FILAS; fila++) {
                const i = fila * this.NUM_COLUMNAS + col;
                if (this.tablero[i] === null) {
                    columnasAfectadas.add(col);
                    break;
                }
            }
        }

        columnasAfectadas.forEach(col => {
            let espaciosVacios = 0;
            
            for (let fila = this.NUM_FILAS - 1; fila >= 0; fila--) {
                const i = fila * this.NUM_COLUMNAS + col;
                if (this.tablero[i] === null) {
                    espaciosVacios++;
                } else if (espaciosVacios > 0) {
                    const nuevaPosicion = i + (espaciosVacios * this.NUM_COLUMNAS);
                    this.tablero[nuevaPosicion] = this.tablero[i];
                    this.tablero[i] = null;
                }
            }
            
            for (let i = 0; i < espaciosVacios; i++) {
                const posicionFinal = i * this.NUM_COLUMNAS + col;
                this.tablero[posicionFinal] = ASSETS.IMAGES[Math.floor(Math.random() * ASSETS.IMAGES.length)];
                
                const tile = document.createElement('div');
                tile.className = 'tile new-tile';
                tile.style.backgroundImage = `url(${this.tablero[posicionFinal]})`;
                tile.style.left = `${col * 58}px`;
                tile.style.top = `${-100 * (i + 1)}px`;
                tile.style.animationDelay = `${i * 0.1}s`;
                
                document.getElementById('game-board').appendChild(tile);
                setTimeout(() => tile.remove(), 800);
            }
        });

        this.renderizarTablero();

        const maxDelay = Math.max(...Array.from(columnasAfectadas).map(col => 
            this.tablero.filter((_, i) => i % this.NUM_COLUMNAS === col).filter(x => x === null).length
        )) * 0.1 + 0.8;

        await new Promise(resolve => setTimeout(resolve, maxDelay * 1000));
        return this.detectarCoincidencias();
    }

    async detectarCoincidencias() {
        const encontrados = {
            coincidencias5: new Set(),
            coincidencias4: new Set(),
            coincidencias3: new Set()
        };

        // Buscar coincidencias horizontales
        for (let fila = 0; fila < this.NUM_FILAS; fila++) {
            for (let col = 0; col < this.NUM_COLUMNAS - 2; col++) {
                const index = fila * this.NUM_COLUMNAS + col;
                const ficha = this.tablero[index];
                if (!ficha || !ASSETS.IMAGES.includes(ficha)) continue;

                let count = 1;
                while (col + count < this.NUM_COLUMNAS && this.tablero[index + count] === ficha) {
                    count++;
                }

                if (count >= 3) {
                    const set = encontrados[`coincidencias${count}`];
                    if (set) {
                        for (let i = 0; i < count; i++) {
                            set.add(index + i);
                        }
                    }
                    col += count - 1;
                }
            }
        }

        // Buscar coincidencias verticales
        for (let col = 0; col < this.NUM_COLUMNAS; col++) {
            for (let fila = 0; fila < this.NUM_FILAS - 2; fila++) {
                const index = fila * this.NUM_COLUMNAS + col;
                const ficha = this.tablero[index];
                if (!ficha || !ASSETS.IMAGES.includes(ficha)) continue;

                let count = 1;
                while (fila + count < this.NUM_FILAS && 
                       this.tablero[index + count * this.NUM_COLUMNAS] === ficha) {
                    count++;
                }

                if (count >= 3) {
                    const set = encontrados[`coincidencias${count}`];
                    if (set) {
                        for (let i = 0; i < count; i++) {
                            set.add(index + i * this.NUM_COLUMNAS);
                        }
                    }
                    fila += count - 1;
                }
            }
        }

        // Procesar coincidencias encontradas
        if (encontrados.coincidencias5.size > 0) {
            const centro = Array.from(encontrados.coincidencias5)[Math.floor(encontrados.coincidencias5.size / 2)];
            this.tablero[centro] = PowerUpManager.createMatchPowerUp(5);
            encontrados.coincidencias5.delete(centro);
            this.combosConsecutivos++;
            return this.procesarCoincidencias(encontrados.coincidencias5);
        } 
        if (encontrados.coincidencias4.size > 0) {
            const centro = Array.from(encontrados.coincidencias4)[Math.floor(encontrados.coincidencias4.size / 2)];
            this.tablero[centro] = PowerUpManager.createMatchPowerUp(4);
            encontrados.coincidencias4.delete(centro);
            this.combosConsecutivos++;
            return this.procesarCoincidencias(encontrados.coincidencias4);
        }
        if (encontrados.coincidencias3.size > 0) {
            this.combosConsecutivos++;
            return this.procesarCoincidencias(encontrados.coincidencias3);
        }

        // Si no hay coincidencias, resetear el contador
        this.combosConsecutivos = 0;
        return false;
    }

    async procesarCoincidencias(coincidencias) {
        if (coincidencias.size === 0) return false;

        // Reproducir sonido inmediatamente si alcanzamos 3 combos consecutivos
        if (this.combosConsecutivos >= 3) {
            EffectsManager.reproducirSonido('combo');
        }

        // Mostrar el contador de combos
        UIManager.actualizarContadorCombos(this.combosConsecutivos);

        if (coincidencias instanceof Set) {
            coincidencias.forEach(async index => {
                if (!PowerUpManager.isPowerUp(this.tablero[index])) {
                    this.tablero[index] = null;
                    await EffectsManager.mostrarEfectoCombo(index);
                }
            });
        } else if (coincidencias.affectedIndices) {
            // Si es un resultado de power-up
            coincidencias.affectedIndices.forEach(async index => {
                if (this.tablero[index]) {
                    await EffectsManager.mostrarEfectoCombo(index);
                    this.tablero[index] = null;
                }
            });
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        await this.rellenarHuecos();
        return true;
    }

    getCombosConsecutivos() {
        return this.combosConsecutivos;
    }

    resetCombos() {
        this.combosConsecutivos = 0;
        UIManager.actualizarContadorCombos(0);
    }

    getTablero() {
        return this.tablero;
    }

    setSeleccionado(index) {
        // Si el índice es el mismo que ya está seleccionado, deseleccionar
        if (this.seleccionado === index) {
            this.seleccionado = null;
        } else {
            this.seleccionado = index;
        }
        this.renderizarTablero();
    }

    getSeleccionado() {
        return this.seleccionado;
    }

    setClickHandler(handler) {
        this.clickHandler = handler;
    }
}