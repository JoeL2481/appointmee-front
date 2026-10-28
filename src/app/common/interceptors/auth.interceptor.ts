import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';

const API_PREFIXES = [
  '/usuarios',
  '/sucursales',
  '/servicios',
  '/turnos',
  '/solicitudes-empleador',
  '/solicitudes-empleado',
  '/pagos',
] as const;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(StorageService).getToken();
  const isApiRequest = API_PREFIXES.some((prefix) => request.url.startsWith(prefix));

  if (!token || !isApiRequest) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
