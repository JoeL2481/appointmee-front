import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../auth/auth';
import { SucursalMiniDTO } from '../models/sucursal.model';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private readonly http = inject(HttpClient);

  private headers(): Record<string, string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  listar(): Observable<SucursalMiniDTO[]> {
    return this.http.get<SucursalMiniDTO[]>(`${API_URL}/sucursales/listar`, {
      headers: this.headers(),
    });
  }

  filtrar(categoria?: string | null, nombre?: string | null): Observable<SucursalMiniDTO[]> {
    let params = new HttpParams();
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    const termino = nombre?.trim();
    if (termino) {
      params = params.set('nombre', termino);
    }
    return this.http.get<SucursalMiniDTO[]>(`${API_URL}/sucursales/listar/filtrar`, {
      headers: this.headers(),
      params,
    });
  }

  categorias(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/sucursales/categorias`, {
      headers: this.headers(),
    });
  }
}
