class UIManager {
    static actualizarPuntuacion(puntos) {
        document.getElementById('score').textContent = puntos;
    }

    static actualizarTiempo(tiempo) {
        const timerElement = document.getElementById('time');
        timerElement.textContent = tiempo;
        
        const timerContainer = document.getElementById('timer-container');
        if (tiempo <= 10) {
            timerContainer.classList.add('time-low');
        } else {
            timerContainer.classList.remove('time-low');
        }
    }

    static actualizarMeta(meta) {
        document.getElementById('current-goal').textContent = meta;
    }

    static actualizarContadorCombos(combos) {
        const comboCounter = document.getElementById('combo');
        const comboContainer = document.getElementById('combo-counter');

        if (combos > 1) {
            comboCounter.textContent = combos;
            comboContainer.classList.add('active');
        } else {
            comboContainer.classList.remove('active');
        }
    }

    static mostrarMensajeNivel(nivelActual, metaActual) {
        const mensaje = document.createElement('div');
        mensaje.className = 'nivel-mensaje';
        mensaje.innerHTML = `
            <div class="nivel-contenido">
                <h2>¡Nivel ${nivelActual-1} Completado!</h2>
                <p>¡Genial! Has alcanzado la meta</p>
                <p>Nueva meta: ${metaActual} puntos</p>
                <p>+${GAME_CONFIG.LEVEL_TIME_BONUS} segundos de bonificación</p>
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
    }

    static mostrarGameOver(puntuacion, metaAlcanzada) {
        return new Promise((resolve) => {
            // Remover cualquier modal existente primero
            const modalesExistentes = document.querySelectorAll('.game-over');
            modalesExistentes.forEach(modal => modal.remove());

            const mensaje = document.createElement('div');
            mensaje.className = 'game-over';
            mensaje.innerHTML = `
                <div class="game-over-contenido">
                    <h2>${metaAlcanzada ? '¡Felicitaciones!' : 'Juego Terminado'}</h2>
                    <p>${metaAlcanzada ? '¡Has alcanzado la meta!' : 'Se acabó el tiempo'}</p>
                    <p>Puntuación final: <span>${puntuacion}</span></p>
                    <button id="reiniciar-btn">Jugar de nuevo</button>
                </div>
            `;

            // Esperar a que cualquier modal anterior se cierre
            setTimeout(() => {
                document.body.appendChild(mensaje);
                requestAnimationFrame(() => {
                    mensaje.classList.add('mostrar');
                });

                const reiniciarBtn = mensaje.querySelector('#reiniciar-btn');
                const handleClick = () => {
                    reiniciarBtn.disabled = true; // Prevenir múltiples clicks
                    mensaje.classList.remove('mostrar');
                    reiniciarBtn.removeEventListener('click', handleClick);
                    
                    setTimeout(() => {
                        mensaje.remove();
                        resolve();
                    }, 300);
                };
                
                reiniciarBtn.addEventListener('click', handleClick);
            }, 100);
        });
    }
}