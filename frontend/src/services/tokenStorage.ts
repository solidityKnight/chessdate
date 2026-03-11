export const tokenStorage = {
  get(): string | null {
    const fromSession = sessionStorage.getItem('token');
    if (fromSession) return fromSession;
    const fromLocal = localStorage.getItem('token');
    if (fromLocal) {
      sessionStorage.setItem('token', fromLocal);
      localStorage.removeItem('token');
      return fromLocal;
    }
    return null;
  },

  set(token: string | null): void {
    if (token) sessionStorage.setItem('token', token);
    else sessionStorage.removeItem('token');
  },

  clear(): void {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
  },
};

