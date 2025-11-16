import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest';
import {
	addUserToGroup,
	getUsersInGroup,
	getActiveGroupsWithStats,
	createSystemGroup,
	deleteSystemGroup
} from './utils.server';
import * as schema from '$lib/db/schema';

const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID');

beforeEach(() => {
	uuidSpy.mockReset();
});

afterAll(() => {
	uuidSpy.mockRestore();
});

vi.mock('$lib/db/schema', async () => {
	const actual = await vi.importActual<typeof import('$lib/db/schema')>('$lib/db/schema');
	return actual;
});

describe('addUserToGroup', () => {
	it('inserts relation when none exists', async () => {
		const whereMock = vi.fn().mockResolvedValue([]);
		const valuesMock = vi.fn().mockResolvedValue(undefined);
		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: whereMock
				}))
			})),
			insert: vi.fn(() => ({
				values: valuesMock
			}))
		} as any;

		const result = await addUserToGroup(db, 'group-1', 'user-1');

		expect(whereMock).toHaveBeenCalled();
		expect(valuesMock).toHaveBeenCalledWith({
			groupId: 'group-1',
			userId: 'user-1',
			adm: false,
			createdById: undefined
		});
		expect(result).toEqual({ success: true });
	});

	it('stores creator id when provided', async () => {
		const whereMock = vi.fn().mockResolvedValue([]);
		const valuesMock = vi.fn().mockResolvedValue(undefined);
		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: whereMock
				}))
			})),
			insert: vi.fn(() => ({
				values: valuesMock
			}))
		} as any;

		await addUserToGroup(db, 'group-1', 'user-1', 'actor-9');

		expect(valuesMock).toHaveBeenCalledWith({
			groupId: 'group-1',
			userId: 'user-1',
			adm: false,
			createdById: 'actor-9'
		});
	});

	it('returns error when relation already exists', async () => {
		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([{}])
				}))
			})),
			insert: vi.fn()
		} as any;

		const result = await addUserToGroup(db, 'group-1', 'user-1');

		expect(result).toEqual({ success: false, error: 'USER_ALREADY_IN_GROUP' });
	});

	it('returns specific error for duplicate key violation', async () => {
		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([])
				}))
			})),
			insert: vi.fn(() => ({
				values: vi.fn(async () => {
					const err = new Error('duplicate') as Error & { code?: string };
					err.code = '23505';
					throw err;
				})
			}))
		} as any;

		const result = await addUserToGroup(db, 'group-1', 'user-1');

		expect(result).toEqual({ success: false, error: 'USER_ALREADY_IN_GROUP' });
	});

	it('returns database error for other exceptions', async () => {
		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([])
				}))
			})),
			insert: vi.fn(() => ({
				values: vi.fn(async () => {
					throw new Error('unexpected');
				})
			}))
		} as any;

		const result = await addUserToGroup(db, 'group-1', 'user-1');

		expect(result).toEqual({ success: false, error: 'DATABASE_ERROR' });
	});
});

describe('getUsersInGroup', () => {
	it('maps database results to expected shape', async () => {
		const records = [
			{ id: '1', username: 'user1', name: 'User 1', isAdmin: true },
			{ id: '2', username: 'user2', name: null, isAdmin: null }
		];

		const whereMock = vi.fn().mockResolvedValue(records);
		const innerJoinMock = vi.fn(() => ({
			where: whereMock
		}));

		const db = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					innerJoin: innerJoinMock
				}))
			}))
		} as any;

		const result = await getUsersInGroup(db, 'group-1');

		expect(innerJoinMock).toHaveBeenCalledWith(schema.user, expect.anything());
		expect(whereMock).toHaveBeenCalled();
		expect(result).toEqual([
			{ id: '1', username: 'user1', name: 'User 1', isAdmin: true },
			{ id: '2', username: 'user2', name: null, isAdmin: false }
		]);
	});
});

describe('getActiveGroupsWithStats', () => {
	it('returns formatted summaries', async () => {
		const orderByMock = vi.fn().mockResolvedValue([
			{
				id: 'group-1',
				name: 'Alpha',
				description: 'desc',
				membersCount: 2,
				createdAt: new Date('2024-01-02T03:00:00Z')
			}
		]);
		const groupByMock = vi.fn(() => ({ orderBy: orderByMock }));
		const whereMock = vi.fn(() => ({ groupBy: groupByMock }));
		const leftJoinMock = vi.fn(() => ({ where: whereMock }));
		const fromMock = vi.fn(() => ({ leftJoin: leftJoinMock }));
		const selectMock = vi.fn(() => ({ from: fromMock }));

		const db = {
			select: selectMock
		} as any;

		const result = await getActiveGroupsWithStats(db);

		expect(selectMock).toHaveBeenCalled();
		expect(leftJoinMock).toHaveBeenCalled();
		expect(groupByMock).toHaveBeenCalled();
		expect(orderByMock).toHaveBeenCalled();
		expect(result).toEqual([
			{
				id: 'group-1',
				name: 'Alpha',
				description: 'desc',
				membersCount: 2,
				createdAt: '2024-01-02T03:00:00.000Z'
			}
		]);
	});
});

