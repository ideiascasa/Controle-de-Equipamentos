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
const getActiveGroupsWithStatsMock = vi.hoisted(() => vi.fn());
const createSystemGroupMock = vi.hoisted(() => vi.fn());
const deleteSystemGroupMock = vi.hoisted(() => vi.fn());

vi.mock('./utils.server', () => ({
	getUsersInGroup: getUsersInGroupMock,
	addUserToGroup: addUserToGroupUtilMock,
	getActiveGroupsWithStats: getActiveGroupsWithStatsMock,
	createSystemGroup: createSystemGroupMock,
	deleteSystemGroup: deleteSystemGroupMock
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

function createActionEvent(
	form: Record<string, string | null>,
	localsOverrides: Partial<typeof defaultLocals> = {}
) {
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
		getActiveGroupsWithStatsMock.mockReset();
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
		expect(result.isSystemUser).toBe(false);
		expect(result.menu).toEqual([]);
		expect(result.allUsers).toEqual([]);
		expect(result.groupMemberships).toEqual({});
		expect(result.systemGroups).toEqual([]);
		expect(getActiveGroupsWithStatsMock).not.toHaveBeenCalled();
	});

	it('loads admin context with users and memberships', async () => {
		getRequestEventMock.mockReturnValue({
			locals: defaultLocals
		});
		selectResponses.push([
			{ id: 'user-1', username: 'user1', name: 'User 1' },
			{ id: 'user-2', username: 'user2', name: 'User 2' }
		]);
		getUsersInGroupMock.mockResolvedValueOnce([
			{ id: 'user-3', username: 'member', name: null, isAdmin: false }
		]);

		const result = await load();

		expect(result.isAdministrator).toBe(true);
		expect(result.isSystemUser).toBe(false);
		expect(result.allUsers).toHaveLength(2);
		expect(getUsersInGroupMock).toHaveBeenCalledWith(expect.anything(), 'group-1');
		expect(result.groupMemberships['group-1']).toEqual([
			{ id: 'user-3', username: 'member', name: null, isAdmin: false }
		]);
		expect(result.systemGroups).toEqual([]);
		expect(getActiveGroupsWithStatsMock).not.toHaveBeenCalled();
	});

	it('loads system user groups when user id is 1', async () => {
		getRequestEventMock.mockReturnValue({
			locals: {
				...defaultLocals,
				user: { id: '1' }
			}
		});
		getActiveGroupsWithStatsMock.mockResolvedValue([{ id: 'g1' }]);

		const result = await load();

		expect(result.isSystemUser).toBe(true);
		expect(getActiveGroupsWithStatsMock).toHaveBeenCalled();
		expect(result.systemGroups).toEqual([{ id: 'g1' }]);
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
		const result = await actions.logout?.({
			locals: { ...defaultLocals, session: null }
		} as any);

		expect(result).toEqual({ status: 401, data: { action: 'logout' } });
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
		createSystemGroupMock.mockReset();
		deleteSystemGroupMock.mockReset();
	});

	it('requires authentication', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-1' },
				{ user: null, groups: null }
			) as any
		);

		expect(result).toEqual({
			status: 401,
			data: { action: 'addUserToGroup', message: 'UNAUTHORIZED' }
		});
	});

	it('requires administrator role', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-1' },
				{ groups: [{ groupId: 'group-1', isAdmin: false }], user: { id: 'user-1' } }
			) as any
		);

		expect(result).toEqual({
			status: 403,
			data: { action: 'addUserToGroup', message: 'NOT_ADMINISTRATOR' }
		});
	});

	it('validates userId input', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: null, groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			status: 400,
			data: { action: 'addUserToGroup', message: 'INVALID_USER_ID' }
		});
	});

	it('validates groupId input', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target-1', groupId: null }) as any
		);

		expect(result).toEqual({
			status: 400,
			data: { action: 'addUserToGroup', message: 'GROUP_NOT_SELECTED' }
		});
	});

	it('requires admin rights on selected group', async () => {
		const result = await actions.addUserToGroup?.(
			createActionEvent(
				{ userId: 'target-1', groupId: 'group-2' },
				{ user: { id: 'user-1' }, groups: [{ groupId: 'group-1', isAdmin: true }] }
			) as any
		);

		expect(result).toEqual({
			status: 403,
			data: { action: 'addUserToGroup', message: 'NO_ADMIN_RIGHTS_ON_GROUP' }
		});
	});

	it('fails when target user not found', async () => {
		selectResponses.push([]);
		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'missing', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			status: 404,
			data: { action: 'addUserToGroup', message: 'USER_NOT_FOUND' }
		});
	});

	it('fails when group not found', async () => {
		selectResponses.push([{ id: 'existing-user' }]);
		selectResponses.push([]);

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			status: 404,
			data: { action: 'addUserToGroup', message: 'GROUP_NOT_FOUND' }
		});
	});

	it('handles duplicate membership gracefully', async () => {
		selectResponses.push([{ id: 'existing-user' }], [{ id: 'group-1' }]);
		addUserToGroupUtilMock.mockResolvedValue({ success: false, error: 'USER_ALREADY_IN_GROUP' });

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			status: 400,
			data: { action: 'addUserToGroup', message: 'USER_ALREADY_IN_GROUP' }
		});
	});

	it('returns success message when user added', async () => {
		selectResponses.push([{ id: 'existing-user' }], [{ id: 'group-1' }]);
		addUserToGroupUtilMock.mockResolvedValue({ success: true });

		const result = await actions.addUserToGroup?.(
			createActionEvent({ userId: 'target', groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			action: 'addUserToGroup',
			success: true,
			message: 'USER_ADDED_SUCCESSFULLY'
		});
	});
});

