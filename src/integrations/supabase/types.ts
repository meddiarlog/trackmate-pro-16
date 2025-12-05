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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          cash_box_id: string | null
          created_at: string
          discount: number | null
          document_number: string | null
          due_date: string
          id: string
          installment_number: number
          installments: number
          is_fixed_expense: boolean
          observations: string | null
          parent_id: string | null
          payment_date: string | null
          payment_method: string
          penalty_interest: number | null
          status: string
          supplier_id: string
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          cash_box_id?: string | null
          created_at?: string
          discount?: number | null
          document_number?: string | null
          due_date: string
          id?: string
          installment_number?: number
          installments?: number
          is_fixed_expense?: boolean
          observations?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          penalty_interest?: number | null
          status?: string
          supplier_id: string
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_box_id?: string | null
          created_at?: string
          discount?: number | null
          document_number?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          installments?: number
          is_fixed_expense?: boolean
          observations?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          penalty_interest?: number | null
          status?: string
          supplier_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_cash_box_id_fkey"
            columns: ["cash_box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          cash_box_id: string | null
          created_at: string
          customer_id: string
          discount: number | null
          document_number: string | null
          due_date: string
          id: string
          installment_number: number
          installments: number
          is_fixed_income: boolean
          observations: string | null
          parent_id: string | null
          payment_date: string | null
          payment_method: string
          penalty_interest: number | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          cash_box_id?: string | null
          created_at?: string
          customer_id: string
          discount?: number | null
          document_number?: string | null
          due_date: string
          id?: string
          installment_number?: number
          installments?: number
          is_fixed_income?: boolean
          observations?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          penalty_interest?: number | null
          status?: string
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_box_id?: string | null
          created_at?: string
          customer_id?: string
          discount?: number | null
          document_number?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          installments?: number
          is_fixed_income?: boolean
          observations?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          penalty_interest?: number | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_cash_box_id_fkey"
            columns: ["cash_box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
        ]
      }
      body_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      boletos: {
        Row: {
          amount: number | null
          created_at: string
          cte_reference: string | null
          customer_id: string
          due_date: string
          file_name: string
          file_url: string
          id: string
          issue_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          cte_reference?: string | null
          customer_id: string
          due_date: string
          file_name: string
          file_url: string
          id?: string
          issue_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          cte_reference?: string | null
          customer_id?: string
          due_date?: string
          file_name?: string
          file_url?: string
          id?: string
          issue_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boletos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_boxes: {
        Row: {
          category_id: string
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_boxes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cash_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          reason: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          reason: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          reason?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: []
      }
      collection_orders: {
        Row: {
          body_type_id: string | null
          code: string | null
          created_at: string
          driver_cnh: string | null
          driver_cnh_expiry: string | null
          driver_cpf: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          employee_name: string | null
          freight_type_id: string | null
          id: string
          loading_city: string | null
          loading_state: string | null
          observations: string | null
          order_date: string
          order_number: number
          order_request_number: string | null
          owner_name: string | null
          owner_phone: string | null
          payment_method: string
          product_id: string | null
          recipient_name: string
          sender_name: string | null
          trailer_plates: string[] | null
          unloading_city: string
          unloading_state: string
          updated_at: string
          vehicle_plate: string | null
          vehicle_type_id: string | null
          weight_tons: number
        }
        Insert: {
          body_type_id?: string | null
          code?: string | null
          created_at?: string
          driver_cnh?: string | null
          driver_cnh_expiry?: string | null
          driver_cpf?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          employee_name?: string | null
          freight_type_id?: string | null
          id?: string
          loading_city?: string | null
          loading_state?: string | null
          observations?: string | null
          order_date?: string
          order_number?: number
          order_request_number?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          payment_method: string
          product_id?: string | null
          recipient_name: string
          sender_name?: string | null
          trailer_plates?: string[] | null
          unloading_city: string
          unloading_state: string
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type_id?: string | null
          weight_tons: number
        }
        Update: {
          body_type_id?: string | null
          code?: string | null
          created_at?: string
          driver_cnh?: string | null
          driver_cnh_expiry?: string | null
          driver_cpf?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          employee_name?: string | null
          freight_type_id?: string | null
          id?: string
          loading_city?: string | null
          loading_state?: string | null
          observations?: string | null
          order_date?: string
          order_number?: number
          order_request_number?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          payment_method?: string
          product_id?: string | null
          recipient_name?: string
          sender_name?: string | null
          trailer_plates?: string[] | null
          unloading_city?: string
          unloading_state?: string
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type_id?: string | null
          weight_tons?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_orders_body_type_id_fkey"
            columns: ["body_type_id"]
            isOneToOne: false
            referencedRelation: "body_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_orders_freight_type_id_fkey"
            columns: ["freight_type_id"]
            isOneToOne: false
            referencedRelation: "freight_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_orders_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          id: string
          inscricao_estadual: string | null
          neighborhood: string | null
          nome_fantasia: string | null
          razao_social: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          neighborhood?: string | null
          nome_fantasia?: string | null
          razao_social: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          neighborhood?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          company_id: string
          contract_number: string
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_number: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_number?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_control: {
        Row: {
          chave_acesso: string
          cnpj_emitente: string
          created_at: string
          credito: number
          data_emissao: string
          id: string
          numero_nfe: string
          quantidade: number
          razao_social: string
          tipo_combustivel: Database["public"]["Enums"]["fuel_type"]
          uf: string
          updated_at: string
          valor_nfe: number
        }
        Insert: {
          chave_acesso: string
          cnpj_emitente: string
          created_at?: string
          credito: number
          data_emissao?: string
          id?: string
          numero_nfe: string
          quantidade: number
          razao_social: string
          tipo_combustivel: Database["public"]["Enums"]["fuel_type"]
          uf: string
          updated_at?: string
          valor_nfe: number
        }
        Update: {
          chave_acesso?: string
          cnpj_emitente?: string
          created_at?: string
          credito?: number
          data_emissao?: string
          id?: string
          numero_nfe?: string
          quantidade?: number
          razao_social?: string
          tipo_combustivel?: Database["public"]["Enums"]["fuel_type"]
          uf?: string
          updated_at?: string
          valor_nfe?: number
        }
        Relationships: []
      }
      ctes: {
        Row: {
          advance_value: number | null
          breakage_value: number | null
          cargo_invoice: string | null
          cargo_quantity: number | null
          cargo_species: string | null
          cfop: string | null
          cfop_description: string | null
          contract_id: string
          created_at: string
          cte_number: string
          destination: string
          driver_account: string | null
          driver_agency: string | null
          driver_bank: string | null
          driver_cellphone: string | null
          driver_city: string | null
          driver_cpf: string | null
          driver_license: string | null
          driver_name: string | null
          driver_phone: string | null
          driver_pis: string | null
          driver_rg: string | null
          driver_rg_issuer: string | null
          driver_state: string | null
          freight_value: number | null
          id: string
          inss_value: number | null
          insurance_company: string | null
          insurance_policy: string | null
          insurance_value: number | null
          issue_date: string
          net_value: number | null
          observations: string | null
          origin: string
          other_discount_value: number | null
          owner_address: string | null
          owner_antt: string | null
          owner_cpf: string | null
          owner_name: string | null
          owner_pis: string | null
          owner_rg: string | null
          pdf_url: string | null
          product_description: string | null
          recipient_address: string | null
          recipient_cnpj: string | null
          recipient_ie: string | null
          recipient_name: string | null
          sender_address: string | null
          sender_cnpj: string | null
          sender_ie: string | null
          sender_name: string | null
          sest_senat_value: number | null
          toll_value: number | null
          value: number
          vehicle_account: string | null
          vehicle_agency: string | null
          vehicle_brand: string | null
          vehicle_city: string | null
          vehicle_plate: string | null
          vehicle_renavam: string | null
          vehicle_rntrc: string | null
          vehicle_state: string | null
          weight: number | null
        }
        Insert: {
          advance_value?: number | null
          breakage_value?: number | null
          cargo_invoice?: string | null
          cargo_quantity?: number | null
          cargo_species?: string | null
          cfop?: string | null
          cfop_description?: string | null
          contract_id: string
          created_at?: string
          cte_number: string
          destination: string
          driver_account?: string | null
          driver_agency?: string | null
          driver_bank?: string | null
          driver_cellphone?: string | null
          driver_city?: string | null
          driver_cpf?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_pis?: string | null
          driver_rg?: string | null
          driver_rg_issuer?: string | null
          driver_state?: string | null
          freight_value?: number | null
          id?: string
          inss_value?: number | null
          insurance_company?: string | null
          insurance_policy?: string | null
          insurance_value?: number | null
          issue_date?: string
          net_value?: number | null
          observations?: string | null
          origin: string
          other_discount_value?: number | null
          owner_address?: string | null
          owner_antt?: string | null
          owner_cpf?: string | null
          owner_name?: string | null
          owner_pis?: string | null
          owner_rg?: string | null
          pdf_url?: string | null
          product_description?: string | null
          recipient_address?: string | null
          recipient_cnpj?: string | null
          recipient_ie?: string | null
          recipient_name?: string | null
          sender_address?: string | null
          sender_cnpj?: string | null
          sender_ie?: string | null
          sender_name?: string | null
          sest_senat_value?: number | null
          toll_value?: number | null
          value: number
          vehicle_account?: string | null
          vehicle_agency?: string | null
          vehicle_brand?: string | null
          vehicle_city?: string | null
          vehicle_plate?: string | null
          vehicle_renavam?: string | null
          vehicle_rntrc?: string | null
          vehicle_state?: string | null
          weight?: number | null
        }
        Update: {
          advance_value?: number | null
          breakage_value?: number | null
          cargo_invoice?: string | null
          cargo_quantity?: number | null
          cargo_species?: string | null
          cfop?: string | null
          cfop_description?: string | null
          contract_id?: string
          created_at?: string
          cte_number?: string
          destination?: string
          driver_account?: string | null
          driver_agency?: string | null
          driver_bank?: string | null
          driver_cellphone?: string | null
          driver_city?: string | null
          driver_cpf?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_pis?: string | null
          driver_rg?: string | null
          driver_rg_issuer?: string | null
          driver_state?: string | null
          freight_value?: number | null
          id?: string
          inss_value?: number | null
          insurance_company?: string | null
          insurance_policy?: string | null
          insurance_value?: number | null
          issue_date?: string
          net_value?: number | null
          observations?: string | null
          origin?: string
          other_discount_value?: number | null
          owner_address?: string | null
          owner_antt?: string | null
          owner_cpf?: string | null
          owner_name?: string | null
          owner_pis?: string | null
          owner_rg?: string | null
          pdf_url?: string | null
          product_description?: string | null
          recipient_address?: string | null
          recipient_cnpj?: string | null
          recipient_ie?: string | null
          recipient_name?: string | null
          sender_address?: string | null
          sender_cnpj?: string | null
          sender_ie?: string | null
          sender_name?: string | null
          sest_senat_value?: number | null
          toll_value?: number | null
          value?: number
          vehicle_account?: string | null
          vehicle_agency?: string | null
          vehicle_brand?: string | null
          vehicle_city?: string | null
          vehicle_plate?: string | null
          vehicle_renavam?: string | null
          vehicle_rntrc?: string | null
          vehicle_state?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ctes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          id: string
          telefone: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email?: string | null
          id?: string
          telefone?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          id?: string
          telefone?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          id: string
          loading_location: string | null
          name: string
          neighborhood: string | null
          observacoes: string | null
          phone: string | null
          prazo_dias: number | null
          responsavel: string | null
          state: string | null
          type: string | null
          unloading_location: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          loading_location?: string | null
          name: string
          neighborhood?: string | null
          observacoes?: string | null
          phone?: string | null
          prazo_dias?: number | null
          responsavel?: string | null
          state?: string | null
          type?: string | null
          unloading_location?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          loading_location?: string | null
          name?: string
          neighborhood?: string | null
          observacoes?: string | null
          phone?: string | null
          prazo_dias?: number | null
          responsavel?: string | null
          state?: string | null
          type?: string | null
          unloading_location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          created_at: string
          document_type: string
          driver_id: string
          file_name: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          driver_id: string
          file_name: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          driver_id?: string
          file_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh: string | null
          cnh_expiry: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          cnh?: string | null
          cnh_expiry?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          cnh?: string | null
          cnh_expiry?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      freight_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          due_date: string
          id: string
          paid_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          paid_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      repository_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          folder_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "repository_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "repository_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_owners: {
        Row: {
          address: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type: string | null
          capacity: string | null
          created_at: string
          id: string
          license_plate: string
          model: string | null
          renavam: string | null
          status: string | null
          updated_at: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          capacity?: string | null
          created_at?: string
          id?: string
          license_plate: string
          model?: string | null
          renavam?: string | null
          status?: string | null
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          capacity?: string | null
          created_at?: string
          id?: string
          license_plate?: string
          model?: string | null
          renavam?: string | null
          status?: string | null
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cash_movement_type: "sangria" | "suprimento"
      fuel_type: "DIESEL" | "DIESEL+ARLA"
      payment_method: "pix" | "boleto" | "transferencia"
      payment_status: "pendente" | "pago" | "vencido"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      cash_movement_type: ["sangria", "suprimento"],
      fuel_type: ["DIESEL", "DIESEL+ARLA"],
      payment_method: ["pix", "boleto", "transferencia"],
      payment_status: ["pendente", "pago", "vencido"],
    },
  },
} as const
