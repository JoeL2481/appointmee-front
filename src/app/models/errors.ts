export interface ValidationErrors {
  readonly [field: string]: string;
}

export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly validationErrors: ValidationErrors | null;
  readonly url: string | null;
}
