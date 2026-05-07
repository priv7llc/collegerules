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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          route_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          route_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          route_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      articulation_rules: {
        Row: {
          catalog_year: string | null
          created_at: string
          destination_program_id: string | null
          id: string
          last_verified_at: string | null
          major_name: string | null
          official_articulation_url: string | null
          rules_payload: Json | null
          source_college_id: string | null
        }
        Insert: {
          catalog_year?: string | null
          created_at?: string
          destination_program_id?: string | null
          id?: string
          last_verified_at?: string | null
          major_name?: string | null
          official_articulation_url?: string | null
          rules_payload?: Json | null
          source_college_id?: string | null
        }
        Update: {
          catalog_year?: string | null
          created_at?: string
          destination_program_id?: string | null
          id?: string
          last_verified_at?: string | null
          major_name?: string | null
          official_articulation_url?: string | null
          rules_payload?: Json | null
          source_college_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articulation_rules_destination_program_id_fkey"
            columns: ["destination_program_id"]
            isOneToOne: false
            referencedRelation: "destination_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articulation_rules_source_college_id_fkey"
            columns: ["source_college_id"]
            isOneToOne: false
            referencedRelation: "source_colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          item_key: string
          route_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          item_key: string
          route_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          item_key?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_progress_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          course_key: string
          grade: string | null
          id: string
          route_id: string
          status: string
          term_taken: string | null
          updated_at: string
        }
        Insert: {
          course_key: string
          grade?: string | null
          id?: string
          route_id: string
          status?: string
          term_taken?: string | null
          updated_at?: string
        }
        Update: {
          course_key?: string
          grade?: string | null
          id?: string
          route_id?: string
          status?: string
          term_taken?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_programs: {
        Row: {
          catalog_year: string | null
          created_at: string
          id: string
          last_verified_at: string | null
          official_program_url: string | null
          program_name: string
          requirements_payload: Json | null
          university_name: string
        }
        Insert: {
          catalog_year?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          official_program_url?: string | null
          program_name: string
          requirements_payload?: Json | null
          university_name: string
        }
        Update: {
          catalog_year?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          official_program_url?: string | null
          program_name?: string
          requirements_payload?: Json | null
          university_name?: string
        }
        Relationships: []
      }
      essays: {
        Row: {
          application_id: string | null
          content: string | null
          created_at: string
          id: string
          is_template: boolean
          prompt: string | null
          title: string | null
          tone: string | null
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          application_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_template?: boolean
          prompt?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          application_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_template?: boolean
          prompt?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "essays_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          price_cents: number
          route_credits: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          price_cents: number
          route_credits: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          price_cents?: number
          route_credits?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          product_code: string
          status: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          product_code: string
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          product_code?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      route_credits: {
        Row: {
          created_at: string
          credits_added: number
          credits_used: number
          id: string
          purchase_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_added?: number
          credits_used?: number
          id?: string
          purchase_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_added?: number
          credits_used?: number
          id?: string
          purchase_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_credits_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      route_dashboards: {
        Row: {
          created_at: string
          dashboard_payload: Json
          generated_by: string | null
          id: string
          llm_model: string | null
          needs_manual_review: boolean
          route_id: string
          version: number
        }
        Insert: {
          created_at?: string
          dashboard_payload?: Json
          generated_by?: string | null
          id?: string
          llm_model?: string | null
          needs_manual_review?: boolean
          route_id: string
          version?: number
        }
        Update: {
          created_at?: string
          dashboard_payload?: Json
          generated_by?: string | null
          id?: string
          llm_model?: string | null
          needs_manual_review?: boolean
          route_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_dashboards_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_inputs: {
        Row: {
          ap_ib_credits: Json | null
          completed_courses: Json | null
          created_at: string
          gpa: number | null
          id: string
          in_progress_courses: Json | null
          raw_form_payload: Json | null
          route_id: string
          student_preferences: Json | null
        }
        Insert: {
          ap_ib_credits?: Json | null
          completed_courses?: Json | null
          created_at?: string
          gpa?: number | null
          id?: string
          in_progress_courses?: Json | null
          raw_form_payload?: Json | null
          route_id: string
          student_preferences?: Json | null
        }
        Update: {
          ap_ib_credits?: Json | null
          completed_courses?: Json | null
          created_at?: string
          gpa?: number | null
          id?: string
          in_progress_courses?: Json | null
          raw_form_payload?: Json | null
          route_id?: string
          student_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "route_inputs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          catalog_year: string | null
          community_college: string | null
          created_at: string
          destination_program: string | null
          destination_university: string | null
          id: string
          major: string | null
          route_name: string | null
          status: Database["public"]["Enums"]["route_status"]
          transfer_term: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          catalog_year?: string | null
          community_college?: string | null
          created_at?: string
          destination_program?: string | null
          destination_university?: string | null
          id?: string
          major?: string | null
          route_name?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          transfer_term?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          catalog_year?: string | null
          community_college?: string | null
          created_at?: string
          destination_program?: string | null
          destination_university?: string | null
          id?: string
          major?: string | null
          route_name?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          transfer_term?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scholarship_applications: {
        Row: {
          amount_won_cents: number | null
          created_at: string
          id: string
          notes: string | null
          route_id: string | null
          scholarship_id: string
          status: Database["public"]["Enums"]["scholarship_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_won_cents?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          route_id?: string | null
          scholarship_id: string
          status?: Database["public"]["Enums"]["scholarship_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_won_cents?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          route_id?: string | null
          scholarship_id?: string
          status?: Database["public"]["Enums"]["scholarship_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_candidates: {
        Row: {
          amount_cents: number | null
          confidence_score: number | null
          created_at: string
          deadline: string | null
          description: string | null
          eligibility_criteria: Json
          essay_prompts: Json
          external_url: string | null
          id: string
          name: string
          rejection_reason: string | null
          relevance_reasoning: string | null
          relevance_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_query: string | null
          source_url: string | null
          sponsor: string | null
          status: Database["public"]["Enums"]["candidate_status"]
        }
        Insert: {
          amount_cents?: number | null
          confidence_score?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_criteria?: Json
          essay_prompts?: Json
          external_url?: string | null
          id?: string
          name: string
          rejection_reason?: string | null
          relevance_reasoning?: string | null
          relevance_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_query?: string | null
          source_url?: string | null
          sponsor?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
        }
        Update: {
          amount_cents?: number | null
          confidence_score?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_criteria?: Json
          essay_prompts?: Json
          external_url?: string | null
          id?: string
          name?: string
          rejection_reason?: string | null
          relevance_reasoning?: string | null
          relevance_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_query?: string | null
          source_url?: string | null
          sponsor?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
        }
        Relationships: []
      }
      scholarship_profiles: {
        Row: {
          arts_activities: string[] | null
          career_goal: string | null
          career_motivation: string | null
          challenges_overcome: string | null
          citizenship_status: string | null
          city: string | null
          clubs_organizations: string[] | null
          community_service_hours: number | null
          created_at: string
          current_gpa: number | null
          disability_status: boolean | null
          ethnicities: string[] | null
          expected_family_contribution_cents: number | null
          first_generation_college: boolean | null
          gender: string | null
          household_income_range: string | null
          id: string
          intended_major: string | null
          leadership_roles: string[] | null
          lgbtq: boolean | null
          pell_grant_eligible: boolean | null
          profile_completeness: number
          religion: string | null
          single_parent_household: boolean | null
          sports: string[] | null
          state_of_residence: string | null
          unique_attributes: string | null
          updated_at: string
          user_id: string
          veteran_or_military_family: boolean | null
          work_experience: Json | null
          zip_code: string | null
        }
        Insert: {
          arts_activities?: string[] | null
          career_goal?: string | null
          career_motivation?: string | null
          challenges_overcome?: string | null
          citizenship_status?: string | null
          city?: string | null
          clubs_organizations?: string[] | null
          community_service_hours?: number | null
          created_at?: string
          current_gpa?: number | null
          disability_status?: boolean | null
          ethnicities?: string[] | null
          expected_family_contribution_cents?: number | null
          first_generation_college?: boolean | null
          gender?: string | null
          household_income_range?: string | null
          id?: string
          intended_major?: string | null
          leadership_roles?: string[] | null
          lgbtq?: boolean | null
          pell_grant_eligible?: boolean | null
          profile_completeness?: number
          religion?: string | null
          single_parent_household?: boolean | null
          sports?: string[] | null
          state_of_residence?: string | null
          unique_attributes?: string | null
          updated_at?: string
          user_id: string
          veteran_or_military_family?: boolean | null
          work_experience?: Json | null
          zip_code?: string | null
        }
        Update: {
          arts_activities?: string[] | null
          career_goal?: string | null
          career_motivation?: string | null
          challenges_overcome?: string | null
          citizenship_status?: string | null
          city?: string | null
          clubs_organizations?: string[] | null
          community_service_hours?: number | null
          created_at?: string
          current_gpa?: number | null
          disability_status?: boolean | null
          ethnicities?: string[] | null
          expected_family_contribution_cents?: number | null
          first_generation_college?: boolean | null
          gender?: string | null
          household_income_range?: string | null
          id?: string
          intended_major?: string | null
          leadership_roles?: string[] | null
          lgbtq?: boolean | null
          pell_grant_eligible?: boolean | null
          profile_completeness?: number
          religion?: string | null
          single_parent_household?: boolean | null
          sports?: string[] | null
          state_of_residence?: string | null
          unique_attributes?: string | null
          updated_at?: string
          user_id?: string
          veteran_or_military_family?: boolean | null
          work_experience?: Json | null
          zip_code?: string | null
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          active: boolean
          amount_cents: number
          created_at: string
          deadline: string | null
          description: string | null
          eligibility_criteria: Json
          essay_prompts: Json
          external_url: string | null
          id: string
          name: string
          sponsor: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_cents: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_criteria?: Json
          essay_prompts?: Json
          external_url?: string | null
          id?: string
          name: string
          sponsor?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility_criteria?: Json
          essay_prompts?: Json
          external_url?: string | null
          id?: string
          name?: string
          sponsor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      source_colleges: {
        Row: {
          active: boolean
          college_name: string
          created_at: string
          id: string
          state: string | null
          system: string | null
        }
        Insert: {
          active?: boolean
          college_name: string
          created_at?: string
          id?: string
          state?: string | null
          system?: string | null
        }
        Update: {
          active?: boolean
          college_name?: string
          created_at?: string
          id?: string
          state?: string | null
          system?: string | null
        }
        Relationships: []
      }
      source_majors: {
        Row: {
          catalog_year: string | null
          college_id: string | null
          created_at: string
          id: string
          last_verified_at: string | null
          major_code: string | null
          major_name: string
          official_catalog_url: string | null
          requirements_payload: Json | null
        }
        Insert: {
          catalog_year?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          major_code?: string | null
          major_name: string
          official_catalog_url?: string | null
          requirements_payload?: Json | null
        }
        Update: {
          catalog_year?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          major_code?: string | null
          major_name?: string
          official_catalog_url?: string | null
          requirements_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "source_majors_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "source_colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      university_costs: {
        Row: {
          books_supplies_cents: number | null
          catalog_year: string | null
          created_at: string
          housing_food_cents: number | null
          id: string
          in_state: boolean
          last_verified_at: string | null
          personal_misc_cents: number | null
          system: string | null
          total_cost_cents: number
          transportation_cents: number | null
          tuition_cents: number
          university_name: string
        }
        Insert: {
          books_supplies_cents?: number | null
          catalog_year?: string | null
          created_at?: string
          housing_food_cents?: number | null
          id?: string
          in_state?: boolean
          last_verified_at?: string | null
          personal_misc_cents?: number | null
          system?: string | null
          total_cost_cents: number
          transportation_cents?: number | null
          tuition_cents: number
          university_name: string
        }
        Update: {
          books_supplies_cents?: number | null
          catalog_year?: string | null
          created_at?: string
          housing_food_cents?: number | null
          id?: string
          in_state?: boolean
          last_verified_at?: string | null
          personal_misc_cents?: number | null
          system?: string | null
          total_cost_cents?: number
          transportation_cents?: number | null
          tuition_cents?: number
          university_name?: string
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
      get_remaining_credits: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_scholarships_for_user: {
        Args: { _user_id: string }
        Returns: {
          active: boolean
          amount_cents: number
          created_at: string
          deadline: string
          description: string
          eligibility_criteria: Json
          essay_prompts: Json
          external_url: string
          id: string
          match_reasons: string[]
          match_score: number
          name: string
          sponsor: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student"
      candidate_status: "pending" | "approved" | "rejected" | "duplicate"
      purchase_status: "pending" | "completed" | "failed" | "refunded"
      route_status:
        | "draft"
        | "processing"
        | "ready"
        | "needs_review"
        | "archived"
      scholarship_status: "saved" | "in_progress" | "submitted" | "won" | "lost"
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
      app_role: ["admin", "student"],
      candidate_status: ["pending", "approved", "rejected", "duplicate"],
      purchase_status: ["pending", "completed", "failed", "refunded"],
      route_status: [
        "draft",
        "processing",
        "ready",
        "needs_review",
        "archived",
      ],
      scholarship_status: ["saved", "in_progress", "submitted", "won", "lost"],
    },
  },
} as const
