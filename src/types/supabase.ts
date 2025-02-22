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
      suppliers: {
        Row: {
          id: string
          name: string
          address: string | null
          country: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      carriers: {
        Row: {
          id: string
          name: string
          address: string | null
          country: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      destinations: {
        Row: {
          id: string
          name: string
          address: string | null
          country: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          reference: string
          supplier_id: string
          destination_id: string
          carrier_id: string
          product_description: string | null
          container_type: string
          transport_price: number | null
          order_value: number | null
          initial_payment_date: string | null
          initial_payment_amount: number | null
          final_payment_date: string | null
          final_payment_amount: number | null
          expected_start_date: string
          container_reference: string | null
          etd: string | null
          eta: string | null
          ata: string | null
          status: 'pending' | 'in_production' | 'in_transit' | 'delivered'
          created_at: string
          updated_at: string
          order_date: string
        }
        Insert: {
          id?: string
          reference: string
          supplier_id: string
          destination_id: string
          carrier_id: string
          product_description?: string | null
          container_type: string
          transport_price?: number | null
          order_value?: number | null
          initial_payment_date?: string | null
          initial_payment_amount?: number | null
          final_payment_date?: string | null
          final_payment_amount?: number | null
          expected_start_date: string
          container_reference?: string | null
          etd?: string | null
          eta?: string | null
          ata?: string | null
          status?: 'pending' | 'in_production' | 'in_transit' | 'delivered'
          created_at?: string
          updated_at?: string
          order_date?: string
        }
        Update: {
          id?: string
          reference?: string
          supplier_id?: string
          destination_id?: string
          carrier_id?: string
          product_description?: string | null
          container_type?: string
          transport_price?: number | null
          order_value?: number | null
          initial_payment_date?: string | null
          initial_payment_amount?: number | null
          final_payment_date?: string | null
          final_payment_amount?: number | null
          expected_start_date?: string
          container_reference?: string | null
          etd?: string | null
          eta?: string | null
          ata?: string | null
          status?: 'pending' | 'in_production' | 'in_transit' | 'delivered'
          created_at?: string
          updated_at?: string
          order_date?: string
        }
      }
    }
  }
}