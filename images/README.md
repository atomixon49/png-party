# Directorio de Imágenes

Este directorio está destinado a almacenar las imágenes que se utilizarán en el juego.

## Estructura recomendada

Se recomienda organizar las imágenes de la siguiente manera:

```
images/
├── items/           # Imágenes para los elementos del juego
├── backgrounds/     # Fondos para el juego
├── ui/              # Elementos de la interfaz de usuario
└── effects/         # Efectos visuales
```

## Formatos recomendados

Para un rendimiento óptimo en dispositivos de bajo rendimiento:

- Utiliza imágenes PNG para elementos con transparencia
- Optimiza el tamaño de las imágenes (compresión)
- Mantén dimensiones consistentes para los elementos del mismo tipo
- Considera usar sprites para mejorar el rendimiento

## Nombres de archivo

Se recomienda usar nombres descriptivos y consistentes, por ejemplo:

- `item_type1.png`, `item_type2.png`, etc.
- `bg_main.png`, `bg_game.png`
- `btn_start.png`, `btn_reset.png`
