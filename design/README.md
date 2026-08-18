# Maquetas

Las direcciones visuales que se están explorando para la portada y para la pantalla de la lista,
antes de tocar el código de verdad.

| Archivo | Qué es |
|---|---|
| `Main.dc.html` | **Hoy**: lo que hay en producción, recreado con los valores reales de `src/app/globals.css` |
| `A_Mercado.dc.html` | Dirección A — cálida, papel crema, bloques verdes, *Bricolage Grotesque* |
| `B_Editorial.dc.html` | Dirección B — serena, serif *Instrument Serif*, filetes finos, el verde muy contenido |
| `C_Nocturno.dc.html` | Dirección C — oscura de nacimiento, alto contraste, *Space Grotesk* |
| `canvas.json` | Dónde va cada tablero en el lienzo, y las notas |

El primero existe para que la comparación sea honesta: se compara contra lo que hay, no contra el
recuerdo de lo que hay. Por eso lleva los tokens OKLCH, los 56 px de objetivo táctil y los radios
exactos, copiados del código y no redondeados.

Cada dirección lleva escrito, en el propio tablero, su motivo y lo que se pierde a cambio.

## Qué no se toca en ninguna

El verde de marca, los 56 px de objetivo táctil, el orden por pasillos y los textos reales de la
web —se compara diseño, no redacción—.

Lo que sí cambia en las tres: **los emoji dejan de hacer de icono**. Hoy los hay en el hero y en las
cabeceras de pasillo; se ven distintos en cada móvil y no se pueden recolorear, así que pasan a
iconos dibujados.

## Cómo se regenera

Estos archivos son la fuente. El `.html` que se publica lo genera la herramienta de diseño a partir
de ellos y **no está en git**: son 2 MB de editor y no se edita a mano. Para cambiar una maqueta se
edita su `.dc.html`, se vuelve a generar y se vuelve a publicar sobre el mismo enlace.
