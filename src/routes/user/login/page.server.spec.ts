import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const selectResponses: any[] = [];
let insertShouldThrow = false;

function createSelectBuilder(response: any[] = []) {
	const finalPromise = Promise.resolve(response);
	const whereResult = {
		limit: vi.fn(() => finalPromise),
		then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
			finalPromise.then(resolve, reject)
	};

	return {
		from: vi.fn(() => ({
			where: vi.fn(() => whereResult),
			limit: vi.fn(() => finalPromise),
			then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
				finalPromise.then(resolve, reject)
		}))
	};
}

const selectMock = vi.hoisted(() => vi.fn(() => createSelectBuilder(selectResponses.shift())));
const insertMock = vi.hoisted(() =>
	vi.fn(() => ({
	values: vi.fn(async () => {
		if (insertShouldThrow) {
			throw new Error('db error');
		}
	})
	}))
);

vi.mock('$lib/db', () => ({
	db: {
		select: selectMock,
		insert: insertMock
	}
}));

const failMock = vi.hoisted(() =>
	vi.fn((status: number, data: unknown) => ({
		status,
		data
	}))
);
const redirectMock = vi.hoisted(() =>
	vi.fn((status: number, location: string) => {
		const error = new Error('redirect') as Error & { status?: number; location?: string };
		error.status = status;
		error.location = location;
		throw error;
	})
);

vi.mock('@sveltejs/kit', () => ({
	fail: failMock,
	redirect: redirectMock
}));

const authMocks = vi.hoisted(() => ({
	generateSessionToken: vi.fn(() => 'session-token'),
	createSession: vi.fn(async () => ({
		id: 'session-id',
		expiresAt: new Date('2024-01-01T00:00:00Z')
	})),
	setSessionTokenCookie: vi.fn(),
	deleteSessionTokenCookie: vi.fn(),
	invalidateSession: vi.fn()
}));

vi.mock('$lib/utils/auth', () => authMocks);

const messages = vi.hoisted(() => ({
	emailInvalid: vi.fn(() => 'EMAIL_INVALID'),
	passwordInvalid: vi.fn(() => 'PASSWORD_INVALID'),
	incorrectCredentials: vi.fn(() => 'INCORRECT_CREDENTIALS'),
	invalidUsername: vi.fn(() => 'INVALID_USERNAME'),
	invalidPassword: vi.fn(() => 'INVALID_PASSWORD'),
	errorOccurred: vi.fn(() => 'ERROR_OCCURRED')
}));

vi.mock('$lib/paraglide/messages.js', () => ({
	m: messages
}));

const commonMocks = vi.hoisted(() => ({
	generateUniqueId: vi.fn(() => 'generated-user-id'),
	ensureDefaultAdminGroupAndRelation: vi.fn(async () => {})
}));

vi.mock('$lib/utils/common', () => commonMocks);

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((a, b) => ({ a, b }))
}));

vi.mock('@oslojs/encoding', () => ({
	encodeBase32LowerCase: vi.fn(),
	encodeHexLowerCase: (bytes: Uint8Array) =>
		Array.from(bytes)
			.map((value) => value.toString(16).padStart(2, '0'))
			.join('')
}));

const originalCrypto = globalThis.crypto;
let lastImportedData = new Uint8Array();

const subtleMock = {
	importKey: vi.fn(async (_format: string, keyData: ArrayBuffer) => {
		lastImportedData = new Uint8Array(keyData);
		return { data: lastImportedData };
	}),
	deriveBits: vi.fn(async (params: { salt: ArrayBufferLike }, _key: unknown, length: number) => {
		const saltBytes = new Uint8Array(params.salt);
		const combinedLength = lastImportedData.length + saltBytes.length + 4;
		const combined = new Uint8Array(combinedLength);
		combined.set(lastImportedData, 0);
		combined.set(saltBytes, lastImportedData.length);
		combined.set(
			new Uint8Array([
				(length >> 24) & 0xff,
				(length >> 16) & 0xff,
				(length >> 8) & 0xff,
				length & 0xff
			]),
			lastImportedData.length + saltBytes.length
		);

		const result = new Uint8Array(32);
		for (let i = 0; i < result.length; i++) {
			result[i] = combined[i % combined.length] ?? 0;
		}
		return result.buffer;
	})
};

Object.defineProperty(globalThis, 'crypto', {
	value: { subtle: subtleMock },
	writable: true
});

// Import after mocks
import { actions, load } from './+page.server';

async function computeHash(password: string, username: string) {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);
	const saltData = encoder.encode(username);

	await subtleMock.importKey('raw', passwordData);
	const bits = await subtleMock.deriveBits({ salt: saltData.buffer }, {}, 256);
	const hex = Array.from(new Uint8Array(bits))
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');
	return hex;
}

function createActionEvent(form: Record<string, string | null>) {
	return {
		request: {
			formData: async () => {
				const entries = Object.entries(form).map(([key, value]) => [key, value]);
				return new Map(entries);
			}
		},
		locals: {}
	};
}

