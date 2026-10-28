import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ApiError } from '../../models/errors';
import {
  EmployeeOwnRequestSummary,
  EmployeeRequestResponse,
  EmployerRequestResponse,
  EmployerRequestSummary,
} from '../../models/request';
import { AuthService } from '../../services/auth.service';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-requests',
  imports: [DatePipe],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Requests {
  private readonly auth = inject(AuthService);
  private readonly requests = inject(RequestService);
  private readonly router = inject(Router);
  private employeeLoaded = false;
  private employerLoaded = false;

  protected readonly employeeRequests = signal<readonly EmployeeOwnRequestSummary[]>([]);
  protected readonly employerRequests = signal<readonly EmployerRequestSummary[]>([]);
  protected readonly employeeDetail = signal<EmployeeRequestResponse | null>(null);
  protected readonly employerDetail = signal<EmployerRequestResponse | null>(null);
  protected readonly loadingEmployee = signal(true);
  protected readonly loadingEmployer = signal(false);
  protected readonly loadingDetail = signal(false);
  protected readonly resolving = signal(false);
  protected readonly error = signal('');
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMINISTRADOR'));
  protected readonly total = computed(
    () => this.employeeRequests().length + this.employerRequests().length,
  );

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user && !this.employeeLoaded) {
        this.employeeLoaded = true;
        this.loadEmployeeRequests();
      }
      if (user && !this.employerLoaded) {
        this.employerLoaded = true;
        this.loadEmployerRequests();
      }
      if (!this.auth.loading() && !user) this.loadingEmployee.set(false);
    });
  }

  protected showEmployee(requestId: number): void {
    this.closeDetail();
    this.loadingDetail.set(true);
    this.requests
      .getEmployeeDetails(requestId)
      .pipe(finalize(() => this.loadingDetail.set(false)))
      .subscribe({
        next: (detail) => this.employeeDetail.set(detail),
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo abrir la solicitud.'),
      });
  }

  protected showEmployer(requestId: number): void {
    this.closeDetail();
    this.loadingDetail.set(true);
    this.requests
      .getEmployerDetails(requestId)
      .pipe(finalize(() => this.loadingDetail.set(false)))
      .subscribe({
        next: (detail) => this.employerDetail.set(detail),
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo abrir la solicitud.'),
      });
  }

  protected resolveEmployee(approve: boolean): void {
    const detail = this.employeeDetail();
    if (!detail) return;
    this.resolving.set(true);
    this.requests
      .resolveEmployee(detail.id, approve)
      .pipe(finalize(() => this.resolving.set(false)))
      .subscribe({
        next: () => {
          if (approve) {
            this.auth.logout();
            void this.router.navigate(['/login'], {
              state: {
                successMessage:
                  'La invitación fue aprobada. Iniciá sesión nuevamente para actualizar tus permisos.',
              },
            });
            return;
          }
          this.employeeRequests.update((items) => items.filter((item) => item.id !== detail.id));
          this.closeDetail();
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo resolver la solicitud.'),
      });
  }

  protected resolveEmployer(approve: boolean): void {
    const detail = this.employerDetail();
    if (!detail) return;
    this.resolving.set(true);
    this.requests
      .resolveEmployer(detail.id, approve)
      .pipe(finalize(() => this.resolving.set(false)))
      .subscribe({
        next: () => {
          this.employerRequests.update((items) => items.filter((item) => item.id !== detail.id));
          this.closeDetail();
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo resolver la solicitud.'),
      });
  }

  protected closeDetail(): void {
    this.employeeDetail.set(null);
    this.employerDetail.set(null);
    this.error.set('');
  }

  private loadEmployeeRequests(): void {
    this.requests
      .listEmployeeReceived()
      .pipe(finalize(() => this.loadingEmployee.set(false)))
      .subscribe({
        next: (items) => this.employeeRequests.set(items),
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudieron cargar las solicitudes.'),
      });
  }

  private loadEmployerRequests(): void {
    this.loadingEmployer.set(true);
    const request = this.isAdmin()
      ? this.requests.listEmployerPending()
      : this.requests.listOwnEmployerRequests();
    request.pipe(finalize(() => this.loadingEmployer.set(false))).subscribe({
      next: (items) => this.employerRequests.set(items),
      error: (error: ApiError) =>
        this.error.set(error.message || 'No se pudieron cargar las solicitudes de empleador.'),
    });
  }
}
