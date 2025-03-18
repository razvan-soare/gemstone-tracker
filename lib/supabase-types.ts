import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

// Extend the SupabaseClient with our custom RPC functions
declare module "@supabase/supabase-js" {
  interface SupabaseClient<Database> {
    rpc<ResponseType = any>(
      fn: "complete_onboarding",
      params: {
        user_name: string;
        organization_name: string;
      }
    ): Promise<{ data: ResponseType; error: Error | null }>;
    
    rpc<ResponseType = any>(
      fn: "create_organization_and_add_member",
      params: {
        organization_name: string;
      }
    ): Promise<{ data: ResponseType; error: Error | null }>;
  }
} 