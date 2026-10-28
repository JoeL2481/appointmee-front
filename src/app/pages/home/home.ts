import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { BRANCH_CATEGORIES, BranchCategory, BranchSummary } from '../../models/branch';
import { BranchService } from '../../services/branch.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly branchService = inject(BranchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryChanges = new Subject<void>();

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly categories = signal<readonly BranchCategory[]>(BRANCH_CATEGORIES);
  protected readonly selectedCategory = signal<BranchCategory | null>(null);
  protected readonly branches = signal<readonly BranchSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.branchService
      .getCategories()
      .pipe(
        catchError(() => of(BRANCH_CATEGORIES)),
        takeUntilDestroyed(),
      )
      .subscribe((categories) => this.categories.set(categories));

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const query = params.get('busqueda') ?? '';
      if (this.search.value !== query) this.search.setValue(query);
    });

    combineLatest([
      this.search.valueChanges.pipe(
        startWith(this.search.value),
        debounceTime(250),
        distinctUntilChanged(),
      ),
      this.categoryChanges.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([input]) => {
          const name = input.trim();
          this.loading.set(true);
          this.error.set('');
          return this.branchService
            .list({
              ...(this.selectedCategory() ? { categoria: this.selectedCategory()! } : {}),
              ...(name ? { nombre: name } : {}),
            })
            .pipe(
              catchError(() => {
                this.error.set('No pudimos cargar las sucursales. Intentá nuevamente.');
                return of([]);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((branches) => {
        this.branches.set(branches);
        this.loading.set(false);
      });
  }

  protected selectCategory(category: BranchCategory | null): void {
    this.selectedCategory.set(category);
    this.reload();
  }

  protected clearFilters(): void {
    this.selectedCategory.set(null);
    this.search.setValue('');
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  protected categoryLabel(category: string): string {
    return category.replaceAll('_', ' ').toLocaleLowerCase('es-AR');
  }

  protected imageError(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  private reload(): void {
    this.categoryChanges.next();
  }
}
