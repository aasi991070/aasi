/** Generated baseline for `npm run gen:types`. Regenerate from Supabase when schema changes. */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          level: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          sale_price: number | null;
          category_id: string | null;
          gender: "men" | "women" | "unisex" | null;
          sizes: string[];
          colors: string[];
          images: string[];
          thumbnail_url: string | null;
          in_stock: boolean;
          stock_count: number;
          is_featured: boolean;
          is_active: boolean;
          tags: string[];
          meta_title: string | null;
          meta_description: string | null;
          image_alts: string[];
          tax_rate: number | null;
          hsn_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          stock_count: number;
          sku: string | null;
          price_override: number | null;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
