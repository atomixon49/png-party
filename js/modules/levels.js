class LevelManager {
    constructor() {
        this.nivelActual = 1;
        this.metaActual = LEVELS.GOALS[0];
        this.tiempoRestante = GAME_CONFIG.INITIAL_TIME;
    }

    verificarNivelCompletado(puntuacion) {
        if (puntuacion >= this.metaActual) {
            this.nivelActual++;
            if (this.nivelActual <= LEVELS.GOALS.length) {
                this.metaActual = LEVELS.GOALS[this.nivelActual - 1];
                this.tiempoRestante += GAME_CONFIG.LEVEL_TIME_BONUS;
                
                UIManager.actualizarMeta(this.metaActual);
                UIManager.mostrarMensajeNivel(this.nivelActual, this.metaActual);
                UIManager.actualizarTiempo(this.tiempoRestante);
                
                return true;
            }
            return 'GAME_COMPLETED';
        }
        return false;
    }

    obtenerMetaActual() {
        return this.metaActual;
    }

    obtenerNivelActual() {
        return this.nivelActual;
    }

    obtenerTiempoRestante() {
        return this.tiempoRestante;
    }

    actualizarTiempo(tiempo) {
        this.tiempoRestante = tiempo;
        UIManager.actualizarTiempo(this.tiempoRestante);
    }

    reiniciarNiveles() {
        this.nivelActual = 1;
        this.metaActual = LEVELS.GOALS[0];
        this.tiempoRestante = GAME_CONFIG.INITIAL_TIME;
        
        UIManager.actualizarMeta(this.metaActual);
        UIManager.actualizarTiempo(this.tiempoRestante);
    }
}