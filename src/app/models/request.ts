import { BranchSummary } from './branch';
import { UserResponse } from './user';

export const REQUEST_STATUSES = ['PENDIENTE', 'RECHAZADA', 'APROBADA'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface EmployerRequestCreate {
  readonly motivo: string;
}

export interface EmployerRequestSummary {
  readonly id: number;
  readonly nombreUsuario: string;
  readonly apellidoUsuario: string;
  readonly fechaSolicitud: string;
}

export interface EmployerRequestResponse {
  readonly id: number;
  readonly motivo: string;
  readonly estado: RequestStatus;
  readonly fechaSolicitud: string;
  readonly usuario: UserResponse;
}

export interface EmployeeBranchRequestSummary {
  readonly id: number;
  readonly nombreEmpleado: string;
  readonly apellidoEmpleado: string;
  readonly fechaSolicitud: string;
}

export interface EmployeeOwnRequestSummary {
  readonly id: number;
  readonly nombreSucursal: string;
  readonly fechaSolicitud: string;
}

export interface EmployeeRequestResponse {
  readonly id: number;
  readonly estadoSolicitud: RequestStatus;
  readonly fechaSolicitud: string;
  readonly empleado: UserResponse;
  readonly sucursal: BranchSummary;
}
