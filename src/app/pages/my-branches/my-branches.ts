import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BranchSummary } from '../../models/branch';
import { ApiError } from '../../models/errors';
import { AuthService } from '../../services/auth.service';
import { BranchService } from '../../services/branch.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-my-branches',
  imports: [RouterLink],
  templateUrl: './my-branches.html',
  styleUrl: './my-branches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyBranches {
  private readonly auth = inject(AuthService);
  private readonly branchesService = inject(BranchService);
  private readonly users = inject(UserService);
  private loadedUserId: number | null = null;

  protected readonly owned = signal<readonly BranchSummary[]>([]);
  protected readonly associated = signal<readonly BranchSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly canCreate = computed(() => this.auth.hasRole('EMPLEADOR'));
  protected readonly branches = computed(() => {
    const unique = new Map<number, BranchSummary>();
    for (const branch of [...this.owned(), ...this.associated()]) unique.set(branch.id, branch);
    return [...unique.values()];
  });

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (userId && userId !== this.loadedUserId) {
        this.loadedUserId = userId;
        this.load(userId);
      } else if (!this.auth.loading() && !userId) {
        this.loading.set(false);
      }
    });
  }

  protected relationship(branchId: number): string {
    const own = this.owned().some((branch) => branch.id === branchId);
    const employee = this.associated().some((branch) => branch.id === branchId);
    if (own && employee) return 'Propia · Asociada';
    return own ? 'Propia' : 'Asociada';
  }

  protected categoryLabel(category: string): string {
    return category
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  private load(userId: number): void {
    this.loading.set(true);
    this.error.set('');
    const ownRequest = this.auth.hasRole('EMPLEADOR')
      ? this.branchesService.listOwn()
      : of([] as readonly BranchSummary[]);
    forkJoin({ profile: this.users.getById(userId), owned: ownRequest })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ profile, owned }) => {
          this.owned.set(owned);
          this.associated.set(profile.sucursalesEmpleado);
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudieron cargar tus sucursales.'),
      });
  }
}
