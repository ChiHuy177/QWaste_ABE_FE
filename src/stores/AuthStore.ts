'use client';

class AuthStoreClass {
    setUser(username: string) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('username', username);
        }
    }

    removeUser() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('username');
        }
    }

    getUsername(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('username');
        }
        return null;
    }

    clear() {
        this.removeUser();
    }
}

export const AuthStore = new AuthStoreClass();
