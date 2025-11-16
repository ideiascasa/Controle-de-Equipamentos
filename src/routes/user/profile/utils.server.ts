import { eq, and, isNull, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { validateGroupInput, toGroupSummary, type GroupSummary } from '$lib/utils/groups';

export async function addUserToGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string,
	userId: string,
	createdById?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// Check if the relation already exists
		const existingRelation = await db
			.select()
			.from(schema.relGroup)
			.where(and(eq(schema.relGroup.userId, userId), eq(schema.relGroup.groupId, groupId)));

		if (existingRelation.length > 0) {
			return { success: false, error: 'USER_ALREADY_IN_GROUP' };
		}

		// Insert the relation with adm: false (non-admin by default)
		await db.insert(schema.relGroup).values({
			groupId: groupId,
			userId: userId,
			adm: false,
			createdById: createdById
		});

		return { success: true };
	} catch (error) {
		// Handle duplicate key errors (composite primary key)
		if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
			return { success: false, error: 'USER_ALREADY_IN_GROUP' };
		}
		return { success: false, error: 'DATABASE_ERROR' };
	}
}

export async function getUsersInGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string
): Promise<{ id: string; username: string; name: string | null; isAdmin: boolean }[]> {
	const results = await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			name: schema.user.name,
			isAdmin: schema.relGroup.adm
		})
		.from(schema.relGroup)
		.innerJoin(schema.user, eq(schema.relGroup.userId, schema.user.id))
		.where(eq(schema.relGroup.groupId, groupId));

	return results.map((result) => ({
		id: result.id,
		username: result.username,
		name: result.name,
		isAdmin: result.isAdmin ?? false
	}));
}

export async function getActiveGroupsWithStats(
	db: PostgresJsDatabase<typeof schema>
): Promise<GroupSummary[]> {
	const rows = await db
		.select({
			id: schema.group.id,
			name: schema.group.name,
			description: schema.group.description,
			membersCount: count(schema.relGroup.userId).as('membersCount'),
			createdAt: schema.group.createdAt
		})
		.from(schema.group)
		.leftJoin(schema.relGroup, eq(schema.relGroup.groupId, schema.group.id))
		.where(isNull(schema.group.deletedAt))
		.groupBy(schema.group.id)
		.orderBy(schema.group.createdAt);

	return rows.map((row) => toGroupSummary(row));
}

export async function createSystemGroup(
	db: PostgresJsDatabase<typeof schema>,
	fields: Record<string, FormDataEntryValue | null>,
	actorId: string
): Promise<{ success: boolean; error?: string; group?: GroupSummary }> {
	const validated = validateGroupInput(fields);
	if (!validated.success) {
		return { success: false, error: validated.error };
	}

	const groupId = crypto.randomUUID();

	try {
		const [inserted] = await db
			.insert(schema.group)
			.values({
				id: groupId,
				name: validated.data.name,
				description: validated.data.description,
				createdById: actorId
			})
			.returning({
				id: schema.group.id,
				name: schema.group.name,
				description: schema.group.description,
				createdAt: schema.group.createdAt
			});

		await db.insert(schema.groupAuditLog).values({
			id: crypto.randomUUID(),
			groupId,
			action: 'create',
			performedById: actorId,
			payload: { name: validated.data.name }
		});

		return {
			success: true,
			group: toGroupSummary({
				...inserted,
				membersCount: 0
			})
		};
	} catch (error) {
		return { success: false, error: 'GROUP_CREATE_FAILED' };
	}
}

export async function deleteSystemGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string,
	actorId: string
): Promise<{ success: boolean; error?: string }> {
	if (!groupId) {
		return { success: false, error: 'GROUP_NOT_FOUND' };
	}

	return db.transaction(async (tx) => {
		const [groupRecord] = await tx
			.select()
			.from(schema.group)
			.where(and(eq(schema.group.id, groupId), isNull(schema.group.deletedAt)))
			.limit(1);

		if (!groupRecord) {
			return { success: false, error: 'GROUP_NOT_FOUND' };
		}

		const [membersRow] = await tx
			.select({ total: count(schema.relGroup.userId) })
			.from(schema.relGroup)
			.where(eq(schema.relGroup.groupId, groupId));

		const membersCount = Number(membersRow?.total ?? 0);
		if (membersCount > 0) {
			return { success: false, error: 'GROUP_HAS_MEMBERS' };
		}

		await tx
			.update(schema.group)
			.set({
				deletedAt: new Date(),
				deletedById: actorId
			})
			.where(eq(schema.group.id, groupId));

		await tx.insert(schema.groupAuditLog).values({
			id: crypto.randomUUID(),
			groupId,
			action: 'delete',
			performedById: actorId,
			payload: { previousName: groupRecord.name }
		});

		return { success: true };
	});
}
