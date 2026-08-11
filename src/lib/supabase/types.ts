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
      list_templates: {
        Row: {
          id: string;
          slug: string;
          locale: Locale;
          title: string;
          description: string | null;
          owner_id: string | null;
          is_public: boolean;
          use_count: number;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["list_templates"]["Row"]> & {
          slug: string;
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
        Relationships: [];
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
      record_product_price: {
        Args: { p_normalized: string; p_name: string; p_price_cents: number };
        Returns: undefined;
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