describe('profile actions createSystemGroup', () => {
	beforeEach(() => {
		failMock.mockClear();
		createSystemGroupMock.mockReset();
	});

	it('requires system user id', async () => {
		const result = await actions.createSystemGroup?.(
			createActionEvent({ name: 'Alpha', description: '' }) as any
		);

		expect(result).toEqual({
			status: 403,
			data: { action: 'createSystemGroup', message: 'SYSTEM_USER_ONLY' }
		});
	});

	it('propagates validation errors', async () => {
		createSystemGroupMock.mockResolvedValue({ success: false, error: 'GROUP_NAME_REQUIRED' });

		const result = await actions.createSystemGroup?.(
			createActionEvent(
				{ name: '', description: '' },
				{ user: { id: '1' }, groups: [], session: { id: 'session' } }
			) as any
		);

		expect(createSystemGroupMock).toHaveBeenCalled();
		expect(result).toEqual({
			status: 400,
			data: { action: 'createSystemGroup', message: 'GROUP_NAME_REQUIRED' }
		});
	});

	it('returns server error for unexpected failures', async () => {
		createSystemGroupMock.mockResolvedValue({ success: false, error: 'GROUP_CREATE_FAILED' });

		const result = await actions.createSystemGroup?.(
			createActionEvent(
				{ name: 'Alpha', description: '' },
				{ user: { id: '1' }, groups: [], session: { id: 'session' } }
			) as any
		);

		expect(result).toEqual({
			status: 500,
			data: { action: 'createSystemGroup', message: 'GROUP_CREATE_FAILED' }
		});
	});

	it('returns success payload when group created', async () => {
		createSystemGroupMock.mockResolvedValue({
			success: true,
			group: { id: 'group-1' }
		});

		const result = await actions.createSystemGroup?.(
			createActionEvent(
				{ name: 'Alpha', description: 'Core' },
				{ user: { id: '1' }, groups: [], session: { id: 'session' } }
			) as any
		);

		expect(result).toEqual({
			action: 'createSystemGroup',
			success: true,
			message: 'GROUP_CREATED_SUCCESS',
			group: { id: 'group-1' }
		});
	});
});

describe('profile actions deleteSystemGroup', () => {
	beforeEach(() => {
		failMock.mockClear();
		deleteSystemGroupMock.mockReset();
	});

	it('requires system user id', async () => {
		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: 'group-1' }) as any
		);

		expect(result).toEqual({
			status: 403,
			data: { action: 'deleteSystemGroup', message: 'SYSTEM_USER_ONLY' }
		});
	});

	it('validates group id', async () => {
		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: null }, { user: { id: '1' } }) as any
		);

		expect(result).toEqual({
			status: 400,
			data: { action: 'deleteSystemGroup', message: 'GROUP_NOT_FOUND' }
		});
	});

	it('propagates not found', async () => {
		deleteSystemGroupMock.mockResolvedValue({ success: false, error: 'GROUP_NOT_FOUND' });

		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: 'missing' }, { user: { id: '1' } }) as any
		);

		expect(result).toEqual({
			status: 404,
			data: { action: 'deleteSystemGroup', message: 'GROUP_NOT_FOUND' }
		});
	});

	it('returns conflict when members exist', async () => {
		deleteSystemGroupMock.mockResolvedValue({ success: false, error: 'GROUP_HAS_MEMBERS' });

		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: 'group-1' }, { user: { id: '1' } }) as any
		);

		expect(result).toEqual({
			status: 409,
			data: { action: 'deleteSystemGroup', message: 'GROUP_HAS_MEMBERS' }
		});
	});

	it('handles generic errors', async () => {
		deleteSystemGroupMock.mockResolvedValue({ success: false, error: 'UNKNOWN_ERROR' });

		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: 'group-1' }, { user: { id: '1' } }) as any
		);

		expect(result).toEqual({
			status: 500,
			data: { action: 'deleteSystemGroup', message: 'UNKNOWN_ERROR' }
		});
	});

	it('returns success payload', async () => {
		deleteSystemGroupMock.mockResolvedValue({ success: true });

		const result = await actions.deleteSystemGroup?.(
			createActionEvent({ groupId: 'group-1' }, { user: { id: '1' } }) as any
		);

		expect(result).toEqual({
			action: 'deleteSystemGroup',
			success: true,
			message: 'GROUP_DELETED_SUCCESS'
		});
	});
});
