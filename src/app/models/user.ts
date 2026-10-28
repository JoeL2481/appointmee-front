import { BranchSummary } from './branch';

export const ROLES = ['CLIENTE', 'EMPLEADO', 'EMPLEADOR', 'ADMINISTRADOR'] as const;
export type Role = (typeof ROLES)[number];

export interface UserSession {
  readonly id: number;
  readonly roles: readonly Role[];
  readonly fotoPerfil: string | null;
}

export interface UserCreate {
  readonly nombre: string;
  readonly apellido: string;
  readonly password: string;
  readonly email: string;
  readonly fotoUrl?: string;
}

export interface UserUpdate {
  readonly nombre?: string;
  readonly apellido?: string;
  readonly password?: string;
  readonly email?: string;
  readonly fotoUrl?: string;
}

export interface UserSummary {
  readonly nombre: string;
  readonly apellido: string;
}

export interface UserAdminSummary {
  readonly id: number;
  readonly nombre: string;
  readonly apellido: string;
  readonly estado: boolean;
}

export interface UserResponse {
  readonly id: number;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string;
  readonly urlFotoPerfil: string | null;
}

export interface UserProfile {
  readonly id: number;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string;
  readonly fechaCreacion: string;
  readonly fotoPerfil: string | null;
  readonly roles: readonly Role[];
  readonly sucursalesEmpleado: readonly BranchSummary[];
}

export interface EmployeeResponse {
  readonly id: number;
  readonly nombre: string;
  readonly apellido: string;
  readonly urlFotoPerfil: string | null;
  readonly puntuacion: number;
  readonly cantidadPuntuaciones: number;
}

export interface UserFilters {
  readonly nombre?: string;
  readonly apellido?: string;
  readonly activo?: boolean;
}
