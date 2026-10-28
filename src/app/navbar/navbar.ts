import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly exact: boolean;
}

const ICONS = {
  home: 'M3 10.7 12 3l9 7.7V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.7Z',
  calendar:
    'M7 2v4M17 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  store: 'M3 9h18M4 9l1.5-5h13L20 9M5 9v11h14V9M9 20v-6h6v6',
  user: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  inbox: 'M4 4h16v16H4zM4 13h4l2 3h4l2-3h4',
  settings:
    'M4 7h6M14 7h6M4 12h10M18 12h2M4 17h2M10 17h10M10 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM6 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM14 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  chevron: 'm9 18 6-6-6-6',
};

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-navbar' },
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly bee = viewChild<ElementRef<HTMLElement>>('bee');
  private readonly beeTrail = viewChild<ElementRef<HTMLElement>>('beeTrail');
  private readonly beeMedia =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
      : null;
  private beeFrame = 0;
  private readonly beeTarget = { x: 0, y: 0 };
  private readonly beePosition = { x: 0, y: 0 };
  private readonly trailPosition = { x: 0, y: 0 };

  protected readonly mobileOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly icons = ICONS;

  protected readonly primaryLinks: readonly NavItem[] = [
    { label: 'Home', path: '/', icon: ICONS.home, exact: true },
    { label: 'Mis Turnos', path: '/mis-turnos', icon: ICONS.calendar, exact: false },
    { label: 'Mis Sucursales', path: '/mis-sucursales', icon: ICONS.store, exact: false },
  ];

  protected readonly accountLinks: readonly NavItem[] = [
    { label: 'Mi Perfil', path: '/perfil', icon: ICONS.user, exact: false },
    { label: 'Solicitudes', path: '/solicitudes', icon: ICONS.inbox, exact: false },
    { label: 'Ajustes', path: '/configuracion', icon: ICONS.settings, exact: false },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeAll());

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.beeFrame);
      document.body.classList.remove('nav-locked');
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    this.profileOpen.set(false);

    const target = event.target;

    if (target instanceof Element && target.closest('.navbar__search-wrap, .search-trigger')) {
      return;
    }

    this.searchOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAll();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  @HostListener('window:resize')
  protected onResize(): void {
    if (window.innerWidth > 1024 && this.mobileOpen()) {
      this.closeMobile();
    }
  }

  @HostListener('document:pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !this.beeMedia?.matches) {
      this.stopBee();
      return;
    }

    const bee = this.bee()?.nativeElement;
    const trail = this.beeTrail()?.nativeElement;

    if (!bee || !trail) {
      return;
    }

    this.beeTarget.x = Math.min(window.innerWidth - 24, Math.max(24, event.clientX + 18));
    this.beeTarget.y = Math.min(window.innerHeight - 24, Math.max(24, event.clientY - 20));

    if (!bee.classList.contains('is-active')) {
      this.beePosition.x = this.beeTarget.x;
      this.beePosition.y = this.beeTarget.y;
      this.trailPosition.x = this.beeTarget.x;
      this.trailPosition.y = this.beeTarget.y;
      bee.style.transform = `translate3d(${this.beeTarget.x}px, ${this.beeTarget.y}px, 0) translate(-50%, -50%)`;
      trail.style.transform = `translate3d(${this.beeTarget.x}px, ${this.beeTarget.y}px, 0) translate(-50%, -50%)`;
      bee.classList.add('is-active');
      trail.classList.add('is-active');
    }

    if (!this.beeFrame) {
      this.beeFrame = requestAnimationFrame(this.tickBee);
    }
  }

  @HostListener('document:mouseleave')
  protected hideBee(): void {
    this.stopBee();
  }

  @HostListener('window:blur')
  protected onWindowBlur(): void {
    this.stopBee();
  }

  private readonly tickBee = (): void => {
    const bee = this.bee()?.nativeElement;
    const trail = this.beeTrail()?.nativeElement;

    if (!bee || !trail) {
      this.beeFrame = 0;
      return;
    }

    this.beePosition.x += (this.beeTarget.x - this.beePosition.x) * 0.18;
    this.beePosition.y += (this.beeTarget.y - this.beePosition.y) * 0.18;
    this.trailPosition.x += (this.beeTarget.x - this.trailPosition.x) * 0.07;
    this.trailPosition.y += (this.beeTarget.y - this.trailPosition.y) * 0.07;

    const dx = this.beeTarget.x - this.beePosition.x;
    const dy = this.beeTarget.y - this.beePosition.y;
    const angle = Math.max(-16, Math.min(16, dx * 0.45));

    bee.style.transform = `translate3d(${this.beePosition.x}px, ${this.beePosition.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
    trail.style.transform = `translate3d(${this.trailPosition.x}px, ${this.trailPosition.y}px, 0) translate(-50%, -50%)`;

    const trailDx = this.beeTarget.x - this.trailPosition.x;
    const trailDy = this.beeTarget.y - this.trailPosition.y;

    if (
      Math.abs(dx) < 0.2 &&
      Math.abs(dy) < 0.2 &&
      Math.abs(trailDx) < 0.2 &&
      Math.abs(trailDy) < 0.2
    ) {
      this.beeFrame = 0;
      return;
    }

    this.beeFrame = requestAnimationFrame(this.tickBee);
  };

  private stopBee(): void {
    cancelAnimationFrame(this.beeFrame);
    this.beeFrame = 0;
    this.bee()?.nativeElement.classList.remove('is-active');
    this.beeTrail()?.nativeElement.classList.remove('is-active');
  }

  protected toggleMobile(): void {
    const open = !this.mobileOpen();

    this.mobileOpen.set(open);
    this.profileOpen.set(false);
    this.searchOpen.set(false);
    document.body.classList.toggle('nav-locked', open);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
    document.body.classList.remove('nav-locked');
  }

  protected toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.update((open) => !open);
    this.searchOpen.set(false);
  }

  protected trackNavPointer(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }

    const list = event.currentTarget as HTMLElement;
    const bounds = list.getBoundingClientRect();

    list.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
    list.style.setProperty('--my', `${event.clientY - bounds.top}px`);
    list.classList.add('is-tracking');
  }

  protected resetNavPointer(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('is-tracking');
  }

  protected openSearch(): void {
    this.searchOpen.set(true);
    this.profileOpen.set(false);
    this.closeMobile();
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  protected closeSearch(): void {
    this.searchOpen.set(false);
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.searchInput()?.nativeElement.focus();
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();

    const term = this.searchTerm().trim();

    this.closeSearch();
    this.closeMobile();

    void this.router.navigate(['/'], term ? { queryParams: { busqueda: term } } : {});
  }

  protected logout(): void {
    localStorage.removeItem('token');
    this.closeAll();
    void this.router.navigate(['/login']);
  }

  protected closeAll(): void {
    this.profileOpen.set(false);
    this.searchOpen.set(false);
    this.closeMobile();
  }
}
