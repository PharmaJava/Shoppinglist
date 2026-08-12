"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Qué enseñar cuando algo revienta dentro. Recibe el error y una función
   *  para volver a intentarlo montando el árbol otra vez. */
  fallback: (error: Error, reset: () => void) => ReactNode;
}

/**
 * Límite de error local.
 *
 * Sin él, cualquier excepción dentro de la hoja de compartir escapaba hasta
 * `global-error.tsx`, que sustituye la página **entera** por «Algo ha ido mal»
 * y se lleva por delante la lista que había detrás. Peor aún: no dice qué ha
 * pasado, así que quien lo sufre sólo puede contar que «al compartir falla».
 *
 * Con esto, el estropicio se queda en el panel que lo causó y el mensaje del
 * error queda a la vista, que es lo único que permite arreglarlo.
 *
 * Tiene que ser una clase: `componentDidCatch` no existe en los hooks.
 */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ListaSupermercado]", error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}
