// ==========================================
// CONFIGURACIÓN DEL TABLERO Y VARIABLES GLOBALES
// ==========================================

// Variables para el tamaño del tablero
let NUM_FILAS = 8;
let NUM_COLUMNAS = 8;

// ==========================================
// CONSTANTES DEL JUEGO
// ==========================================

// Colores disponibles para las fichas (actualmente no se usan, pero están disponibles)
const COLORES = ['#ff69b4', '#ffb6c1', '#ffc0cb', '#db7093', '#ff1493'];

// Imágenes disponibles para las fichas normales
const IMAGENES = [
    'images/chritmas-doro.png',    // Doro navideño
    'images/doro-imagen.png',      // Doro normal
    'images/doro-lemon.png',       // Doro limón
    'images/piggy.png',            // Cerdito
    'images/chibi-doro.png'        // Doro chibi
];

// Power-ups disponibles en el juego
const POWER_UPS = {
    FILA: 'images/fila-card-power.png',      // Power-up que elimina una fila/columna
    SAME: 'images/same-card-power.png',      // Power-up que elimina todas las fichas del mismo tipo
    DORO_MINI: 'images/doro-mini-game.gif',  // Power-up que aparece al hacer match de 4
    SUPER_DORO: 'images/super-doro.gif'      // Power-up que aparece al hacer match de 5
};

// Probabilidades de aparición de power-ups
const POWER_UP_CHANCES = {
    FILA: 0.04,   // 4% de probabilidad
    SAME: 0.01    // 1% de probabilidad
};

// Efectos de sonido del juego
const SOUNDS = {
    COMBO: new Audio('sounds/combos.mp3'),         // Sonido para combos normales
    SPECIAL: new Audio('sounds/combo-momoi.mp3')   // Sonido para combos especiales
};

// ==========================================
// VARIABLES DEL JUEGO
// ==========================================

let tablero = [];              // Array que contiene el estado actual del tablero
let puntuacion = 0;           // Puntuación actual del jugador
let tiempoRestante = 60;      // Tiempo restante en segundos
let metaActual = 1000;        // Meta de puntos actual
let nivelActual = 1;          // Nivel actual del jugador
let combosConsecutivos = 0;   // Contador de combos consecutivos
let seleccionado = null;      // Índice de la ficha seleccionada actualmente
let metas = [1000, 2500, 5000, 8000, 12000]; // Metas de puntos para cada nivel

// Función para ajustar el tamaño del tablero según el ancho de la pantalla
const ajustarTamañoTablero = () => {
    if (window.innerWidth <= 480) {
        NUM_COLUMNAS = 7;
        NUM_FILAS = 8;
    } else {
        NUM_COLUMNAS = 8;
        NUM_FILAS = 8;
    }
    generarTablero();
};

// Agregar listener para redimensionar
window.addEventListener('resize', () => {
    const oldColumnas = NUM_COLUMNAS;
    ajustarTamañoTablero();
    if (oldColumnas !== NUM_COLUMNAS) {
        reiniciarJuego();
    }
});

const generarTablero = () => {
    tablero = [];
    for (let i = 0; i < NUM_FILAS * NUM_COLUMNAS; i++) {
        let imagen;
        let intentos = 0;

        // Generar power-up con probabilidades diferentes
        const random = Math.random();
        if (random < POWER_UP_CHANCES.SAME) {
            imagen = POWER_UPS.SAME;
        } else if (random < POWER_UP_CHANCES.SAME + POWER_UP_CHANCES.FILA) {
            imagen = POWER_UPS.FILA;
        } else {
            do {
                imagen = IMAGENES[Math.floor(Math.random() * IMAGENES.length)];
                intentos++;
                if (intentos > 10) break;
            } while (
                (i % NUM_COLUMNAS >= 2 &&
                 tablero[i-1] === imagen &&
                 tablero[i-2] === imagen) ||
                (i >= NUM_COLUMNAS * 2 &&
                 tablero[i-NUM_COLUMNAS] === imagen &&
                 tablero[i-NUM_COLUMNAS*2] === imagen)
            );
        }
        tablero.push(imagen);
    }
    renderizarTablero();
};

