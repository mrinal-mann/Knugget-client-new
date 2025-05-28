// types/supabase.ts - Supabase generated types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          plan: 'FREE' | 'PREMIUM'
          credits: number
          supabase_id: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          email_verified: boolean
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar?: string | null
          plan?: 'FREE' | 'PREMIUM'
          credits?: number
          supabase_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          email_verified?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          plan?: 'FREE' | 'PREMIUM'
          credits?: number
          supabase_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          email_verified?: boolean
        }
        Relationships: []
      }
      summaries: {
        Row: {
          id: string
          title: string
          key_points: string[]
          full_summary: string
          tags: string[]
          status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          video_id: string
          video_title: string
          channel_name: string
          video_duration: string | null
          video_url: string
          thumbnail_url: string | null
          transcript: Json | null
          transcript_text: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          key_points?: string[]
          full_summary: string
          tags?: string[]
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          video_id: string
          video_title: string
          channel_name: string
          video_duration?: string | null
          video_url: string
          thumbnail_url?: string | null
          transcript?: Json | null
          transcript_text?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          key_points?: string[]
          full_summary?: string
          tags?: string[]
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          video_id?: string
          video_title?: string
          channel_name?: string
          video_duration?: string | null
          video_url?: string
          thumbnail_url?: string | null
          transcript?: Json | null
          transcript_text?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'summaries_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      refresh_tokens: {
        Row: {
          id: string
          token: string
          user_id: string
          expires_at: string
          created_at: string
          revoked: boolean
        }
        Insert: {
          id?: string
          token: string
          user_id: string
          expires_at: string
          created_at?: string
          revoked?: boolean
        }
        Update: {
          id?: string
          token?: string
          user_id?: string
          expires_at?: string
          created_at?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'refresh_tokens_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      video_metadata: {
        Row: {
          id: string
          video_id: string
          title: string
          channel_name: string
          duration: string | null
          thumbnail_url: string | null
          description: string | null
          published_at: string | null
          view_count: number | null
          like_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          title: string
          channel_name: string
          duration?: string | null
          thumbnail_url?: string | null
          description?: string | null
          published_at?: string | null
          view_count?: number | null
          like_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          title?: string
          channel_name?: string
          duration?: string | null
          thumbnail_url?: string | null
          description?: string | null
          published_at?: string | null
          view_count?: number | null
          like_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          method: string
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          method: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          method?: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'api_usage_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
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
      user_plan: 'FREE' | 'PREMIUM'
      summary_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}