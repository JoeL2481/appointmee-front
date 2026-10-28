import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AppointmentSummary, Availability } from '../../models/appointment';
import { CatalogServiceSummary } from '../../models/service';
import { EmployeeResponse } from '../../models/user';
import { AppointmentService } from '../../services/appointment.service';
import { BranchService } from '../../services/branch.service';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-booking',
  imports: [RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Booking {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly branchService = inject(BranchService);
  private readonly catalogService = inject(CatalogService);
  private readonly appointmentService = inject(AppointmentService);

  protected readonly branchId = signal(0);
  protected readonly employees = signal<readonly EmployeeResponse[]>([]);
  protected readonly services = signal<readonly CatalogServiceSummary[]>([]);
  protected readonly availability = signal<readonly Availability[]>([]);
  protected readonly selectedEmployeeId = signal<number | null>(null);
  protected readonly selectedServiceId = signal<number | null>(null);
  protected readonly selectedDate = signal('');
  protected readonly selectedTime = signal('');
  protected readonly loading = signal(true);
  protected readonly availabilityLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly step = computed(() => {
    if (!this.selectedEmployeeId()) return 1;
    if (!this.selectedServiceId()) return 2;
    return 3;
  });
  protected readonly selectedService = computed(() =>
    this.services().find((service) => service.id === this.selectedServiceId()),
  );
  protected readonly selectedDay = computed(() =>
    this.availability().find((day) => day.fecha === this.selectedDate()),
  );
  protected readonly canSubmit = computed(
    () =>
      !!this.selectedEmployeeId() &&
      !!this.selectedServiceId() &&
      !!this.selectedDate() &&
      !!this.selectedTime(),
  );

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id') ?? params.get('branchId'));
          if (!Number.isInteger(id) || id <= 0) {
            this.error.set('La sucursal solicitada no es válida.');
            return of(null);
          }
          this.branchId.set(id);
          return forkJoin({
            employees: this.branchService.listSelectableEmployees(id),
            services: this.catalogService.listByBranch(id),
          }).pipe(
            catchError(() => {
              this.error.set('No pudimos preparar la reserva. Intentá nuevamente.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result) {
          this.employees.set(result.employees);
          this.services.set(result.services);
        }
        this.loading.set(false);
      });
  }

  protected chooseEmployee(id: number): void {
    this.selectedEmployeeId.set(id);
    this.selectedServiceId.set(null);
    this.resetSlot();
  }

  protected chooseService(id: number): void {
    this.selectedServiceId.set(id);
    this.resetSlot();
    this.loadAvailability();
  }

  protected chooseDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedTime.set('');
  }

  protected back(): void {
    if (this.selectedServiceId()) {
      this.selectedServiceId.set(null);
      this.resetSlot();
    } else {
      this.selectedEmployeeId.set(null);
    }
  }

  protected submit(): void {
    const employeeId = this.selectedEmployeeId();
    const serviceId = this.selectedServiceId();
    if (!employeeId || !serviceId || !this.canSubmit() || this.submitting()) return;

    const dateTime = `${this.selectedDate()}T${this.selectedTime()}`;
    this.submitting.set(true);
    this.error.set('');
    this.appointmentService
      .create({ fechaHora: dateTime, empleadoId: employeeId, servicioId: serviceId })
      .pipe(
        switchMap((response) => {
          const responseId = this.extractId(response);
          return responseId
            ? of({ id: responseId, unresolved: false })
            : this.resolveCreatedId(dateTime).pipe(
                map((id) => ({ id, unresolved: !id })),
                catchError(() => of({ id: null, unresolved: true })),
              );
        }),
        catchError(() => {
          this.error.set('No pudimos crear el turno. Revisá el horario e intentá nuevamente.');
          return of({ id: null, unresolved: false });
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ id, unresolved }) => {
        this.submitting.set(false);
        if (id) {
          void this.router.navigate(['/pago', id]);
        } else if (unresolved) {
          void this.router.navigate(['/mis-turnos'], {
            state: {
              message:
                'El turno fue creado, pero no pudimos abrir el pago. Revisalo en tu lista antes de volver a reservar.',
            },
          });
        }
      });
  }

  private loadAvailability(): void {
    const employeeId = this.selectedEmployeeId();
    const serviceId = this.selectedServiceId();
    if (!employeeId || !serviceId) return;
    this.availabilityLoading.set(true);
    this.appointmentService
      .getAvailability(employeeId, serviceId)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos consultar la disponibilidad.');
          return of([]);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((availability) => {
        this.availability.set(availability);
        this.availabilityLoading.set(false);
      });
  }

  private resolveCreatedId(dateTime: string) {
    const expected = new Date(dateTime).getTime();
    return this.appointmentService.listOwn().pipe(
      switchMap((appointments) => {
        const candidates = appointments.filter(
          (appointment) =>
            appointment.nombreServicio === this.selectedService()?.nombre &&
            new Date(appointment.fechaTurno).getTime() === expected &&
            appointment.estadoTurno === 'PENDIENTE',
        );
        const match = this.highestId(candidates);
        return match ? of(match.id) : of(null);
      }),
    );
  }

  private highestId(appointments: readonly AppointmentSummary[]): AppointmentSummary | undefined {
    return appointments.reduce<AppointmentSummary | undefined>(
      (latest, current) => (!latest || current.id > latest.id ? current : latest),
      undefined,
    );
  }

  private extractId(response: string): number | null {
    const exact = response.trim().match(/^\d+$/)?.[0];
    const labelled = response.match(/(?:id|turno)\D+(\d+)/i)?.[1];
    const value = Number(exact ?? labelled);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  private resetSlot(): void {
    this.availability.set([]);
    this.selectedDate.set('');
    this.selectedTime.set('');
  }
}
