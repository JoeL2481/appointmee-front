import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';

/**
 * Estado posible de la sesión:
 * - visitante: sin token o token rechazado -> el navbar muestra "Iniciar sesión"/"Crear cuenta".
 * - restaurando: hay token y se está consultando /usuarios/me -> el navbar muestra un placeholder
 *   (criterio 11 de US-HOME-06: nunca un estado incorrecto).
 * - autenticado: el perfil se cargó -> navbar con links y menú de perfil según rol.
 */
export type EstadoSesion = 'visitante' | 'restaurando' | 'autenticado';

export interface UsuarioSesion {
  readonly id: number;
  readonly roles: readonly string[];
  readonly fotoPerfil: string | null;
  /** Email que el propio usuario escribió en el login (el DTO de /me no lo devuelve todavía). */
  readonly email: string | null;
}

/** Contrato real de GET /usuarios/me (UsuarioMeDTO del backend: id, roles, fotoPerfil). */
interface UsuarioMeResponse {
  id: number;
  roles: string[];
  fotoPerfil: string | null;
}

/** Contrato real de POST /usuarios/inicio-sesion (LoginResponseDTO: token). */
interface LoginResponse {
  token: string;
}

export const API_URL = 'http://localhost:8080';

/** Misma clave que ya usaba el navbar viejo. */
const TOKEN_KEY = 'token';
/** Email guardado junto al token para poder mostrar iniciales al restaurar la sesión. */
const EMAIL_KEY = 'email';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly estado = signal<EstadoSesion>('visitante');
  private readonly usuario = signal<UsuarioSesion | null>(null);

  /** Estado listo para el navbar. */
  readonly autenticado = computed(() => this.estado() === 'autenticado');
  readonly visitante = computed(() => this.estado() === 'visitante');
  readonly restaurando = computed(() => this.estado() === 'restaurando');
  readonly perfil = computed(() => this.usuario());

  /**
   * Iniciales para el avatar (criterio 5): foto -> iniciales del email -> fallback genérico.
   * "gino.marin@mail.com" -> "GM", "gino.marx@mail.com" (fallback "AM") -> "GI".
   */
  readonly iniciales = computed(() => {
    const email = this.usuario()?.email;
    if (!email) {
      return 'AM';
    }

    const local = email.split('@')[0] ?? '';
    const partes = local.split(/[._\-+\s]+/).filter(Boolean);

    if (partes.length >= 2) {
      return `${partes[0]?.charAt(0) ?? ''}${partes[1]?.charAt(0) ?? ''}`.toUpperCase();
    }

    const iniciales = local.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();
    return iniciales.length > 0 ? iniciales : 'AM';
  });

  constructor() {
    // Restauración de sesión al arrancar (criterio 11): si hay token, se consulta
    // /usuarios/me y mientras responde el estado es "restaurando" (placeholder).
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      this.leerPerfil(token, localStorage.getItem(EMAIL_KEY));
    }
  }

  /** ¿El usuario autenticado tiene alguno de estos roles? (ERol: ADMINISTRADOR, EMPLEADOR, EMPLEADO, CLIENTE) */
  tieneAlgunRol(...roles: string[]): boolean {
    const usuario = this.usuario();
    return !!usuario && usuario.roles.some((rol) => roles.includes(rol));
  }

  /** POST /usuarios/inicio-sesion y luego cargar el perfil con el token. */
  iniciarSesion(email: string, contrasenia: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${API_URL}/usuarios/inicio-sesion`, { email, pass: contrasenia })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem(TOKEN_KEY, respuesta.token);
          localStorage.setItem(EMAIL_KEY, email);
        }),
        switchMap((respuesta) =>
          this.http
            .get<UsuarioMeResponse>(`${API_URL}/usuarios/me`, {
              headers: { Authorization: `Bearer ${respuesta.token}` },
            })
            .pipe(
              map((perfil) => {
                this.usuario.set({
                  id: perfil.id,
                  roles: perfil.roles,
                  fotoPerfil: perfil.fotoPerfil ?? null,
                  email,
                });
                this.estado.set('autenticado');
              }),
            ),
        ),
      );
  }

  /** Cerrar sesión: limpia token y email, y vuelve al estado visitante. */
  cerrarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this.usuario.set(null);
    this.estado.set('visitante');
  }

  private leerPerfil(token: string, email: string | null): void {
    this.estado.set('restaurando');

    this.http
      .get<UsuarioMeResponse>(`${API_URL}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (perfil) => {
          this.usuario.set({
            id: perfil.id,
            roles: perfil.roles,
            fotoPerfil: perfil.fotoPerfil ?? null,
            email,
          });
          this.estado.set('autenticado');
        },
        // Token expirado/inválido: estado incorrecto no, visitante.
        error: () => this.cerrarSesion(),
      });
  }
}
