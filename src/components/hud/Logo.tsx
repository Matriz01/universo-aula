/**
 * Logo — icono de la aplicación Universo Aula.
 *
 * SVG inline mínimo (sol estilizado + texto "UA").
 * A11y: role="img" aria-label="Universo Aula".
 * pointer-events-none: no interfiere con interacciones del canvas.
 * Sin props, sin store, sin i18n.
 */

/**
 * Icono de Universo Aula. No interactivo.
 */
export function Logo() {
  return (
    <div className="pointer-events-none select-none">
      <svg
        role="img"
        aria-label="Universo Aula"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sol estilizado */}
        <circle cx="16" cy="16" r="8" fill="#FFD700" opacity="0.9" />
        <circle cx="16" cy="16" r="6" fill="#FFA500" opacity="0.8" />
        {/* Rayos */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 16 + 10 * Math.cos(rad);
          const y1 = 16 + 10 * Math.sin(rad);
          const x2 = 16 + 14 * Math.cos(rad);
          const y2 = 16 + 14 * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FFD700"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}
      </svg>
    </div>
  );
}

Logo.displayName = 'Logo';
