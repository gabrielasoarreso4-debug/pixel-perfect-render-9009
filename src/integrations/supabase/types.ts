export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          access_days: number
          id: number
          support_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          access_days?: number
          id?: number
          support_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          access_days?: number
          id?: number
          support_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chamados: {
        Row: {
          assunto: string
          categoria: string
          cliente_id: string
          created_at: string
          equipamento_id: string | null
          id: string
          mensagem: string
          resposta: string | null
          status: string
        }
        Insert: {
          assunto: string
          categoria: string
          cliente_id: string
          created_at?: string
          equipamento_id?: string | null
          id?: string
          mensagem: string
          resposta?: string | null
          status?: string
        }
        Update: {
          assunto?: string
          categoria?: string
          cliente_id?: string
          created_at?: string
          equipamento_id?: string | null
          id?: string
          mensagem?: string
          resposta?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_diarios: {
        Row: {
          aluguel_equipamento: number
          anuncio: number
          cliente_id: string
          created_at: string
          data: string
          faturamento: number
          id: string
          insumos: number
          locacao_id: string | null
        }
        Insert: {
          aluguel_equipamento?: number
          anuncio?: number
          cliente_id: string
          created_at?: string
          data?: string
          faturamento?: number
          id?: string
          insumos?: number
          locacao_id?: string | null
        }
        Update: {
          aluguel_equipamento?: number
          anuncio?: number
          cliente_id?: string
          created_at?: string
          data?: string
          faturamento?: number
          id?: string
          insumos?: number
          locacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_diarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_diarios_locacao_id_fkey"
            columns: ["locacao_id"]
            isOneToOne: false
            referencedRelation: "locacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          foto_url: string | null
          id: string
          link_marketing: string | null
          link_treinamento: string | null
          nome: string
          ordem: number
          protocolo_pdf_path: string | null
          slug: string
          valor_diaria_padrao: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          link_marketing?: string | null
          link_treinamento?: string | null
          nome: string
          ordem?: number
          protocolo_pdf_path?: string | null
          slug: string
          valor_diaria_padrao?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          link_marketing?: string | null
          link_treinamento?: string | null
          nome?: string
          ordem?: number
          protocolo_pdf_path?: string | null
          slug?: string
          valor_diaria_padrao?: number | null
        }
        Relationships: []
      }
      faq: {
        Row: {
          created_at: string
          equipamento_id: string | null
          id: string
          pergunta: string
          resposta: string
        }
        Insert: {
          created_at?: string
          equipamento_id?: string | null
          id?: string
          pergunta: string
          resposta: string
        }
        Update: {
          created_at?: string
          equipamento_id?: string | null
          id?: string
          pergunta?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          diarias_contratadas: number
          equipamento_id: string
          horas_por_diaria: number
          id: string
          status: string
          valor_diaria: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          diarias_contratadas: number
          equipamento_id: string
          horas_por_diaria?: number
          id?: string
          status?: string
          valor_diaria?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          diarias_contratadas?: number
          equipamento_id?: string
          horas_por_diaria?: number
          id?: string
          status?: string
          valor_diaria?: number
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          acesso_ate: string | null
          acesso_ativo: boolean
          created_at: string
          id: string
          nome: string
          usuario: string
          whatsapp: string | null
        }
        Insert: {
          acesso_ate?: string | null
          acesso_ativo?: boolean
          created_at?: string
          id: string
          nome: string
          usuario: string
          whatsapp?: string | null
        }
        Update: {
          acesso_ate?: string | null
          acesso_ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          usuario?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      tem_acesso: { Args: never; Returns: boolean }
      tem_equipamento: { Args: { _eq: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cliente"],
    },
  },
} as const
