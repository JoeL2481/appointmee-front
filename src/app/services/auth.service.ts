import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth';
import { Role, UserSession } from '../models/user';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly userState = signal<UserSession | null>(null);
  private readonly loadingState = signal(true);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly authenticated = computed(() => this.userState() !== null);

  constructor() {
    this.restoreSession().subscribe();
  }

  login(credentials: LoginRequest): Observable<UserSession> {
    this.loadingState.set(true);

    return this.http.post<LoginResponse>(`${this.apiUrl}/inicio-sesion`, credentials).pipe(
      tap(({ token }) => this.storage.setToken(token)),
      switchMap(() => this.loadCurrentUser()),
      catchError((error: unknown) => {
        this.clearSession();
        throw error;
      }),
      finalize(() => this.loadingState.set(false)),
    );
  }

  logout(): void {
    this.clearSession();
  }

  restoreSession(): Observable<UserSession | null> {
    const token = this.storage.getToken();

    if (!token) {
      this.clearSession();
      this.loadingState.set(false);
      return of(null);
    }

    this.loadingState.set(true);
    return this.loadCurrentUser().pipe(
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      finalize(() => this.loadingState.set(false)),
    );
  }

  refreshSession(): Observable<UserSession> {
    return this.loadCurrentUser();
  }

  hasRole(...roles: readonly Role[]): boolean {
    return roles.some((role) => this.userState()?.roles.includes(role));
  }

  private loadCurrentUser(): Observable<UserSession> {
    return this.http
      .get<UserSession>(`${this.apiUrl}/me`)
      .pipe(tap((user) => this.userState.set(user)));
  }

  private clearSession(): void {
    this.storage.removeToken();
    this.userState.set(null);
  }
}
