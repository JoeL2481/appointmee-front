import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Role } from '../../models/user';
import { AuthService } from '../../services/auth.service';

interface SettingOption {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly label: string;
  readonly roles?: readonly Role[];
  readonly hideFor?: readonly Role[];
}

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly allOptions: readonly SettingOption[] = [
    {
      title: 'Datos personales',
      description: 'Nombre, correo, foto y contraseña.',
      path: '/perfil',
      label: 'Editar perfil',
    },
    {
      title: 'Solicitudes',
      description: 'Invitaciones y solicitudes pendientes.',
      path: '/solicitudes',
      label: 'Ver solicitudes',
    },
    {
      title: 'Mis sucursales',
      description: 'Negocios propios y lugares donde trabajás.',
      path: '/mis-sucursales',
      label: 'Abrir sucursales',
      roles: ['EMPLEADO', 'EMPLEADOR'],
    },
    {
      title: 'Panel de empleador',
      description: 'Administrá sucursales, equipo, servicios y turnos.',
      path: '/empleador',
      label: 'Abrir panel',
      roles: ['EMPLEADOR'],
    },
    {
      title: 'Panel de empleado',
      description: 'Consultá y gestioná tu agenda laboral.',
      path: '/empleado',
      label: 'Abrir panel',
      roles: ['EMPLEADO'],
    },
    {
      title: 'Administración',
      description: 'Accedé a las herramientas administrativas.',
      path: '/admin',
      label: 'Abrir panel',
      roles: ['ADMINISTRADOR'],
    },
    {
      title: 'Cuenta de empleador',
      description: 'Solicitá permisos para publicar tu negocio.',
      path: '/solicitar-empleador',
      label: 'Enviar solicitud',
      hideFor: ['EMPLEADOR', 'ADMINISTRADOR'],
    },
  ];

  protected readonly options = computed(() =>
    this.allOptions.filter(
      (option) =>
        (!option.roles || option.roles.some((role) => this.auth.hasRole(role))) &&
        (!option.hideFor || !option.hideFor.some((role) => this.auth.hasRole(role))),
    ),
  );
  protected readonly roleLabel = computed(() =>
    (this.auth.user()?.roles ?? [])
      .map((role) => role.charAt(0) + role.slice(1).toLowerCase())
      .join(' · '),
  );

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
