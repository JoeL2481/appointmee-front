import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { Role } from '../../models/user';
import { AuthService } from '../../services/auth.service';

export function roleGuard(...roles: readonly Role[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return toObservable(auth.loading).pipe(
      filter((loading) => !loading),
      take(1),
      map(() => {
        if (!auth.authenticated()) {
          return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }

        return auth.hasRole(...roles) ? true : router.createUrlTree(['/']);
      }),
    );
  };
}
