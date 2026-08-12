export interface LimitadorOpciones {
  /** Fallos consecutivos antes de bloquear. */
  maxIntentos: number;
  /** Cuánto dura el bloqueo, en milisegundos. */
  bloqueoMs: number;
  /** Tras cuánto tiempo sin intentos se olvida el contador. */
  olvidoMs: number;
}

interface Entrada {
  fallos: number;
  ultimo: number;
  bloqueadoHasta: number;
}

export interface Limitador {
  /** Milisegundos que faltan para poder volver a intentarlo; 0 si se puede ya. */
  esperaRestante(clave: string, ahora: number): number;
  registrarFallo(clave: string, ahora: number): void;
  registrarExito(clave: string): void;
}

/**
 * Freno para la pantalla de acceso del panel.
 *
 * Vive en memoria, así que en Vercel es por instancia y se pierde en cada
 * despliegue. No es un antídoto contra un ataque distribuido —para eso está la
 * contraseña larga y el scrypt— sino contra lo que de verdad pasa: alguien
 * encuentra la URL y se pone a probar contraseñas desde una pestaña.
 */
export function crearLimitador({ maxIntentos, bloqueoMs, olvidoMs }: LimitadorOpciones): Limitador {
  const entradas = new Map<string, Entrada>();

  function limpiar(ahora: number) {
    for (const [k, v] of entradas) {
      if (ahora - v.ultimo > olvidoMs && v.bloqueadoHasta <= ahora) entradas.delete(k);
    }
  }

  return {
    esperaRestante(clave, ahora) {
      const entrada = entradas.get(clave);
      if (!entrada) return 0;
      return Math.max(0, entrada.bloqueadoHasta - ahora);
    },

    registrarFallo(clave, ahora) {
      limpiar(ahora);
      const previa = entradas.get(clave);
      // Si el contador ya había caducado, se empieza de cero: quien se
      // equivocó dos veces el mes pasado no arrastra penalización.
      const fallos = previa && ahora - previa.ultimo <= olvidoMs ? previa.fallos + 1 : 1;

      entradas.set(clave, {
        fallos,
        ultimo: ahora,
        bloqueadoHasta: fallos >= maxIntentos ? ahora + bloqueoMs : 0,
      });
    },

    registrarExito(clave) {
      entradas.delete(clave);
    },
  };
}