// Agregar eventos táctiles al renderizarTablero
const renderizarTablero = () => {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    tablero.forEach((imagen, index) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (imagen) {
            tile.style.backgroundImage = `url(${imagen})`;
        }
        tile.dataset.index = index;

        // Agregar clase selected si está seleccionada
        if (index === seleccionado) {
            tile.classList.add('selected');
        }

        // Agregar eventos táctiles
        tile.addEventListener('touchstart', (e) => {
            e.preventDefault();
            manejarClick(index);
        });

        tile.addEventListener('click', () => manejarClick(index));
        gameBoard.appendChild(tile);
    });
};

const esAdyacente = (i1, i2) => {
    const fila1 = Math.floor(i1 / NUM_COLUMNAS);
    const col1 = i1 % NUM_COLUMNAS;
    const fila2 = Math.floor(i2 / NUM_COLUMNAS);
    const col2 = i2 % NUM_COLUMNAS;
    return (
        (fila1 === fila2 && Math.abs(col1 - col2) === 1) ||
        (col1 === col2 && Math.abs(fila1 - fila2) === 1)
    );
};

const intercambiar = (index1, index2) => {
    const tile1 = document.querySelector(`[data-index='${index1}']`);
    const tile2 = document.querySelector(`[data-index='${index2}']`);
    
    // Determinar si el movimiento es horizontal o vertical
    const esMovimientoHorizontal = Math.abs(index1 % NUM_COLUMNAS - index2 % NUM_COLUMNAS) === 1;
    const col1 = index1 % NUM_COLUMNAS;
    const col2 = index2 % NUM_COLUMNAS;
    const fila1 = Math.floor(index1 / NUM_COLUMNAS);
    const fila2 = Math.floor(index2 / NUM_COLUMNAS);
    
    if (esMovimientoHorizontal) {
        tile1.classList.add(col1 < col2 ? 'swap-right' : 'swap-left');
        tile2.classList.add(col1 < col2 ? 'swap-left' : 'swap-right');
    } else {
        tile1.classList.add(fila1 < fila2 ? 'swap-down' : 'swap-up');
        tile2.classList.add(fila1 < fila2 ? 'swap-up' : 'swap-down');
    }

    // Guardar estado original
    const ficha1 = tablero[index1];
    const ficha2 = tablero[index2];
    
    // Realizar intercambio
    [tablero[index1], tablero[index2]] = [tablero[index2], tablero[index1]];
    
    setTimeout(() => {
        // Limpiar clases de animación
        tile1?.classList.remove('swap-right', 'swap-left', 'swap-up', 'swap-down');
        tile2?.classList.remove('swap-right', 'swap-left', 'swap-up', 'swap-down');
        
        renderizarTablero();
        
        // Verificar coincidencias
        if (!detectarCoincidencias()) {
            // Revertir si no hay coincidencias
            [tablero[index1], tablero[index2]] = [ficha1, ficha2];
            
            setTimeout(() => {
                const newTile1 = document.querySelector(`[data-index='${index1}']`);
                const newTile2 = document.querySelector(`[data-index='${index2}']`);
                
                if (esMovimientoHorizontal) {
                    newTile1?.classList.add(col1 < col2 ? 'swap-left' : 'swap-right');
                    newTile2?.classList.add(col1 < col2 ? 'swap-right' : 'swap-left');
                } else {
                    newTile1?.classList.add(fila1 < fila2 ? 'swap-up' : 'swap-down');
                    newTile2?.classList.add(fila1 < fila2 ? 'swap-down' : 'swap-up');
                }
                
                setTimeout(() => {
                    renderizarTablero();
                }, 300);
            }, 50);
        }
    }, 300);
};