describe('user login load', () => {
	beforeEach(() => {
		selectResponses.length = 0;
		selectMock.mockClear();
		insertMock.mockClear();
		insertShouldThrow = false;
		failMock.mockClear();
		redirectMock.mockClear();
		Object.values(authMocks).forEach((mockFn) => {
			if ('mockClear' in mockFn) {
				(mockFn as unknown as { mockClear: () => void }).mockClear();
			}
		});
		Object.values(messages).forEach((mockFn) => mockFn.mockClear());
		commonMocks.generateUniqueId.mockClear();
		commonMocks.ensureDefaultAdminGroupAndRelation.mockClear();
		subtleMock.importKey.mockClear();
		subtleMock.deriveBits.mockClear();
	});

	it('redirects authenticated users away from login page', async () => {
		await expect(load({ locals: { user: { id: '123' } } } as any)).rejects.toMatchObject({
			location: '/user/profile',
			status: 302
		});
		expect(redirectMock).toHaveBeenCalledWith(302, '/user/profile');
	});

	it('allows unauthenticated users to access login page', async () => {
		await expect(load({ locals: { user: null } } as any)).resolves.toEqual({});
	});
});

describe('user login actions', () => {
	beforeEach(() => {
		selectResponses.length = 0;
	});

	it('returns failure when username is invalid', async () => {
		const result = await actions.login?.(
			createActionEvent({ username: 'invalid', password: '123456' }) as any
		);
		expect(failMock).toHaveBeenCalledWith(400, { message: 'EMAIL_INVALID' });
		expect(result).toEqual({ status: 400, data: { message: 'EMAIL_INVALID' } });
	});

	it('returns failure when password is invalid', async () => {
		const result = await actions.login?.(
			createActionEvent({ username: 'user@email.com', password: '123' }) as any
		);
		expect(failMock).toHaveBeenCalledWith(400, { message: 'PASSWORD_INVALID' });
		expect(result).toEqual({ status: 400, data: { message: 'PASSWORD_INVALID' } });
	});

	it('returns failure when user not found', async () => {
		selectResponses.push([]);
		const result = await actions.login?.(
			createActionEvent({ username: 'test@email.com', password: '123456' }) as any
		);
		expect(selectMock).toHaveBeenCalled();
		expect(result).toEqual({ status: 400, data: { message: 'INCORRECT_CREDENTIALS' } });
	});

	it('returns failure when password verification fails', async () => {
		selectResponses.push([
			{ id: 'user-1', username: 'user@email.com', passwordHash: 'different-hash' }
		]);

		const result = await actions.login?.(
			createActionEvent({ username: 'user@email.com', password: '654321' }) as any
		);
		expect(result).toEqual({ status: 400, data: { message: 'INCORRECT_CREDENTIALS' } });
	});

	it('redirects to home on successful login', async () => {
		const password = 'secret123';
		const username = 'user@email.com';
		const hash = await computeHash(password, username);

		selectResponses.push([{ id: 'user-1', username, passwordHash: hash }]);

		await expect(
			actions.login?.(
				createActionEvent({ username, password }) as any
			) as Promise<unknown>
		).rejects.toMatchObject({ location: '/home', status: 302 });

		expect(authMocks.generateSessionToken).toHaveBeenCalled();
		expect(authMocks.createSession).toHaveBeenCalledWith('session-token', 'user-1');
		expect(authMocks.setSessionTokenCookie).toHaveBeenCalled();
	});
});

	describe('user register action', () => {
		beforeEach(() => {
			selectResponses.length = 0;
			insertShouldThrow = false;
			commonMocks.generateUniqueId.mockClear();
			commonMocks.ensureDefaultAdminGroupAndRelation.mockClear();
		});

		it('returns failure when username invalid', async () => {
			const result = await actions.register?.(
				createActionEvent({ username: 'bad', password: '123456' }) as any
			);
			expect(result).toEqual({ status: 400, data: { message: 'INVALID_USERNAME' } });
		});

		it('returns failure when password invalid', async () => {
			const result = await actions.register?.(
				createActionEvent({ username: 'user@email.com', password: '123' }) as any
			);
			expect(result).toEqual({ status: 400, data: { message: 'INVALID_PASSWORD' } });
		});

		it('handles database errors gracefully', async () => {
			insertShouldThrow = true;
			const result = await actions.register?.(
				createActionEvent({ username: 'user@email.com', password: '123456' }) as any
			);
			expect(result).toEqual({ status: 500, data: { message: 'ERROR_OCCURRED' } });
		});

		it('creates first user with id "1" and admin group relation', async () => {
			// No users exist yet
			selectResponses.push([]);

			await expect(
				actions.register?.(
					createActionEvent({ username: 'user@email.com', password: '123456' }) as any
				) as Promise<unknown>
			).rejects.toMatchObject({ location: '/user/login', status: 302 });

			expect(commonMocks.generateUniqueId).not.toHaveBeenCalled();
			expect(commonMocks.ensureDefaultAdminGroupAndRelation).toHaveBeenCalledWith(
				expect.anything(),
				'1'
			);
			expect(authMocks.createSession).toHaveBeenCalledWith('session-token', '1');
			expect(authMocks.setSessionTokenCookie).toHaveBeenCalled();
		});

		it('creates subsequent users with generated id and no admin relation', async () => {
			// At least one user already exists
			selectResponses.push([{ id: 'existing-user' }]);

			await expect(
				actions.register?.(
					createActionEvent({ username: 'user2@email.com', password: 'abcdef' }) as any
				) as Promise<unknown>
			).rejects.toMatchObject({ location: '/user/login', status: 302 });

			expect(commonMocks.generateUniqueId).toHaveBeenCalled();
			expect(commonMocks.ensureDefaultAdminGroupAndRelation).not.toHaveBeenCalled();
			expect(authMocks.createSession).toHaveBeenCalledWith(
				'session-token',
				'generated-user-id'
			);
			expect(authMocks.setSessionTokenCookie).toHaveBeenCalled();
		});
	});

afterAll(() => {
	Object.defineProperty(globalThis, 'crypto', {
		value: originalCrypto,
		writable: true
	});
});
