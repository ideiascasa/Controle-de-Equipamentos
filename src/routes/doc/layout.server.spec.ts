import { describe, expect, it, beforeEach, vi } from 'vitest';

const mockGetRequestEvent = vi.hoisted(() => vi.fn());

vi.mock('$app/server', () => ({
	getRequestEvent: mockGetRequestEvent
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

import { load } from './+layout.server';

describe('doc layout load', () => {
	beforeEach(() => {
		mockGetRequestEvent.mockReset();
		redirectMock.mockClear();
	});

	it('should redirect to login when user missing', async () => {
		mockGetRequestEvent.mockReturnValue({ locals: { user: null } });

		await expect(load()).rejects.toMatchObject({ location: '/user/login', status: 302 });
		expect(redirectMock).toHaveBeenCalledWith(302, '/user/login');
	});

	it('should return locals and empty menu when user present', async () => {
		const locals = { user: { id: '1' }, session: {}, groups: [] };
		mockGetRequestEvent.mockReturnValue({ locals });

		const result = await load();

		expect(result).toEqual({
			user: locals.user,
			session: locals.session,
			groups: locals.groups,
			menu: []
		});
	});
});
