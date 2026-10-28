import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError, ValidationErrors } from '../../models/errors';
import { StorageService } from '../../services/storage.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !request.url.includes('/usuarios/inicio-sesion')) {
        storage.removeToken();
        const returnUrl = router.url;
        void router.navigate(['/login'], {
          queryParams: returnUrl !== '/login' ? { returnUrl } : undefined,
        });
      }

      return throwError(() => normalizeApiError(error));
    }),
  );
};

function normalizeApiError(error: HttpErrorResponse): ApiError {
  const validationErrors = getValidationErrors(error.error);
  const message =
    typeof error.error === 'string' && error.error.trim()
      ? error.error
      : error.status === 0
        ? 'No se pudo conectar con el servidor'
        : error.message || 'Ocurrió un error inesperado';

  return {
    status: error.status,
    message,
    validationErrors,
    url: error.url,
  };
}

function getValidationErrors(value: unknown): ValidationErrors | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);
  if (!entries.length || entries.some(([, message]) => typeof message !== 'string')) {
    return null;
  }

  return Object.fromEntries(entries) as ValidationErrors;
}
