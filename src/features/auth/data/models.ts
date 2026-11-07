import type { User } from "../domain/auth";
export interface ProfileDto {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: User["role"];
  preferred_language: "ar" | "en";
  is_active: boolean;
  created_at: string;
}
