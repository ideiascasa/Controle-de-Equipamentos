import { eq, and, isNull, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { validateGroupInput, toGroupSummary, type GroupSummary } from '$lib/utils/groups';
import { createAuditLog } from '$lib/utils/audit';
import { m } from '$lib/paraglide/messages.js';

export async function addUserToGroup(
	db: PostgresJsDatabase<typeof schema>,
	groupId: string,
	userId: string,
	createdById?: string,
	isAdmin?: boolean
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

		// Insert the relation with adm value from parameter (defaults to false)
		await db.insert(schema.relGroup).values({
			groupId: groupId,
			userId: userId,
			adm: isAdmin ?? false
		});

		// Audit log
		await createAuditLog(db, 'group.add_user', createdById ?? null, {
			groupId,
			userId,
			isAdmin: isAdmin ?? false
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
	try {
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
	} catch (error) {
		// Handle case when tables are empty or query fails
		console.error(m.errorFetchingUsersInGroup(), error);
		return [];
	}
}

export async function getActiveGroupsWithStats(
	db: PostgresJsDatabase<typeof schema>
): Promise<GroupSummary[]> {
	try {
		const rows = await db
			.select({
				id: schema.group.id,
				name: schema.group.name,
				description: schema.group.description,
				membersCount: count(schema.relGroup.userId).as('membersCount')
			})
			.from(schema.group)
			.leftJoin(schema.relGroup, eq(schema.relGroup.groupId, schema.group.id))
			.groupBy(schema.group.id);
		return rows.map((row) => toGroupSummary(row));
	} catch (error) {
		// Handle case when tables are empty or query fails
		console.error(m.errorFetchingActiveGroupsWithStats(), error);
		return [];
	}
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
				description: validated.data.description
			})
			.returning({
				id: schema.group.id,
				name: schema.group.name,
				description: schema.group.description
			});

		// Audit log
		await createAuditLog(db, 'group.create', actorId, {
			groupId,
			name: validated.data.name,
			description: validated.data.description
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
		let groupRecord;
		try {
			const groupResults = await tx
				.select()
				.from(schema.group)
				.where(and(eq(schema.group.id, groupId)))
				.limit(1);
			groupRecord = groupResults[0];
		} catch (error) {
			console.error(m.errorFetchingGroupRecord(), error);
			return { success: false, error: 'DATABASE_ERROR' };
		}

		if (!groupRecord) {
			return { success: false, error: 'GROUP_NOT_FOUND' };
		}

		let membersRow;
		try {
			const membersResults = await tx
				.select({ total: count(schema.relGroup.userId) })
				.from(schema.relGroup)
				.where(eq(schema.relGroup.groupId, groupId));
			membersRow = membersResults[0];
		} catch (error) {
			console.error(m.errorFetchingMembersCount(), error);
			return { success: false, error: 'DATABASE_ERROR' };
		}

		const membersCount = Number(membersRow?.total ?? 0);
		if (membersCount > 0) {
			return { success: false, error: 'GROUP_HAS_MEMBERS' };
		}

		// Audit log
		await createAuditLog(tx, 'group.delete', actorId, {
			groupId,
			previousName: groupRecord.name
		});

		return { success: true };
	});
}
