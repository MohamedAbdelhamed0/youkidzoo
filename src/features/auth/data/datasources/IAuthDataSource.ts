import type { AuthRepository } from "../../domain/auth";
import type { ProfileDto } from "../models";
export interface IAuthDataSource {
  getProfile(): Promise<ProfileDto | null>;
  signIn(identifier: string, password: string): Promise<void>;
  signUp(
    input: Parameters<AuthRepository["signUp"]>[0],
  ): Promise<{ confirmationRequired: boolean }>;
  signOut(): Promise<void>;
  updateProfile(
    input: Parameters<AuthRepository["updateProfile"]>[0],
  ): Promise<void>;
  onChange(callback: () => void): () => void;
}
