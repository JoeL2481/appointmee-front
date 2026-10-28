import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type NavigationState = Record<string, unknown>;

@Component({
  selector: 'app-error',
  imports: [RouterLink],
  templateUrl: './error.html',
  styleUrl: './error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = this.readState();

  protected readonly status = computed(() =>
    this.safeStatus(this.state['status'] ?? this.route.snapshot.queryParamMap.get('status')),
  );
  protected readonly title = computed(() =>
    this.safeText(
      this.state['title'] ?? this.route.snapshot.queryParamMap.get('title'),
      'Algo no salió como esperábamos',
    ),
  );
  protected readonly message = computed(() =>
    this.safeText(
      this.state['message'] ?? this.route.snapshot.queryParamMap.get('message'),
      'No pudimos completar la solicitud. Podés volver al inicio e intentarlo otra vez.',
      320,
    ),
  );

  private readState(): NavigationState {
    const state = this.router.currentNavigation()?.extras.state;
    return state && typeof state === 'object' ? state : {};
  }

  private safeText(value: unknown, fallback: string, maxLength = 100): string {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback;
  }

  private safeStatus(value: unknown): string {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(parsed) && parsed >= 400 && parsed <= 599 ? String(parsed) : 'Error';
  }
}
