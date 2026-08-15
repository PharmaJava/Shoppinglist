/**
 * Tipos de la base de datos, escritos a mano a partir de
 * supabase/migrations/0001_baseline.sql.
 *
 * Regenerar con `pnpm db:types` (requiere SUPABASE_PROJECT_REF y sesión de
 * `supabase login`) en cuanto haya acceso de CLI al proyecto — sustituye
 * este archivo por el generado sin tocar su forma exterior (Database).
 */

export type ListRole = "owner" | "editor" | "viewer";
export type Locale = "es" | "en";
export type Plan = "free" | "premium";
/** Cada cuánto se crea sola una lista recurrente (migración 0012). */
export type Cadence = "weekly" | "biweekly" | "monthly";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: Locale;
          currency: string;
          plan: Plan;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          name_es: string;
          name_en: string;
          icon: string | null;
          sort_order: number;
        };
        Relationships: [];
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      lists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          emoji: string | null;
          currency: string;
          budget_cents: number | null;
          archived_at: string | null;
          /**
           * Cuándo se da por terminada sola. Sólo la tienen las listas de
           * quien no ha creado cuenta; la escribe la base de datos y el
           * cliente no puede tocarla (migración 0015).
           */
          auto_finish_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["lists"]["Row"]> & { owner_id: string };
        Update: Partial<Database["public"]["Tables"]["lists"]["Row"]>;
      };
      list_members: {
        Row: {
          list_id: string;
          user_id: string;
          role: ListRole;
          joined_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["list_members"]["Row"]> & {
          list_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["list_members"]["Row"]>;
      };
      list_invites: {
        Row: {
          token: string;
          list_id: string;
          created_by: string;
          role: ListRole;
          expires_at: string | null;
          revoked_at: string | null;
          max_uses: number | null;
          uses: number;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["list_invites"]["Row"]> & {
          token: string;
          list_id: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["list_invites"]["Row"]>;
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          qty: number | null;
          unit: string | null;
          note: string | null;
          category_id: string | null;
          price_cents: number | null;
          is_checked: boolean;
          checked_by: string | null;
          checked_at: string | null;
          assigned_to: string | null;
          sort_key: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["list_items"]["Row"]> & {
          id: string;
          list_id: string;
          name: string;
          sort_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["list_items"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          locale: Locale;
          name: string;
          normalized: string;
          category_id: string | null;
          default_unit: string | null;
          popularity: number;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          locale: Locale;
          name: string;
          normalized: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      user_product_history: {
        Row: {
          user_id: string;
          normalized: string;
          name: string;
          category_id: string | null;
          times_added: number;
          last_added: string;
          avg_price_cents: number | null;
          price_samples: number;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["user_product_history"]["Row"]> & {
          user_id: string;
          normalized: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_product_history"]["Row"]>;
      };
      push_subscriptions: {
        Row: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          locale: Locale;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
      };
      pantry_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          normalized: string;
          qty: number | null;
          unit: string | null;
          category_id: string | null;
          /** Fecha sin hora (`date` en Postgres): «2026-08-20». */
          expires_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["pantry_items"]["Row"]> & {
          user_id: string;
          name: string;
          normalized: string;
        };
        Update: Partial<Database["public"]["Tables"]["pantry_items"]["Row"]>;
      };
      user_barcodes: {
        Row: {
          user_id: string;
          /** GTIN de 8 a 14 dígitos, como texto: los ceros de la izquierda cuentan. */
          code: string;
          name: string;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["user_barcodes"]["Row"]> & {
          user_id: string;
          code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_barcodes"]["Row"]>;
      };
      recurring_lists: {
        Row: {
          id: string;
          owner_id: string;
          template_id: string;
          title: string;
          cadence: Cadence;
          /** ISO: 1 = lunes … 7 = domingo. Nulo en las mensuales. */
          weekday: number | null;
          /** 1–28. Nulo en las semanales y quincenales. Ver la migración 0012. */
          day_of_month: number | null;
          /** Fecha sin hora. La pone el servidor, siempre. */
          next_run_on: string;
          last_run_on: string | null;
          last_list_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        // Hace falta para el `select("… list_templates(title)")` de la
        // pantalla: sin la relación declarada, PostgREST no sabe unirlas.
        Relationships: [
          {
            foreignKeyName: "recurring_lists_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "list_templates";
            referencedColumns: ["id"];
          },
        ];
        Insert: Partial<Database["public"]["Tables"]["recurring_lists"]["Row"]> & {
          owner_id: string;
          template_id: string;
          title: string;
          cadence: Cadence;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_lists"]["Row"]>;
      };
      list_templates: {
        Row: {
          id: string;
          // Nulo en las plantillas de una persona: sólo las públicas tienen
          // URL, y por tanto slug (migración 0008).
          slug: string | null;
          locale: Locale;
          title: string;
          description: string | null;
          owner_id: string | null;
          is_public: boolean;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["list_templates"]["Row"]> & {
          locale: Locale;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["list_templates"]["Row"]>;
      };
      template_items: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          qty: number | null;
          unit: string | null;
          category_id: string | null;
          sort_order: number;
        };
        // La única relación declarada del archivo, y hace falta: sin ella
        // PostgREST no sabe unir `list_templates` con sus productos y el
        // `select("… template_items(count)")` no compila.
        Relationships: [
          {
            foreignKeyName: "template_items_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "list_templates";
            referencedColumns: ["id"];
          },
        ];
        Insert: Partial<Database["public"]["Tables"]["template_items"]["Row"]> & {
          template_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["template_items"]["Row"]>;
      };
      subscriptions: {
        Row: {
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          current_period_end: string | null;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          user_id: string;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_list_by_token: {
        Args: { p_token: string };
        Returns: string;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      record_products: {
        Args: { p_items: RecordedProduct[] };
        Returns: undefined;
      };
      push_targets_for_list: {
        Args: { p_list: string; p_actor: string | null };
        Returns: Array<{ endpoint: string; p256dh: string; auth: string; locale: string }>;
      };
      push_targets_for_user: {
        Args: { p_user: string };
        Returns: Array<{ endpoint: string; p256dh: string; auth: string; locale: string }>;
      };
      /** Sólo desde el servidor con la clave de servicio. Ver la migración 0012. */
      run_due_recurring_lists: {
        Args: Record<string, never>;
        Returns: Array<{
          recurring_id: string;
          list_id: string;
          owner_id: string;
          title: string;
        }>;
      };
      set_member_role: {
        Args: { p_list: string; p_user: string; p_role: ListRole };
        Returns: undefined;
      };
      remove_list_member: {
        Args: { p_list: string; p_user: string };
        Returns: undefined;
      };
      transfer_list_ownership: {
        Args: { p_list: string; p_to: string };
        Returns: undefined;
      };
      record_product_price: {
        Args: { p_normalized: string; p_name: string; p_price_cents: number };
        Returns: undefined;
      };
      save_list_as_template: {
        Args: { p_list: string; p_title: string };
        Returns: string;
      };
      stock_up_from_list: {
        Args: { p_list: string };
        /** Cuántos productos han entrado en la despensa. */
        Returns: number;
      };
      is_premium: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      /** Devuelve la nueva fecha de fin, o nula si la lista no caduca. */
      reopen_list: {
        Args: { p_list: string };
        Returns: string | null;
      };
      /** Cuántas listas de invitado se han dado por terminadas. Sólo el servidor. */
      finish_stale_guest_lists: {
        Args: Record<string, never>;
        Returns: number;
      };
      /** Cuántas listas de invitado inactivas se han borrado. Sólo el servidor. */
      delete_stale_guest_lists: {
        Args: Record<string, never>;
        Returns: number;
      };
      /** No devuelve nada: o pasa, o lanza. Ver la migración 0010. */
      require_premium: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      run_recurring_list: {
        Args: { p_recurring: string };
        /** El id de la lista recién creada. */
        Returns: string;
      };
    };
  };
}

export type ListRow = Database["public"]["Tables"]["lists"]["Row"];
export type ListItemRow = Database["public"]["Tables"]["list_items"]["Row"];
export type ListMemberRow = Database["public"]["Tables"]["list_members"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProductHistoryRow = Database["public"]["Tables"]["user_product_history"]["Row"];

/** Lo que `record_products` espera de cada producto (jsonb en la función). */
export interface RecordedProduct {
  normalized: string;
  name: string;
  category_id: string | null;
}
