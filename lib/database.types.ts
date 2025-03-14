export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          min_version: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          min_version: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          min_version?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          company: string
          created_at: string | null
          id: string
          organization_id: string | null
          pictures: string[] | null
          updated_at: string | null
        }
        Insert: {
          certificate_number: string
          company: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          pictures?: string[] | null
          updated_at?: string | null
        }
        Update: {
          certificate_number?: string
          company?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          pictures?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string
          id: string
          medium: string | null
          organization_id: string | null
          original: string | null
          stone_id: string
          thumbnail: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medium?: string | null
          organization_id?: string | null
          original?: string | null
          stone_id?: string
          thumbnail?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medium?: string | null
          organization_id?: string | null
          original?: string | null
          stone_id?: string
          thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_stone_id_fkey"
            columns: ["stone_id"]
            isOneToOne: false
            referencedRelation: "stones"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted: boolean | null
          created_at: string
          email: string | null
          id: number
          invited_by: string | null
          organization_id: string | null
          organization_name: string | null
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          invited_by?: string | null
          organization_id?: string | null
          organization_name?: string | null
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          invited_by?: string | null
          organization_id?: string | null
          organization_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_owners: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stones: {
        Row: {
          bill_number: string | null
          buy_currency: string | null
          buy_price: number | null
          buyer: string | null
          buyer_address: string | null
          certificate_id: string | null
          color: string | null
          comment: string | null
          created_at: string | null
          cut: string | null
          date: string | null
          dimensions: Json | null
          gem_type: string | null
          id: string
          name: string
          organization_id: string | null
          owner: string | null
          pictures: string[] | null
          purchase_date: string | null
          quantity: string | null
          sell_currency: string | null
          sell_price: number | null
          shape: string | null
          sold: boolean | null
          sold_at: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          bill_number?: string | null
          buy_currency?: string | null
          buy_price?: number | null
          buyer?: string | null
          buyer_address?: string | null
          certificate_id?: string | null
          color?: string | null
          comment?: string | null
          created_at?: string | null
          cut?: string | null
          date?: string | null
          dimensions?: Json | null
          gem_type?: string | null
          id?: string
          name: string
          organization_id?: string | null
          owner?: string | null
          pictures?: string[] | null
          purchase_date?: string | null
          quantity?: string | null
          sell_currency?: string | null
          sell_price?: number | null
          shape?: string | null
          sold?: boolean | null
          sold_at?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          bill_number?: string | null
          buy_currency?: string | null
          buy_price?: number | null
          buyer?: string | null
          buyer_address?: string | null
          certificate_id?: string | null
          color?: string | null
          comment?: string | null
          created_at?: string | null
          cut?: string | null
          date?: string | null
          dimensions?: Json | null
          gem_type?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          owner?: string | null
          pictures?: string[] | null
          purchase_date?: string | null
          quantity?: string | null
          sell_currency?: string | null
          sell_price?: number | null
          shape?: string | null
          sold?: boolean | null
          sold_at?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stones_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

