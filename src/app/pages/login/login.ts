import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';

/**
 * Login mínimo para poder levantar sesión durante el demo 2 (navbar autenticado).
 * Después se reemplaza por la US del flujo de login.
 */
@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly contrasenia = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected actualizarEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected actualizarContrasenia(event: Event): void {
    this.contrasenia.set((event.target as HTMLInputElement).value);
  }

  protected enviar(event: Event): void {
    event.preventDefault();

    const email = this.email().trim();

    if (!email || !this.contrasenia()) {
      this.error.set('Completá email y contraseña.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    this.auth.iniciarSesion(email, this.contrasenia()).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigate(['/']);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('No pudimos iniciar sesión. Revisá el email y la contraseña.');
      },
    });
  }
}
