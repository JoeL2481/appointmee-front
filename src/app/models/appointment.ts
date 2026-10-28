import { AppointmentService } from './service';
import { UserResponse, UserSummary } from './user';

export const APPOINTMENT_STATUSES = [
  'PENDIENTE',
  'REALIZADO',
  'CANCELADO',
  'PAGO_RECHAZADO',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface AppointmentCreate {
  readonly fechaHora: string;
  readonly empleadoId: number;
  readonly servicioId: number;
}

export interface AppointmentSummary {
  readonly id: number;
  readonly nombreServicio: string;
  readonly fechaTurno: string;
  readonly estadoTurno: AppointmentStatus;
  readonly puntuacion: number | null;
}

export interface ReviewCreate {
  readonly puntuacion: number;
  readonly comentario?: string;
}

export interface ReviewResponse {
  readonly puntuacion: number;
  readonly comentario: string | null;
  readonly fechaResenia: string;
}

export interface AppointmentResponse {
  readonly id: number;
  readonly fechaReserva: string;
  readonly fechaTurno: string;
  readonly estadoTurno: AppointmentStatus;
  readonly cliente: UserSummary;
  readonly empleado: UserResponse;
  readonly servicio: AppointmentService;
  readonly resenia: ReviewResponse | null;
}

export interface ClientAppointmentResponse {
  readonly fechaReserva: string;
  readonly fechaHora: string;
  readonly estadoTurno: AppointmentStatus;
  readonly empleado: UserSummary;
  readonly servicio: AppointmentService;
  readonly cliente: UserSummary;
  readonly resenia: ReviewResponse | null;
}

export interface Availability {
  readonly fecha: string;
  readonly horarios: readonly string[];
}
