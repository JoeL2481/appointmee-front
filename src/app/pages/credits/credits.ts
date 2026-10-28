import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CreditLink {
  readonly label: string;
  readonly description: string;
  readonly href: string;
}

@Component({
  selector: 'app-credits',
  imports: [RouterLink],
  templateUrl: './credits.html',
  styleUrl: './credits.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Credits {
  protected readonly resources: readonly CreditLink[] = [
    {
      label: 'Angular',
      description: 'Framework para la interfaz y navegación de la aplicación.',
      href: 'https://angular.dev/',
    },
    {
      label: 'Geist',
      description: 'Familia tipográfica utilizada en la experiencia visual.',
      href: 'https://vercel.com/font',
    },
    {
      label: 'Código de AppointMee',
      description: 'Repositorio del proyecto y registro de su evolución.',
      href: 'https://github.com/JoeL2481/appointmee-front',
    },
  ];
}
