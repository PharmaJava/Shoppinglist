import type { Metadata } from "next";
import Link from "next/link";
import { Dashboard } from "@/components/admin/dashboard";
import { adminConfigurado, haySesionAdmin } from "@/lib/admin/auth";
import { pistaDelError } from "@/lib/admin/diagnostico";
import { obtenerKpis } from "@/lib/admin/kpis";
import { salirAction } from "./actions";
import { LoginForm } from "./login-form";

/**
 * Panel de administración.
 *
 * Fuera de `[locale]` a propósito: no es producto, es instrumental, y está
 * sólo en español. `noindex` en los metadatos y `Disallow` en robots.txt, pero
 * lo que de verdad lo protege es la contraseña — robots.txt es una petición
 * educada, no una puerta.
 */
export const metadata: Metadata = {
  title: "Panel · ListaSupermercado",
  robots: { index: false, follow: false, nocache: true },
};

// Lee cookies y datos en vivo: nada que prerrenderizar.
export const dynamic = "force-dynamic";

const RANGOS = [7, 30, 90] as const;

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      {children}
    </main>
  );
}

export default async function VegetaPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  if (!adminConfigurado()) {
    return (
      <Marco>
        <h1 className="text-2xl font-bold text-on-surface">Panel sin configurar</h1>
        <p className="max-w-prose text-on-surface-muted">
          Faltan <code className="font-mono text-sm">ADMIN_EMAIL</code> o{" "}
          <code className="font-mono text-sm">ADMIN_PASSWORD_HASH</code> en las variables de entorno
          del servidor. El hash se genera con{" "}
          <code className="font-mono text-sm">node scripts/admin-hash.mjs</code>; está explicado en{" "}
          <code className="font-mono text-sm">docs/09-ADMIN.md</code>.
        </p>
      </Marco>
    );
  }

  if (!(await haySesionAdmin())) {
    return (
      <Marco>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
          <h1 className="text-2xl font-bold text-on-surface">Panel</h1>
          <LoginForm />
        </div>
      </Marco>
    );
  }

  const { dias: diasParam } = await searchParams;
  const solicitados = Number(diasParam);
  const dias = RANGOS.includes(solicitados as (typeof RANGOS)[number]) ? solicitados : 30;

  const resultado = await obtenerKpis(dias);

  return (
    <Marco>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Panel</h1>
          <p className="text-sm text-on-surface-muted">
            {resultado.ok
              ? `Datos de ${new Date(resultado.kpis.generado_en).toLocaleString("es-ES")}`
              : "Sin datos"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <nav aria-label="Rango" className="flex gap-1 rounded-full bg-surface-muted p-1">
            {RANGOS.map((rango) => (
              <Link
                key={rango}
                href={`/vegeta?dias=${rango}`}
                aria-current={rango === dias ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  rango === dias
                    ? "bg-brand text-brand-contrast"
                    : "text-on-surface-muted hover:text-on-surface"
                }`}
              >
                {rango} d
              </Link>
            ))}
          </nav>

          <form action={salirAction}>
            <button
              type="submit"
              className="text-sm font-medium text-on-surface-muted underline hover:text-on-surface"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {resultado.ok ? (
        <Dashboard kpis={resultado.kpis} />
      ) : (
        <div className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent/5 p-5">
          <h2 className="font-semibold text-on-surface">No se han podido leer las métricas</h2>

          {resultado.motivo === "sin_configurar" ? (
            <p className="text-sm text-on-surface-muted">
              Falta SUPABASE_SERVICE_ROLE_KEY en el servidor: sin ella no se pueden contar las
              listas de todo el mundo, sólo las propias.
            </p>
          ) : (
            <>
              {/* Primero qué hacer, y debajo lo que ha dicho Postgres. Al
                  revés se lee el mensaje técnico y se cierra la página. */}
              {pistaDelError(resultado.detalle ?? "") && (
                <p className="text-sm font-medium text-on-surface">
                  {pistaDelError(resultado.detalle ?? "")}
                </p>
              )}
              <p className="break-words font-mono text-xs text-on-surface-muted">
                {resultado.detalle}
              </p>
            </>
          )}
        </div>
      )}
    </Marco>
  );
}
