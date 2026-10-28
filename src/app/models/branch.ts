import { UserSummary } from './user';

export const BRANCH_CATEGORIES = [
  'PELUQUERIA',
  'SPA',
  'VETERINARIA',
  'ODONTOLOGIA',
  'PODOLOGIA',
  'TATUAJE',
  'MANICURA',
  'BARBERIA',
  'PELUQUERIA_CANINA',
  'FOTOGRAFIA',
  'OCULISTA',
  'MASAJE',
  'DEPILACION',
] as const;
export type BranchCategory = (typeof BRANCH_CATEGORIES)[number];

export interface ImageResponse {
  readonly id: number;
  readonly url: string;
}

export interface BranchCreate {
  readonly nombre: string;
  readonly direccion: string;
  readonly telefono?: string;
  readonly descripcion: string;
  readonly categoriaId: number;
  readonly horaApertura: string;
  readonly horaCierre: string;
  readonly fotoUrl: string;
}

export interface BranchUpdate {
  readonly nombre?: string;
  readonly direccion?: string;
  readonly telefono?: string;
  readonly descripcion?: string;
  readonly categoriaId?: number;
  readonly horaApertura?: string;
  readonly horaCierre?: string;
  readonly fotoUrl?: string;
}

export interface BranchSummary {
  readonly id: number;
  readonly nombre: string;
  readonly categoria: BranchCategory;
  readonly fotoPerfil: string | null;
  readonly puntuacion: number;
  readonly cantidadPuntuaciones: number;
}

export interface BranchResponse {
  readonly id: number;
  readonly nombre: string;
  readonly direccion: string;
  readonly telefono: string | null;
  readonly descripcion: string;
  readonly fechaCreacion: string;
  readonly categoria: BranchCategory;
  readonly horaApertura: string;
  readonly horaCierre: string;
  readonly puntuacion: number;
  readonly cantidadPuntuaciones: number;
  readonly empleador: UserSummary;
  readonly empleados: readonly UserSummary[];
  readonly fotoPerfil: string | null;
  readonly imagenes: readonly ImageResponse[];
}

export interface BranchFilters {
  readonly categoria?: BranchCategory;
  readonly nombre?: string;
}

export interface ImageCreate {
  readonly urls: readonly string[];
}
