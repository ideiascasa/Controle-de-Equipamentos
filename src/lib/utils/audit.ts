import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from './common';

export type AuditAction =
	| 'user.create'
	| 'user.login'
	| 'user.logout'
	| 'session.create'
	| 'session.update'
	| 'session.delete'
	| 'group.create'
	| 'group.delete'
	| 'group.add_user'
	| 'group.remove_user';

export interface AuditPayload {
	[key: string]: unknown;
}

type Database = PostgresJsDatabase<typeof schema>;
type Transaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;

/**
 * Creates an audit log entry
 * @param db Database instance or transaction
 * @param action Action being performed
 * @param performedById ID of the user performing the action (optional for system actions)
 * @param payload Additional data about the action
 */
export async function createAuditLog(
	db: Database | Transaction,
	action: AuditAction,
	performedById: string | null,
	payload?: AuditPayload
): Promise<void> {
	const auditId = generateUniqueId();

	await db.insert(schema.auditLog).values({
		id: auditId,
		action,
		performedById,
		payload: payload || null
	});
}
