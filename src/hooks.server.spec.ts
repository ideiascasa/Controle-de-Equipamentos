import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Handle, ResolveOptions } from '@sveltejs/kit';

const handlerContainer = vi.hoisted(() => ({ value: [] as Handle[] }));

const sequenceMock = vi.hoisted(() =>
	vi.fn((...handlers: Handle[]) => {
		handlerContainer.value.splice(0, handlerContainer.value.length, ...handlers);
		return async (
			event: Parameters<Handle>[0]['event'],
			resolve: Parameters<Handle>[0]['resolve']
		) => {
			const dispatch = async (
				index: number,
				currentEvent: Parameters<Handle>[0]['event'],
				options?: ResolveOptions
			): Promise<any> => {
				if (index >= handlers.length) {
					return resolve(currentEvent, options);
				}
				const handler = handlers[index];
				return handler({
					event: currentEvent,
					resolve: (nextEvent, nextOptions) =>
						dispatch(index + 1, nextEvent ?? currentEvent, nextOptions ?? options)
				});
			};
			return dispatch(0, event);
		};
	})
);

vi.mock('@sveltejs/kit/hooks', () => ({
	sequence: sequenceMock
}));

const paraglideMiddlewareMock = vi.hoisted(() =>
	vi.fn(
		(
			request: Request,
			callback: (params: { request: Request; locale: string }) => Promise<any>
		) => {
			const newRequest = new Request(request, { headers: { 'x-locale': 'pt' } });
			return callback({ request: newRequest, locale: 'pt-BR' });
		}
	)
);

vi.mock('$lib/paraglide/server', () => ({
	paraglideMiddleware: paraglideMiddlewareMock
}));

const authMocks = vi.hoisted(() => ({
	validateSessionToken: vi.fn(),
	setSessionTokenCookie: vi.fn(),
	deleteSessionTokenCookie: vi.fn()
}));

vi.mock('$lib/utils/auth', () => ({
	sessionCookieName: 'session',
	validateSessionToken: authMocks.validateSessionToken,
	setSessionTokenCookie: authMocks.setSessionTokenCookie,
	deleteSessionTokenCookie: authMocks.deleteSessionTokenCookie
}));

import { handle } from './hooks.server';

function createEvent(cookieValue?: string) {
	const cookiesGet = vi.fn(() => cookieValue);
	return {
		request: new Request('https://example.com'),
		locals: {} as Record<string, unknown>,
		cookies: {
			get: cookiesGet
		}
	};
}

describe('hooks.server handle', () => {
	beforeEach(() => {
		handlerContainer.value.length = 0;
		paraglideMiddlewareMock.mockClear();
		authMocks.validateSessionToken.mockReset();
		authMocks.setSessionTokenCookie.mockReset();
		authMocks.deleteSessionTokenCookie.mockReset();
	});

	it('applies paraglide middleware and resolves without session', async () => {
		const event = createEvent();
		const resolve = vi.fn(async (_event, opts?: ResolveOptions) => {
			if (opts?.transformPageChunk) {
				return opts.transformPageChunk({ html: '<html>%paraglide.lang%</html>' });
			}
			return 'resolved';
		});

		const result = await handle(event as any, resolve as any);

		expect(paraglideMiddlewareMock).toHaveBeenCalled();
		expect(resolve).toHaveBeenCalled();
		expect(result).toBe('<html>pt-BR</html>');
		expect(event.locals).toEqual({
			user: null,
			session: null,
			groups: null
		});
		expect(authMocks.validateSessionToken).not.toHaveBeenCalled();
	});

	it('validates session token and refreshes cookie when session valid', async () => {
		const event = createEvent('token-123');
		const resolve = vi.fn(async () => 'resolved');

		authMocks.validateSessionToken.mockResolvedValueOnce({
			session: { id: 'session-id', expiresAt: new Date('2024-01-01T00:00:00Z') },
			user: { id: 'user-1' },
			groups: [{ groupId: 'g1' }]
		});

		await handle(event as any, resolve as any);

		expect(authMocks.validateSessionToken).toHaveBeenCalledWith('token-123');
		expect(authMocks.setSessionTokenCookie).toHaveBeenCalledWith(
			event,
			'token-123',
			new Date('2024-01-01T00:00:00Z')
		);
		expect(event.locals).toEqual({
			user: { id: 'user-1' },
			session: { id: 'session-id', expiresAt: new Date('2024-01-01T00:00:00Z') },
			groups: [{ groupId: 'g1' }]
		});
		expect(authMocks.deleteSessionTokenCookie).not.toHaveBeenCalled();
	});

	it('clears cookie when session invalid', async () => {
		const event = createEvent('token-456');
		const resolve = vi.fn(async () => 'resolved');

		authMocks.validateSessionToken.mockResolvedValueOnce({
			session: null,
			user: null,
			groups: null
		});

		await handle(event as any, resolve as any);

		expect(authMocks.deleteSessionTokenCookie).toHaveBeenCalledWith(event);
		expect(event.locals).toEqual({
			user: null,
			session: null,
			groups: null
		});
	});
});
