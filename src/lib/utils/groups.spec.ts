import { describe, it, expect } from 'vitest';
import { validateGroupInput, toGroupSummary, buildAuditPayload } from './groups';

describe('validateGroupInput', () => {
	it('accepts valid name and optional description', () => {
		const result = validateGroupInput({
			name: ' Alpha ',
			description: '  Core team '
		});

		expect(result).toEqual({
			success: true,
			data: {
				name: 'Alpha',
				description: 'Core team'
			}
		});
	});

	it('normalizes empty description to null', () => {
		const result = validateGroupInput({
			name: 'Ops',
			description: ''
		});

		expect(result).toEqual({
			success: true,
			data: {
				name: 'Ops',
				description: null
			}
		});
	});

	it('requires name', () => {
		const result = validateGroupInput({
			name: '',
			description: 'anything'
		});

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_REQUIRED' });
	});

	it('limits name length', () => {
		const result = validateGroupInput({
			name: 'a'.repeat(65),
			description: null
		});

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_TOO_LONG' });
	});

	it('limits description length', () => {
		const result = validateGroupInput({
			name: 'Alpha',
			description: 'a'.repeat(257)
		});

		expect(result).toEqual({ success: false, error: 'GROUP_DESCRIPTION_TOO_LONG' });
	});
});

describe('toGroupSummary', () => {
	it('maps database row to summary', () => {
		const summary = toGroupSummary({
			id: 'group-1',
			name: 'Alpha',
			description: null,
			membersCount: 5,
			createdAt: new Date('2024-01-02T03:00:00Z')
		});

		expect(summary).toEqual({
			id: 'group-1',
			name: 'Alpha',
			description: null,
			membersCount: 5,
			createdAt: '2024-01-02T03:00:00.000Z'
		});
	});

	it('defaults missing values', () => {
		const summary = toGroupSummary({
			id: 'group-2',
			name: null,
			description: null,
			membersCount: null,
			createdAt: null
		});

		expect(summary).toEqual({
			id: 'group-2',
			name: null,
			description: null,
			membersCount: 0,
			createdAt: new Date(0).toISOString()
		});
	});
});

describe('buildAuditPayload', () => {
	it('returns the same object reference', () => {
		const data = { example: true };
		expect(buildAuditPayload(data)).toBe(data);
	});
});
