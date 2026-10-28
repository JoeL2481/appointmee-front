import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  UserAdminSummary,
  UserCreate,
  UserFilters,
  UserProfile,
  UserResponse,
  UserUpdate,
} from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  create(user: UserCreate): Observable<string> {
    return this.http.post(`${this.apiUrl}/crear`, user, { responseType: 'text' });
  }

  recoverAccount(email: string, pass: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/recuperar-cuenta`,
      { email, pass },
      { responseType: 'text' },
    );
  }

  update(userId: number, user: UserUpdate): Observable<string> {
    return this.http.patch(`${this.apiUrl}/modificar/${userId}`, user, { responseType: 'text' });
  }

  getById(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }

  list(filters?: UserFilters): Observable<readonly UserAdminSummary[]> {
    const url = filters ? `${this.apiUrl}/listar/filtrar` : `${this.apiUrl}/listar`;
    let params = new HttpParams();

    if (filters?.nombre) params = params.set('nombre', filters.nombre);
    if (filters?.apellido) params = params.set('apellido', filters.apellido);
    if (filters?.activo !== undefined) params = params.set('activo', filters.activo);

    return this.http.get<readonly UserAdminSummary[]>(url, { params });
  }

  findByEmail(email: string): Observable<UserResponse> {
    return this.http.request<UserResponse>('GET', `${this.apiUrl}/email`, { body: { email } });
  }

  delete(userId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/eliminar/${userId}`, { responseType: 'text' });
  }

  deleteOwnAccount(): Observable<string> {
    return this.http.delete(`${this.apiUrl}/borrar-cuenta`, { responseType: 'text' });
  }

  deleteProfilePhoto(): Observable<string> {
    return this.http.delete(`${this.apiUrl}/eliminar/foto-perfil`, { responseType: 'text' });
  }
}
