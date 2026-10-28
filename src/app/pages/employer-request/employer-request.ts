import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../models/errors';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-employer-request',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employer-request.html',
  styleUrl: './employer-request.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployerRequest {
  private readonly requests = inject(RequestService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');
  protected readonly form = this.formBuilder.nonNullable.group({
    motivo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(300)]],
  });

  protected readonly remaining = () => 300 - this.form.controls.motivo.value.length;

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set('');
    this.requests
      .requestEmployer({ motivo: this.form.controls.motivo.value.trim() })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.form.reset();
        },
        error: (error: ApiError) =>
          this.error.set(error.message || 'No se pudo enviar la solicitud.'),
      });
  }
}
