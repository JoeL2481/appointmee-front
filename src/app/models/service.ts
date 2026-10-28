export interface CatalogServiceCreate {
  readonly nombre: string;
  readonly descripcion: string;
  readonly duracion: number;
  readonly precio: number;
  readonly sucursalId: number;
  readonly fotoUrl: string;
}

export interface CatalogServiceUpdate {
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly duracion?: number;
  readonly precio?: number;
  readonly fotoUrl?: string;
}

export interface CatalogServiceSummary {
  readonly id: number;
  readonly nombre: string;
  readonly duracion: number;
  readonly fotoPerfil: string | null;
  readonly puntuacion: number;
  readonly cantidadPuntuaciones: number;
}

export interface CatalogServiceResponse {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly duracion: number;
  readonly precio: number;
  readonly fotoPerfil: string | null;
  readonly puntuacion: number;
  readonly cantidadPuntuaciones: number;
  readonly nombreSucursal: string;
  readonly direccionSucursal: string;
  readonly categoriaSucursal: string;
}

export interface AppointmentService {
  readonly id: number;
  readonly nombre: string;
  readonly precio: number;
  readonly duracion: number;
}
