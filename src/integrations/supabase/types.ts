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
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_catalog_requests: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          model_number: string | null
          name: string
          photo_path: string | null
          segment: string | null
          status: string
          technician_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          model_number?: string | null
          name: string
          photo_path?: string | null
          segment?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          model_number?: string | null
          name?: string
          photo_path?: string | null
          segment?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_catalog_requests_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          approved_at: string | null
          assignment_id: string
          created_at: string
          customer_id: string
          id: string
          paid_at: string | null
          parts_replaced: string | null
          repair_notes: string | null
          repair_request_id: string
          status: string
          technician_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          assignment_id: string
          created_at?: string
          customer_id: string
          id?: string
          paid_at?: string | null
          parts_replaced?: string | null
          repair_notes?: string | null
          repair_request_id: string
          status?: string
          technician_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          assignment_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          paid_at?: string | null
          parts_replaced?: string | null
          repair_notes?: string | null
          repair_request_id?: string
          status?: string
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "request_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_repair_request_id_fkey"
            columns: ["repair_request_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repair_request_images: {
        Row: {
          id: string
          repair_request_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          id?: string
          repair_request_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          id?: string
          repair_request_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_request_images_repair_request_id_fkey"
            columns: ["repair_request_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_requests: {
        Row: {
          address: string | null
          brand: string | null
          category_id: string | null
          city: string | null
          created_at: string
          customer_id: string
          id: string
          issue_description: string
          lat: number | null
          lng: number | null
          model: string | null
          pincode: string | null
          preferred_visit_time: string | null
          priority: string | null
          state: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          customer_id: string
          id?: string
          issue_description: string
          lat?: number | null
          lng?: number | null
          model?: string | null
          pincode?: string | null
          preferred_visit_time?: string | null
          priority?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          issue_description?: string
          lat?: number | null
          lng?: number | null
          model?: string | null
          pincode?: string | null
          preferred_visit_time?: string | null
          priority?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      request_assignments: {
        Row: {
          accepted_at: string | null
          amount: number | null
          completed_at: string | null
          created_at: string
          id: string
          parts_replaced: string | null
          repair_notes: string | null
          repair_request_id: string
          status: string | null
          technician_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          parts_replaced?: string | null
          repair_notes?: string | null
          repair_request_id: string
          status?: string | null
          technician_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          parts_replaced?: string | null
          repair_notes?: string | null
          repair_request_id?: string
          status?: string | null
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_assignments_repair_request_id_fkey"
            columns: ["repair_request_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          repair_request_id: string
          sender_id: string
          sender_role: string
          technician_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          repair_request_id: string
          sender_id: string
          sender_role?: string
          technician_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          repair_request_id?: string
          sender_id?: string
          sender_role?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_repair_request_id_fkey"
            columns: ["repair_request_id"]
            isOneToOne: false
            referencedRelation: "repair_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          assignment_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          assignment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          assignment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "request_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_capabilities: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          equipment: string | null
          equipment_type: string | null
          experience_years: number
          id: string
          segment: string
          service: string | null
          skill: string | null
          skill_level: string | null
          technician_id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          equipment?: string | null
          equipment_type?: string | null
          experience_years?: number
          id?: string
          segment: string
          service?: string | null
          skill?: string | null
          skill_level?: string | null
          technician_id: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          equipment?: string | null
          equipment_type?: string | null
          experience_years?: number
          id?: string
          segment?: string
          service?: string | null
          skill?: string | null
          skill_level?: string | null
          technician_id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_capabilities_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_categories: {
        Row: {
          category_id: string
          id: string
          technician_id: string
        }
        Insert: {
          category_id: string
          id?: string
          technician_id: string
        }
        Update: {
          category_id?: string
          id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_categories_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_certifications: {
        Row: {
          certificate_number: string | null
          certificate_url: string | null
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          name: string
          technician_id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name: string
          technician_id: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string
          technician_id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_certifications_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_documents: {
        Row: {
          created_at: string
          document_type: string
          file_path: string
          id: string
          rejection_reason: string | null
          technician_id: string
          updated_at: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          technician_id: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          technician_id?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_documents_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_onboarding: {
        Row: {
          completion_percent: number
          created_at: string
          current_step: number
          data: Json
          id: string
          status: string
          submitted_at: string | null
          technician_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percent?: number
          created_at?: string
          current_step?: number
          data?: Json
          id?: string
          status?: string
          submitted_at?: string | null
          technician_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percent?: number
          created_at?: string
          current_step?: number
          data?: Json
          id?: string
          status?: string
          submitted_at?: string | null
          technician_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_onboarding_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_payment_details: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          created_at: string
          id: string
          ifsc: string | null
          technician_id: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          ifsc?: string | null
          technician_id: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          ifsc?: string | null
          technician_id?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_payment_details_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_qualifications: {
        Row: {
          certificate_url: string | null
          created_at: string
          id: string
          institute: string | null
          qualification: string
          technician_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          id?: string
          institute?: string | null
          qualification: string
          technician_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          id?: string
          institute?: string | null
          qualification?: string
          technician_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_qualifications_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_service_areas: {
        Row: {
          city: string
          district: string | null
          id: string
          locality: string | null
          pan_india: boolean
          pincode: string | null
          radius_km: number | null
          state: string
          technician_id: string
        }
        Insert: {
          city: string
          district?: string | null
          id?: string
          locality?: string | null
          pan_india?: boolean
          pincode?: string | null
          radius_km?: number | null
          state: string
          technician_id: string
        }
        Update: {
          city?: string
          district?: string | null
          id?: string
          locality?: string | null
          pan_india?: boolean
          pincode?: string | null
          radius_km?: number | null
          state?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_service_areas_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          aadhaar_url: string | null
          address: string | null
          availability: Json
          avg_rating: number | null
          business: Json
          business_name: string | null
          city: string | null
          completion_percent: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          display_name: string | null
          district: string | null
          experience_months: number
          experience_years: number | null
          gst_number: string | null
          headline: string | null
          id: string
          is_approved: boolean | null
          is_available: boolean | null
          lat: number | null
          lng: number | null
          onboarding_status: string
          pan_url: string | null
          pincode: string | null
          pricing: Json
          profile_id: string
          profile_photo_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          segments: string[]
          service_modes: string[]
          service_radius_km: number | null
          shop_photo_url: string | null
          state: string | null
          submitted_at: string | null
          technician_type: string | null
          total_reviews: number | null
          updated_at: string
          visiting_card_url: string | null
          whatsapp_number: string | null
          workshop: Json
        }
        Insert: {
          aadhaar_url?: string | null
          address?: string | null
          availability?: Json
          avg_rating?: number | null
          business?: Json
          business_name?: string | null
          city?: string | null
          completion_percent?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          district?: string | null
          experience_months?: number
          experience_years?: number | null
          gst_number?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string
          pan_url?: string | null
          pincode?: string | null
          pricing?: Json
          profile_id: string
          profile_photo_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          segments?: string[]
          service_modes?: string[]
          service_radius_km?: number | null
          shop_photo_url?: string | null
          state?: string | null
          submitted_at?: string | null
          technician_type?: string | null
          total_reviews?: number | null
          updated_at?: string
          visiting_card_url?: string | null
          whatsapp_number?: string | null
          workshop?: Json
        }
        Update: {
          aadhaar_url?: string | null
          address?: string | null
          availability?: Json
          avg_rating?: number | null
          business?: Json
          business_name?: string | null
          city?: string | null
          completion_percent?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          district?: string | null
          experience_months?: number
          experience_years?: number | null
          gst_number?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string
          pan_url?: string | null
          pincode?: string | null
          pricing?: Json
          profile_id?: string
          profile_photo_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          segments?: string[]
          service_modes?: string[]
          service_radius_km?: number | null
          shop_photo_url?: string | null
          state?: string | null
          submitted_at?: string | null
          technician_type?: string | null
          total_reviews?: number | null
          updated_at?: string
          visiting_card_url?: string | null
          whatsapp_number?: string | null
          workshop?: Json
        }
        Relationships: [
          {
            foreignKeyName: "technicians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "customer" | "technician"
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
      app_role: ["admin", "customer", "technician"],
    },
  },
} as const
