import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors as FormValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError, ValidationErrors } from '../../models/errors';
import { UserCreate } from '../../models/user';
import { UserService } from '../../services/user.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!_-]).+$/;
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;

const matchingPasswords: ValidatorFn = (control: AbstractControl): FormValidationErrors | null =>
  control.get('password')?.value === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly users = inject(UserService);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60),
          Validators.pattern(NAME_PATTERN),
        ],
      ],
      apellido: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60),
          Validators.pattern(NAME_PATTERN),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(8), Validators.maxLength(150)],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(67),
          Validators.pattern(PASSWORD_PATTERN),
        ],
      ],
      confirmPassword: ['', Validators.required],
      fotoUrl: [''],
    },
    { validators: matchingPasswords },
  );
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly backendErrors = signal<ValidationErrors>({});

  protected submit(): void {
    this.errorMessage.set('');
    this.backendErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _, fotoUrl, ...requiredFields } = this.form.getRawValue();
    const payload: UserCreate = {
      ...requiredFields,
      ...(fotoUrl.trim() ? { fotoUrl: fotoUrl.trim() } : {}),
    };

    this.submitting.set(true);
    this.users
      .create(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (message) =>
          void this.router.navigate(['/login'], {
            state: { successMessage: message || 'Tu cuenta fue creada. Ya podés iniciar sesión.' },
          }),
        error: (error: unknown) => this.handleError(error),
      });
  }

  protected backendError(field: string): string {
    return this.backendErrors()[field] ?? '';
  }

  protected clearBackendError(field: string): void {
    const current = this.backendErrors();
    if (!current[field]) return;
    const { [field]: _, ...remaining } = current;
    this.backendErrors.set(remaining);
  }

  private handleError(error: unknown): void {
    if (this.isApiError(error)) {
      this.backendErrors.set(error.validationErrors ?? {});
      this.errorMessage.set(
        error.validationErrors ? 'Revisá los campos señalados.' : error.message,
      );
      return;
    }
    this.errorMessage.set('No pudimos crear tu cuenta. Intentá nuevamente.');
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
