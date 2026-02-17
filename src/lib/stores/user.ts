import { writable } from 'svelte/store';

export type UserRole = 'guest' | 'landlord' | 'seller' | 'user';
export type ContactMethod = 'phone' | 'email' | 'whatsapp' | 'viber' | 'telegram';

export interface User {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	password?: string;
	contactPhone?: string;
	contactEmail?: string;
	contactWhatsapp?: string;
	contactViber?: string;
	contactTelegram?: string;
	preferredContactMethod?: ContactMethod;
	balance: number;
	role: UserRole;
}

function createUserStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	return {
		subscribe,
		register: (userData: Omit<User, 'role' | 'balance'>, role: UserRole) => {
			set({ ...userData, balance: 0, role });
		},
		setAsUser: () => {
			set({ role: 'user', balance: 0 });
		},
		clear: () => set(null),
		setRole: (role: UserRole) => {
			update((currentUser) => (currentUser ? { ...currentUser, role } : { role, balance: 0 }));
		},
		updateProfile: (profile: Omit<User, 'role' | 'balance'>) => {
			update((currentUser) => {
				if (!currentUser) return { ...profile, role: 'user', balance: 0 };
				return { ...currentUser, ...profile };
			});
		}
	};
}

export const user = createUserStore();
