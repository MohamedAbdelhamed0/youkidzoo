import type { SupabaseClient } from "@supabase/supabase-js";
import type { IAuthDataSource } from "./IAuthDataSource";
import type { ProfileDto } from "../models";
import type { AuthRepository } from "../../domain/auth";
export class SupabaseAuthDataSource implements IAuthDataSource {
  constructor(
    private readonly client: SupabaseClient | null,
    private readonly redirectUrl: string,
  ) {}
  private requireClient() {
    if (!this.client)
      throw new Error(
        "The store is not connected yet. Please connect Supabase.",
      );
    return this.client;
  }
  async getProfile() {
    if (!this.client) return null;
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();
    if (error) throw error;
    if (!session) return null;
    const result = await this.client
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (result.error) throw result.error;
    return result.data as ProfileDto;
  }
  async signIn(identifier: string, password: string) {
    const client = this.requireClient();
    if (identifier.includes("@")) {
      const { error } = await client.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });
      if (error) throw error;
    } else {
      const { data, error } = await client.functions.invoke("username-login", {
        body: { username: identifier.trim().toLowerCase(), password },
      });
      if (error || !data?.access_token || !data?.refresh_token)
        throw new Error("Invalid username or password.");
      const result = await client.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (result.error) throw result.error;
    }
  }
  async signUp(input: Parameters<AuthRepository["signUp"]>[0]) {
    const { data, error } = await this.requireClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username.toLowerCase(),
          full_name: input.fullName,
        },
        emailRedirectTo: this.redirectUrl,
      },
    });
    if (error) throw error;
    return { confirmationRequired: !data.session };
  }
  async signOut() {
    const { error } = await this.requireClient().auth.signOut();
    if (error) throw error;
  }
  async updateProfile(input: Parameters<AuthRepository["updateProfile"]>[0]) {
    const { error } = await this.requireClient().rpc("update_my_profile", {
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_language: input.preferredLanguage,
    });
    if (error) throw error;
  }
  onChange(callback: () => void) {
    const subscription = this.client?.auth.onAuthStateChange(() => {
      setTimeout(callback, 0);
    });
    return () => subscription?.data.subscription.unsubscribe();
  }
}
