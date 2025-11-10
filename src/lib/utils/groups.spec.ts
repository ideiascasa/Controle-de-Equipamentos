import { describe, expect, it } from 'vitest';
import { toGroupSummary, validateGroupInput } from './groups';

describe('validateGroupInput', () => {
	it('returns success for valid fields', () => {
		const result = validateGroupInput({
			name: 'Operations',
			description: 'Core team'
		});

		expect(result).toEqual({
			success: true,
			data: {
				name: 'Operations',
				description: 'Core team'
			}
		});
	});

	it('fails when name is missing', () => {
		const result = validateGroupInput({
			description: 'Missing name'
		});

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_REQUIRED' });
	});

	it('fails when name exceeds limit', () => {
		const result = validateGroupInput({
			name: 'x'.repeat(65)
		});

		expect(result).toEqual({ success: false, error: 'GROUP_NAME_TOO_LONG' });
	});

	it('fails when description exceeds limit', () => {
		const result = validateGroupInput({
			name: 'Valid',
			description: 'y'.repeat(257)
		});

		expect(result).toEqual({ success: false, error: 'GROUP_DESCRIPTION_TOO_LONG' });
	});
});

describe('toGroupSummary', () => {
	it('maps values and normalizes count and date', () => {
		const summary = toGroupSummary({
			id: 'g-1',
			name: 'Ops',
			description: null,
			membersCount: '4',
			createdAt: new Date('2024-01-15T00:00:00.000Z')
		});

		expect(summary).toEqual({
			id: 'g-1',
			name: 'Ops',
			description: null,
			membersCount: 4,
			createdAt: '2024-01-15T00:00:00.000Z'
		});
	});

	it('provides defaults when values are missing', () => {
		const summary = toGroupSummary({
			id: 'g-2',
			name: null,
			description: null,
			membersCount: null,
			createdAt: null
		});

		expect(summary.membersCount).toBe(0);
		expect(summary.createdAt).toBe(new Date(0).toISOString());
	});
});
