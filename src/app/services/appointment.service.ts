import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppointmentCreate,
  AppointmentResponse,
  AppointmentStatus,
  AppointmentSummary,
  Availability,
  ClientAppointmentResponse,
  ReviewCreate,
} from '../models/appointment';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/turnos`;

  create(appointment: AppointmentCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/registrar`, appointment, { responseType: 'text' });
  }

  getAvailability(employeeId: number, serviceId: number): Observable<readonly Availability[]> {
    return this.http.get<readonly Availability[]>(
      `${this.apiUrl}/disponibilidad/empleado/${employeeId}/servicio/${serviceId}`,
    );
  }

  listOwn(): Observable<readonly AppointmentSummary[]> {
    return this.http.get<readonly AppointmentSummary[]>(`${this.apiUrl}/propios`);
  }

  getOwnDetails(appointmentId: number): Observable<ClientAppointmentResponse> {
    return this.http.get<ClientAppointmentResponse>(
      `${this.apiUrl}/propios/detalles/${appointmentId}`,
    );
  }

  listByBranch(
    branchId: number,
    status: AppointmentStatus,
  ): Observable<readonly AppointmentSummary[]> {
    const params = new HttpParams().set('estadoTurno', status);
    return this.http.get<readonly AppointmentSummary[]>(`${this.apiUrl}/de-sucursal/${branchId}`, {
      params,
    });
  }

  listEmployeeOwn(
    branchId: number,
    status: AppointmentStatus,
  ): Observable<readonly AppointmentSummary[]> {
    const params = new HttpParams().set('estadoTurno', status);
    return this.http.get<readonly AppointmentSummary[]>(
      `${this.apiUrl}/de-sucursal/${branchId}/propios`,
      { params },
    );
  }

  getBranchDetails(appointmentId: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(
      `${this.apiUrl}/de-sucursal/detalles/${appointmentId}`,
    );
  }

  cancel(appointmentId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/cancelar/${appointmentId}`, { responseType: 'text' });
  }

  complete(appointmentId: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/finalizar/${appointmentId}`, null, {
      responseType: 'text',
    });
  }

  review(appointmentId: number, review: ReviewCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/${appointmentId}/resenia`, review, {
      responseType: 'text',
    });
  }
}
