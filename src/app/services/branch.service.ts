import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BranchCategory,
  BranchCreate,
  BranchFilters,
  BranchResponse,
  BranchSummary,
  BranchUpdate,
  ImageCreate,
  ImageResponse,
} from '../models/branch';
import { EmployeeResponse, UserResponse } from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sucursales`;

  list(filters?: BranchFilters): Observable<readonly BranchSummary[]> {
    const url = filters ? `${this.apiUrl}/listar/filtrar` : `${this.apiUrl}/listar`;
    let params = new HttpParams();

    if (filters?.categoria) params = params.set('categoria', filters.categoria);
    if (filters?.nombre) params = params.set('nombre', filters.nombre);

    return this.http.get<readonly BranchSummary[]>(url, { params });
  }

  listOwn(): Observable<readonly BranchSummary[]> {
    return this.http.get<readonly BranchSummary[]>(`${this.apiUrl}/listar/propias`);
  }

  getById(branchId: number): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(`${this.apiUrl}/${branchId}`);
  }

  create(branch: BranchCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/crear`, branch, { responseType: 'text' });
  }

  update(branchId: number, branch: BranchUpdate): Observable<string> {
    return this.http.patch(`${this.apiUrl}/modificar/${branchId}`, branch, {
      responseType: 'text',
    });
  }

  delete(branchId: number, own = false): Observable<string> {
    const path = own ? 'borrar-sucursal-propia' : 'eliminar';
    return this.http.delete(`${this.apiUrl}/${path}/${branchId}`, { responseType: 'text' });
  }

  listEmployees(branchId: number): Observable<readonly UserResponse[]> {
    return this.http.get<readonly UserResponse[]>(`${this.apiUrl}/${branchId}/empleados`);
  }

  listSelectableEmployees(branchId: number): Observable<readonly EmployeeResponse[]> {
    return this.http.get<readonly EmployeeResponse[]>(`${this.apiUrl}/${branchId}/elegir-empleado`);
  }

  inviteEmployee(branchId: number, email: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/${branchId}/empleados/agregar`,
      { email },
      { responseType: 'text' },
    );
  }

  removeEmployee(branchId: number, employeeId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${branchId}/empleados/eliminar/${employeeId}`, {
      responseType: 'text',
    });
  }

  becomeEmployee(branchId: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${branchId}/convertirme-empleado`, null, {
      responseType: 'text',
    });
  }

  getCategories(): Observable<readonly BranchCategory[]> {
    return this.http.get<readonly BranchCategory[]>(`${this.apiUrl}/categorias`);
  }

  getImages(branchId: number): Observable<readonly ImageResponse[]> {
    return this.http.get<readonly ImageResponse[]>(`${this.apiUrl}/${branchId}/imagenes`);
  }

  addImages(branchId: number, images: ImageCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/${branchId}/agregar/imagenes`, images, {
      responseType: 'text',
    });
  }

  deleteImage(branchId: number, imageId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${branchId}/eliminar/imagen/${imageId}`, {
      responseType: 'text',
    });
  }
}
