import type { AuthRepository } from "../domain/auth";
import type { IAuthDataSource } from "./datasources/IAuthDataSource";
import { mapUser } from "./mappers";
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly source: IAuthDataSource) {}
  async currentUser() {
    const dto = await this.source.getProfile();
    if (!dto) return null;
    const user = mapUser(dto);
    if (!user.isActive) {
      await this.source.signOut();
      throw new Error("This account is inactive.");
    }
    return user;
  }
  async signIn(identifier: string, password: string) {
    await this.source.signIn(identifier, password);
    const user = await this.currentUser();
    if (!user) throw new Error("Sign-in could not be completed.");
    return user;
  }
  signUp(input: Parameters<AuthRepository["signUp"]>[0]) {
    return this.source.signUp(input);
  }
  signOut() {
    return this.source.signOut();
  }
  async updateProfile(input: Parameters<AuthRepository["updateProfile"]>[0]) {
    await this.source.updateProfile(input);
    const user = await this.currentUser();
    if (!user) throw new Error("Please sign in again.");
    return user;
  }
  onChange(callback: () => void) {
    return this.source.onChange(callback);
  }
}
