import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogServiceCreate,
  CatalogServiceResponse,
  CatalogServiceSummary,
  CatalogServiceUpdate,
} from '../models/service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/servicios`;

  listByBranch(branchId: number): Observable<readonly CatalogServiceSummary[]> {
    return this.http.get<readonly CatalogServiceSummary[]>(
      `${this.apiUrl}/listar/sucursal/${branchId}`,
    );
  }

  getById(serviceId: number): Observable<CatalogServiceResponse> {
    return this.http.get<CatalogServiceResponse>(`${this.apiUrl}/${serviceId}`);
  }

  create(service: CatalogServiceCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/crear`, service, { responseType: 'text' });
  }

  update(serviceId: number, service: CatalogServiceUpdate): Observable<string> {
    return this.http.patch(`${this.apiUrl}/modificar/${serviceId}`, service, {
      responseType: 'text',
    });
  }

  delete(serviceId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/eliminar/${serviceId}`, { responseType: 'text' });
  }
}
