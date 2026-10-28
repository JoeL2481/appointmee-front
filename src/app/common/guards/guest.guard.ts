import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const storage = inject(StorageService);

  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => (auth.authenticated() && storage.getToken() ? router.createUrlTree(['/']) : true)),
  );
};
