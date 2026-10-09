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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          code: string
          created_at: string
          id: string
          is_current: boolean
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_current?: boolean
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_current?: boolean
          label?: string
        }
        Relationships: []
      }
      application_academic_history: {
        Row: {
          application_id: string
          applying_for_class: string | null
          migration_number: string | null
          previous_board: string | null
          previous_class: string | null
          previous_marks_percent: number | null
          previous_school: string | null
          previous_year: string | null
          remarks: string | null
          stream: string | null
          tc_number: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          applying_for_class?: string | null
          migration_number?: string | null
          previous_board?: string | null
          previous_class?: string | null
          previous_marks_percent?: number | null
          previous_school?: string | null
          previous_year?: string | null
          remarks?: string | null
          stream?: string | null
          tc_number?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          applying_for_class?: string | null
          migration_number?: string | null
          previous_board?: string | null
          previous_class?: string | null
          previous_marks_percent?: number | null
          previous_school?: string | null
          previous_year?: string | null
          remarks?: string | null
          stream?: string | null
          tc_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_academic_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_address_details: {
        Row: {
          application_id: string
          permanent_city: string | null
          permanent_line1: string | null
          permanent_line2: string | null
          permanent_pincode: string | null
          permanent_state: string | null
          present_city: string | null
          present_line1: string | null
          present_line2: string | null
          present_pincode: string | null
          present_state: string | null
          same_as_present: boolean
          updated_at: string
        }
        Insert: {
          application_id: string
          permanent_city?: string | null
          permanent_line1?: string | null
          permanent_line2?: string | null
          permanent_pincode?: string | null
          permanent_state?: string | null
          present_city?: string | null
          present_line1?: string | null
          present_line2?: string | null
          present_pincode?: string | null
          present_state?: string | null
          same_as_present?: boolean
          updated_at?: string
        }
        Update: {
          application_id?: string
          permanent_city?: string | null
          permanent_line1?: string | null
          permanent_line2?: string | null
          permanent_pincode?: string | null
          permanent_state?: string | null
          present_city?: string | null
          present_line1?: string | null
          present_line2?: string | null
          present_pincode?: string | null
          present_state?: string | null
          same_as_present?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_address_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          ai_checked_at: string | null
          ai_checked_by: string | null
          ai_extracted: Json | null
          ai_flags: Json | null
          ai_status: string | null
          ai_summary: string | null
          application_id: string
          definition_id: string | null
          document_code: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          remarks: string | null
          uploaded_at: string
          verification_status: Database["public"]["Enums"]["doc_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_checked_at?: string | null
          ai_checked_by?: string | null
          ai_extracted?: Json | null
          ai_flags?: Json | null
          ai_status?: string | null
          ai_summary?: string | null
          application_id: string
          definition_id?: string | null
          document_code: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          remarks?: string | null
          uploaded_at?: string
          verification_status?: Database["public"]["Enums"]["doc_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_checked_at?: string | null
          ai_checked_by?: string | null
          ai_extracted?: Json | null
          ai_flags?: Json | null
          ai_status?: string | null
          ai_summary?: string | null
          application_id?: string
          definition_id?: string | null
          document_code?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          remarks?: string | null
          uploaded_at?: string
          verification_status?: Database["public"]["Enums"]["doc_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "document_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      application_hostel_details: {
        Row: {
          application_id: string
          dietary_requirements: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          medical_conditions: string | null
          mess_preference: string | null
          parent_consent: boolean
          room_type: string | null
          selected_campus_label: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          medical_conditions?: string | null
          mess_preference?: string | null
          parent_consent?: boolean
          room_type?: string | null
          selected_campus_label?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          medical_conditions?: string | null
          mess_preference?: string | null
          parent_consent?: boolean
          room_type?: string | null
          selected_campus_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_hostel_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_parent_details: {
        Row: {
          application_id: string
          father_email: string | null
          father_income: number | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          mother_email: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          father_email?: string | null
          father_income?: number | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          father_email?: string | null
          father_income?: number | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_parent_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_student_details: {
        Row: {
          aadhaar: string | null
          application_id: string
          blood_group: string | null
          category: string | null
          date_of_birth: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          last_name: string | null
          middle_name: string | null
          mother_tongue: string | null
          nationality: string | null
          photo_path: string | null
          religion: string | null
          signature_path: string | null
          updated_at: string
        }
        Insert: {
          aadhaar?: string | null
          application_id: string
          blood_group?: string | null
          category?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          last_name?: string | null
          middle_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          photo_path?: string | null
          religion?: string | null
          signature_path?: string | null
          updated_at?: string
        }
        Update: {
          aadhaar?: string | null
          application_id?: string
          blood_group?: string | null
          category?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          last_name?: string | null
          middle_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          photo_path?: string | null
          religion?: string | null
          signature_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_student_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          academic_year_id: string | null
          admission_selection: Json
          applicant_email: string | null
          applicant_phone: string | null
          applicant_user_id: string | null
          application_number: string
          branch_id: string | null
          campus_id: string | null
          created_at: string
          draft_token: string | null
          hostel_id: string | null
          hostel_required: boolean
          id: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          program_id: string | null
          quota_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          admission_selection?: Json
          applicant_email?: string | null
          applicant_phone?: string | null
          applicant_user_id?: string | null
          application_number?: string
          branch_id?: string | null
          campus_id?: string | null
          created_at?: string
          draft_token?: string | null
          hostel_id?: string | null
          hostel_required?: boolean
          id?: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          program_id?: string | null
          quota_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          admission_selection?: Json
          applicant_email?: string | null
          applicant_phone?: string | null
          applicant_user_id?: string | null
          application_number?: string
          branch_id?: string | null
          campus_id?: string | null
          created_at?: string
          draft_token?: string | null
          hostel_id?: string | null
          hostel_required?: boolean
          id?: string
          institution_type?: Database["public"]["Enums"]["institution_type"]
          program_id?: string | null
          quota_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_quota_id_fkey"
            columns: ["quota_id"]
            isOneToOne: false
            referencedRelation: "quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          program_id: string
          seats: number | null
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          program_id: string
          seats?: number | null
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          program_id?: string
          seats?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          state: string | null
          supported_types: Database["public"]["Enums"]["institution_type"][]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          state?: string | null
          supported_types?: Database["public"]["Enums"]["institution_type"][]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          supported_types?: Database["public"]["Enums"]["institution_type"][]
          updated_at?: string
        }
        Relationships: []
      }
      document_definitions: {
        Row: {
          allowed_formats: string[]
          category: string
          code: string
          id: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          is_active: boolean
          max_size_mb: number
          name: string
          required: boolean
          stage: string
        }
        Insert: {
          allowed_formats?: string[]
          category: string
          code: string
          id?: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          is_active?: boolean
          max_size_mb?: number
          name: string
          required?: boolean
          stage?: string
        }
        Update: {
          allowed_formats?: string[]
          category?: string
          code?: string
          id?: string
          institution_type?: Database["public"]["Enums"]["institution_type"]
          is_active?: boolean
          max_size_mb?: number
          name?: string
          required?: boolean
          stage?: string
        }
        Relationships: []
      }
      fee_heads: {
        Row: {
          code: string
          id: string
          institution_type:
            | Database["public"]["Enums"]["institution_type"]
            | null
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          id?: string
          institution_type?:
            | Database["public"]["Enums"]["institution_type"]
            | null
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          id?: string
          institution_type?:
            | Database["public"]["Enums"]["institution_type"]
            | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      hostels: {
        Row: {
          campus_id: string
          capacity: number | null
          gender: Database["public"]["Enums"]["gender"]
          id: string
          is_active: boolean
          name: string
          room_types: Json
        }
        Insert: {
          campus_id: string
          capacity?: number | null
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          name: string
          room_types?: Json
        }
        Update: {
          campus_id?: string
          capacity?: number | null
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          name?: string
          room_types?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hostels_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          created_at: string
          event: string
          gateway_ref: string | null
          id: string
          payload: Json | null
          payment_id: string
        }
        Insert: {
          created_at?: string
          event: string
          gateway_ref?: string | null
          id?: string
          payload?: Json | null
          payment_id: string
        }
        Update: {
          created_at?: string
          event?: string
          gateway_ref?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          currency: string
          fee_head_id: string | null
          id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          purpose: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          currency?: string
          fee_head_id?: string | null
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          purpose?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          currency?: string
          fee_head_id?: string | null
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          purpose?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_head_id_fkey"
            columns: ["fee_head_id"]
            isOneToOne: false
            referencedRelation: "fee_heads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          campus_id: string
          code: string
          created_at: string
          duration_years: number | null
          id: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          is_active: boolean
          name: string
        }
        Insert: {
          campus_id: string
          code: string
          created_at?: string
          duration_years?: number | null
          id?: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          is_active?: boolean
          name: string
        }
        Update: {
          campus_id?: string
          code?: string
          created_at?: string
          duration_years?: number | null
          id?: string
          institution_type?: Database["public"]["Enums"]["institution_type"]
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      quotas: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      status_history: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campus_scopes: {
        Row: {
          campus_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campus_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          campus_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campus_scopes_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_campus_access: {
        Args: { _campus_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_or_admin: { Args: { _user_id: string }; Returns: boolean }
      next_application_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "head_office"
        | "campus_operator"
        | "admission_staff"
        | "doc_verifier"
        | "accounts"
        | "hostel_admin"
        | "applicant"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "documents_pending"
        | "documents_verified"
        | "payment_pending"
        | "payment_completed"
        | "approved"
        | "rejected"
        | "admission_confirmed"
      doc_verification_status:
        | "pending"
        | "verified"
        | "rejected"
        | "reupload_required"
      gender: "male" | "female" | "other"
      institution_type:
        | "school"
        | "intermediate"
        | "college"
        | "degree"
        | "hostel"
      payment_status: "initiated" | "pending" | "paid" | "failed" | "refunded"
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
      app_role: [
        "super_admin",
        "admin",
        "head_office",
        "campus_operator",
        "admission_staff",
        "doc_verifier",
        "accounts",
        "hostel_admin",
        "applicant",
      ],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "documents_pending",
        "documents_verified",
        "payment_pending",
        "payment_completed",
        "approved",
        "rejected",
        "admission_confirmed",
      ],
      doc_verification_status: [
        "pending",
        "verified",
        "rejected",
        "reupload_required",
      ],
      gender: ["male", "female", "other"],
      institution_type: [
        "school",
        "intermediate",
        "college",
        "degree",
        "hostel",
      ],
      payment_status: ["initiated", "pending", "paid", "failed", "refunded"],
    },
  },
} as const
