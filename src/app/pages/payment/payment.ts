import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  imports: [RouterLink],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payment {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);

  protected readonly appointmentId = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id') ?? params.get('appointmentId'));
      if (Number.isInteger(id) && id > 0) this.appointmentId.set(id);
      else this.error.set('El turno solicitado no es válido.');
    });
  }

  protected pay(): void {
    if (!this.appointmentId() || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.paymentService
      .createCheckout(this.appointmentId())
      .pipe(
        switchMap((checkoutUrl) => {
          const safeUrl = this.validateCheckoutUrl(checkoutUrl);
          if (!safeUrl) {
            this.error.set('La plataforma de pago devolvió un enlace inválido.');
            return of(null);
          }
          return of(safeUrl);
        }),
        catchError(() => {
          this.error.set('No pudimos iniciar el pago. Intentá nuevamente.');
          return of(null);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((url) => {
        this.loading.set(false);
        if (url) window.location.assign(url);
      });
  }

  private validateCheckoutUrl(value: string): string | null {
    try {
      const url = new URL(value.trim());
      const host = url.hostname.toLowerCase();
      const officialHost =
        host === 'mercadopago.com' ||
        host.endsWith('.mercadopago.com') ||
        host === 'mercadopago.com.ar' ||
        host.endsWith('.mercadopago.com.ar');
      return url.protocol === 'https:' && officialHost ? url.toString() : null;
    } catch {
      return null;
    }
  }
}
