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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          created_at: string
          id: string
          max_tokens: number
          model_id: string | null
          name: string
          purpose: string
          runs_30d: number
          status: string
          success_rate: number
          system_prompt: string
          temperature: number
          tools: Json
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number
          model_id?: string | null
          name: string
          purpose: string
          runs_30d?: number
          status?: string
          success_rate?: number
          system_prompt?: string
          temperature?: number
          tools?: Json
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number
          model_id?: string | null
          name?: string
          purpose?: string
          runs_30d?: number
          status?: string
          success_rate?: number
          system_prompt?: string
          temperature?: number
          tools?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decision_logs: {
        Row: {
          agent_id: string | null
          confidence: number
          cost_usd: number
          decision: string
          id: string
          input_summary: string | null
          model_id: string | null
          occurred_at: string
          outcome: string
          output_summary: string | null
          tokens: number
        }
        Insert: {
          agent_id?: string | null
          confidence?: number
          cost_usd?: number
          decision: string
          id?: string
          input_summary?: string | null
          model_id?: string | null
          occurred_at?: string
          outcome?: string
          output_summary?: string | null
          tokens?: number
        }
        Update: {
          agent_id?: string | null
          confidence?: number
          cost_usd?: number
          decision?: string
          id?: string
          input_summary?: string | null
          model_id?: string | null
          occurred_at?: string
          outcome?: string
          output_summary?: string | null
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_decision_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          context_window: number
          created_at: string
          id: string
          input_cost_per_1k: number
          is_default: boolean
          latency_ms: number
          modality: string
          model_id: string
          name: string
          output_cost_per_1k: number
          provider_id: string | null
          quality_score: number
          status: string
        }
        Insert: {
          context_window?: number
          created_at?: string
          id?: string
          input_cost_per_1k?: number
          is_default?: boolean
          latency_ms?: number
          modality?: string
          model_id: string
          name: string
          output_cost_per_1k?: number
          provider_id?: string | null
          quality_score?: number
          status?: string
        }
        Update: {
          context_window?: number
          created_at?: string
          id?: string
          input_cost_per_1k?: number
          is_default?: boolean
          latency_ms?: number
          modality?: string
          model_id?: string
          name?: string
          output_cost_per_1k?: number
          provider_id?: string | null
          quality_score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          base_url: string | null
          category: string
          created_at: string
          docs_url: string | null
          id: string
          monthly_cost_usd: number
          name: string
          region: string
          slug: string
          status: string
        }
        Insert: {
          base_url?: string | null
          category?: string
          created_at?: string
          docs_url?: string | null
          id?: string
          monthly_cost_usd?: number
          name: string
          region?: string
          slug: string
          status?: string
        }
        Update: {
          base_url?: string | null
          category?: string
          created_at?: string
          docs_url?: string | null
          id?: string
          monthly_cost_usd?: number
          name?: string
          region?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      api_integrations: {
        Row: {
          auth_type: string
          category: string
          created_at: string
          direction: string
          error_count: number
          id: string
          last_sync_at: string | null
          name: string
          provider_id: string | null
          status: string
          sync_frequency: string
          webhook_url: string | null
        }
        Insert: {
          auth_type?: string
          category?: string
          created_at?: string
          direction?: string
          error_count?: number
          id?: string
          last_sync_at?: string | null
          name: string
          provider_id?: string | null
          status?: string
          sync_frequency?: string
          webhook_url?: string | null
        }
        Update: {
          auth_type?: string
          category?: string
          created_at?: string
          direction?: string
          error_count?: number
          id?: string
          last_sync_at?: string | null
          name?: string
          provider_id?: string | null
          status?: string
          sync_frequency?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          environment: string
          expires_at: string | null
          fingerprint: string
          id: string
          key_prefix: string
          label: string
          last_four: string
          last_rotated_at: string | null
          last_used_at: string | null
          provider_id: string | null
          rotation_days: number
          scopes: string[]
          secret_encrypted: string | null
          service_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          environment?: string
          expires_at?: string | null
          fingerprint: string
          id?: string
          key_prefix?: string
          label: string
          last_four?: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          provider_id?: string | null
          rotation_days?: number
          scopes?: string[]
          secret_encrypted?: string | null
          service_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          environment?: string
          expires_at?: string | null
          fingerprint?: string
          id?: string
          key_prefix?: string
          label?: string
          last_four?: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          provider_id?: string | null
          rotation_days?: number
          scopes?: string[]
          secret_encrypted?: string | null
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          error_message: string | null
          id: string
          ip: string | null
          latency_ms: number
          method: string
          occurred_at: string
          path: string
          request_id: string | null
          service_id: string | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          ip?: string | null
          latency_ms?: number
          method?: string
          occurred_at?: string
          path?: string
          request_id?: string | null
          service_id?: string | null
          status_code?: number
          user_agent?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          ip?: string | null
          latency_ms?: number
          method?: string
          occurred_at?: string
          path?: string
          request_id?: string | null
          service_id?: string | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      api_services: {
        Row: {
          avg_latency_ms: number
          category: string
          created_at: string
          endpoint_url: string | null
          health_status: string
          id: string
          last_checked_at: string | null
          name: string
          owner_team: string
          provider_id: string | null
          slug: string
          status: string
          type: string
          uptime_pct: number
          version: string
        }
        Insert: {
          avg_latency_ms?: number
          category?: string
          created_at?: string
          endpoint_url?: string | null
          health_status?: string
          id?: string
          last_checked_at?: string | null
          name: string
          owner_team?: string
          provider_id?: string | null
          slug: string
          status?: string
          type?: string
          uptime_pct?: number
          version?: string
        }
        Update: {
          avg_latency_ms?: number
          category?: string
          created_at?: string
          endpoint_url?: string | null
          health_status?: string
          id?: string
          last_checked_at?: string | null
          name?: string
          owner_team?: string
          provider_id?: string | null
          slug?: string
          status?: string
          type?: string
          uptime_pct?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string
          entity_id: string | null
          entity_type: string
          id: string
          ip: string | null
          metadata: Json
          occurred_at: string
          severity: string
        }
        Insert: {
          action: string
          actor?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          metadata?: Json
          occurred_at?: string
          severity?: string
        }
        Update: {
          action?: string
          actor?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          metadata?: Json
          occurred_at?: string
          severity?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          condition: Json
          created_at: string
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          trigger_type: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          condition?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_type?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          condition?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_type?: string
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          currency: string
          id: string
          included_requests: number
          monthly_fee: number
          name: string
          overage_per_1k: number
          provider_id: string | null
          renewal_date: string | null
          status: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          included_requests?: number
          monthly_fee?: number
          name: string
          overage_per_1k?: number
          provider_id?: string | null
          renewal_date?: string | null
          status?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          included_requests?: number
          monthly_fee?: number
          name?: string
          overage_per_1k?: number
          provider_id?: string | null
          renewal_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_entries: {
        Row: {
          cache_key: string
          cost_saved_usd: number
          created_at: string
          hits: number
          id: string
          last_hit_at: string | null
          model: string
          size_kb: number
          ttl_hours: number
        }
        Insert: {
          cache_key: string
          cost_saved_usd?: number
          created_at?: string
          hits?: number
          id?: string
          last_hit_at?: string | null
          model: string
          size_kb?: number
          ttl_hours?: number
        }
        Update: {
          cache_key?: string
          cost_saved_usd?: number
          created_at?: string
          hits?: number
          id?: string
          last_hit_at?: string | null
          model?: string
          size_kb?: number
          ttl_hours?: number
        }
        Relationships: []
      }
      cost_recommendations: {
        Row: {
          category: string
          created_at: string
          detail: string
          effort: string
          estimated_monthly_saving: number
          id: string
          service_id: string | null
          status: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          detail?: string
          effort?: string
          estimated_monthly_saving?: number
          id?: string
          service_id?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          detail?: string
          effort?: string
          estimated_monthly_saving?: number
          id?: string
          service_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_recommendations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      data_governance_rules: {
        Row: {
          compliance_tags: string[]
          created_at: string
          data_class: string
          enabled: boolean
          encryption: string
          id: string
          masking: string
          name: string
          region: string
          retention_days: number
        }
        Insert: {
          compliance_tags?: string[]
          created_at?: string
          data_class?: string
          enabled?: boolean
          encryption?: string
          id?: string
          masking?: string
          name: string
          region?: string
          retention_days?: number
        }
        Update: {
          compliance_tags?: string[]
          created_at?: string
          data_class?: string
          enabled?: boolean
          encryption?: string
          id?: string
          masking?: string
          name?: string
          region?: string
          retention_days?: number
        }
        Relationships: []
      }
      emergency_controls: {
        Row: {
          description: string | null
          engaged: boolean
          engaged_at: string | null
          engaged_by: string | null
          id: string
          key: string
          label: string
          scope: string
        }
        Insert: {
          description?: string | null
          engaged?: boolean
          engaged_at?: string | null
          engaged_by?: string | null
          id?: string
          key: string
          label: string
          scope?: string
        }
        Update: {
          description?: string | null
          engaged?: boolean
          engaged_at?: string | null
          engaged_by?: string | null
          id?: string
          key?: string
          label?: string
          scope?: string
        }
        Relationships: []
      }
      error_events: {
        Row: {
          created_at: string
          fingerprint: string
          fn_name: string | null
          id: string
          message: string
          metadata: Json
          occurred_at: string
          resolved: boolean
          route: string | null
          severity: string
          source: string
          stack: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          fingerprint: string
          fn_name?: string | null
          id?: string
          message: string
          metadata?: Json
          occurred_at?: string
          resolved?: boolean
          route?: string | null
          severity?: string
          source: string
          stack?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string
          fn_name?: string | null
          id?: string
          message?: string
          metadata?: Json
          occurred_at?: string
          resolved?: boolean
          route?: string | null
          severity?: string
          source?: string
          stack?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      failover_events: {
        Row: {
          extra_latency_ms: number
          from_model: string
          id: string
          occurred_at: string
          reason: string
          result: string
          to_model: string
        }
        Insert: {
          extra_latency_ms?: number
          from_model: string
          id?: string
          occurred_at?: string
          reason: string
          result?: string
          to_model: string
        }
        Update: {
          extra_latency_ms?: number
          from_model?: string
          id?: string
          occurred_at?: string
          reason?: string
          result?: string
          to_model?: string
        }
        Relationships: []
      }
      fine_tuning_jobs: {
        Row: {
          base_model: string
          completed_at: string | null
          cost_usd: number
          created_at: string
          dataset_name: string
          dataset_rows: number
          id: string
          metrics: Json
          name: string
          progress: number
          result_model_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          base_model: string
          completed_at?: string | null
          cost_usd?: number
          created_at?: string
          dataset_name: string
          dataset_rows?: number
          id?: string
          metrics?: Json
          name: string
          progress?: number
          result_model_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          base_model?: string
          completed_at?: string | null
          cost_usd?: number
          created_at?: string
          dataset_name?: string
          dataset_rows?: number
          id?: string
          metrics?: Json
          name?: string
          progress?: number
          result_model_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          id: string
          impact: string | null
          postmortem_url: string | null
          resolved_at: string | null
          root_cause: string | null
          service_id: string | null
          severity: string
          started_at: string
          status: string
          title: string
        }
        Insert: {
          id?: string
          impact?: string | null
          postmortem_url?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          service_id?: string | null
          severity?: string
          started_at?: string
          status?: string
          title: string
        }
        Update: {
          id?: string
          impact?: string | null
          postmortem_url?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          service_id?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_usd: number
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string
          paid_at: string | null
          period_end: string
          period_start: string
          provider_id: string | null
          status: string
          tax_usd: number
        }
        Insert: {
          amount_usd?: number
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          provider_id?: string | null
          status?: string
          tax_usd?: number
        }
        Update: {
          amount_usd?: number
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          provider_id?: string | null
          status?: string
          tax_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      model_evaluations: {
        Row: {
          baseline: number
          evaluated_at: string
          id: string
          metric: string
          model_id: string | null
          notes: string | null
          score: number
          status: string
          suite: string
        }
        Insert: {
          baseline?: number
          evaluated_at?: string
          id?: string
          metric: string
          model_id?: string | null
          notes?: string | null
          score?: number
          status?: string
          suite: string
        }
        Update: {
          baseline?: number
          evaluated_at?: string
          id?: string
          metric?: string
          model_id?: string | null
          notes?: string | null
          score?: number
          status?: string
          suite?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_evaluations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_versions: {
        Row: {
          deprecate_at: string | null
          id: string
          model_id: string | null
          notes: string | null
          released_at: string | null
          retire_at: string | null
          stage: string
          version: string
        }
        Insert: {
          deprecate_at?: string | null
          id?: string
          model_id?: string | null
          notes?: string | null
          released_at?: string | null
          retire_at?: string | null
          stage?: string
          version: string
        }
        Update: {
          deprecate_at?: string | null
          id?: string
          model_id?: string | null
          notes?: string | null
          released_at?: string | null
          retire_at?: string | null
          stage?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_versions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      on_device_models: {
        Row: {
          accuracy: number
          created_at: string
          downloads: number
          framework: string
          id: string
          name: string
          platforms: string[]
          size_mb: number
          status: string
          version: string
        }
        Insert: {
          accuracy?: number
          created_at?: string
          downloads?: number
          framework?: string
          id?: string
          name: string
          platforms?: string[]
          size_mb?: number
          status?: string
          version?: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          downloads?: number
          framework?: string
          id?: string
          name?: string
          platforms?: string[]
          size_mb?: number
          status?: string
          version?: string
        }
        Relationships: []
      }
      product_apis: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notes: string | null
          plan: string
          product: string
          quota_monthly: number
          service_id: string | null
          used_this_month: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notes?: string | null
          plan?: string
          product: string
          quota_monthly?: number
          service_id?: string | null
          used_this_month?: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notes?: string | null
          plan?: string
          product?: string
          quota_monthly?: number
          service_id?: string | null
          used_this_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_apis_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          notes: string | null
          prompt_id: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          prompt_id?: string | null
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          prompt_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string
          current_version: number
          description: string | null
          id: string
          name: string
          owner: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          current_version?: number
          description?: string | null
          id?: string
          name: string
          owner?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          current_version?: number
          description?: string | null
          id?: string
          name?: string
          owner?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_on_exceed: string
          burst: number
          created_at: string
          current_usage: number
          enabled: boolean
          id: string
          max_requests: number
          scope: string
          service_id: string | null
          window_seconds: number
        }
        Insert: {
          action_on_exceed?: string
          burst?: number
          created_at?: string
          current_usage?: number
          enabled?: boolean
          id?: string
          max_requests?: number
          scope?: string
          service_id?: string | null
          window_seconds?: number
        }
        Update: {
          action_on_exceed?: string
          burst?: number
          created_at?: string
          current_usage?: number
          enabled?: boolean
          id?: string
          max_requests?: number
          scope?: string
          service_id?: string | null
          window_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      role_api_permissions: {
        Row: {
          can_admin: boolean
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          rate_limit_per_min: number
          role_name: string
          service_id: string | null
        }
        Insert: {
          can_admin?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          rate_limit_per_min?: number
          role_name: string
          service_id?: string | null
        }
        Update: {
          can_admin?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          rate_limit_per_min?: number
          role_name?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_api_permissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      router_rules: {
        Row: {
          active: boolean
          created_at: string
          fallback_model: string | null
          id: string
          matches_30d: number
          name: string
          pattern: string
          priority: string
          sort_order: number
          target_model: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fallback_model?: string | null
          id?: string
          matches_30d?: number
          name: string
          pattern: string
          priority?: string
          sort_order?: number
          target_model: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fallback_model?: string | null
          id?: string
          matches_30d?: number
          name?: string
          pattern?: string
          priority?: string
          sort_order?: number
          target_model?: string
        }
        Relationships: []
      }
      safety_policies: {
        Row: {
          action: string
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          severity_threshold: string
          violations_30d: number
        }
        Insert: {
          action?: string
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          severity_threshold?: string
          violations_30d?: number
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          severity_threshold?: string
          violations_30d?: number
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          category: string
          description: string | null
          detected_at: string
          id: string
          resolved_at: string | null
          severity: string
          source: string
          status: string
          title: string
        }
        Insert: {
          category?: string
          description?: string | null
          detected_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          title: string
        }
        Update: {
          category?: string
          description?: string | null
          detected_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
          value: string
          value_type: string
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: string
          value_type?: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      usage_daily: {
        Row: {
          avg_latency_ms: number
          cost_usd: number
          day: string
          errors: number
          id: string
          model_id: string | null
          requests: number
          service_id: string | null
          tokens: number
        }
        Insert: {
          avg_latency_ms?: number
          cost_usd?: number
          day: string
          errors?: number
          id?: string
          model_id?: string | null
          requests?: number
          service_id?: string | null
          tokens?: number
        }
        Update: {
          avg_latency_ms?: number
          cost_usd?: number
          day?: string
          errors?: number
          id?: string
          model_id?: string | null
          requests?: number
          service_id?: string | null
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_daily_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_daily_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          cost_usd: number
          id: string
          latency_ms: number
          model_id: string | null
          occurred_at: string
          product: string
          requests: number
          service_id: string | null
          source: string
          status_code: number
          success: boolean
          tokens_in: number
          tokens_out: number
        }
        Insert: {
          cost_usd?: number
          id?: string
          latency_ms?: number
          model_id?: string | null
          occurred_at?: string
          product?: string
          requests?: number
          service_id?: string | null
          source?: string
          status_code?: number
          success?: boolean
          tokens_in?: number
          tokens_out?: number
        }
        Update: {
          cost_usd?: number
          id?: string
          latency_ms?: number
          model_id?: string | null
          occurred_at?: string
          product?: string
          requests?: number
          service_id?: string | null
          source?: string
          status_code?: number
          success?: boolean
          tokens_in?: number
          tokens_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "api_services"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          type: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          auto_topup: boolean
          auto_topup_amount: number
          balance: number
          created_at: string
          currency: string
          id: string
          low_balance_threshold: number
          name: string
          status: string
        }
        Insert: {
          auto_topup?: boolean
          auto_topup_amount?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          low_balance_threshold?: number
          name: string
          status?: string
        }
        Update: {
          auto_topup?: boolean
          auto_topup_amount?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          low_balance_threshold?: number
          name?: string
          status?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
