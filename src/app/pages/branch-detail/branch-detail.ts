import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BranchResponse, ImageResponse } from '../../models/branch';
import { ReviewResponse } from '../../models/appointment';
import { CatalogServiceSummary } from '../../models/service';
import { UserSummary } from '../../models/user';
import { BranchService } from '../../services/branch.service';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-branch-detail',
  imports: [RouterLink],
  templateUrl: './branch-detail.html',
  styleUrl: './branch-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly branchService = inject(BranchService);
  private readonly catalogService = inject(CatalogService);

  protected readonly branch = signal<BranchResponse | null>(null);
  protected readonly employees = signal<readonly UserSummary[]>([]);
  protected readonly services = signal<readonly CatalogServiceSummary[]>([]);
  protected readonly reviews = signal<readonly ReviewResponse[]>([]);
  protected readonly gallery = signal<readonly ImageResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const branchId = Number(params.get('id') ?? params.get('branchId'));
          if (!Number.isInteger(branchId) || branchId <= 0) {
            this.error.set('La sucursal solicitada no es válida.');
            return of(null);
          }

          return forkJoin({
            branch: this.branchService.getById(branchId),
            services: this.catalogService.listByBranch(branchId).pipe(catchError(() => of([]))),
            reviews: this.http
              .get<readonly ReviewResponse[]>(
                `${environment.apiUrl}/sucursales/${branchId}/resenias`,
              )
              .pipe(catchError(() => of([]))),
          }).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar esta sucursal.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result) {
          this.branch.set(result.branch);
          this.employees.set(result.branch.empleados);
          this.services.set(result.services);
          this.reviews.set(result.reviews);
          this.gallery.set(result.branch.imagenes);
        }
        this.loading.set(false);
      });
  }

  protected categoryLabel(category: string): string {
    return category.replaceAll('_', ' ').toLocaleLowerCase('es-AR');
  }
}
