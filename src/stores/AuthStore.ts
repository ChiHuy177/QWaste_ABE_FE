'use client';

class AuthStoreClass {
    setUser(username: string) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('username', username);
            this.clearCalendarAlarmState();
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

    clearCalendarAlarmState() {
        if (typeof window !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('has_seen_calendar_popup')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        }
    }

    clear() {
        this.removeUser();
        this.clearCalendarAlarmState();
    }
}

export const AuthStore = new AuthStoreClass();
