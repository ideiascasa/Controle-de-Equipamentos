import { encodeBase32LowerCase, encodeHexLowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/utils/auth';
import { db } from '$lib/db';
import * as table from '$lib/db/schema';
import type { Actions, PageServerLoad } from './$types';

import { m } from '$lib/paraglide/messages.js';
import { generateUniqueId, ensureDefaultAdminGroupAndRelation } from '$lib/utils/common';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/user/profile');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, {
				message: m.emailInvalid()
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: m.passwordInvalid() });
		}

		const results = await db.select().from(table.user).where(eq(table.user.username, username));

		const existingUser = results.at(0);
		if (!existingUser || !existingUser.passwordHash) {
			return fail(400, { message: m.incorrectCredentials() });
		}

		const validPassword = await verifyPassword(
			password,
			existingUser.passwordHash,
			existingUser.username
		);

		if (!validPassword) {
			return fail(400, { message: m.incorrectCredentials() });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/home');
	},
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: m.invalidUsername() });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: m.invalidPassword() });
		}
		
		// Determine if this is the first user in the system so we can set id = "1"
		const existingUsers = await db.select().from(table.user);
		const isFirstUser = existingUsers.length === 0;
		const userId = isFirstUser ? '1' : generateUniqueId();
		const passwordHash = await hashPassword(password, username);

		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash });

			// If this is the first user, relate them to the default admin group
			if (isFirstUser) {
				await ensureDefaultAdminGroupAndRelation(db, userId);
			}

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch {
			return fail(500, { message: m.errorOccurred() });
		}
		return redirect(302, '/user/login');
	}
};

function validateUsername(username: unknown): username is string {
	return typeof username === 'string' && username.length >= 3 && /^\S+@\S+\.\S+$/.test(username);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

async function hashPassword(password: string, salt: string): Promise<string> {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);
	const saltData = encoder.encode(salt);

	const keyMaterial = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
		'deriveBits'
	]);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltData,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);

	return encodeHexLowerCase(new Uint8Array(derivedBits));
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
	const computedHash = await hashPassword(password, salt);
	return computedHash === hash;
}
