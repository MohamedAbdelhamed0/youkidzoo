export type UserRole = "user" | "admin" | "shop_manager";
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  preferredLanguage: "en" | "ar";
  isActive: boolean;
  createdAt: string;
}
export interface AuthRepository {
  currentUser(): Promise<User | null>;
  signIn(identifier: string, password: string): Promise<User>;
  signUp(input: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ confirmationRequired: boolean }>;
  signOut(): Promise<void>;
  updateProfile(input: {
    fullName: string;
    phone: string;
    preferredLanguage: "en" | "ar";
  }): Promise<User>;
  onChange(callback: () => void): () => void;
}
