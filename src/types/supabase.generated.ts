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
      alert_fires: {
        Row: {
          dispatched_channels: Json | null
          event_id: string | null
          fired_at: string | null
          id: string
          item_title: string | null
          matched_on: Json | null
          rule_id: string | null
          suppressed_reason: string | null
        }
        Insert: {
          dispatched_channels?: Json | null
          event_id?: string | null
          fired_at?: string | null
          id?: string
          item_title?: string | null
          matched_on?: Json | null
          rule_id?: string | null
          suppressed_reason?: string | null
        }
        Update: {
          dispatched_channels?: Json | null
          event_id?: string | null
          fired_at?: string | null
          id?: string
          item_title?: string | null
          matched_on?: Json | null
          rule_id?: string | null
          suppressed_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_fires_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_fires_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_queue: {
        Row: {
          alert_body: string | null
          alert_level: string
          alert_title: string | null
          created_at: string | null
          cycle_id: string
          defcon_recommendation: number | null
          delivered: boolean | null
          delivered_at: string | null
          expires_at: string | null
          expiry_minutes: number | null
          id: string
          send_push: boolean | null
        }
        Insert: {
          alert_body?: string | null
          alert_level: string
          alert_title?: string | null
          created_at?: string | null
          cycle_id: string
          defcon_recommendation?: number | null
          delivered?: boolean | null
          delivered_at?: string | null
          expires_at?: string | null
          expiry_minutes?: number | null
          id?: string
          send_push?: boolean | null
        }
        Update: {
          alert_body?: string | null
          alert_level?: string
          alert_title?: string | null
          created_at?: string | null
          cycle_id?: string
          defcon_recommendation?: number | null
          delivered?: boolean | null
          delivered_at?: string | null
          expires_at?: string | null
          expiry_minutes?: number | null
          id?: string
          send_push?: boolean | null
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          active: boolean
          categories: string[] | null
          channels: Json | null
          cooldown_minutes: number | null
          countries: string[] | null
          created_at: string | null
          description: string | null
          fire_count: number | null
          id: string
          keywords_encrypted: string | null
          keywords_plain: string[] | null
          last_fired_at: string | null
          min_score: number | null
          name: string
          quiet_hours: Json | null
          severities: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          categories?: string[] | null
          channels?: Json | null
          cooldown_minutes?: number | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          fire_count?: number | null
          id?: string
          keywords_encrypted?: string | null
          keywords_plain?: string[] | null
          last_fired_at?: string | null
          min_score?: number | null
          name: string
          quiet_hours?: Json | null
          severities?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          categories?: string[] | null
          channels?: Json | null
          cooldown_minutes?: number | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          fire_count?: number | null
          id?: string
          keywords_encrypted?: string | null
          keywords_plain?: string[] | null
          last_fired_at?: string | null
          min_score?: number | null
          name?: string
          quiet_hours?: Json | null
          severities?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          approved_at: string | null
          created_at: string
          email: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          purpose: string
          rate_limit: number
          request_count: number
          status: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          email: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name: string
          purpose: string
          rate_limit?: number
          request_count?: number
          status?: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          email?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          purpose?: string
          rate_limit?: number
          request_count?: number
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          lang: string
          og_image: string | null
          published: boolean
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string
          category?: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          lang?: string
          og_image?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          lang?: string
          og_image?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bluesky_posts: {
        Row: {
          author_did: string | null
          author_handle: string | null
          cid: string
          created_at: string
          feed_rkey: string
          indexed_at: string
          langs: string[] | null
          text: string | null
          uri: string
        }
        Insert: {
          author_did?: string | null
          author_handle?: string | null
          cid: string
          created_at: string
          feed_rkey: string
          indexed_at?: string
          langs?: string[] | null
          text?: string | null
          uri: string
        }
        Update: {
          author_did?: string | null
          author_handle?: string | null
          cid?: string
          created_at?: string
          feed_rkey?: string
          indexed_at?: string
          langs?: string[] | null
          text?: string | null
          uri?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          note: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_preferences: {
        Row: {
          country_codes: string[]
          created_at: string
          daily_enabled: boolean
          id: string
          last_daily_sent_at: string | null
          last_weekly_sent_at: string | null
          locale: string
          quiet_end: string
          quiet_hours_enabled: boolean
          quiet_start: string
          timezone: string
          unsubscribe_token: string
          updated_at: string
          user_profile_id: string
          weekly_enabled: boolean
        }
        Insert: {
          country_codes?: string[]
          created_at?: string
          daily_enabled?: boolean
          id?: string
          last_daily_sent_at?: string | null
          last_weekly_sent_at?: string | null
          locale?: string
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          timezone?: string
          unsubscribe_token?: string
          updated_at?: string
          user_profile_id: string
          weekly_enabled?: boolean
        }
        Update: {
          country_codes?: string[]
          created_at?: string
          daily_enabled?: boolean
          id?: string
          last_daily_sent_at?: string | null
          last_weekly_sent_at?: string | null
          locale?: string
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          timezone?: string
          unsubscribe_token?: string
          updated_at?: string
          user_profile_id?: string
          weekly_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "briefing_preferences_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_events: {
        Row: {
          actors: string[] | null
          country_code: string | null
          description: string | null
          event_date: string | null
          event_type: string | null
          fatalities: number | null
          fetched_at: string | null
          hash: string | null
          id: string
          lat: number | null
          lon: number | null
          raw_data: Json | null
          region: string | null
          source: string
          source_url: string | null
          title: string | null
        }
        Insert: {
          actors?: string[] | null
          country_code?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          fatalities?: number | null
          fetched_at?: string | null
          hash?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          raw_data?: Json | null
          region?: string | null
          source: string
          source_url?: string | null
          title?: string | null
        }
        Update: {
          actors?: string[] | null
          country_code?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          fatalities?: number | null
          fetched_at?: string | null
          hash?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          raw_data?: Json | null
          region?: string | null
          source?: string
          source_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      convergence_embeddings: {
        Row: {
          created_at: string
          dimensions: number
          embedding: string
          event_id: string
          provider: string
        }
        Insert: {
          created_at?: string
          dimensions?: number
          embedding: string
          event_id: string
          provider: string
        }
        Update: {
          created_at?: string
          dimensions?: number
          embedding?: string
          event_id?: string
          provider?: string
        }
        Relationships: []
      }
      convergence_history: {
        Row: {
          affected_regions: string[]
          categories: string[]
          category_count: number
          centroid_lat: number
          centroid_lng: number
          confidence: number
          created_at: string
          cycle_timestamp: string
          id: string
          impact_chain: Json
          narrative: string | null
          predictions: Json
          signal_count: number
          signals: Json
          storyline_id: string | null
          timeline_end: string
          timeline_start: string
          type: string
        }
        Insert: {
          affected_regions?: string[]
          categories?: string[]
          category_count?: number
          centroid_lat: number
          centroid_lng: number
          confidence: number
          created_at?: string
          cycle_timestamp?: string
          id: string
          impact_chain?: Json
          narrative?: string | null
          predictions?: Json
          signal_count?: number
          signals?: Json
          storyline_id?: string | null
          timeline_end: string
          timeline_start: string
          type: string
        }
        Update: {
          affected_regions?: string[]
          categories?: string[]
          category_count?: number
          centroid_lat?: number
          centroid_lng?: number
          confidence?: number
          created_at?: string
          cycle_timestamp?: string
          id?: string
          impact_chain?: Json
          narrative?: string | null
          predictions?: Json
          signal_count?: number
          signals?: Json
          storyline_id?: string | null
          timeline_end?: string
          timeline_start?: string
          type?: string
        }
        Relationships: []
      }
      convergence_metrics: {
        Row: {
          clusters_dropped_min_size: number | null
          clusters_dropped_single_category: number | null
          clusters_produced: number
          created_at: string
          cycle_timestamp: string
          debug_hint: string | null
          duration_ms: number
          events_input: number
          events_skipped_no_embedding: number | null
          events_with_embedding: number | null
          failure_reason: string | null
          geo_clusters_found: number | null
          id: number
          temporal_groups_found: number | null
          track: string
        }
        Insert: {
          clusters_dropped_min_size?: number | null
          clusters_dropped_single_category?: number | null
          clusters_produced?: number
          created_at?: string
          cycle_timestamp?: string
          debug_hint?: string | null
          duration_ms?: number
          events_input?: number
          events_skipped_no_embedding?: number | null
          events_with_embedding?: number | null
          failure_reason?: string | null
          geo_clusters_found?: number | null
          id?: number
          temporal_groups_found?: number | null
          track: string
        }
        Update: {
          clusters_dropped_min_size?: number | null
          clusters_dropped_single_category?: number | null
          clusters_produced?: number
          created_at?: string
          cycle_timestamp?: string
          debug_hint?: string | null
          duration_ms?: number
          events_input?: number
          events_skipped_no_embedding?: number | null
          events_with_embedding?: number | null
          failure_reason?: string | null
          geo_clusters_found?: number | null
          id?: number
          temporal_groups_found?: number | null
          track?: string
        }
        Relationships: []
      }
      convergence_storylines: {
        Row: {
          affected_regions: string[]
          archived: boolean
          categories: string[]
          centroid_lat: number
          centroid_lng: number
          created_at: string
          expires_at: string
          headline: string
          id: string
          last_activity_at: string
          peak_confidence: number
          posted_to_telegram_at: string | null
          snapshots: Json
          type: string
        }
        Insert: {
          affected_regions?: string[]
          archived?: boolean
          categories?: string[]
          centroid_lat: number
          centroid_lng: number
          created_at?: string
          expires_at: string
          headline: string
          id: string
          last_activity_at?: string
          peak_confidence: number
          posted_to_telegram_at?: string | null
          snapshots?: Json
          type: string
        }
        Update: {
          affected_regions?: string[]
          archived?: boolean
          categories?: string[]
          centroid_lat?: number
          centroid_lng?: number
          created_at?: string
          expires_at?: string
          headline?: string
          id?: string
          last_activity_at?: string
          peak_confidence?: number
          posted_to_telegram_at?: string | null
          snapshots?: Json
          type?: string
        }
        Relationships: []
      }
      convergence_telemetry: {
        Row: {
          category_count: number
          confidence: number
          convergence_id: string
          created_at: string
          event: string
          has_narrative: boolean
          id: number
          predictions_validated: number
          signal_count: number
          surface: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          category_count?: number
          confidence: number
          convergence_id: string
          created_at?: string
          event: string
          has_narrative?: boolean
          id?: number
          predictions_validated?: number
          signal_count?: number
          surface?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          category_count?: number
          confidence?: number
          convergence_id?: string
          created_at?: string
          event?: string
          has_narrative?: boolean
          id?: number
          predictions_validated?: number
          signal_count?: number
          surface?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      corrections: {
        Row: {
          correction: string
          created_at: string
          date: string
          headline: string
          id: string
          original_claim: string
          url: string
        }
        Insert: {
          correction: string
          created_at?: string
          date: string
          headline: string
          id?: string
          original_claim: string
          url: string
        }
        Update: {
          correction?: string
          created_at?: string
          date?: string
          headline?: string
          id?: string
          original_claim?: string
          url?: string
        }
        Relationships: []
      }
      country_briefings: {
        Row: {
          content: string
          country_code: string
          date: string
          event_count: number
          generated_at: string
          generation_ms: number | null
          id: string
          locale: string
          top_severity: string | null
        }
        Insert: {
          content: string
          country_code: string
          date: string
          event_count?: number
          generated_at?: string
          generation_ms?: number | null
          id?: string
          locale?: string
          top_severity?: string | null
        }
        Update: {
          content?: string
          country_code?: string
          date?: string
          event_count?: number
          generated_at?: string
          generation_ms?: number | null
          id?: string
          locale?: string
          top_severity?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          aliases: string[]
          created_at: string
          first_seen: string
          id: number
          last_seen: string
          mention_count: number
          metadata: Json
          name: string
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          first_seen?: string
          id?: number
          last_seen?: string
          mention_count?: number
          metadata?: Json
          name: string
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          first_seen?: string
          id?: number
          last_seen?: string
          mention_count?: number
          metadata?: Json
          name?: string
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          country_code: string | null
          expires_at: string | null
          fetched_at: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          published_at: string
          severity: string
          source: string
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          category: string
          country_code?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          published_at: string
          severity?: string
          source: string
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          category?: string
          country_code?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          published_at?: string
          severity?: string
          source?: string
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      feeds: {
        Row: {
          category: string
          created_at: string | null
          default_severity: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          language: string | null
          last_fetched_at: string | null
          name: string
          region: string | null
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          default_severity?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name: string
          region?: string | null
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          default_severity?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name?: string
          region?: string | null
          url?: string
        }
        Relationships: []
      }
      intel_summaries: {
        Row: {
          created_at: string | null
          cycle_id: string
          headline: string | null
          id: string
          key_actors: string[] | null
          languages_detected: string[] | null
          locations: Json | null
          region: string | null
          source_confidence: number | null
          source_count: number | null
          summary: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_id: string
          headline?: string | null
          id?: string
          key_actors?: string[] | null
          languages_detected?: string[] | null
          locations?: Json | null
          region?: string | null
          source_confidence?: number | null
          source_count?: number | null
          summary?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_id?: string
          headline?: string | null
          id?: string
          key_actors?: string[] | null
          languages_detected?: string[] | null
          locations?: Json | null
          region?: string | null
          source_confidence?: number | null
          source_count?: number | null
          summary?: string | null
        }
        Relationships: []
      }
      lemon_webhook_events: {
        Row: {
          error: string | null
          event_id: string
          event_name: string
          id: string
          payload: Json
          processed_at: string | null
          received_at: string | null
          webhook_id: string | null
        }
        Insert: {
          error?: string | null
          event_id: string
          event_name: string
          id?: string
          payload: Json
          processed_at?: string | null
          received_at?: string | null
          webhook_id?: string | null
        }
        Update: {
          error?: string | null
          event_id?: string
          event_name?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      market_snapshots: {
        Row: {
          change_pct: number | null
          id: string
          name: string
          price: number
          recorded_at: string | null
          symbol: string
          volume: number | null
        }
        Insert: {
          change_pct?: number | null
          id?: string
          name: string
          price: number
          recorded_at?: string | null
          symbol: string
          volume?: number | null
        }
        Update: {
          change_pct?: number | null
          id?: string
          name?: string
          price?: number
          recorded_at?: string | null
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      newsletter_referrals: {
        Row: {
          created_at: string
          id: number
          referee_email: string
          referrer_email: string
        }
        Insert: {
          created_at?: string
          id?: number
          referee_email: string
          referrer_email: string
        }
        Update: {
          created_at?: string
          id?: number
          referee_email?: string
          referrer_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_referrals_referee_email_fkey"
            columns: ["referee_email"]
            isOneToOne: false
            referencedRelation: "newsletter_referral_leaderboard"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "newsletter_referrals_referee_email_fkey"
            columns: ["referee_email"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "newsletter_referrals_referrer_email_fkey"
            columns: ["referrer_email"]
            isOneToOne: false
            referencedRelation: "newsletter_referral_leaderboard"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "newsletter_referrals_referrer_email_fkey"
            columns: ["referrer_email"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["email"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: number
          is_active: boolean
          preferences: Json | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          source: string | null
          subscribed_at: string
          tier: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          frequency?: string
          id?: never
          is_active?: boolean
          preferences?: Json | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          source?: string | null
          subscribed_at?: string
          tier?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: never
          is_active?: boolean
          preferences?: Json | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          source?: string | null
          subscribed_at?: string
          tier?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          date: string
          event_count: number | null
          generated_at: string | null
          id: string
          lang: string | null
          og_summary: string | null
          region: string | null
          summary: string | null
          title: string | null
          type: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          date: string
          event_count?: number | null
          generated_at?: string | null
          id?: string
          lang?: string | null
          og_summary?: string | null
          region?: string | null
          summary?: string | null
          title?: string | null
          type: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          date?: string
          event_count?: number | null
          generated_at?: string | null
          id?: string
          lang?: string | null
          og_summary?: string | null
          region?: string | null
          summary?: string | null
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          affected_countries: string[] | null
          alert_level: string | null
          anomaly_detected: boolean | null
          anomaly_type: string | null
          civilian_impact: number | null
          confidence_level: string | null
          created_at: string | null
          cycle_id: string
          defcon_recommendation: number | null
          delta_score: number | null
          diplomatic_breakdown: number | null
          displacement_risk: string | null
          economic_disruption: number | null
          escalation_horizon: string | null
          escalation_probability: number | null
          event_count: number | null
          gdelt_goldstein_avg: number | null
          id: string
          military_intensity: number | null
          overall_risk_score: number | null
          predict_label: string | null
          primary_drivers: string[] | null
          region: string | null
          regional_spillover: number | null
          risk_label: string | null
          send_push: boolean | null
        }
        Insert: {
          affected_countries?: string[] | null
          alert_level?: string | null
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          civilian_impact?: number | null
          confidence_level?: string | null
          created_at?: string | null
          cycle_id: string
          defcon_recommendation?: number | null
          delta_score?: number | null
          diplomatic_breakdown?: number | null
          displacement_risk?: string | null
          economic_disruption?: number | null
          escalation_horizon?: string | null
          escalation_probability?: number | null
          event_count?: number | null
          gdelt_goldstein_avg?: number | null
          id?: string
          military_intensity?: number | null
          overall_risk_score?: number | null
          predict_label?: string | null
          primary_drivers?: string[] | null
          region?: string | null
          regional_spillover?: number | null
          risk_label?: string | null
          send_push?: boolean | null
        }
        Update: {
          affected_countries?: string[] | null
          alert_level?: string | null
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          civilian_impact?: number | null
          confidence_level?: string | null
          created_at?: string | null
          cycle_id?: string
          defcon_recommendation?: number | null
          delta_score?: number | null
          diplomatic_breakdown?: number | null
          displacement_risk?: string | null
          economic_disruption?: number | null
          escalation_horizon?: string | null
          escalation_probability?: number | null
          event_count?: number | null
          gdelt_goldstein_avg?: number | null
          id?: string
          military_intensity?: number | null
          overall_risk_score?: number | null
          predict_label?: string | null
          primary_drivers?: string[] | null
          region?: string | null
          regional_spillover?: number | null
          risk_label?: string | null
          send_push?: boolean | null
        }
        Relationships: []
      }
      story_entities: {
        Row: {
          confidence: number
          created_at: string
          entity_id: number
          event_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          entity_id: number
          event_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          entity_id?: number
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          lemon_subscription_id: string | null
          metadata: Json | null
          new_status: string | null
          previous_status: string | null
          subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          lemon_subscription_id?: string | null
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          lemon_subscription_id?: string | null
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          email: string | null
          ends_at: string | null
          id: string
          lemon_customer_id: string | null
          lemon_order_id: string | null
          lemon_product_id: string | null
          lemon_subscription_id: string | null
          lemon_variant_id: string | null
          plan: string | null
          price_cents: number | null
          renews_at: string | null
          status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          ends_at?: string | null
          id?: string
          lemon_customer_id?: string | null
          lemon_order_id?: string | null
          lemon_product_id?: string | null
          lemon_subscription_id?: string | null
          lemon_variant_id?: string | null
          plan?: string | null
          price_cents?: number | null
          renews_at?: string | null
          status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          ends_at?: string | null
          id?: string
          lemon_customer_id?: string | null
          lemon_order_id?: string | null
          lemon_product_id?: string | null
          lemon_subscription_id?: string | null
          lemon_variant_id?: string | null
          plan?: string | null
          price_cents?: number | null
          renews_at?: string | null
          status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_subscribers: {
        Row: {
          categories: string[] | null
          chat_id: string
          id: string
          is_active: boolean
          last_alert_at: string | null
          min_severity: string
          subscribed_at: string | null
        }
        Insert: {
          categories?: string[] | null
          chat_id: string
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          min_severity?: string
          subscribed_at?: string | null
        }
        Update: {
          categories?: string[] | null
          chat_id?: string
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          min_severity?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_id: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          locale: string | null
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          locale?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          locale?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          categories: string[] | null
          countries: string[] | null
          created_at: string | null
          id: string
          keywords: string[] | null
          name: string
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          countries?: string[] | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          countries?: string[] | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          categories: string[]
          created_at: string
          error_count: number
          id: string
          is_active: boolean
          last_error: string | null
          last_triggered_at: string | null
          min_severity: string
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_triggered_at?: string | null
          min_severity?: string
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_triggered_at?: string | null
          min_severity?: string
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      convergence_ctr_buckets: {
        Row: {
          bucket: string | null
          clicked: number | null
          ctr: number | null
          dismissed: number | null
          shown: number | null
        }
        Relationships: []
      }
      convergence_daily_stats: {
        Row: {
          avg_categories: number | null
          avg_signals: number | null
          bucket: string | null
          count: number | null
          day: string | null
        }
        Relationships: []
      }
      convergence_track_health: {
        Row: {
          avg_clusters_per_cycle: number | null
          avg_duration_ms: number | null
          cycles: number | null
          empty_cycles: number | null
          failure_cycles: number | null
          top_failure_reason: string | null
          total_clusters: number | null
          total_events_seen: number | null
          track: string | null
        }
        Relationships: []
      }
      entity_cooccurrence: {
        Row: {
          entity_a: number | null
          entity_b: number | null
          last_co_occurred: string | null
          shared_events: number | null
        }
        Relationships: []
      }
      event_convergence_scores: {
        Row: {
          affected_regions: string[] | null
          categories: string[] | null
          event_id: string | null
          last_activity_at: string | null
          peak_confidence: number | null
          storyline_headline: string | null
          storyline_id: string | null
        }
        Relationships: []
      }
      newsletter_referral_leaderboard: {
        Row: {
          email: string | null
          referral_code: string | null
          referral_count: number | null
          subscribed_at: string | null
          tier: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_expired_storylines: { Args: never; Returns: number }
      cleanup_expired_events: { Args: never; Returns: undefined }
      increment_api_key_usage: { Args: { key_id: string }; Returns: undefined }
      prune_bluesky_posts: { Args: never; Returns: number }
      purge_old_convergence_history: { Args: never; Returns: number }
      purge_old_convergence_metrics: { Args: never; Returns: number }
      purge_old_embeddings: { Args: never; Returns: number }
      purge_orphaned_embeddings: { Args: never; Returns: number }
      search_events_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          event_id: string
          similarity: number
        }[]
      }
      upsert_entity: {
        Args: { p_name: string; p_slug: string; p_type: string }
        Returns: {
          aliases: string[]
          created_at: string
          first_seen: string
          id: number
          last_seen: string
          mention_count: number
          metadata: Json
          name: string
          slug: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "entities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
