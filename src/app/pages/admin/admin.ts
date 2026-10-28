import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BranchResponse, BranchSummary } from '../../models/branch';
import { UserAdminSummary, UserProfile } from '../../models/user';
import { BranchService } from '../../services/branch.service';
import { UserService } from '../../services/user.service';

type AdminSection = 'users' | 'branches';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  private readonly userService = inject(UserService);
  private readonly branchService = inject(BranchService);

  protected readonly users = signal<readonly UserAdminSummary[]>([]);
  protected readonly branches = signal<readonly BranchSummary[]>([]);
  protected readonly userDetails = signal<UserProfile | null>(null);
  protected readonly branchDetails = signal<BranchResponse | null>(null);
  protected readonly section = signal<AdminSection>('users');
  protected readonly query = signal('');
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly activeUsers = computed(
    () => this.users().filter((user) => user.estado).length,
  );
  protected readonly filteredUsers = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es-AR');
    if (!query) return this.users();
    return this.users().filter((user) =>
      `${user.nombre} ${user.apellido}`.toLocaleLowerCase('es-AR').includes(query),
    );
  });
  protected readonly filteredBranches = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es-AR');
    if (!query) return this.branches();
    return this.branches().filter((branch) =>
      `${branch.nombre} ${branch.categoria}`.toLocaleLowerCase('es-AR').includes(query),
    );
  });

  constructor() {
    this.reloadAll();
  }

  protected setSection(section: AdminSection): void {
    this.section.set(section);
    this.query.set('');
    this.userDetails.set(null);
    this.branchDetails.set(null);
    this.clearMessages();
  }

  protected searchChanged(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected showUser(userId: number): void {
    this.detailLoading.set(true);
    this.branchDetails.set(null);
    this.userService.getById(userId).subscribe({
      next: (user) => {
        this.userDetails.set(user);
        this.detailLoading.set(false);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected showBranch(branchId: number): void {
    this.detailLoading.set(true);
    this.userDetails.set(null);
    this.branchService.getById(branchId).subscribe({
      next: (branch) => {
        this.branchDetails.set(branch);
        this.detailLoading.set(false);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected deleteUser(user: UserAdminSummary | UserProfile): void {
    if (!confirm(`¿Eliminar la cuenta de ${user.nombre} ${user.apellido}?`)) return;
    this.busy.set(true);
    this.clearMessages();
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.notice.set('Usuario eliminado correctamente.');
        this.userDetails.set(null);
        this.busy.set(false);
        this.reloadUsers();
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected deleteBranch(branch: BranchSummary | BranchResponse): void {
    if (!confirm(`¿Eliminar definitivamente la sucursal “${branch.nombre}”?`)) return;
    this.busy.set(true);
    this.clearMessages();
    this.branchService.delete(branch.id).subscribe({
      next: () => {
        this.notice.set('Sucursal eliminada correctamente.');
        this.branchDetails.set(null);
        this.busy.set(false);
        this.reloadBranches();
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  protected formatCategory(category: string): string {
    return category.replaceAll('_', ' ').toLocaleLowerCase('es-AR');
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date(date));
  }

  private reloadAll(): void {
    forkJoin({ users: this.userService.list(), branches: this.branchService.list() }).subscribe({
      next: ({ users, branches }) => {
        this.users.set(users);
        this.branches.set(branches);
        this.loading.set(false);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private reloadUsers(): void {
    this.userService.list().subscribe({
      next: (users) => this.users.set(users),
      error: (error: unknown) => this.fail(error),
    });
  }

  private reloadBranches(): void {
    this.branchService.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: (error: unknown) => this.fail(error),
    });
  }

  private clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private fail(error: unknown): void {
    this.error.set(
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'No se pudo completar la operación.',
    );
    this.loading.set(false);
    this.detailLoading.set(false);
    this.busy.set(false);
  }
}
