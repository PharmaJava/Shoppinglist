import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    server: {
      // Sin esto, next-intl se carga con el ESM de Node, que no aplica los
      // alias de abajo y no sabe resolver su `import "next/navigation"`.
      deps: { inline: ["next-intl"] },
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      // next-intl importa "next/navigation" desde su build ESM, y ahí Vite
      // resuelve sin el mapa `exports` de next: falla con un «Cannot find
      // module» al montar cualquier componente que use `@/i18n/navigation`.
      // Apuntar al archivo real es lo mismo que hace Next en producción.
      "next/navigation": new URL("./node_modules/next/navigation.js", import.meta.url).pathname,
    },
  },
});
