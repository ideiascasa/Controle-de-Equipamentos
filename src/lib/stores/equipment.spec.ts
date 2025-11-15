import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { EquipmentFilterState } from './equipment';

const STORAGE_KEY = 'equipmentFilters';

function createLocalStorage(initial: Record<string, string> = {}) {
	let store = { ...initial };
	return {
		getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		snapshot: () => ({ ...store })
	};
}

async function loadStore(browserValue: boolean, storageSeed?: EquipmentFilterState) {
	vi.resetModules();

	if (browserValue) {
		const payload = storageSeed ? JSON.stringify(storageSeed) : null;
		const localStorageMock = createLocalStorage(payload ? { [STORAGE_KEY]: payload } : {});
		Object.defineProperty(globalThis, 'localStorage', {
			value: localStorageMock,
			configurable: true
		});
		vi.doMock('$app/environment', () => ({ browser: true }));
		const module = await import('./equipment');
		return { storeModule: module, storage: localStorageMock };
	}

	vi.doMock('$app/environment', () => ({ browser: false }));
	const module = await import('./equipment');
	return { storeModule: module, storage: null };
}

describe('equipmentFilters store', () => {
	beforeEach(() => {
		vi.resetModules();
		if ('localStorage' in globalThis) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (globalThis as any).localStorage;
		}
	});

	it('returns default state when executando no server', async () => {
		const { storeModule } = await loadStore(false);
		const { equipmentFilters } = storeModule;
		let current;
		const unsubscribe = equipmentFilters.subscribe((value) => {
			current = value;
		});

		expect(current).toEqual({
			search: '',
			status: null,
			locationId: null,
			category: null,
			criticality: null
		});

		unsubscribe();
	});

	it('carrega estado armazenado quando browser for true', async () => {
		const seed: EquipmentFilterState = {
			search: 'notebook',
			status: 'ativo',
			locationId: 'matriz',
			category: 'Notebook',
			criticality: 'alta'
		};
		const { storeModule } = await loadStore(true, seed);
		const { equipmentFilters } = storeModule;
		let current;
		const unsubscribe = equipmentFilters.subscribe((value) => {
			current = value;
		});

		expect(current).toEqual(seed);

		unsubscribe();
	});

	it('persiste atualizacoes no localStorage', async () => {
		const { storeModule, storage } = await loadStore(true);
		const { equipmentFilters } = storeModule;

		const next: EquipmentFilterState = {
			search: 'servidor',
			status: 'em_manutencao',
			locationId: 'dc-a',
			category: 'Servidor',
			criticality: 'media'
		};

		equipmentFilters.set(next);

		expect(storage?.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(next));

		equipmentFilters.reset();

		expect(storage?.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});
});
