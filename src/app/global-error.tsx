"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Sustituye por completo el layout raíz cuando un error escapa de todos los
 * demás límites de error — por eso lleva su propio <html>/<body> y no puede
 * usar el resto del árbol de la app (ni next-intl).
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "0.5rem",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            textAlign: "center",
            padding: "1.5rem",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>🛒</span>
          <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Algo ha ido mal / Something went wrong</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              border: "1px solid #d4d4d4",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Reintentar / Retry
          </button>
        </div>
      </body>
    </html>
  );
}
