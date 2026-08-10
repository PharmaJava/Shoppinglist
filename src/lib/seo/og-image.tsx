import { ImageResponse } from "next/og";
import { Logo } from "@/components/brand/logo";

/** 1200×630 es la proporción que esperan Facebook, LinkedIn, X y WhatsApp. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BRAND = "#1fa971";
const BRAND_DARK = "#0d5c3d";

interface OgImageOptions {
  title: string;
  description: string;
}

/**
 * Imagen de previsualización para redes sociales y mensajería.
 *
 * Se rasteriza con Satori, que sólo entiende un subconjunto de CSS: colores
 * literales (nada de `oklch()` ni variables), y `display: flex` explícito en
 * todo contenedor con más de un hijo. Por eso no reutiliza las clases de
 * Tailwind del resto de la interfaz.
 */
export function renderOgImage({ title, description }: OgImageOptions) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        backgroundColor: BRAND,
        backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Logo size={72} basketColor="#ffffff" checkColor={BRAND_DARK} />
        <span style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>ListaSupermercado</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 32, color: "rgba(255,255,255,0.85)", lineHeight: 1.35 }}>
          {description}
        </span>
      </div>

      <span style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
        listasupermercado.com
      </span>
    </div>,
    OG_SIZE,
  );
}
