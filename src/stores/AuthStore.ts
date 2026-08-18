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
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('has_seen_calendar_popup');
        }
    }
}

export const AuthStore = new AuthStoreClass();
