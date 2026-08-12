import { defineConfig, devices } from "@playwright/test";

/**
 * E2E sobre el servidor de producción, no el de desarrollo: lo que se
 * comprueba aquí —metadatos, hreflang, sitemap, hoja de impresión— sale del
 * build, y en `next dev` no siempre coincide.
 *
 * Cubre lo que no necesita sesión de Supabase. Los flujos con lista real
 * (tiempo real entre dos navegadores, offline) exigen credenciales de un
 * proyecto de pruebas; ver `e2e/README.md`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3111",
    trace: "on-first-retry",
    // En el CI se instala el navegador que toca y esto queda a `undefined`.
    // La variable sirve para máquinas donde ya hay un Chromium instalado con
    // otra versión, y evita descargarse otro de 150 MB para lo mismo.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
  },

  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "pnpm build && pnpm start --port 3111",
    url: "http://localhost:3111/es",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // El build no llama a Supabase, sólo necesita las variables para
      // resolver los módulos del cliente (igual que en el CI).
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "clave-de-ejemplo-para-e2e",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3111",
      // Panel de administración. La contraseña de estas pruebas es
      // `contrasena-de-pruebas-e2e`, y esto es su hash: aquí no hay nada que
      // proteger —es un servidor local sin datos— y tenerlo fijo permite
      // probar el acceso de verdad, que es justo lo que hay que probar.
      ADMIN_EMAIL: "admin@ejemplo.com",
      ADMIN_PASSWORD_HASH:
        "scrypt$32768$8$1$febe35bc3340bedf003e2c0798f33905$30a2c908729e9c6206ddfbeae7f28124bbb5c1668c04a060b57d6f49ec8189a7",
    },
  },
});