// Ajustar posición de efectos para dispositivos móviles
const mostrarEfectoCombo = (index) => {
    const tile = document.querySelector(`[data-index='${index}']`);
    if (tile) {
        tile.classList.add('matching');
        
        const rect = tile.getBoundingClientRect();
        const escala = window.innerWidth < 480 ? 0.8 : 1;
        
        // Efecto principal de estrellas
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.className = 'star-effect';
            const startX = rect.left + rect.width/2;
            const startY = rect.top + rect.height/2;
            
            const angle = (Math.PI * 2 * i) / 5;
            const distance = (20 + Math.random() * 15) * escala;
            
            star.style.left = `${startX}px`;
            star.style.top = `${startY}px`;
            star.style.fontSize = `${24 * escala}px`;
            
            document.body.appendChild(star);
            
            star.animate([
                { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1 },
                { 
                    transform: `translate(
                        calc(-50% + ${Math.cos(angle) * distance}px), 
                        calc(-50% + ${Math.sin(angle) * distance}px)
                    ) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });
            
            setTimeout(() => star.remove(), 600);
        }
        
        // Añadir mini-estrellas adicionales
        for (let i = 0; i < 8; i++) {
            const miniStar = document.createElement('div');
            miniStar.innerHTML = '✦';
            miniStar.className = 'mini-star';
            const angle = Math.random() * Math.PI * 2;
            const distance = (8 + Math.random() * 20) * escala;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            miniStar.style.left = `${rect.left + rect.width/2}px`;
            miniStar.style.top = `${rect.top + rect.height/2}px`;
            miniStar.style.fontSize = `${12 * escala}px`;
            miniStar.style.setProperty('--tx', `${tx}px`);
            miniStar.style.setProperty('--ty', `${ty}px`);
            
            document.body.appendChild(miniStar);
            
            miniStar.animate([
                { transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.8) rotate(360deg)`, opacity: 0 }
            ], {
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });
            
            setTimeout(() => miniStar.remove(), 400);
        }
    }
};

const actualizarContadorCombos = (combos) => {
    const comboCounter = document.getElementById('combo');
    const comboContainer = document.getElementById('combo-counter');

    if (combos > 1) {
        comboCounter.textContent = combos;
        comboContainer.classList.add('active');
    } else {
        comboContainer.classList.remove('active');
    }
};

// Ajustar el GIF de Momoi para móviles
const mostrarMomoiSpecial = () => {
    const gifLeft = document.createElement('img');
    const gifRight = document.createElement('img');
    
    const alturaGif = window.innerWidth < 480 ? '200px' : '300px';

    gifLeft.src = 'images/momoi-especial.gif';
    gifRight.src = 'images/momoi-especial.gif';

    Object.assign(gifLeft.style, {
        position: 'fixed',
        left: '0',
        top: '50%',
        transform: 'translateY(-50%)',
        height: alturaGif,
        zIndex: 1000
    });

    Object.assign(gifRight.style, {
        position: 'fixed',
        right: '0',
        top: '50%',
        transform: 'translateY(-50%)',
        height: alturaGif,
        zIndex: 1000
    });

    document.body.appendChild(gifLeft);
    document.body.appendChild(gifRight);

    setTimeout(() => {
        gifLeft.remove();
        gifRight.remove();
    }, 3000);
};

