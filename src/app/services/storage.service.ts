import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getToken(): string | null {
    return this.storage?.getItem(TOKEN_KEY) ?? null;
  }

  setToken(token: string): void {
    this.storage?.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    this.storage?.removeItem(TOKEN_KEY);
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
