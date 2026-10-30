import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'AppointMee | Inicio',
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'mis-turnos',
    title: 'AppointMee | Mis Turnos',
    data: {
      title: 'Mis Turnos',
      description: 'Consultá y gestioná todos tus turnos en un solo lugar.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: 'mis-sucursales',
    title: 'AppointMee | Mis Sucursales',
    data: {
      title: 'Mis Sucursales',
      description: 'Explorá las sucursales disponibles y encontrá la más cercana.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: 'perfil',
    title: 'AppointMee | Mi Perfil',
    data: {
      title: 'Mi Perfil',
      description: 'Actualizá tus datos y mantené tu cuenta al día.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: 'solicitudes',
    title: 'AppointMee | Solicitudes',
    data: {
      title: 'Solicitudes',
      description: 'Seguí el estado de tus solicitudes y enterate de las novedades.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: 'configuracion',
    title: 'AppointMee | Ajustes',
    data: {
      title: 'Ajustes',
      description: 'Personalizá tus preferencias y la forma en que usás AppointMee.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: 'login',
    title: 'AppointMee | Iniciar sesión',
    data: {
      title: 'Iniciar sesión',
      description: 'Ingresá a tu cuenta para volver a gestionar tus turnos.',
    },
    loadComponent: () => import('./pages/section/section').then((module) => module.Section),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
