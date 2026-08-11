import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `SITE_URL` se calcula al cargar el módulo, así que cada caso necesita
 * recargarlo con otro entorno. Es la única forma de probar algo que en
 * producción se decide una sola vez, al compilar.
 */
async function siteUrlWith(env: Record<string, string | undefined>): Promise<string> {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
  return (await import("./site")).SITE_URL;
}

afterEach(() => vi.unstubAllEnvs());

describe("SITE_URL", () => {
  it("usa la variable explícita cuando está", async () => {
    const url = await siteUrlWith({ NEXT_PUBLIC_SITE_URL: "https://listasupermercado.com" });

    expect(url).toBe("https://listasupermercado.com");
  });

  it("quita la barra final, que duplicaría la de las rutas", async () => {
    const url = await siteUrlWith({ NEXT_PUBLIC_SITE_URL: "https://listasupermercado.com/" });

    expect(url).toBe("https://listasupermercado.com");
  });

  // El fallo que esto evita es silencioso y caro: un despliegue sin la
  // variable publicaba un sitemap lleno de URLs de localhost, y Search Console
  // lo rechaza entero porque no pertenecen al dominio verificado.
  it("sin variable, cae en el dominio de producción de Vercel", async () => {
    const url = await siteUrlWith({
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "listasupermercado.com",
    });

    expect(url).toBe("https://listasupermercado.com");
  });

  it("en una previsualización, el dominio de esa previsualización", async () => {
    const url = await siteUrlWith({
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_URL: "shoppinglist-abc123.vercel.app",
    });

    expect(url).toBe("https://shoppinglist-abc123.vercel.app");
  });

  it("fuera de Vercel y sin variable, localhost", async () => {
    const url = await siteUrlWith({
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_URL: undefined,
    });

    expect(url).toBe("http://localhost:3000");
  });

  it("la dirección elegida nunca lleva protocolo duplicado", async () => {
    const url = await siteUrlWith({
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "listasupermercado.com",
    });

    expect(url.match(/https?:\/\//g)).toHaveLength(1);
  });
});
