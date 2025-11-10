import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
	addUserToGroup,
	getUsersInGroup,
	getActiveGroupsWithStats,
	createSystemGroup,
	deleteSystemGroup
} from './utils.server';
import * as schema from '$lib/db/schema';

vi.mock('$lib/db/schema', async () => {
	const actual = await vi.importActual<typeof import('$lib/db/schema')>('$lib/db/schema');
	return actual;
});

vi.mock('crypto', () => ({
	randomUUID: vi.fn()
}));

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
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
			adm: false
		});
		expect(result).toEqual({ success: true });
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
	it('maps query results into summaries', async () => {
		const rows = [
			{
				id: 'group-1',
				name: 'Ops',
				description: null,
				membersCount: 2,
				createdAt: new Date('2024-01-10T00:00:00.000Z')
			}
		];

		const orderByMock = vi.fn().mockResolvedValue(rows);
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
		expect(leftJoinMock).toHaveBeenCalledWith(schema.relGroup, expect.anything());
		expect(result).toEqual([
			{
				id: 'group-1',
				name: 'Ops',
				description: null,
				membersCount: 2,
				createdAt: '2024-01-10T00:00:00.000Z'
			}
		]);
	});
});

describe('createSystemGroup', () => {
	it('creates group, audit log and returns summary', async () => {
		vi.useFakeTimers();
		const fixedDate = new Date('2024-02-01T00:00:00.000Z');
		vi.setSystemTime(fixedDate);

		const randomUUIDMock = vi.mocked(randomUUID);
		randomUUIDMock
			.mockReturnValueOnce('group-uuid')
			.mockReturnValueOnce('audit-uuid');

		const insertedGroups: any[] = [];
		const insertedAudits: any[] = [];

		const groupByMock = vi.fn().mockResolvedValue([
			{
				id: 'group-uuid',
				name: 'Ops',
				description: 'System group',
				membersCount: 0,
				createdAt: fixedDate
			}
		]);

		const tx = {
			insert: vi.fn((table) => ({
				values: vi.fn((value) => {
					if (table === schema.group) {
						insertedGroups.push(value);
					} else if (table === schema.groupAuditLog) {
						insertedAudits.push(value);
					}
					return Promise.resolve();
				})
			})),
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							groupBy: groupByMock
						}))
					}))
				}))
			}))
		};

		const db = {
			transaction: vi.fn(async (handler) => handler(tx as any))
		} as any;

		const result = await createSystemGroup(
			db,
			{ name: 'Ops', description: 'System group' },
			'user-1'
		);

		expect(db.transaction).toHaveBeenCalled();
		expect(insertedGroups[0]).toMatchObject({
			id: 'group-uuid',
			name: 'Ops',
			description: 'System group',
			createdById: 'user-1'
		});
		expect(insertedAudits[0]).toMatchObject({
			id: 'audit-uuid',
			groupId: 'group-uuid',
			action: 'created',
			performedById: 'user-1'
		});
		expect(result).toEqual({
			success: true,
			group: {
				id: 'group-uuid',
				name: 'Ops',
				description: 'System group',
				membersCount: 0,
				createdAt: fixedDate.toISOString()
			}
		});

		randomUUIDMock.mockReset();
	});

	it('returns validation error before hitting database', async () => {
		const db = {
			transaction: vi.fn()
		} as any;

		const result = await createSystemGroup(db, { description: 'Missing name' }, 'user-1');

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_REQUIRED' });
		expect(db.transaction).not.toHaveBeenCalled();
	});

	it('propagates database errors', async () => {
		const db = {
			transaction: vi.fn(async () => {
				throw new Error('db failure');
			})
		} as any;

		const result = await createSystemGroup(db, { name: 'Ops' }, 'user-1');

		expect(result).toEqual({ success: false, error: 'DATABASE_ERROR' });
	});
});

describe('deleteSystemGroup', () => {
	it('soft deletes group without members', async () => {
		vi.useFakeTimers();
		const fixedDate = new Date('2024-03-01T00:00:00.000Z');
		vi.setSystemTime(fixedDate);

		const updateSetMock = vi.fn().mockResolvedValue(undefined);
		const updateMock = vi.fn(() => ({
			set: (values: any) => {
				updateSetMock(values);
				return { where: vi.fn().mockResolvedValue(undefined) };
			}
		}));

		const auditInsertMock = vi.fn().mockResolvedValue(undefined);

		const tx = {
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					if (table === schema.group) {
						return {
							where: vi.fn(() => ({
								limit: vi.fn().mockResolvedValue([{ id: 'group-uuid', deletedAt: null }])
							}))
						};
					}
					// rel_group
					return {
						where: vi.fn().mockResolvedValue([{ membersCount: 0 }])
					};
				})
			})),
			update: updateMock,
			insert: vi.fn((table) => ({
				values: vi.fn((value) => {
					if (table === schema.groupAuditLog) {
						auditInsertMock(value);
					}
					return Promise.resolve();
				})
			}))
		};

		const db = {
			transaction: vi.fn(async (handler) => handler(tx as any))
		} as any;

		const result = await deleteSystemGroup(db, 'group-uuid', 'user-1');

		expect(result).toEqual({ success: true });
		expect(updateSetMock).toHaveBeenCalledWith({
			deletedAt: fixedDate,
			deletedById: 'user-1'
		});
		expect(auditInsertMock).toHaveBeenCalledWith(
			expect.objectContaining({
				groupId: 'group-uuid',
				action: 'deleted',
				performedById: 'user-1'
			})
		);
	});

	it('returns error when group is not found', async () => {
		const tx = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn().mockResolvedValue([])
					}))
				}))
			}))
		};

		const db = {
			transaction: vi.fn(async (handler) => handler(tx as any))
		} as any;

		const result = await deleteSystemGroup(db, 'missing', 'user-1');

		expect(result).toEqual({ success: false, error: 'GROUP_NOT_FOUND' });
	});

	it('returns error when group still has members', async () => {
		const tx = {
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					if (table === schema.group) {
						return {
							where: vi.fn(() => ({
								limit: vi.fn().mockResolvedValue([{ id: 'group-uuid', deletedAt: null }])
							}))
						};
					}
					return {
						where: vi.fn().mockResolvedValue([{ membersCount: 5 }])
					};
				})
			}))
		};

		const db = {
			transaction: vi.fn(async (handler) => handler(tx as any))
		} as any;

		const result = await deleteSystemGroup(db, 'group-uuid', 'user-1');

		expect(result).toEqual({ success: false, error: 'GROUP_HAS_MEMBERS' });
	});

	it('propagates database errors', async () => {
		const db = {
			transaction: vi.fn(async () => {
				throw new Error('db failure');
			})
		} as any;

		const result = await deleteSystemGroup(db, 'group-uuid', 'user-1');

		expect(result).toEqual({ success: false, error: 'DATABASE_ERROR' });
	});
});
