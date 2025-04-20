class EffectsManager {
    static async mostrarEfectoCombo(index) {
        const tile = document.querySelector(`[data-index='${index}']`);
        if (!tile) return;

        tile.classList.add('matching');
        
        const rect = tile.getBoundingClientRect();
        const escala = window.innerWidth < 480 ? 0.8 : 1;
        
        await Promise.all([
            this.crearEstrellasprincipales(rect, escala),
            this.crearMiniEstrellas(rect, escala)
        ]);
    }

    static crearEstrellasprincipales(rect, escala) {
        return new Promise(resolve => {
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
                
                const animation = star.animate([
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
                
                animation.onfinish = () => {
                    star.remove();
                    if (i === 4) resolve();
                };
            }
        });
    }

    static crearMiniEstrellas(rect, escala) {
        return new Promise(resolve => {
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
                
                const animation = miniStar.animate([
                    { transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.8) rotate(360deg)`, opacity: 0 }
                ], {
                    duration: 400,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                });
                
                animation.onfinish = () => {
                    miniStar.remove();
                    if (i === 7) resolve();
                };
            }
        });
    }

    static mostrarMomoiSpecial() {
        const gifLeft = document.createElement('img');
        const gifRight = document.createElement('img');
        
        gifLeft.src = 'images/momoi-especial.gif';
        gifRight.src = 'images/momoi-especial.gif';
        
        gifLeft.className = 'momoi-special left';
        gifRight.className = 'momoi-special right';

        document.body.appendChild(gifLeft);
        document.body.appendChild(gifRight);

        // Después de 2.5 segundos, añadir la clase de salida
        setTimeout(() => {
            gifLeft.classList.add('salida');
            gifRight.classList.add('salida');
            
            // Remover los elementos después de la animación de salida
            setTimeout(() => {
                gifLeft.remove();
                gifRight.remove();
            }, 500);
        }, 2500);
    }

    static reproducirSonido(tipo) {
        try {
            const sound = tipo === 'combo' ? ASSETS.SOUNDS.COMBO : ASSETS.SOUNDS.SPECIAL;
            if (sound && sound.play) {
                sound.currentTime = 0;
                sound.volume = 0.5; // Volumen al 50%
                const playPromise = sound.play();
                if (playPromise) {
                    playPromise.catch(e => console.log("Error reproduciendo sonido:", e));
                }
            }
        } catch (error) {
            console.log("Error con el sonido:", error);
        }
    }
}