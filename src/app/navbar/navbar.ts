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

    this.destroyRef.onDestroy(() => document.body.classList.remove('nav-locked'));
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