describe('createSystemGroup', () => {
	it('validates input', async () => {
		const db = {
			insert: vi.fn()
		} as any;

		const result = await createSystemGroup(db, { name: '', description: '' }, 'actor-1');

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_REQUIRED' });
		expect(db.insert).not.toHaveBeenCalled();
	});

	it('creates group and audit log', async () => {
		uuidSpy.mockReturnValueOnce('group-id').mockReturnValueOnce('audit-id');

		const returningMock = vi
			.fn()
			.mockResolvedValue([
				{
					id: 'group-id',
					name: 'Alpha',
					description: null,
					createdAt: new Date('2024-01-02T03:00:00Z')
				}
			]);
		const groupValuesMock = vi.fn(() => ({
			returning: returningMock
		}));
		const auditValuesMock = vi.fn().mockResolvedValue(undefined);
		const insertMock = vi
			.fn()
			.mockReturnValueOnce({ values: groupValuesMock })
			.mockReturnValueOnce({ values: auditValuesMock });

		const db = {
			insert: insertMock
		} as any;

		const result = await createSystemGroup(
			db,
			{
				name: 'Alpha',
				description: ''
			},
			'actor-1'
		);

		expect(result.success).toBe(true);
		expect(result.group).toMatchObject({
			id: 'group-id',
			name: 'Alpha',
			description: null,
			membersCount: 0,
			createdAt: '2024-01-02T03:00:00.000Z'
		});
		expect(groupValuesMock).toHaveBeenCalledWith({
			id: 'group-id',
			name: 'Alpha',
			description: null,
			createdById: 'actor-1'
		});
		expect(auditValuesMock).toHaveBeenCalledWith({
			id: 'audit-id',
			groupId: 'group-id',
			action: 'create',
			performedById: 'actor-1',
			payload: { name: 'Alpha' }
		});
	});

	it('returns failure when insert throws', async () => {
		uuidSpy.mockReturnValueOnce('group-id');
		const groupValuesMock = vi.fn(() => ({
			returning: vi.fn().mockRejectedValue(new Error('boom'))
		}));
		const insertMock = vi.fn().mockReturnValueOnce({ values: groupValuesMock });
		const db = { insert: insertMock } as any;

		const result = await createSystemGroup(
			db,
			{
				name: 'Alpha',
				description: 'desc'
			},
			'actor-2'
		);

		expect(result).toEqual({ success: false, error: 'GROUP_CREATE_FAILED' });
	});
});

describe('deleteSystemGroup', () => {
	it('requires group id', async () => {
		const db = {
			transaction: vi.fn()
		} as any;

		const result = await deleteSystemGroup(db, '', 'actor-1');

		expect(result).toEqual({ success: false, error: 'GROUP_NOT_FOUND' });
		expect(db.transaction).not.toHaveBeenCalled();
	});

	it('returns not found when group missing', async () => {
		const selectGroupLimit = vi.fn().mockResolvedValue([]);
		const selectGroupWhere = vi.fn(() => ({ limit: selectGroupLimit }));
		const selectGroupFrom = vi.fn(() => ({ where: selectGroupWhere }));
		const txSelect = vi.fn().mockReturnValueOnce({ from: selectGroupFrom });

		const tx = {
			select: txSelect
		};

		const db = {
			transaction: vi.fn(async (callback) => callback(tx))
		} as any;

		const result = await deleteSystemGroup(db, 'group-1', 'actor-1');

		expect(result).toEqual({ success: false, error: 'GROUP_NOT_FOUND' });
	});

	it('blocks deletion when members exist', async () => {
		const selectGroupLimit = vi.fn().mockResolvedValue([{ id: 'group-1', name: 'Alpha' }]);
		const selectGroupWhere = vi.fn(() => ({ limit: selectGroupLimit }));
		const selectGroupFrom = vi.fn(() => ({ where: selectGroupWhere }));
		const selectMembersWhere = vi.fn().mockResolvedValue([{ total: 2 }]);
		const selectMembersFrom = vi.fn(() => ({ where: selectMembersWhere }));

		const txSelect = vi
			.fn()
			.mockReturnValueOnce({ from: selectGroupFrom })
			.mockReturnValueOnce({ from: selectMembersFrom });

		const tx = {
			select: txSelect
		};

		const db = {
			transaction: vi.fn(async (callback) => callback(tx))
		} as any;

		const result = await deleteSystemGroup(db, 'group-1', 'actor-1');

		expect(result).toEqual({ success: false, error: 'GROUP_HAS_MEMBERS' });
	});

	it('soft deletes group and writes audit log', async () => {
		uuidSpy.mockReturnValueOnce('audit-id-2');

		const selectGroupLimit = vi.fn().mockResolvedValue([{ id: 'group-1', name: 'Alpha' }]);
		const selectGroupWhere = vi.fn(() => ({ limit: selectGroupLimit }));
		const selectGroupFrom = vi.fn(() => ({ where: selectGroupWhere }));
		const selectMembersWhere = vi.fn().mockResolvedValue([{ total: 0 }]);
		const selectMembersFrom = vi.fn(() => ({ where: selectMembersWhere }));

		const txSelect = vi
			.fn()
			.mockReturnValueOnce({ from: selectGroupFrom })
			.mockReturnValueOnce({ from: selectMembersFrom });

		const updateWhere = vi.fn().mockResolvedValue(undefined);
		const updateSet = vi.fn(() => ({ where: updateWhere }));
		const txUpdate = vi.fn(() => ({ set: updateSet }));

		const auditValues = vi.fn().mockResolvedValue(undefined);
		const txInsert = vi.fn(() => ({ values: auditValues }));

		const tx = {
			select: txSelect,
			update: txUpdate,
			insert: txInsert
		};

		const db = {
			transaction: vi.fn(async (callback) => callback(tx))
		} as any;

		const result = await deleteSystemGroup(db, 'group-1', 'actor-9');

		expect(result).toEqual({ success: true });
		expect(updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				deletedById: 'actor-9'
			})
		);
		expect(auditValues).toHaveBeenCalledWith({
			id: 'audit-id-2',
			groupId: 'group-1',
			action: 'delete',
			performedById: 'actor-9',
			payload: { previousName: 'Alpha' }
		});
	});
});
