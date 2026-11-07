import type { User } from "../domain/auth";
import type { ProfileDto } from "./models";
export const mapUser = (p: ProfileDto): User => ({
  id: p.id,
  username: p.username,
  email: p.email,
  fullName: p.full_name,
  phone: p.phone,
  avatarUrl: p.avatar_url,
  role: p.role,
  preferredLanguage: p.preferred_language,
  isActive: p.is_active,
  createdAt: p.created_at,
});
