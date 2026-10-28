import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  BranchCategory,
  BranchCreate,
  BranchResponse,
  BranchSummary,
  BranchUpdate,
} from '../../models/branch';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentSummary,
} from '../../models/appointment';
import { CatalogServiceSummary } from '../../models/service';
import { UserResponse } from '../../models/user';
import { AppointmentService } from '../../services/appointment.service';
import { BranchService } from '../../services/branch.service';
import { CatalogService } from '../../services/catalog.service';

type EmployerTab = 'branches' | 'services' | 'appointments' | 'employees';

@Component({
  selector: 'app-employer',
  imports: [ReactiveFormsModule],
  templateUrl: './employer.html',
  styleUrl: './employer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Employer {
  private readonly formBuilder = inject(FormBuilder);
  private readonly branchService = inject(BranchService);
  private readonly catalogService = inject(CatalogService);
  private readonly appointmentService = inject(AppointmentService);

  protected readonly branches = signal<readonly BranchSummary[]>([]);
  protected readonly categories = signal<readonly BranchCategory[]>([]);
  protected readonly branchDetails = signal<BranchResponse | null>(null);
  protected readonly services = signal<readonly CatalogServiceSummary[]>([]);
  protected readonly employees = signal<readonly UserResponse[]>([]);
  protected readonly appointments = signal<readonly AppointmentSummary[]>([]);
  protected readonly appointmentDetails = signal<AppointmentResponse | null>(null);
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly editingBranchId = signal<number | null>(null);
  protected readonly editingServiceId = signal<number | null>(null);
  protected readonly activeTab = signal<EmployerTab>('branches');
  protected readonly appointmentStatus = signal<AppointmentStatus>('PENDIENTE');
  protected readonly loading = signal(true);
  protected readonly workspaceLoading = signal(false);
  protected readonly busy = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly selectedBranch = computed(() =>
    this.branches().find((branch) => branch.id === this.selectedBranchId()),
  );
  protected readonly pendingAppointments = computed(
    () =>
      this.appointments().filter((appointment) => appointment.estadoTurno === 'PENDIENTE').length,
  );

  protected readonly branchForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
    direccion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^\d{8,20}$/)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
    categoria: ['', Validators.required],
    horaApertura: ['', Validators.required],
    horaCierre: ['', Validators.required],
    fotoUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
  });

  protected readonly serviceForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(60)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    duracion: [30, [Validators.required, Validators.min(30), Validators.max(360)]],
    precio: [0.01, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
    fotoUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
  });

  protected readonly imageForm = this.formBuilder.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
  });

  protected readonly inviteForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    forkJoin({
      branches: this.branchService.listOwn(),
      categories: this.branchService.getCategories(),
    }).subscribe({
      next: ({ branches, categories }) => {
        this.branches.set(branches);
        this.categories.set(categories);
        this.loading.set(false);
        if (branches.length) this.selectBranch(branches[0].id);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected setTab(tab: EmployerTab): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  protected branchChanged(event: Event): void {
    this.selectBranch(Number((event.target as HTMLSelectElement).value));
  }

  protected selectBranch(branchId: number): void {
    if (!branchId) return;
    this.selectedBranchId.set(branchId);
    this.workspaceLoading.set(true);
    this.appointmentDetails.set(null);
    forkJoin({
      details: this.branchService.getById(branchId),
      services: this.catalogService.listByBranch(branchId),
      employees: this.branchService.listEmployees(branchId),
      appointments: this.appointmentService.listByBranch(branchId, this.appointmentStatus()),
    }).subscribe({
      next: ({ details, services, employees, appointments }) => {
        if (branchId !== this.selectedBranchId()) return;
        this.branchDetails.set(details);
        this.services.set(services);
        this.employees.set(employees);
        this.appointments.set(appointments);
        this.workspaceLoading.set(false);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error, true);
      },
    });
  }

  protected newBranch(clearMessages = true): void {
    this.editingBranchId.set(null);
    this.branchForm.reset({
      nombre: '',
      direccion: '',
      telefono: '',
      descripcion: '',
      categoria: '',
      horaApertura: '',
      horaCierre: '',
      fotoUrl: '',
    });
    if (clearMessages) this.clearMessages();
  }

  protected editBranch(): void {
    const details = this.branchDetails();
    if (!details) return;
    this.editingBranchId.set(details.id);
    this.branchForm.setValue({
      nombre: details.nombre,
      direccion: details.direccion,
      telefono: details.telefono ?? '',
      descripcion: details.descripcion,
      categoria: details.categoria,
      horaApertura: details.horaApertura.slice(0, 5),
      horaCierre: details.horaCierre.slice(0, 5),
      fotoUrl: details.fotoPerfil ?? '',
    });
  }

  protected saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const value = this.branchForm.getRawValue();
    const categoryId = this.categories().indexOf(value.categoria as BranchCategory) + 1;
    if (!categoryId) return;
    const payload: BranchCreate = {
      nombre: value.nombre,
      direccion: value.direccion,
      telefono: value.telefono || undefined,
      descripcion: value.descripcion,
      categoriaId: categoryId,
      horaApertura: value.horaApertura,
      horaCierre: value.horaCierre,
      fotoUrl: value.fotoUrl,
    };
    const branchId = this.editingBranchId();
    this.run(
      branchId
        ? this.branchService.update(branchId, payload as BranchUpdate)
        : this.branchService.create(payload),
      branchId ? 'Sucursal actualizada.' : 'Sucursal creada.',
      () => {
        this.newBranch(false);
        this.reloadBranches(branchId ?? undefined);
      },
      'branch-save',
    );
  }

  protected deleteBranch(): void {
    const branch = this.selectedBranch();
    if (!branch || !confirm(`¿Eliminar definitivamente “${branch.nombre}”?`)) return;
    this.run(
      this.branchService.delete(branch.id, true),
      'Sucursal eliminada.',
      () => {
        this.selectedBranchId.set(null);
        this.branchDetails.set(null);
        this.reloadBranches();
      },
      'branch-delete',
    );
  }

  protected addImage(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.imageForm.invalid) {
      this.imageForm.markAllAsTouched();
      return;
    }
    this.run(
      this.branchService.addImages(branchId, { urls: [this.imageForm.controls.url.value] }),
      'Imagen agregada.',
      () => {
        this.imageForm.reset();
        this.reloadBranchDetails(branchId);
      },
      'image-add',
    );
  }

  protected deleteImage(imageId: number): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !confirm('¿Eliminar esta imagen?')) return;
    this.run(
      this.branchService.deleteImage(branchId, imageId),
      'Imagen eliminada.',
      () => {
        this.reloadBranchDetails(branchId);
      },
      `image-${imageId}`,
    );
  }

  protected newService(clearMessages = true): void {
    this.editingServiceId.set(null);
    this.serviceForm.reset({
      nombre: '',
      descripcion: '',
      duracion: 30,
      precio: 0.01,
      fotoUrl: '',
    });
    if (clearMessages) this.clearMessages();
  }

  protected editService(serviceId: number): void {
    const branchId = this.selectedBranchId();
    this.busy.set(`service-load-${serviceId}`);
    this.catalogService.getById(serviceId).subscribe({
      next: (service) => {
        if (branchId !== this.selectedBranchId()) return;
        this.editingServiceId.set(serviceId);
        this.serviceForm.setValue({
          nombre: service.nombre,
          descripcion: service.descripcion,
          duracion: service.duracion,
          precio: service.precio,
          fotoUrl: service.fotoPerfil ?? '',
        });
        this.busy.set(null);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected saveService(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    const value = this.serviceForm.getRawValue();
    const serviceId = this.editingServiceId();
    const payload = { ...value, sucursalId: branchId };
    this.run(
      serviceId
        ? this.catalogService.update(serviceId, value)
        : this.catalogService.create(payload),
      serviceId ? 'Servicio actualizado.' : 'Servicio creado.',
      () => {
        this.newService(false);
        this.reloadServices(branchId);
      },
      'service-save',
    );
  }

  protected deleteService(service: CatalogServiceSummary): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !confirm(`¿Eliminar el servicio “${service.nombre}”?`)) return;
    this.run(
      this.catalogService.delete(service.id),
      'Servicio eliminado.',
      () => {
        this.reloadServices(branchId);
      },
      `service-delete-${service.id}`,
    );
  }

  protected statusChanged(event: Event): void {
    this.appointmentStatus.set((event.target as HTMLSelectElement).value as AppointmentStatus);
    this.reloadAppointments();
  }

  protected showAppointment(appointmentId: number): void {
    const branchId = this.selectedBranchId();
    this.busy.set(`appointment-detail-${appointmentId}`);
    this.appointmentService.getBranchDetails(appointmentId).subscribe({
      next: (details) => {
        if (branchId !== this.selectedBranchId()) return;
        this.appointmentDetails.set(details);
        this.busy.set(null);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected completeAppointment(appointmentId: number): void {
    if (!confirm('¿Marcar este turno como realizado?')) return;
    this.run(
      this.appointmentService.complete(appointmentId),
      'Turno finalizado.',
      () => {
        this.appointmentDetails.set(null);
        this.reloadAppointments();
      },
      `appointment-${appointmentId}`,
    );
  }

  protected cancelAppointment(appointmentId: number): void {
    if (!confirm('¿Cancelar este turno? Esta acción no se puede deshacer.')) return;
    this.run(
      this.appointmentService.cancel(appointmentId),
      'Turno cancelado.',
      () => {
        this.appointmentDetails.set(null);
        this.reloadAppointments();
      },
      `appointment-${appointmentId}`,
    );
  }

  protected inviteEmployee(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.run(
      this.branchService.inviteEmployee(branchId, this.inviteForm.controls.email.value),
      'Invitación enviada.',
      () => this.inviteForm.reset(),
      'invite',
    );
  }

  protected removeEmployee(employee: UserResponse): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !confirm(`¿Desvincular a ${employee.nombre} ${employee.apellido}?`)) return;
    this.run(
      this.branchService.removeEmployee(branchId, employee.id),
      'Empleado desvinculado.',
      () => {
        this.reloadEmployees(branchId);
      },
      `employee-${employee.id}`,
    );
  }

  protected becomeEmployee(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !confirm('¿Sumarte también como empleado de esta sucursal?')) return;
    this.run(
      this.branchService.becomeEmployee(branchId),
      'Ahora también sos empleado.',
      () => {
        this.reloadEmployees(branchId);
      },
      'become-employee',
    );
  }

  protected formatCategory(category: string): string {
    return category
      .replaceAll('_', ' ')
      .toLocaleLowerCase('es-AR')
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(date),
    );
  }

  private reloadBranches(preferredId?: number): void {
    this.branchService.listOwn().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        const nextId = preferredId ?? this.selectedBranchId() ?? branches[0]?.id;
        if (nextId && branches.some((branch) => branch.id === nextId)) this.selectBranch(nextId);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private reloadBranchDetails(branchId: number): void {
    this.branchService.getById(branchId).subscribe({
      next: (details) => {
        if (branchId === this.selectedBranchId()) this.branchDetails.set(details);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error);
      },
    });
  }

  private reloadServices(branchId: number): void {
    this.catalogService.listByBranch(branchId).subscribe({
      next: (services) => {
        if (branchId === this.selectedBranchId()) this.services.set(services);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error);
      },
    });
  }

  private reloadEmployees(branchId: number): void {
    this.branchService.listEmployees(branchId).subscribe({
      next: (employees) => {
        if (branchId === this.selectedBranchId()) this.employees.set(employees);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error);
      },
    });
  }

  private reloadAppointments(): void {
    const branchId = this.selectedBranchId();
    if (!branchId) return;
    this.workspaceLoading.set(true);
    this.appointmentService.listByBranch(branchId, this.appointmentStatus()).subscribe({
      next: (appointments) => {
        if (branchId !== this.selectedBranchId()) return;
        this.appointments.set(appointments);
        this.workspaceLoading.set(false);
      },
      error: (error: unknown) => {
        if (branchId === this.selectedBranchId()) this.fail(error, true);
      },
    });
  }

  private run(
    request: Observable<unknown>,
    message: string,
    after: () => void,
    operation: string,
  ): void {
    this.clearMessages();
    this.busy.set(operation);
    request.subscribe({
      next: () => {
        this.notice.set(message);
        this.busy.set(null);
        after();
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private fail(error: unknown, workspace = false): void {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'No se pudo completar la operación.';
    this.error.set(message);
    this.busy.set(null);
    this.loading.set(false);
    if (workspace) this.workspaceLoading.set(false);
  }
}
