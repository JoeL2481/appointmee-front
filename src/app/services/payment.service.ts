import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pagos`;

  createCheckout(appointmentId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${appointmentId}`, null, { responseType: 'text' });
  }
}
