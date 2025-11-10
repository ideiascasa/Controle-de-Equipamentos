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

const failMock = vi.hoisted(() => vi.fn((status: number, data?: unknown) => ({ status, data })));

vi.mock('@sveltejs/kit', () => ({
	redirect: redirectMock,
	fail: failMock
}));

const authMocks = vi.hoisted(() => ({
	invalidateSession: vi.fn(),
	deleteSessionTokenCookie: vi.fn()
}));

vi.mock('$lib/utils/auth', () => authMocks);

const getUsersInGroupMock = vi.hoisted(() => vi.fn());
const addUserToGroupUtilMock = vi.hoisted(() => vi.fn());

vi.mock('./utils.server', () => ({
	getUsersInGroup: getUsersInGroupMock,
	addUserToGroup: addUserToGroupUtilMock
}));

const selectResponses: any[] = [];

function createSelectBuilder(response: any[] = []) {
	const finalPromise = Promise.resolve(response);
	const whereResult = {
		limit: vi.fn(() => finalPromise),
		then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
			finalPromise.then(resolve, reject)
	};

	const fromResult = {
		where: vi.fn(() => whereResult),
		limit: vi.fn(() => finalPromise),
		then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
			finalPromise.then(resolve, reject)
	};

	return {
		from: vi.fn(() => fromResult)
	};
}

const selectMock = vi.hoisted(() => vi.fn(() => createSelectBuilder(selectResponses.shift())));

vi.mock('$lib/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load, actions } from './+page.server';

function createActionEvent(form: Record<string, string | null>, localsOverrides: Partial<typeof defaultLocals> = {}) {
	return {
		request: {
			formData: async () => new Map(Object.entries(form))
		},
		locals: {
			...defaultLocals,
			...localsOverrides
		}
	};
}

const defaultLocals = {
	user: { id: 'user-1' },
	session: { id: 'session-1' },
	groups: [
		{
			groupId: 'group-1',
			isAdmin: true
		}
	]
};

describe('profile page load', () => {
	beforeEach(() => {
		getRequestEventMock.mockReset();
		redirectMock.mockClear();
		selectResponses.length = 0;
		selectMock.mockClear();
		getUsersInGroupMock.mockReset();
		failMock.mockClear();
	});

	it('redirects unauthenticated users', async () => {
		getRequestEventMock.mockReturnValue({ locals: { user: null } });

		await expect(load()).rejects.toMatchObject({ location: '/user/login', status: 302 });
		expect(redirectMock).toHaveBeenCalledWith(302, '/user/login');
	});

	it('returns base context for non-administrator', async () => {
		getRequestEventMock.mockReturnValue({
			locals: {
				user: { id: 'user-2' },
				session: { id: 'session-2' },
				groups: [{ groupId: 'group-2', isAdmin: false }]
			}
		});

		const result = await load();

		expect(result.isAdministrator).toBe(false);
		expect(result.menu).toEqual([]);
		expect(result.allUsers).toEqual([]);
		expect(result.groupMemberships).toEqual({});
	});

	it('loads admin context with users and memberships', async () => {
		getRequestEventMock.mockReturnValue({
			locals: defaultLocals
		});
		selectResponses.push([
			{ id: 'user-1', username: 'user1', name: 'User 1' },
			{ id: 'user-2', username: 'user2', name: 'User 2' }
		]);
		getUsersInGroupMock.mockResolvedValueOnce([{ id: 'user-3', username: 'member', name: null, isAdmin: false }]);

		const result = await load();

		expect(result.isAdministrator).toBe(true);
		expect(result.allUsers).toHaveLength(2);
		expect(getUsersInGroupMock).toHaveBeenCalledWith(expect.anything(), 'group-1');
		expect(result.groupMemberships['group-1']).toEqual([
			{ id: 'user-3', username: 'member', name: null, isAdmin: false }
		]);
	});
});

describe('profile actions logout', () => {
	beforeEach(() => {
		failMock.mockClear();
		redirectMock.mockClear();
		authMocks.invalidateSession.mockClear();
		authMocks.deleteSessionTokenCookie.mockClear();
	});

	it('returns 401 when session missing', async () => {
		const result = await actions.logout?.(
			{
				locals: { ...defaultLocals, session: null }
			} as any
		);

		expect(result).toEqual({ status: 401, data: undefined });
	});

	it('invalidates session and redirects on logout', async () => {
		await expect(
			actions.logout?.({
				locals: defaultLocals
			} as any) as Promise<unknown>
		).rejects.toMatchObject({ location: '/', status: 302 });

		expect(authMocks.invalidateSession).toHaveBeenCalledWith('session-1');
		expect(authMocks.deleteSessionTokenCookie).toHaveBeenCalled();
	});
});

describe('profile actions addUserToGroup', () => {
	beforeEach(() => {
		failMock.mockClear();
		redirectMock.mockClear();
		selectResponses.length = 0;
		selectMock.mockClear();
		addUserToGroupUtilMock.mockReset();
	});

	it('requires authentication', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-1' },
				{ user: null, groups: null }
			) as any
		);

		expect(result).toEqual({ status: 401, data: { message: 'UNAUTHORIZED' } });
	});

	it('requires administrator role', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-1' },
				{ groups: [{ groupId: 'group-1', isAdmin: false }], user: { id: 'user-1' } }
			) as any
		);

		expect(result).toEqual({ status: 403, data: { message: 'NOT_ADMINISTRATOR' } });
	});

	it('validates userId input', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: null, groupId: 'group-1' }) as any
		);

		expect(result).toEqual({ status: 400, data: { message: 'INVALID_USER_ID' } });
	});

	it('validates groupId input', async () => {
		const result = await actions.addUserToGroup?.(createActionEvent({ userId: 'target-1', groupId: null }) as any);

		expect(result).toEqual({ status: 400, data: { message: 'GROUP_NOT_SELECTED' } });
	});

	it('requires admin rights on selected group', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-2' },
				{ user: { id: 'user-1' }, groups: [{ groupId: 'group-1', isAdmin: true }] }
			) as any
		);

		expect(result).toEqual({ status: 403, data: { message: 'NO_ADMIN_RIGHTS_ON_GROUP' } });
	});

	it('fails when target user not found', async () => {
		selectResponses.push([]);
		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'missing', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({ status: 404, data: { message: 'USER_NOT_FOUND' } });
	});

	it('fails when group not found', async () => {
		selectResponses.push([{ id: 'existing-user' }]);
		selectResponses.push([]);

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({ status: 404, data: { message: 'GROUP_NOT_FOUND' } });
	});

	it('handles duplicate membership gracefully', async () => {
		selectResponses.push([{ id: 'existing-user' }], [{ id: 'group-1' }]);
		addUserToGroupUtilMock.mockResolvedValue({ success: false, error: 'USER_ALREADY_IN_GROUP' });

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({ status: 400, data: { message: 'USER_ALREADY_IN_GROUP' } });
	});

	it('returns success message when user added', async () => {
		selectResponses.push([{ id: 'existing-user' }], [{ id: 'group-1' }]);
		addUserToGroupUtilMock.mockResolvedValue({ success: true });

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({ success: true, message: 'USER_ADDED_SUCCESSFULLY' });
	});
});
