import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../models/errors';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    pass: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal(this.readSuccessMessage());

  protected submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error)),
      });
  }

  private safeReturnUrl(): string {
    const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    return typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/';
  }

  private readSuccessMessage(): string {
    const value = this.router.currentNavigation()?.extras.state?.['successMessage'];
    return typeof value === 'string' ? value.slice(0, 240) : '';
  }

  private getErrorMessage(error: unknown): string {
    if (this.isApiError(error)) {
      return error.validationErrors?.['email'] ?? error.validationErrors?.['pass'] ?? error.message;
    }
    return 'No pudimos iniciar sesión. Intentá nuevamente.';
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    );
  }
}
