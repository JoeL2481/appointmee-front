import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AppointmentResponse, AppointmentSummary } from '../../models/appointment';
import { BranchSummary } from '../../models/branch';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.html',
  styleUrl: './employee.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Employee {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly appointmentService = inject(AppointmentService);
  private loadedUserId: number | null = null;

  protected readonly branches = signal<readonly BranchSummary[]>([]);
  protected readonly appointments = signal<readonly AppointmentSummary[]>([]);
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly appointmentDetails = signal<AppointmentResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly agendaLoading = signal(false);
  protected readonly busyId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly selectedBranch = computed(() =>
    this.branches().find((branch) => branch.id === this.selectedBranchId()),
  );

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user && user.id !== this.loadedUserId) {
        this.loadedUserId = user.id;
        this.loadProfile(user.id);
      } else if (!this.authService.loading() && !user) {
        this.loading.set(false);
        this.error.set('No se encontró una sesión activa.');
      }
    });
  }

  protected branchChanged(event: Event): void {
    this.selectBranch(Number((event.target as HTMLSelectElement).value));
  }

  protected selectBranch(branchId: number): void {
    if (!branchId) return;
    this.selectedBranchId.set(branchId);
    this.appointmentDetails.set(null);
    this.loadAppointments(branchId);
  }

  protected showDetails(appointmentId: number): void {
    const branchId = this.selectedBranchId();
    this.busyId.set(appointmentId);
    this.appointmentService.getBranchDetails(appointmentId).subscribe({
      next: (details) => {
        if (branchId !== this.selectedBranchId()) return;
        this.appointmentDetails.set(details);
        this.busyId.set(null);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error);
      },
    });
  }

  protected complete(appointment: AppointmentSummary): void {
    if (!confirm(`¿Finalizar el turno de “${appointment.nombreServicio}”?`)) return;
    this.error.set(null);
    this.notice.set(null);
    this.busyId.set(appointment.id);
    this.appointmentService.complete(appointment.id).subscribe({
      next: () => {
        this.notice.set('Turno finalizado correctamente.');
        this.appointmentDetails.set(null);
        this.busyId.set(null);
        const branchId = this.selectedBranchId();
        if (branchId) this.loadAppointments(branchId);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  protected formatCategory(category: string): string {
    return category.replaceAll('_', ' ').toLocaleLowerCase('es-AR');
  }

  private loadProfile(userId: number): void {
    this.userService.getById(userId).subscribe({
      next: (profile) => {
        this.branches.set(profile.sucursalesEmpleado);
        this.loading.set(false);
        if (profile.sucursalesEmpleado.length) this.selectBranch(profile.sucursalesEmpleado[0].id);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private loadAppointments(branchId: number): void {
    this.agendaLoading.set(true);
    this.error.set(null);
    this.appointmentService.listEmployeeOwn(branchId, 'PENDIENTE').subscribe({
      next: (appointments) => {
        if (branchId !== this.selectedBranchId()) return;
        this.appointments.set(appointments);
        this.agendaLoading.set(false);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error);
      },
    });
  }

  private fail(error: unknown): void {
    this.error.set(
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'No se pudo completar la operación.',
    );
    this.loading.set(false);
    this.agendaLoading.set(false);
    this.busyId.set(null);
  }
}
