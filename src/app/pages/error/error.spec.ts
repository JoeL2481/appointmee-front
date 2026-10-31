import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ErrorPage } from './error';

describe('ErrorPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows a safe public error message and always offers a way home', async () => {
    const fixture = TestBed.createComponent(ErrorPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('h1')?.textContent).toContain('Algo salió mal');
    expect(html.querySelector('a[routerLink="/"]')?.textContent).toContain('Ir al inicio');
    expect(html.textContent).not.toContain('stack trace');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('omits an unsafe reference supplied through navigation state', async () => {
    history.replaceState({ errorReference: 'token secret' }, '');

    const fixture = TestBed.createComponent(ErrorPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.error-card__reference')).toBeNull();
  });
});