const activarPowerUp = (index, tipo) => {
    if (tipo === POWER_UPS.FILA) {
        const ficha1 = tablero[index];
        const ficha2 = tablero[seleccionado];
        
        // Determinar si el movimiento es horizontal o vertical
        const col1 = index % NUM_COLUMNAS;
        const col2 = seleccionado % NUM_COLUMNAS;
        const fila1 = Math.floor(index / NUM_COLUMNAS);
        const fila2 = Math.floor(seleccionado / NUM_COLUMNAS);
        const esMovimientoHorizontal = Math.abs(col1 - col2) === 1;
        
        if (esMovimientoHorizontal) {
            // Movimiento horizontal -> Eliminar columna
            const columnaAEliminar = col2;
            for (let fila = 0; fila < NUM_FILAS; fila++) {
                const i = fila * NUM_COLUMNAS + columnaAEliminar;
                tablero[i] = null;
                mostrarEfectoCombo(i);
            }
            puntuacion += NUM_FILAS * 10;
        } else {
            // Movimiento vertical -> Eliminar fila
            const filaAEliminar = fila2;
            const inicio = filaAEliminar * NUM_COLUMNAS;
            const fin = inicio + NUM_COLUMNAS;
            
            for (let i = inicio; i < fin; i++) {
                tablero[i] = null;
                mostrarEfectoCombo(i);
            }
            puntuacion += NUM_COLUMNAS * 10;
        }
        
        // Eliminar el power-up
        tablero[index] = null;
        SOUNDS.COMBO.play();
    } else if (tipo === POWER_UPS.SAME) {
        // Determinar cuál es la ficha normal y cuál es el power-up
        let indexFichaNormal, indexPowerUp;
        if (IMAGENES.includes(tablero[index])) {
            indexFichaNormal = index;
            indexPowerUp = seleccionado;
        } else {
            indexFichaNormal = seleccionado;
            indexPowerUp = index;
        }

        const fichaAEliminar = tablero[indexFichaNormal];
        let count = 0;

        // Eliminar todas las fichas del mismo tipo
        tablero.forEach((ficha, i) => {
            if (ficha === fichaAEliminar) {
                tablero[i] = null;
                mostrarEfectoCombo(i);
                count++;
            }
        });

        // Eliminar el power-up
        tablero[indexPowerUp] = null;
        SOUNDS.SPECIAL.play();
        mostrarMomoiSpecial();
        puntuacion += count * 20;
    }
    
    document.getElementById('score').textContent = puntuacion;
    setTimeout(rellenarHuecos, 300);
};

