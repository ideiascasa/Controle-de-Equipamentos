import { randomUUID } from 'crypto';
import { eq, and, sql, isNull, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import {
	validateGroupInput,
	toGroupSummary,
	type GroupSummary
} from '$lib/utils/groups';

export const SYSTEM_USER_ID = '1';

export async function addUserToGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string,
	userId: string
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
			adm: false
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
			createdAt: schema.group.createdAt,
			membersCount: sql<number>`count(${schema.relGroup.userId})`
		})
		.from(schema.group)
		.leftJoin(schema.relGroup, eq(schema.group.id, schema.relGroup.groupId))
		.where(isNull(schema.group.deletedAt))
		.groupBy(schema.group.id)
		.orderBy(desc(schema.group.createdAt));

	return rows.map(toGroupSummary);
}

export async function createSystemGroup(
	db: PostgresJsDatabase<typeof schema>,
	fields: Record<string, FormDataEntryValue | null>,
	userId: string
): Promise<{ success: true; group: GroupSummary } | { success: false; error: string }> {
	const validation = validateGroupInput(fields);

	if (!validation.success) {
		return { success: false, error: validation.error };
	}

	const groupId = randomUUID();
	const auditId = randomUUID();
	const now = new Date();

	try {
		const groupData = await db.transaction(async (tx) => {
			await tx.insert(schema.group).values({
				id: groupId,
				name: validation.data.name,
				description: validation.data.description,
				createdAt: now,
				createdById: userId
			});

			await tx.insert(schema.groupAuditLog).values({
				id: auditId,
				groupId,
				action: 'created',
				performedById: userId,
				payload: {
					name: validation.data.name,
					description: validation.data.description
				},
				createdAt: now
			});

			const [row] = await tx
				.select({
					id: schema.group.id,
					name: schema.group.name,
					description: schema.group.description,
					createdAt: schema.group.createdAt,
					membersCount: sql<number>`count(${schema.relGroup.userId})`
				})
				.from(schema.group)
				.leftJoin(schema.relGroup, eq(schema.group.id, schema.relGroup.groupId))
				.where(eq(schema.group.id, groupId))
				.groupBy(schema.group.id);

			return toGroupSummary(row);
		});

		return { success: true, group: groupData };
	} catch (error) {
		return { success: false, error: 'DATABASE_ERROR' };
	}
}

export async function deleteSystemGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string,
	userId: string
): Promise<{ success: true } | { success: false; error: string }> {
	try {
		return await db.transaction(async (tx) => {
			const group = await tx
				.select({
					id: schema.group.id,
					deletedAt: schema.group.deletedAt
				})
				.from(schema.group)
				.where(and(eq(schema.group.id, groupId), isNull(schema.group.deletedAt)))
				.limit(1);

			if (group.length === 0) {
				return { success: false, error: 'GROUP_NOT_FOUND' };
			}

			const [{ membersCount }] = await tx
				.select({
					membersCount: sql<number>`count(${schema.relGroup.userId})`
				})
				.from(schema.relGroup)
				.where(eq(schema.relGroup.groupId, groupId));

			if (membersCount > 0) {
				return { success: false, error: 'GROUP_HAS_MEMBERS' };
			}

			const now = new Date();

			await tx
				.update(schema.group)
				.set({
					deletedAt: now,
					deletedById: userId
				})
				.where(eq(schema.group.id, groupId));

			await tx.insert(schema.groupAuditLog).values({
				id: randomUUID(),
				groupId,
				action: 'deleted',
				performedById: userId,
				payload: { reason: 'system_user_delete' },
				createdAt: now
			});

			return { success: true };
		});
	} catch (error) {
		return { success: false, error: 'DATABASE_ERROR' };
	}
}
