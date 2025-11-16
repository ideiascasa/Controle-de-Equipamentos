import googleClient from '$lib/utils/googleClient.server';
import { decodeIdToken } from 'arctic';
import { type RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { db } from '$lib/db';
import * as table from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/utils/auth';
import { generateUniqueId, ensureDefaultAdminGroupAndRelation } from '$lib/utils/common';
import { m } from '$lib/paraglide/messages.js';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_code_verifier') ?? null;

	if (code === null || state === null || storedState === null || codeVerifier === null) {
		return new Response(null, { status: 400 });
	}

	if (state !== storedState) {
		return new Response(null, { status: 400 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await googleClient.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		console.error(m.errorValidatingGoogleAuth(), e);
		return new Response(null, { status: 400 });
	}

	const claims: any = decodeIdToken(tokens.idToken());
	// TODO OAuth2 do google nao esta retornando o email do usuario
	const googleUserId = claims?.sub;
	const username = claims?.name;

	// Check if user exists, create if not
	const results = await db.select().from(table.user).where(eq(table.user.username, googleUserId));
	const existingUser = results.at(0);

	try {
		if (!existingUser) {
			// Determine if this is the first user in the system so we can set id = "1"
			const existingUsers = await db.select().from(table.user);
			const isFirstUser = existingUsers.length === 0;
			const userId = isFirstUser ? '1' : generateUniqueId();
			await db.insert(table.user).values({ id: userId, username: googleUserId, name: username });

			// If this is the first user, relate them to the default admin group
			if (isFirstUser) {
				await ensureDefaultAdminGroupAndRelation(db, userId);
			}

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} else {
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, existingUser.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		}
	} catch (e) {
		console.error(m.errorCreatingSession(), e);
		return new Response(null, { status: 500 });
	}

	return new Response(null, {
		status: 302,
		headers: { Location: '/' }
	});
}
