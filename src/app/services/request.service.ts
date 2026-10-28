import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EmployeeBranchRequestSummary,
  EmployeeOwnRequestSummary,
  EmployeeRequestResponse,
  EmployerRequestCreate,
  EmployerRequestResponse,
  EmployerRequestSummary,
} from '../models/request';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly employerUrl = `${environment.apiUrl}/solicitudes-empleador`;
  private readonly employeeUrl = `${environment.apiUrl}/solicitudes-empleado`;

  requestEmployer(request: EmployerRequestCreate): Observable<string> {
    return this.http.post(`${this.employerUrl}/solicitar`, request, { responseType: 'text' });
  }

  listEmployerPending(): Observable<readonly EmployerRequestSummary[]> {
    return this.http.get<readonly EmployerRequestSummary[]>(`${this.employerUrl}/listar`);
  }

  listOwnEmployerRequests(): Observable<readonly EmployerRequestSummary[]> {
    return this.http.get<readonly EmployerRequestSummary[]>(`${this.employerUrl}/propias`);
  }

  getEmployerDetails(requestId: number): Observable<EmployerRequestResponse> {
    return this.http.get<EmployerRequestResponse>(`${this.employerUrl}/${requestId}/detalles`);
  }

  resolveEmployer(requestId: number, approve: boolean): Observable<string> {
    const action = approve ? 'aprobar' : 'rechazar';
    return this.http.patch(`${this.employerUrl}/${requestId}/${action}`, null, {
      responseType: 'text',
    });
  }

  listEmployeeSent(branchId: number): Observable<readonly EmployeeBranchRequestSummary[]> {
    return this.http.get<readonly EmployeeBranchRequestSummary[]>(
      `${this.employeeUrl}/enviadas/sucursal/${branchId}`,
    );
  }

  listEmployeeReceived(): Observable<readonly EmployeeOwnRequestSummary[]> {
    return this.http.get<readonly EmployeeOwnRequestSummary[]>(`${this.employeeUrl}/recibidas`);
  }

  getEmployeeDetails(requestId: number): Observable<EmployeeRequestResponse> {
    return this.http.get<EmployeeRequestResponse>(`${this.employeeUrl}/${requestId}/detalles`);
  }

  resolveEmployee(requestId: number, approve: boolean): Observable<string> {
    const action = approve ? 'aprobar' : 'rechazar';
    return this.http.patch(`${this.employeeUrl}/${requestId}/${action}`, null, {
      responseType: 'text',
    });
  }
}
