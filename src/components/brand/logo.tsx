interface LogoProps {
  size?: number;
  /** Color del cuerpo de la cesta. */
  basketColor?: string;
  /** Color del check, que va calado sobre la cesta. */
  checkColor?: string;
}

/**
 * Marca de ListaSupermercado: una cesta de la compra con un check dentro —
 * las dos ideas del producto (comprar y marcar) en una sola figura.
 *
 * Los colores se pasan explícitos, sin variables CSS ni clases de Tailwind,
 * porque este mismo componente se rasteriza con Satori para la imagen de
 * Open Graph y allí sólo se resuelven valores literales.
 */
export function Logo({ size = 32, basketColor = "#1fa971", checkColor = "#ffffff" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // Decorativo en todos sus usos: siempre va acompañado del nombre
      // escrito. Además Satori pinta cualquier <title> como texto visible.
      aria-hidden="true"
    >
      <path
        d="M16 17v-3.5a8 8 0 0 1 16 0V17"
        stroke={basketColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 17h35l-3.1 20.8A6 6 0 0 1 32.5 43h-17a6 6 0 0 1-5.9-5.2L6.5 17Z"
        fill={basketColor}
      />
      <path
        d="m17.5 28.5 4.5 4.5 9-9"
        stroke={checkColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
