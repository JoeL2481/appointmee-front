import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  APPOINTMENT_STATUSES,
  AppointmentStatus,
  AppointmentSummary,
} from '../../models/appointment';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-appointments',
  imports: [RouterLink],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointments {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);

  protected readonly statuses = APPOINTMENT_STATUSES;
  protected readonly appointments = signal<readonly AppointmentSummary[]>([]);
  protected readonly selectedStatus = signal<AppointmentStatus | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal(this.readNavigationMessage());
  protected readonly filteredAppointments = computed(() => {
    const status = this.selectedStatus();
    return status
      ? this.appointments().filter((appointment) => appointment.estadoTurno === status)
      : this.appointments();
  });

  constructor() {
    this.appointmentService
      .listOwn()
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar tus turnos.');
          return of([]);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      });
  }

  protected statusLabel(status: string): string {
    return status.replaceAll('_', ' ').toLocaleLowerCase('es-AR');
  }

  private readNavigationMessage(): string {
    const value = this.router.currentNavigation()?.extras.state?.['message'];
    return typeof value === 'string' ? value.slice(0, 300) : '';
  }
}