const detectarCoincidencias = () => {
    let encontrados = new Set();
    let combosEnEsteTurno = 0;

    // Función recursiva para detectar todos los combos en un turno
    const detectarTodosLosCombos = () => {
        encontrados.clear();
        let coincidencias5 = new Set();
        let coincidencias4 = new Set();
        let coincidencias3 = new Set();

        // Coincidencias en filas
        for (let fila = 0; fila < NUM_FILAS; fila++) {
            for (let col = 0; col < NUM_COLUMNAS - 4; col++) {
                const i = fila * NUM_COLUMNAS + col;
                if (
                    tablero[i] &&
                    IMAGENES.includes(tablero[i]) &&
                    tablero[i] === tablero[i + 1] &&
                    tablero[i] === tablero[i + 2] &&
                    tablero[i] === tablero[i + 3] &&
                    tablero[i] === tablero[i + 4]
                ) {
                    // Coincidencia de 5
                    for (let j = 0; j < 5; j++) {
                        coincidencias5.add(i + j);
                    }
                }
            }
        }

        // Coincidencias en columnas de 5
        for (let col = 0; col < NUM_COLUMNAS; col++) {
            for (let fila = 0; fila < NUM_FILAS - 4; fila++) {
                const i = fila * NUM_COLUMNAS + col;
                if (
                    tablero[i] &&
                    IMAGENES.includes(tablero[i]) &&
                    tablero[i] === tablero[i + NUM_COLUMNAS] &&
                    tablero[i] === tablero[i + NUM_COLUMNAS * 2] &&
                    tablero[i] === tablero[i + NUM_COLUMNAS * 3] &&
                    tablero[i] === tablero[i + NUM_COLUMNAS * 4]
                ) {
                    // Coincidencia de 5
                    for (let j = 0; j < 5; j++) {
                        coincidencias5.add(i + (j * NUM_COLUMNAS));
                    }
                }
            }
        }

        // Si no hay coincidencias de 5, buscar coincidencias de 4
        if (coincidencias5.size === 0) {
            // Filas de 4
            for (let fila = 0; fila < NUM_FILAS; fila++) {
                for (let col = 0; col < NUM_COLUMNAS - 3; col++) {
                    const i = fila * NUM_COLUMNAS + col;
                    if (
                        tablero[i] &&
                        IMAGENES.includes(tablero[i]) &&
                        tablero[i] === tablero[i + 1] &&
                        tablero[i] === tablero[i + 2] &&
                        tablero[i] === tablero[i + 3]
                    ) {
                        // Coincidencia de 4
                        for (let j = 0; j < 4; j++) {
                            coincidencias4.add(i + j);
                        }
                    }
                }
            }

            // Columnas de 4
            for (let col = 0; col < NUM_COLUMNAS; col++) {
                for (let fila = 0; fila < NUM_FILAS - 3; fila++) {
                    const i = fila * NUM_COLUMNAS + col;
                    if (
                        tablero[i] &&
                        IMAGENES.includes(tablero[i]) &&
                        tablero[i] === tablero[i + NUM_COLUMNAS] &&
                        tablero[i] === tablero[i + NUM_COLUMNAS * 2] &&
                        tablero[i] === tablero[i + NUM_COLUMNAS * 3]
                    ) {
                        // Coincidencia de 4
                        for (let j = 0; j < 4; j++) {
                            coincidencias4.add(i + (j * NUM_COLUMNAS));
                        }
                    }
                }
            }
        }

        // Si no hay coincidencias de 4 o 5, buscar coincidencias de 3
        if (coincidencias5.size === 0 && coincidencias4.size === 0) {
            // Filas de 3
            for (let fila = 0; fila < NUM_FILAS; fila++) {
                for (let col = 0; col < NUM_COLUMNAS - 2; col++) {
                    const i = fila * NUM_COLUMNAS + col;
                    if (
                        tablero[i] &&
                        IMAGENES.includes(tablero[i]) &&
                        tablero[i] === tablero[i + 1] &&
                        tablero[i] === tablero[i + 2]
                    ) {
                        for (let j = 0; j < 3; j++) {
                            coincidencias3.add(i + j);
                        }
                    }
                }
            }

            // Columnas de 3
            for (let col = 0; col < NUM_COLUMNAS; col++) {
                for (let fila = 0; fila < NUM_FILAS - 2; fila++) {
                    const i = fila * NUM_COLUMNAS + col;
                    if (
                        tablero[i] &&
                        IMAGENES.includes(tablero[i]) &&
                        tablero[i] === tablero[i + NUM_COLUMNAS] &&
                        tablero[i] === tablero[i + NUM_COLUMNAS * 2]
                    ) {
                        for (let j = 0; j < 3; j++) {
                            coincidencias3.add(i + (j * NUM_COLUMNAS));
                        }
                    }
                }
            }
        }

        // Procesar coincidencias y crear power-ups
        if (coincidencias5.size > 0) {
            encontrados = coincidencias5;
            // Crear SUPER_DORO power-up en el centro de la coincidencia
            const centro = Array.from(coincidencias5)[Math.floor(coincidencias5.size / 2)];
            tablero[centro] = POWER_UPS.SUPER_DORO;
            coincidencias5.delete(centro);
        } else if (coincidencias4.size > 0) {
            encontrados = coincidencias4;
            // Crear DORO_MINI power-up en el centro de la coincidencia
            const centro = Array.from(coincidencias4)[Math.floor(coincidencias4.size / 2)];
            tablero[centro] = POWER_UPS.DORO_MINI;
            coincidencias4.delete(centro);
        } else if (coincidencias3.size > 0) {
            encontrados = coincidencias3;
        }

        if (encontrados.size > 0) {
            combosEnEsteTurno++;

            // Reproducir sonido solo si es el segundo combo o más en este turno
            if (combosEnEsteTurno > 1) {
                SOUNDS.COMBO.currentTime = 0;
                SOUNDS.COMBO.play();
            }

            encontrados.forEach(i => {
                if (tablero[i] !== POWER_UPS.SUPER_DORO && tablero[i] !== POWER_UPS.DORO_MINI) {
                    tablero[i] = null;
                    mostrarEfectoCombo(i);
                }
            });

            puntuacion += encontrados.size * 10;
            document.getElementById('score').textContent = puntuacion;

            // Continuar buscando más combos después de rellenar
            setTimeout(() => {
                rellenarHuecos();
                setTimeout(() => {
                    detectarTodosLosCombos();
                }, 600);
            }, 300);

            return true;
        }

        // Si no hay más combos en este turno, actualizar combosConsecutivos
        if (combosEnEsteTurno > 0) {
            combosConsecutivos = Math.max(combosConsecutivos, combosEnEsteTurno);
            actualizarContadorCombos(combosConsecutivos);
            verificarMeta();
        } else {
            combosConsecutivos = 0;
            actualizarContadorCombos(0);
        }

        return false;
    };

    return detectarTodosLosCombos();
};

