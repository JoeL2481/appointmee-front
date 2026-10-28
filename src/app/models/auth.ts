import { UserSession } from './user';

export interface LoginRequest {
  readonly email: string;
  readonly pass: string;
}

export interface LoginResponse {
  readonly token: string;
}

export interface AuthState {
  readonly user: UserSession | null;
  readonly loading: boolean;
}
