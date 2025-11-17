import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRequestEventMock = vi.hoisted(() => vi.fn());
vi.mock('$app/server', () => ({
	getRequestEvent: getRequestEventMock
}));

const redirectMock = vi.hoisted(() =>
	vi.fn((status: number, location: string) => {
		const error = new Error('redirect') as Error & { status?: number; location?: string };
		error.status = status;
		error.location = location;
		throw error;
	})
);

vi.mock('@sveltejs/kit', () => ({
	redirect: redirectMock
}));

const getEquipmentListMock = vi.hoisted(() => vi.fn());

vi.mock('./utils.server', () => ({
	getEquipmentList: getEquipmentListMock
}));

import { load } from './+page.server';

describe('equipment page load', () => {
	beforeEach(() => {
		getRequestEventMock.mockReset();
		redirectMock.mockClear();
		getEquipmentListMock.mockReset();
	});

	it('redirects unauthenticated users', async () => {
		getRequestEventMock.mockReturnValue({ locals: { user: null } });

		await expect(load()).rejects.toMatchObject({ location: '/user/login', status: 302 });
		expect(redirectMock).toHaveBeenCalledWith(302, '/user/login');
	});

	it('loads equipment list for authenticated users', async () => {
		const mockEquipmentList = [
			{
				equipment: {
					id: 'eq-1',
					code: 'EQ001',
					name: 'Laptop',
					status: 'available'
				},
				currentLocation: { id: 'loc-1', name: 'Sala 101' },
				currentUser: { id: 'user-1', username: 'user1', name: 'User 1' }
			}
		];

		getRequestEventMock.mockReturnValue({
			locals: {
				user: { id: 'user-1' },
				session: { id: 'session-1' },
				groups: []
			}
		});

		getEquipmentListMock.mockResolvedValue(mockEquipmentList);

		const result = await load();

		expect(result.equipmentList).toEqual(mockEquipmentList);
		expect(getEquipmentListMock).toHaveBeenCalledWith(expect.anything(), 'user-1');
	});
});
