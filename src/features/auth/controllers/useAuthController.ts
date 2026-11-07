import { create } from "zustand";
import type { User, AuthRepository } from "../domain/auth";
import { container } from "../../../app/di/container";
import { errorMessage } from "../../../core/errors/AppError";
export const authRepository = container.authRepository;
let request = 0;
export const useAuthController = create<{
  user: User | null;
  loading: boolean;
  error: string;
  refresh(): Promise<void>;
  login(identifier: string, password: string): Promise<User>;
  registerAccount(
    input: Parameters<AuthRepository["signUp"]>[0],
  ): ReturnType<AuthRepository["signUp"]>;
  saveProfile(
    input: Parameters<AuthRepository["updateProfile"]>[0],
  ): Promise<User>;
  logout(): Promise<void>;
}>((set) => ({
  user: null,
  loading: true,
  error: "",
  async login(identifier, password) {
    const user = await authRepository.signIn(identifier, password);
    request++;
    set({ user, error: "", loading: false });
    return user;
  },
  registerAccount(input) {
    return authRepository.signUp(input);
  },
  async saveProfile(input) {
    const user = await authRepository.updateProfile(input);
    request++;
    set({ user, error: "", loading: false });
    return user;
  },
  async logout() {
    await authRepository.signOut();
    request++;
    set({ user: null, error: "", loading: false });
  },
  async refresh() {
    const current = ++request;
    try {
      const user = await authRepository.currentUser();
      if (current === request) set({ user, loading: false, error: "" });
    } catch (error) {
      if (current === request)
        set({
          user: null,
          loading: false,
          error: errorMessage(error, "Unable to load account."),
        });
    }
  },
}));
