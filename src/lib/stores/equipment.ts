import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type EquipmentFilterState = {
	search: string;
	status: string | null;
	locationId: string | null;
	category: string | null;
	criticality: string | null;
};

const STORAGE_KEY = 'equipmentFilters';

function loadInitialState(): EquipmentFilterState {
	if (!browser) {
		return {
			search: '',
			status: null,
			locationId: null,
			category: null,
			criticality: null
		};
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<EquipmentFilterState>;
			return {
				search: parsed.search ?? '',
				status: parsed.status ?? null,
				locationId: parsed.locationId ?? null,
				category: parsed.category ?? null,
				criticality: parsed.criticality ?? null
			};
		}
	} catch {
		// Ignore storage errors and fall back to defaults
	}

	return {
		search: '',
		status: null,
		locationId: null,
		category: null,
		criticality: null
	};
}

function createEquipmentFilterStore() {
	const { subscribe, set, update } = writable<EquipmentFilterState>(loadInitialState());

	return {
		subscribe,
		set: (value: EquipmentFilterState) => {
			set(value);
			if (browser) {
				try {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
				} catch {
					// Ignore storage errors
				}
			}
		},
		update: (updater: (state: EquipmentFilterState) => EquipmentFilterState) => {
			update((state) => {
				const next = updater(state);
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
					} catch {
						// Ignore storage errors
					}
				}
				return next;
			});
		},
		reset: () => {
			const initial = loadInitialState();
			set(initial);
			if (browser) {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch {
					// Ignore storage errors
				}
			}
		}
	};
}

export const equipmentFilters = createEquipmentFilterStore();