const rellenarHuecos = () => {
    const columnasAfectadas = new Set();
    
    // Identificar columnas afectadas
    for (let col = 0; col < NUM_COLUMNAS; col++) {
        for (let fila = 0; fila < NUM_FILAS; fila++) {
            const i = fila * NUM_COLUMNAS + col;
            if (tablero[i] === null) {
                columnasAfectadas.add(col);
                break;
            }
        }
    }

    // Procesar columnas afectadas
    columnasAfectadas.forEach(col => {
        let espaciosVacios = 0;
        let fichasMovidas = [];
        
        // Primero mover las fichas existentes hacia abajo
        for (let fila = NUM_FILAS - 1; fila >= 0; fila--) {
            const i = fila * NUM_COLUMNAS + col;
            if (tablero[i] === null) {
                espaciosVacios++;
            } else if (espaciosVacios > 0) {
                const nuevaPosicion = i + (espaciosVacios * NUM_COLUMNAS);
                tablero[nuevaPosicion] = tablero[i];
                tablero[i] = null;
                fichasMovidas.push({
                    desde: i,
                    hasta: nuevaPosicion,
                    imagen: tablero[nuevaPosicion]
                });
            }
        }
        
        // Generar nuevas fichas arriba con posiciones virtuales
        for (let i = 0; i < espaciosVacios; i++) {
            const posicionFinal = i * NUM_COLUMNAS + col;
            const posicionVirtual = -1 - i; // Posición virtual arriba del tablero
            tablero[posicionFinal] = IMAGENES[Math.floor(Math.random() * IMAGENES.length)];
            
            const tile = document.createElement('div');
            tile.className = 'tile new-tile';
            tile.style.backgroundImage = `url(${tablero[posicionFinal]})`;
            tile.style.left = `${col * 58}px`; // Ajusta este valor según el tamaño de tus fichas
            tile.style.top = `${-100 * (i + 1)}px`;
            tile.style.animationDelay = `${i * 0.1}s`;
            
            document.getElementById('game-board').appendChild(tile);
            
            setTimeout(() => tile.remove(), 800); // Remover después de que termine la animación
        }
    });

    renderizarTablero();

    // Esperar a que terminen las animaciones antes de buscar nuevas coincidencias
    const maxDelay = Math.max(...Array.from(columnasAfectadas).map(col => 
        tablero.filter((_, i) => i % NUM_COLUMNAS === col).filter(x => x === null).length
    )) * 0.1 + 0.8;

    setTimeout(() => {
        detectarCoincidencias();
    }, maxDelay * 1000);
};

