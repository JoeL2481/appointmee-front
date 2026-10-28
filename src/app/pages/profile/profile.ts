import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../models/errors';
import { UserProfile, UserUpdate } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!_-]).+$/;

function optionalUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value).trim();
  if (!value) return null;
  try {
    new URL(value);
    return null;
  } catch {
    return { url: true };
  }
}

@Component({
  selector: 'app-profile',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  protected readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private loadedUserId: number | null = null;

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deletingPhoto = signal(false);
  protected readonly confirmingDelete = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly initials = computed(() => {
    const user = this.profile();
    return user ? `${user.nombre[0] ?? ''}${user.apellido[0] ?? ''}`.toUpperCase() : 'AM';
  });
  protected readonly canRequestEmployer = computed(
    () => !this.auth.hasRole('EMPLEADOR', 'ADMINISTRADOR'),
  );
  protected readonly canManageBranches = computed(() => this.auth.hasRole('EMPLEADO', 'EMPLEADOR'));

  protected readonly form = this.formBuilder.nonNullable.group({
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
    fotoUrl: ['', optionalUrl],
    password: [
      '',
      [Validators.minLength(8), Validators.maxLength(67), Validators.pattern(PASSWORD_PATTERN)],
    ],
  });

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (userId && userId !== this.loadedUserId) {
        this.loadedUserId = userId;
        this.loadProfile(userId);
      } else if (!this.auth.loading() && !userId) {
        this.loading.set(false);
      }
    });
  }

  protected save(): void {
    if (this.form.invalid || !this.profile()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.changedValues();
    if (!Object.keys(payload).length) {
      this.success.set('No hay cambios para guardar.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const emailChanged = payload.email !== undefined && payload.email !== this.profile()!.email;
    this.users
      .update(this.profile()!.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          if (emailChanged) {
            this.auth.logout();
            void this.router.navigate(['/login'], {
              state: {
                successMessage: 'Tu correo fue actualizado. Iniciá sesión nuevamente.',
              },
            });
            return;
          }
          this.success.set('Tus datos se actualizaron correctamente.');
          if (payload.fotoUrl) {
            this.auth.refreshSession().subscribe({ error: () => undefined });
          }
          this.loadProfile(this.profile()!.id, false);
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo actualizar el perfil.'),
      });
  }

  protected deleteAccount(): void {
    this.deleting.set(true);
    this.error.set('');
    this.users
      .deleteOwnAccount()
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.auth.logout();
          void this.router.navigate(['/']);
        },
        error: (error: ApiError) => {
          this.error.set(error.message || 'No se pudo eliminar la cuenta.');
          this.confirmingDelete.set(false);
        },
      });
  }

  protected deletePhoto(): void {
    const profile = this.profile();
    if (!profile?.fotoPerfil || this.deletingPhoto()) return;
    this.deletingPhoto.set(true);
    this.error.set('');
    this.success.set('');
    this.users
      .deleteProfilePhoto()
      .pipe(finalize(() => this.deletingPhoto.set(false)))
      .subscribe({
        next: () => {
          this.auth.refreshSession().subscribe({
            next: () => {
              this.success.set('La foto de perfil fue eliminada.');
              this.loadProfile(profile.id, false);
            },
            error: (error: ApiError) =>
              this.error.set(error.message || 'La foto se eliminó, pero no pudimos recargarla.'),
          });
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo eliminar la foto de perfil.'),
      });
  }

  protected fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'Ingresá un correo válido.';
    if (control.hasError('url')) return 'Ingresá una URL válida.';
    if (control.hasError('pattern')) {
      return field === 'password'
        ? 'Usá mayúscula, minúscula, número y un carácter especial.'
        : 'Usá únicamente letras españolas y espacios.';
    }
    if (control.hasError('minlength')) {
      return field === 'nombre' || field === 'apellido'
        ? 'Usá al menos 3 caracteres.'
        : 'Usá al menos 8 caracteres.';
    }
    return 'El valor ingresado es demasiado largo.';
  }

  protected formatRole(role: string): string {
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  private loadProfile(userId: number, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.error.set('');
    this.users
      .getById(userId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.form.reset({
            nombre: profile.nombre,
            apellido: profile.apellido,
            email: profile.email,
            fotoUrl: profile.fotoPerfil ?? '',
            password: '',
          });
        },
        error: (error: ApiError) => this.error.set(error.message || 'No se pudo cargar el perfil.'),
      });
  }

  private changedValues(): UserUpdate {
    const values = this.form.getRawValue();
    const controls = this.form.controls;
    return {
      ...(controls.nombre.dirty ? { nombre: values.nombre.trim() } : {}),
      ...(controls.apellido.dirty ? { apellido: values.apellido.trim() } : {}),
      ...(controls.email.dirty ? { email: values.email.trim() } : {}),
      ...(controls.fotoUrl.dirty && values.fotoUrl.trim()
        ? { fotoUrl: values.fotoUrl.trim() }
        : {}),
      ...(controls.password.dirty && values.password ? { password: values.password } : {}),
    };
  }
}
