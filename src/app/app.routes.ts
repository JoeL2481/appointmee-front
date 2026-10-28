import { Routes } from '@angular/router';
import { authGuard } from './common/guards/auth.guard';
import { guestGuard } from './common/guards/guest.guard';
import { roleGuard } from './common/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'AppointMee | Iniciar sesión',
    canActivate: [guestGuard],
    data: { hideNavbar: true },
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
  },
  {
    path: 'registro',
    title: 'AppointMee | Crear cuenta',
    canActivate: [guestGuard],
    data: { hideNavbar: true },
    loadComponent: () => import('./pages/register/register').then((module) => module.Register),
  },
  {
    path: 'recuperar-cuenta',
    title: 'AppointMee | Recuperar cuenta',
    canActivate: [guestGuard],
    data: { hideNavbar: true },
    loadComponent: () =>
      import('./pages/account-recovery/account-recovery').then((module) => module.AccountRecovery),
  },
  {
    path: 'error',
    title: 'AppointMee | Error',
    data: { hideNavbar: true },
    loadComponent: () => import('./pages/error/error').then((module) => module.ErrorPage),
  },
  {
    path: '',
    title: 'AppointMee | Inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'sucursales/crear',
    pathMatch: 'full',
    redirectTo: 'empleador',
  },
  {
    path: 'sucursales/:id',
    title: 'AppointMee | Sucursal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/branch-detail/branch-detail').then((module) => module.BranchDetail),
  },
  {
    path: 'reservar/:sucursalId',
    title: 'AppointMee | Reservar turno',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () => import('./pages/booking/booking').then((module) => module.Booking),
  },
  {
    path: 'mis-turnos',
    title: 'AppointMee | Mis turnos',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./pages/appointments/appointments').then((module) => module.Appointments),
  },
  {
    path: 'mis-turnos/:id',
    title: 'AppointMee | Detalle del turno',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./pages/appointment-detail/appointment-detail').then(
        (module) => module.AppointmentDetail,
      ),
  },
  {
    path: 'pago/:turnoId',
    title: 'AppointMee | Pago',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () => import('./pages/payment/payment').then((module) => module.Payment),
  },
  {
    path: 'perfil',
    title: 'AppointMee | Mi perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'configuracion',
    title: 'AppointMee | Ajustes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings').then((module) => module.Settings),
  },
  {
    path: 'solicitudes',
    title: 'AppointMee | Solicitudes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/requests/requests').then((module) => module.Requests),
  },
  {
    path: 'solicitar-empleador',
    title: 'AppointMee | Solicitar rol empleador',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./pages/employer-request/employer-request').then((module) => module.EmployerRequest),
  },
  {
    path: 'mis-sucursales',
    title: 'AppointMee | Mis sucursales',
    canActivate: [roleGuard('EMPLEADOR', 'EMPLEADO')],
    loadComponent: () =>
      import('./pages/my-branches/my-branches').then((module) => module.MyBranches),
  },
  {
    path: 'empleador',
    title: 'AppointMee | Panel empleador',
    canActivate: [roleGuard('EMPLEADOR')],
    loadComponent: () => import('./pages/employer/employer').then((module) => module.Employer),
  },
  {
    path: 'empleado',
    title: 'AppointMee | Panel empleado',
    canActivate: [roleGuard('EMPLEADO')],
    loadComponent: () => import('./pages/employee/employee').then((module) => module.Employee),
  },
  {
    path: 'admin',
    title: 'AppointMee | Administración',
    canActivate: [roleGuard('ADMINISTRADOR')],
    loadComponent: () => import('./pages/admin/admin').then((module) => module.Admin),
  },
  {
    path: 'creditos',
    title: 'AppointMee | Créditos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/credits/credits').then((module) => module.Credits),
  },
  { path: '**', redirectTo: '' },
];
