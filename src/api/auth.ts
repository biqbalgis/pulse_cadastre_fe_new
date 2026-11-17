import { api, tokenStore } from "./client";
import type { LoginResponse, UserInfo } from "./types";

export async function login(username: string, password: string): Promise<UserInfo> {
  const res = await api.raw<LoginResponse>("POST", "auth/jwt/login/json", {
    body: { username, password },
    auth: false,
  });
  tokenStore.set(res.token.accessToken, res.token.refreshToken);
  return res.userInfo;
}

export async function fetchCurrentUser(): Promise<UserInfo> {
  const res = await api.get<{ user: UserInfo } | UserInfo>("auth/jwt/user_info/");
  return "user" in res ? res.user : res;
}

export function logout() {
  tokenStore.clear();
}
