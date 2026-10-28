import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError, ValidationErrors } from '../../models/errors';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-account-recovery',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-recovery.html',
  styleUrl: './account-recovery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRecovery {
  private readonly formBuilder = inject(FormBuilder);
  private readonly users = inject(UserService);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    pass: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly backendErrors = signal<ValidationErrors>({});

  protected submit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.backendErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, pass } = this.form.getRawValue();
    this.submitting.set(true);
    this.users
      .recoverAccount(email, pass)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (message) => {
          this.successMessage.set(message || 'Tu cuenta fue reactivada correctamente.');
          this.form.reset();
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  protected backendError(field: string): string {
    return this.backendErrors()[field] ?? '';
  }

  private handleError(error: unknown): void {
    if (this.isApiError(error)) {
      this.backendErrors.set(error.validationErrors ?? {});
      this.errorMessage.set(
        error.validationErrors ? 'Revisá los datos ingresados.' : error.message,
      );
      return;
    }
    this.errorMessage.set('No pudimos recuperar tu cuenta. Intentá nuevamente.');
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
