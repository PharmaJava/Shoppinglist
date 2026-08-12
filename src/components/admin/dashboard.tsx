import type { ReactNode } from "react";
import { cuota, decimal, euros, numero, porcentaje, variacion } from "@/lib/admin/format";
import type { Kpis } from "@/lib/admin/kpis";
import { BarList } from "./bar-list";
import { KpiCard } from "./kpi-card";
import { Sparkline } from "./sparkline";

/**
 * El panel está sólo en español, a propósito: lo mira una persona. Traducirlo
 * sería duplicar cien cadenas para nadie.
 */

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-on-surface">{titulo}</h2>
        {descripcion && <p className="text-sm text-on-surface-muted">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

function Rejilla({ children, ancha }: { children: ReactNode; ancha?: boolean }) {
  return (
    <div
      className={`grid gap-3 ${
        ancha ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {children}
    </div>
  );
}

/** Fila compacta para los bloques con muchos números pequeños. */
function Dato({ etiqueta, valor, pie }: { etiqueta: string; valor: ReactNode; pie?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-card border border-border bg-surface p-3">
      <span className="text-xs text-on-surface-muted">{etiqueta}</span>
      <span className="text-lg font-semibold tabular-nums text-on-surface">{valor}</span>
      {pie && <span className="text-xs text-on-surface-muted">{pie}</span>}
    </div>
  );
}

function Reparto({
  titulo,
  filas,
}: {
  titulo: string;
  filas: Array<{ etiqueta: string; valor: number }>;
}) {
  const total = filas.reduce((suma, fila) => suma + fila.valor, 0);

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">
        {titulo}
      </h3>
      <ul className="flex flex-col gap-2">
        {filas.map((fila) => (
          <li key={fila.etiqueta} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-on-surface">{fila.etiqueta}</span>
              <span className="tabular-nums text-on-surface-muted">
                {numero(fila.valor)}
                <span className="ml-1 text-xs">({porcentaje(cuota(fila.valor, total))})</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: total > 0 ? `${(fila.valor / total) * 100}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Dashboard({ kpis }: { kpis: Kpis }) {
  const { usuarios, listas, productos, colaboracion, invitaciones, norte, dinero } = kpis;
  const { perfiles, push, catalogo, series, tops } = kpis;

  const dias = series.map((punto) => punto.dia);
  const suma = (clave: "usuarios" | "listas" | "productos") =>
    series.reduce((total, punto) => total + punto[clave], 0);

  return (
    <div className="flex flex-col gap-10">
      {/* ── Las cinco métricas del plan (00-PLAN.md §1) ───────────── */}
      <Seccion
        titulo="Las métricas del plan"
        descripcion="Las cinco de las que cuelga el negocio. El objetivo es el de 00-PLAN.md §1."
      >
        <Rejilla>
          <KpiCard
            destacado
            etiqueta="Activación"
            valor={porcentaje(norte.activacion)}
            actual={norte.activacion}
            objetivo={{ valor: 25, sentido: "mayor", unidad: "porcentaje" }}
            pie={`${numero(norte.activados)} personas con una lista de 3 productos o más`}
          />
          <KpiCard
            destacado
            etiqueta="Viralidad (K)"
            valor={decimal(norte.viralidad_k)}
            actual={norte.viralidad_k}
            objetivo={{ valor: 1.2, sentido: "mayor", unidad: "numero" }}
            pie="Personas que entran por cada lista creada"
          />
          <KpiCard
            destacado
            etiqueta="Retención D7"
            valor={porcentaje(norte.retencion_d7)}
            actual={norte.retencion_d7}
            objetivo={{ valor: 20, sentido: "mayor", unidad: "porcentaje" }}
            pie="Vuelven una semana después de darse de alta"
          />
          <KpiCard
            destacado
            etiqueta="Colaboración"
            valor={porcentaje(norte.colaboracion)}
            actual={norte.colaboracion}
            objetivo={{ valor: 35, sentido: "mayor", unidad: "porcentaje" }}
            pie={`${numero(colaboracion.listas_compartidas)} listas con 2 personas o más`}
          />
        </Rejilla>
        <p className="text-xs text-on-surface-muted">
          La quinta —LCP móvil— no sale de la base de datos: está en Vercel Speed Insights.
        </p>
      </Seccion>

      {/* ── Actividad ─────────────────────────────────────────────── */}
      <Seccion
        titulo="Ahora mismo"
        descripcion="Alguien está «activo» si ha tocado una lista, añadido un producto o marcado algo."
      >
        <Rejilla>
          <KpiCard etiqueta="Activos 24 h" valor={numero(norte.activos_24h)} />
          <KpiCard etiqueta="Activos 7 días" valor={numero(norte.activos_7d)} />
          <KpiCard etiqueta="Activos 30 días" valor={numero(norte.activos_30d)} />
          <KpiCard
            etiqueta="Adherencia"
            valor={porcentaje(norte.adherencia)}
            pie="Diarios sobre mensuales. Por debajo del 10 % se usa y se olvida."
          />
        </Rejilla>
      </Seccion>

      {/* ── Crecimiento ───────────────────────────────────────────── */}
      <Seccion titulo="Crecimiento" descripcion="Últimos 7 días frente a los 7 anteriores.">
        <Rejilla>
          <KpiCard
            etiqueta="Altas 7 días"
            valor={numero(usuarios.nuevos_7d)}
            variacion={variacion(usuarios.nuevos_7d, usuarios.nuevos_7d_previos)}
            pie={`${numero(usuarios.nuevos_hoy)} hoy · ${numero(usuarios.nuevos_30d)} en 30 días`}
          />
          <KpiCard
            etiqueta="Listas 7 días"
            valor={numero(listas.nuevas_7d)}
            variacion={variacion(listas.nuevas_7d, listas.nuevas_7d_previos)}
            pie={`${numero(listas.nuevas_hoy)} hoy · ${numero(listas.nuevas_30d)} en 30 días`}
          />
          <KpiCard
            etiqueta="Productos 7 días"
            valor={numero(productos.nuevos_7d)}
            pie={`${numero(productos.nuevos_hoy)} hoy · ${numero(productos.nuevos_30d)} en 30 días`}
          />
          <KpiCard
            etiqueta="Listas tocadas 24 h"
            valor={numero(listas.tocadas_24h)}
            pie={`${numero(listas.tocadas_7d)} en 7 días`}
          />
        </Rejilla>
      </Seccion>

      {/* ── Series ────────────────────────────────────────────────── */}
      <Seccion titulo={`Día a día (${kpis.dias} días)`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Sparkline
            titulo="Altas"
            serie={series.map((p) => p.usuarios)}
            etiquetas={dias}
            total={suma("usuarios")}
          />
          <Sparkline
            titulo="Listas creadas"
            serie={series.map((p) => p.listas)}
            etiquetas={dias}
            total={suma("listas")}
          />
          <Sparkline
            titulo="Productos añadidos"
            serie={series.map((p) => p.productos)}
            etiquetas={dias}
            total={suma("productos")}
          />
          <Sparkline
            titulo="Personas activas"
            serie={series.map((p) => p.activos)}
            etiquetas={dias}
            // Las personas activas no se suman entre días: quien entra dos
            // días seguidos contaría dos veces. El número es el mejor día.
            total={Math.max(...series.map((p) => p.activos), 0)}
            resumen="el mejor día"
          />
        </div>
      </Seccion>

      {/* ── Totales ───────────────────────────────────────────────── */}
      <Seccion titulo="Totales">
        <Rejilla>
          <Dato
            etiqueta="Personas"
            valor={numero(usuarios.total)}
            pie={`${numero(usuarios.registrados)} con cuenta · ${numero(usuarios.anonimos)} invitados`}
          />
          <Dato
            etiqueta="Conversión a cuenta"
            valor={porcentaje(cuota(usuarios.registrados, usuarios.total))}
            pie="Invitados que acaban registrándose"
          />
          <Dato
            etiqueta="Listas"
            valor={numero(listas.total)}
            pie={`${numero(listas.activas)} activas · ${numero(listas.archivadas)} archivadas`}
          />
          <Dato
            etiqueta="Productos"
            valor={numero(productos.total)}
            pie={`${numero(productos.borrados)} borrados`}
          />
          <Dato
            etiqueta="Marcados"
            valor={porcentaje(cuota(productos.marcados, productos.total))}
            pie={`${numero(productos.marcados)} productos comprados`}
          />
          <Dato
            etiqueta="Con precio"
            valor={porcentaje(cuota(productos.con_precio, productos.total))}
            pie={`${numero(productos.con_precio)} productos`}
          />
          <Dato
            etiqueta="Sin categoría"
            valor={porcentaje(cuota(productos.sin_categoria, productos.total))}
            pie="Lo que el catálogo no reconoce"
          />
          <Dato
            etiqueta="Con cantidad"
            valor={porcentaje(cuota(productos.con_cantidad, productos.total))}
            pie={`${numero(productos.con_cantidad)} productos`}
          />
        </Rejilla>
      </Seccion>

      {/* ── Forma de las listas ───────────────────────────────────── */}
      <Seccion
        titulo="Cómo son las listas"
        descripcion="«Vacías» es gente que llegó, creó la lista y se fue: la fuga más cara."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Reparto
            titulo={`Productos por lista · media ${decimal(tops.tamano_listas.media, 1)} · mediana ${decimal(tops.tamano_listas.mediana, 0)}`}
            filas={[
              { etiqueta: "Vacías", valor: tops.tamano_listas.vacias },
              { etiqueta: "1 a 4", valor: tops.tamano_listas.de_1_a_4 },
              { etiqueta: "5 a 14", valor: tops.tamano_listas.de_5_a_14 },
              { etiqueta: "15 a 29", valor: tops.tamano_listas.de_15_a_29 },
              { etiqueta: "30 o más", valor: tops.tamano_listas.de_30_mas },
            ]}
          />
          <Reparto
            titulo={`Personas por lista · media ${decimal(colaboracion.media_miembros, 1)} · máx. ${numero(colaboracion.max_miembros)}`}
            filas={[
              { etiqueta: "Sólo quien la creó", valor: colaboracion.reparto.una },
              { etiqueta: "Dos", valor: colaboracion.reparto.dos },
              { etiqueta: "Tres", valor: colaboracion.reparto.tres },
              { etiqueta: "Cuatro o más", valor: colaboracion.reparto.cuatro_mas },
            ]}
          />
        </div>
      </Seccion>

      {/* ── Invitaciones ──────────────────────────────────────────── */}
      <Seccion
        titulo="Invitaciones"
        descripcion="Compartir es el motor de crecimiento: aquí se ve si el enlace se abre o se queda en el móvil."
      >
        <Rejilla>
          <Dato etiqueta="Creadas" valor={numero(invitaciones.total)} />
          <Dato
            etiqueta="Usadas al menos una vez"
            valor={porcentaje(invitaciones.tasa_uso)}
            pie={`${numero(invitaciones.usadas)} enlaces`}
          />
          <Dato etiqueta="Canjes totales" valor={numero(invitaciones.canjes)} />
          <Dato
            etiqueta="Revocadas o caducadas"
            valor={numero(invitaciones.revocadas + invitaciones.caducadas)}
            pie={`${numero(invitaciones.revocadas)} revocadas`}
          />
        </Rejilla>
      </Seccion>

      {/* ── Dinero ────────────────────────────────────────────────── */}
      <Seccion titulo="Presupuesto y precios">
        <Rejilla>
          <Dato
            etiqueta="Listas con presupuesto"
            valor={numero(dinero.listas_con_presupuesto)}
            pie={porcentaje(cuota(dinero.listas_con_presupuesto, listas.total))}
          />
          <Dato etiqueta="Presupuesto medio" valor={euros(dinero.presupuesto_medio)} />
          <Dato
            etiqueta="Valor de las cestas"
            valor={euros(dinero.valor_cestas_cents)}
            pie="Suma de precio × cantidad"
          />
          <Dato etiqueta="Precio medio" valor={euros(dinero.precio_medio_producto)} />
        </Rejilla>
      </Seccion>

      {/* ── Perfiles, push y catálogo ─────────────────────────────── */}
      <Seccion titulo="Idioma, avisos y catálogo">
        <Rejilla>
          <Dato
            etiqueta="Español"
            valor={numero(perfiles.es)}
            pie={porcentaje(cuota(perfiles.es, perfiles.total))}
          />
          <Dato
            etiqueta="Inglés"
            valor={numero(perfiles.en)}
            pie={porcentaje(cuota(perfiles.en, perfiles.total))}
          />
          <Dato
            etiqueta="Con nombre visible"
            valor={numero(perfiles.con_nombre)}
            pie={porcentaje(cuota(perfiles.con_nombre, perfiles.total))}
          />
          <Dato
            etiqueta="Premium"
            valor={numero(perfiles.premium)}
            pie={`${numero(perfiles.free)} en gratuito`}
          />
          <Dato
            etiqueta="Avisos push"
            valor={numero(push.usuarios)}
            pie={`${numero(push.suscripciones)} dispositivos · ${porcentaje(cuota(push.usuarios, usuarios.total))} de las personas`}
          />
          <Dato
            etiqueta="Precios recordados"
            valor={numero(dinero.precios_recordados)}
            pie="Productos con precio aprendido"
          />
          <Dato
            etiqueta="Historial"
            valor={numero(catalogo.historial_filas)}
            pie={`${numero(catalogo.usuarios_con_historial)} personas`}
          />
          <Dato
            etiqueta="Catálogo"
            valor={numero(catalogo.productos_catalogo)}
            pie={`${numero(catalogo.categorias)} categorías`}
          />
        </Rejilla>
      </Seccion>

      {/* ── Rankings ──────────────────────────────────────────────── */}
      <Seccion
        titulo="Qué se compra"
        descripcion="Los nombres tal cual se escriben. Sirve para ampliar el catálogo y afinar las categorías."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <BarList titulo="Productos más añadidos" filas={tops.productos} />
          <BarList titulo="Categorías (pasillos)" filas={tops.categorias} />
        </div>
      </Seccion>
    </div>
  );
}
