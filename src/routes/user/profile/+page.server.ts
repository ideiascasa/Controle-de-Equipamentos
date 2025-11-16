import * as auth from '$lib/utils/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import {
	addUserToGroup as addUserToGroupUtil,
	getUsersInGroup,
	getActiveGroupsWithStats,
	createSystemGroup,
	deleteSystemGroup
} from './utils.server';
import { eq, and } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { m } from '$lib/paraglide/messages.js';

const SYSTEM_USER_ID = '1';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	// Empty menu data for /user/profile route
	const menu: MenuData = [];

	// Check if user is administrator (has any group with isAdmin === true)
	const isAdministrator = result.groups?.some((group) => group.isAdmin === true) ?? false;

	// Fetch all users from database for selection (only if administrator)
	let allUsers: { id: string; username: string; name: string | null }[] = [];
	// Fetch group memberships for all groups where user has admin rights
	const groupMemberships: Record<
		string,
		{ id: string; username: string; name: string | null; isAdmin: boolean }[]
	> = {};
	const isSystemUser = result.user?.id === SYSTEM_USER_ID;
	const systemGroups = isSystemUser ? await getActiveGroupsWithStats(db) : [];

	if (isAdministrator && result.groups) {
		try {
			allUsers = await db
				.select({
					id: schema.user.id,
					username: schema.user.username,
					name: schema.user.name
				})
				.from(schema.user);
		} catch (error) {
			console.error(m.errorFetchingAllUsers(), error);
			allUsers = [];
		}

		// Get all group IDs where user has admin rights
		const adminGroupIds = result.groups.filter((g) => g.isAdmin === true).map((g) => g.groupId);

		// Fetch users for each admin group
		for (const groupId of adminGroupIds) {
			groupMemberships[groupId] = await getUsersInGroup(db, groupId);
		}
	}

	return {
		...result,
		menu,
		isAdministrator,
		allUsers,
		groupMemberships,
		isSystemUser,
		systemGroups
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401, { action: 'logout' });
		}
		const userId = event.locals.user?.id;
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		// Audit log for logout
		if (userId) {
			await createAuditLog(db, 'user.logout', userId, {
				userId,
				sessionId: event.locals.session.id
			});
		}

		return redirect(302, '/');
	},
	addUserToGroup: async (event) => {
		const { locals } = event;

		// Check if user is logged in
		if (!locals.user || !locals.groups) {
			return fail(401, { action: 'addUserToGroup', message: 'UNAUTHORIZED' });
		}

		// Check if user is administrator (has any group with isAdmin === true)
		const isAdministrator = locals.groups.some((group) => group.isAdmin === true);
		if (!isAdministrator) {
			return fail(403, { action: 'addUserToGroup', message: 'NOT_ADMINISTRATOR' });
		}

		const formData = await event.request.formData();
		const userId = formData.get('userId');
		const groupId = formData.get('groupId');
		const isAdminValue = formData.get('isAdmin');

		// Validate inputs
		if (!userId || typeof userId !== 'string') {
			return fail(400, { action: 'addUserToGroup', message: 'INVALID_USER_ID' });
		}
		if (!groupId || typeof groupId !== 'string') {
			return fail(400, { action: 'addUserToGroup', message: 'GROUP_NOT_SELECTED' });
		}

		// Convert isAdmin to boolean (check if exists and equals "true")
		const isAdmin = isAdminValue === 'true' || isAdminValue === 'on';

		// Verify selected group exists and user has admin rights on that specific group
		const userGroupRelation = locals.groups.find(
			(g) => g.groupId === groupId && g.isAdmin === true
		);
		if (!userGroupRelation) {
			return fail(403, { action: 'addUserToGroup', message: 'NO_ADMIN_RIGHTS_ON_GROUP' });
		}

		// Verify target user exists
		let targetUser;
		try {
			targetUser = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, userId))
				.limit(1);
		} catch (error) {
			console.error(m.errorVerifyingTargetUser(), error);
			return fail(500, { action: 'addUserToGroup', message: 'DATABASE_ERROR' });
		}

		if (targetUser.length === 0) {
			return fail(404, { action: 'addUserToGroup', message: 'USER_NOT_FOUND' });
		}

		// Verify group exists
		let group;
		try {
			group = await db.select().from(schema.group).where(eq(schema.group.id, groupId)).limit(1);
		} catch (error) {
			console.error(m.errorVerifyingGroup(), error);
			return fail(500, { action: 'addUserToGroup', message: 'DATABASE_ERROR' });
		}

		if (group.length === 0) {
			return fail(404, { action: 'addUserToGroup', message: 'GROUP_NOT_FOUND' });
		}

		// Add user to group
		const result = await addUserToGroupUtil(db, groupId, userId, locals.user.id, isAdmin);

		if (!result.success) {
			if (result.error === 'USER_ALREADY_IN_GROUP') {
				return fail(400, { action: 'addUserToGroup', message: 'USER_ALREADY_IN_GROUP' });
			}
			return fail(500, { action: 'addUserToGroup', message: 'DATABASE_ERROR' });
		}

		// Return success - the form enhancement will automatically refresh the page data
		return { action: 'addUserToGroup', success: true, message: 'USER_ADDED_SUCCESSFULLY' };
	},
	createSystemGroup: async (event) => {
		const { locals } = event;
		if (!locals.user || locals.user.id !== SYSTEM_USER_ID) {
			return fail(403, { action: 'createSystemGroup', message: 'SYSTEM_USER_ONLY' });
		}

		const formData = await event.request.formData();
		const fields: Record<string, FormDataEntryValue | null> = {};
		formData.forEach((value, key) => {
			fields[key] = value;
		});

		const result = await createSystemGroup(db, fields, locals.user.id);
		if (!result.success) {
			const status =
				result.error === 'GROUP_NAME_REQUIRED' ||
				result.error === 'GROUP_NAME_TOO_LONG' ||
				result.error === 'GROUP_DESCRIPTION_TOO_LONG'
					? 400
					: 500;
			return fail(status, { action: 'createSystemGroup', message: result.error });
		}

		return {
			action: 'createSystemGroup',
			success: true,
			message: 'GROUP_CREATED_SUCCESS',
			group: result.group
		};
	},
	deleteSystemGroup: async (event) => {
		const { locals } = event;
		if (!locals.user || locals.user.id !== SYSTEM_USER_ID) {
			return fail(403, { action: 'deleteSystemGroup', message: 'SYSTEM_USER_ONLY' });
		}

		const formData = await event.request.formData();
		const groupId = formData.get('groupId');
		if (!groupId || typeof groupId !== 'string') {
			return fail(400, { action: 'deleteSystemGroup', message: 'GROUP_NOT_FOUND' });
		}

		const result = await deleteSystemGroup(db, groupId, locals.user.id);
		if (!result.success) {
			const status =
				result.error === 'GROUP_NOT_FOUND' ? 404 : result.error === 'GROUP_HAS_MEMBERS' ? 409 : 500;
			return fail(status, { action: 'deleteSystemGroup', message: result.error });
		}

		return {
			action: 'deleteSystemGroup',
			success: true,
			message: 'GROUP_DELETED_SUCCESS'
		};
	}
};
