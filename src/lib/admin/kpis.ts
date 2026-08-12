import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("src/lib/admin/kpis.ts es sólo de servidor.");
}

/**
 * La forma exacta de lo que devuelve `public.admin_kpis()`
 * (supabase/migrations/0007_admin_kpis.sql). Si se toca el SQL hay que tocar
 * esto: son un contrato, y el panel entero se dibuja a partir de aquí.
 */
export interface Kpis {
  generado_en: string;
  dias: number;
  usuarios: {
    total: number;
    registrados: number;
    anonimos: number;
    nuevos_hoy: number;
    nuevos_7d: number;
    nuevos_30d: number;
    nuevos_7d_previos: number;
  };
  listas: {
    total: number;
    activas: number;
    archivadas: number;
    nuevas_hoy: number;
    nuevas_7d: number;
    nuevas_30d: number;
    nuevas_7d_previos: number;
    tocadas_24h: number;
    tocadas_7d: number;
  };
  productos: {
    total: number;
    borrados: number;
    marcados: number;
    con_precio: number;
    con_cantidad: number;
    sin_categoria: number;
    nuevos_hoy: number;
    nuevos_7d: number;
    nuevos_30d: number;
  };
  colaboracion: {
    listas_compartidas: number;
    listas_con_miembros: number;
    media_miembros: number;
    max_miembros: number;
    reparto: { una: number; dos: number; tres: number; cuatro_mas: number };
  };
  invitaciones: {
    total: number;
    usadas: number;
    revocadas: number;
    caducadas: number;
    canjes: number;
    tasa_uso: number;
  };
  norte: {
    activados: number;
    activacion: number;
    viralidad_k: number;
    colaboracion: number;
    retencion_d7: number;
    activos_24h: number;
    activos_7d: number;
    activos_30d: number;
    adherencia: number;
  };
  dinero: {
    listas_con_presupuesto: number;
    presupuesto_medio: number;
    valor_cestas_cents: number;
    precio_medio_producto: number;
    precios_recordados: number;
  };
  perfiles: {
    total: number;
    es: number;
    en: number;
    con_nombre: number;
    free: number;
    premium: number;
  };
  push: { suscripciones: number; usuarios: number; es: number; en: number };
  catalogo: {
    productos_catalogo: number;
    categorias: number;
    historial_filas: number;
    usuarios_con_historial: number;
  };
  series: Array<{
    dia: string;
    usuarios: number;
    listas: number;
    productos: number;
    activos: number;
  }>;
  tops: {
    productos: Array<{ nombre: string; veces: number }>;
    categorias: Array<{ nombre: string; veces: number }>;
    tamano_listas: {
      vacias: number;
      de_1_a_4: number;
      de_5_a_14: number;
      de_15_a_29: number;
      de_30_mas: number;
      media: number;
      mediana: number;
    };
  };
}

export type ResultadoKpis =
  | { ok: true; kpis: Kpis }
  | { ok: false; motivo: "sin_configurar" | "error"; detalle?: string };

/**
 * Lee las métricas con la **clave de servicio**, que se salta RLS.
 *
 * Es la única forma de contar listas de todo el mundo: con la clave pública,
 * RLS sólo dejaría ver las del administrador, que son cero. Esa clave no sale
 * nunca de aquí — ni al navegador, ni a un componente de cliente.
 */
export async function obtenerKpis(dias = 30): Promise<ResultadoKpis> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return { ok: false, motivo: "sin_configurar" };

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("admin_kpis", { p_dias: dias });

  if (error) return { ok: false, motivo: "error", detalle: error.message };
  if (!data) return { ok: false, motivo: "error", detalle: "sin datos" };

  return { ok: true, kpis: data as unknown as Kpis };
}