const manejarClick = (index) => {
    const tile = document.querySelector(`[data-index='${index}']`);
    
    if (seleccionado === null) {
        // Primera selección - permite seleccionar cualquier ficha
        seleccionado = index;
        tile.classList.add('selected');
    } else {
        // Segunda selección
        const tileAnterior = document.querySelector(`[data-index='${seleccionado}']`);
        
        if (seleccionado === index) {
            // Deseleccionar si se hace clic en la misma ficha
            seleccionado = null;
            tile.classList.remove('selected');
        } else if (esAdyacente(seleccionado, index)) {
            // Realizar el intercambio si son adyacentes
            const ficha1 = tablero[seleccionado];
            const ficha2 = tablero[index];
            
            // Limpiar selección
            if (tileAnterior) tileAnterior.classList.remove('selected');
            tile.classList.remove('selected');
            
            // Verificar power-ups (ahora funciona en ambas direcciones)
            if (Object.values(POWER_UPS).includes(ficha1) || Object.values(POWER_UPS).includes(ficha2)) {
                if (Object.values(POWER_UPS).includes(ficha1)) {
                    activarPowerUp(seleccionado, ficha1);
                } else {
                    activarPowerUp(index, ficha2);
                }
            } else {
                intercambiar(seleccionado, index);
            }
            seleccionado = null;
        } else {
            // Si no son adyacentes, actualizar la selección
            if (tileAnterior) tileAnterior.classList.remove('selected');
            seleccionado = index;
            tile.classList.add('selected');
        }
    }
};

// Verificar si se alcanzó la meta actual
const verificarMeta = () => {
    if (puntuacion >= metaActual) {
        nivelActual++;
        if (nivelActual <= metas.length) {
            metaActual = metas[nivelActual - 1];
            document.getElementById('current-goal').textContent = metaActual;

            // Mostrar mensaje de nivel completado
            mostrarMensajeNivel();

            // Dar tiempo extra como recompensa
            tiempoRestante += 30;
            document.getElementById('time').textContent = tiempoRestante;
        } else {
            // Juego completado
            alert('¡Felicidades! Has completado todos los niveles con una puntuación de ' + puntuacion);
            reiniciarJuego();
        }
    }
};

// Mostrar mensaje de nivel completado
const mostrarMensajeNivel = () => {
    const mensaje = document.createElement('div');
    mensaje.className = 'nivel-mensaje';
    mensaje.innerHTML = `
        <div class="nivel-contenido">
            <h2>¡Nivel ${nivelActual-1} Completado!</h2>
            <p>¡Genial! Has alcanzado la meta</p>
            <p>Nueva meta: ${metaActual} puntos</p>
            <p>+30 segundos de bonificación</p>
        </div>
    `;
    document.body.appendChild(mensaje);

    setTimeout(() => {
        mensaje.classList.add('mostrar');
    }, 100);

    setTimeout(() => {
        mensaje.classList.remove('mostrar');
        setTimeout(() => mensaje.remove(), 500);
    }, 3000);
};

// Agregar meta al juego
let metaPuntos = 1000;

const iniciarTimer = () => {
    const timerElement = document.getElementById('time');
    const interval = setInterval(() => {
        tiempoRestante--;
        timerElement.textContent = tiempoRestante;

        // Verificar si se alcanzó la meta
        if (puntuacion >= metaPuntos) {
            clearInterval(interval);
            setTimeout(() => {
                alert('¡Felicitaciones! ¡Has alcanzado la meta!');
                reiniciarJuego();
            }, 500);
        }

        if (tiempoRestante <= 0) {
            clearInterval(interval);
            setTimeout(() => {
                if (puntuacion >= metaPuntos) {
                    alert('¡Felicitaciones! ¡Has alcanzado la meta!');
                } else {
                    alert(`¡Tiempo terminado! Tu puntuación final es: ${puntuacion}`);
                }
                reiniciarJuego();
            }, 500);
        }
    }, 1000);
};

const reiniciarJuego = () => {
    puntuacion = 0;
    tiempoRestante = 60;
    nivelActual = 1;
    metaActual = metas[0];
    combosConsecutivos = 0;

    // Actualizar todos los elementos de la interfaz
    document.getElementById('score').textContent = puntuacion;
    document.getElementById('time').textContent = tiempoRestante;
    document.getElementById('current-goal').textContent = metaActual;
    document.getElementById('combo').textContent = '0';

    // Quitar clases de tiempo bajo
    document.getElementById('timer-container').classList.remove('time-low');
    document.getElementById('combo-counter').classList.remove('active');

    generarTablero();
    iniciarTimer();
};

document.addEventListener('DOMContentLoaded', () => {
    ajustarTamañoTablero();
    iniciarTimer();
});