export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activity: {
        Row: {
          action: Database['public']['Enums']['action']
          action_timestamp: string
          actor_address: string
          created_at: string
          id: string
          target_address: string
          updated_at: string
        }
        Insert: {
          action: Database['public']['Enums']['action']
          action_timestamp: string
          actor_address: string
          created_at?: string
          id?: string
          target_address: string
          updated_at?: string
        }
        Update: {
          action?: Database['public']['Enums']['action']
          action_timestamp?: string
          actor_address?: string
          created_at?: string
          id?: string
          target_address?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_actor_address_fkey'
            columns: ['actor_address']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['wallet_address']
          }
        ]
      }
      user: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_ulid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_followers: {
        Args: {
          target_address: string
        }
        Returns: {
          actor_address: string
          action_timestamp: string
          created_at: string
        }[]
      }
      get_following: {
        Args: {
          actor_address: string
        }
        Returns: {
          target_address: string
          action_timestamp: string
          created_at: string
        }[]
      }
      health: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      action: 'follow' | 'unfollow' | 'block' | 'unblock' | 'mute' | 'unmute'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
