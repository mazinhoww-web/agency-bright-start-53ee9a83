export type ProcessStatus =
  | 'pending_form'
  | 'form_completed'
  | 'consular_fee_paid'
  | 'appointment_requested'
  | 'docs_in_preparation'
  | 'docs_ready'
  | 'completed'

export type LocationType = 'casv' | 'consulate'

export type Database = {
  public: {
    Tables: {
      processes: {
        Row: {
          id: string
          user_id: string
          package: string
          max_applicants: number
          status: ProcessStatus
          consulting_payment_id: string | null
          consulting_amount_brl: number | null
          consulting_paid_at: string | null
          consular_payment_id: string | null
          consular_amount_brl: number | null
          consular_usd_rate: number | null
          consular_paid_at: string | null
          casv_city: string | null
          casv_intended_date: string | null
          consulate_city: string | null
          consulate_intended_date: string | null
          appointment_disclaimer_accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['processes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['processes']['Insert']>
      }
      applicants: {
        Row: {
          id: string
          process_id: string
          is_primary: boolean
          label: string
          surname: string | null
          given_name: string | null
          other_names: string | null
          gender: string | null
          marital_status: string | null
          birth_date: string | null
          birth_city: string | null
          birth_state: string | null
          birth_country: string | null
          passport_type: string | null
          passport_number: string | null
          passport_country: string | null
          passport_issue_date: string | null
          passport_expiry_date: string | null
          address_street: string | null
          address_number: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          phone_residential: string | null
          phone_mobile: string | null
          email: string | null
          travel_purpose: string | null
          intended_arrival_date: string | null
          intended_stay_duration: string | null
          us_address: string | null
          trip_payer: string | null
          employment_data: Record<string, unknown> | null
          education_data: Record<string, unknown> | null
          family_data: Record<string, unknown> | null
          security_questions: Record<string, unknown> | null
          previous_us_travel: Record<string, unknown> | null
          social_media: Record<string, unknown> | null
          photo_url: string | null
          form_step: number
          form_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applicants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applicants']['Insert']>
      }
      documents: {
        Row: {
          id: string
          process_id: string
          name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      available_dates: {
        Row: {
          id: string
          location_type: LocationType
          city: string
          date: string
          is_active: boolean
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['available_dates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['available_dates']['Insert']>
      }
      whatsapp_logs: {
        Row: {
          id: string
          process_id: string | null
          to_number: string
          message: string
          event: string | null
          status: string
          z_api_response: Record<string, unknown> | null
          sent_at: string
        }
        Insert: Omit<Database['public']['Tables']['whatsapp_logs']['Row'], 'id' | 'sent_at'>
        Update: Partial<Database['public']['Tables']['whatsapp_logs']['Insert']>
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          old_value: Record<string, unknown> | null
          new_value: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_audit_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Insert']>
      }
      admin_notes: {
        Row: {
          id: string
          process_id: string
          admin_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_notes']['Insert']>
      }
    }
  }
}
