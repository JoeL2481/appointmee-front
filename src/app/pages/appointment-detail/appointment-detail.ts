import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { ClientAppointmentResponse } from '../../models/appointment';
import { AppointmentService } from '../../services/appointment.service';

const optionalCommentLength = (control: AbstractControl) => {
  const length = String(control.value).trim().length;
  return length === 0 || (length >= 8 && length <= 400) ? null : { commentLength: true };
};

@Component({
  selector: 'app-appointment-detail',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './appointment-detail.html',
  styleUrl: './appointment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentService = inject(AppointmentService);

  protected readonly appointmentId = signal(0);
  protected readonly appointment = signal<ClientAppointmentResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly reviewForm = new FormGroup({
    puntuacion: new FormControl(5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
    comentario: new FormControl('', {
      nonNullable: true,
      validators: [optionalCommentLength],
    }),
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id') ?? params.get('appointmentId'));
          if (!Number.isInteger(id) || id <= 0) {
            this.error.set('El turno solicitado no es válido.');
            return of(null);
          }
          this.appointmentId.set(id);
          return this.appointmentService.getOwnDetails(id).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar el detalle del turno.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((appointment) => {
        this.appointment.set(appointment);
        this.loading.set(false);
      });
  }

  protected submitReview(): void {
    if (this.reviewForm.invalid || this.saving()) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const { puntuacion, comentario } = this.reviewForm.getRawValue();
    this.appointmentService
      .review(this.appointmentId(), {
        puntuacion,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos guardar tu reseña.');
          return of(null);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.saving.set(false);
        if (result !== null) {
          this.success.set('Gracias, tu reseña fue publicada.');
          const current = this.appointment();
          if (current) {
            this.appointment.set({
              ...current,
              resenia: {
                puntuacion,
                comentario: comentario.trim() || null,
                fechaResenia: new Date().toISOString(),
              },
            });
          }
        }
      });
  }
}
