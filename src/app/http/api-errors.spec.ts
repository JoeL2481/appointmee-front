import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiErrors } from './api-errors';

describe('ApiErrors', () => {
  let errors: ApiErrors;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiErrors] });
    errors = TestBed.inject(ApiErrors);
  });

  it('maps known statuses to actionable safe messages', () => {
    expect(errors.map(new HttpErrorResponse({ status: 429, error: 'private backend text' })).message)
      .toBe('Demasiados intentos. Esperá unos segundos e intentá de nuevo.');
    expect(errors.map(new HttpErrorResponse({ status: 503 })).message)
      .toBe('Tuvimos un problema. Probá de nuevo en unos segundos.');
    expect(errors.map(new HttpErrorResponse({ status: 0 })).message)
      .toBe('No pudimos conectarnos. Revisá tu conexión.');
  });

  it('keeps validation errors structured and never exposes unknown backend text', () => {
    const validation = errors.map(new HttpErrorResponse({
      status: 422,
      error: { fields: { email: 'Formato inválido', ignored: 9 } },
    }));
    expect(validation.fields).toEqual({
      email: 'Revisá el formato del email e intentá nuevamente.',
      ignored: 'Revisá este campo e intentá nuevamente.',
    });

    const unknown = errors.map(new HttpErrorResponse({ status: 418, error: 'SQL SELECT secret' }));
    expect(unknown.message).toContain('Ocurrió un error inesperado');
    expect(unknown.message).not.toContain('SQL');
  });

  it('maps known plain-text conflicts to a safe contextual email error', () => {
    const conflict = errors.map(new HttpErrorResponse({
      status: 409,
      error: 'El email ya está registrado en el sistema. Detalle SQL: private data',
    }));
    expect(conflict.fields).toEqual({ email: 'Este email ya está registrado.' });
    expect(conflict.message).toBe('Este email ya está registrado.');
    expect(conflict.message).not.toContain('SQL');
  });
});
