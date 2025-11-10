export type GroupValidationError =
	| 'GROUP_NAME_REQUIRED'
	| 'GROUP_NAME_TOO_LONG'
	| 'GROUP_DESCRIPTION_TOO_LONG';

export type GroupInputResult =
	| { success: true; data: { name: string; description: string | null } }
	| { success: false; error: GroupValidationError };

export type GroupSummary = {
	id: string;
	name: string | null;
	description: string | null;
	membersCount: number;
	createdAt: string;
};

export function validateGroupInput(fields: Record<string, FormDataEntryValue | null>): GroupInputResult {
	const name = readField(fields, 'name');
	const description = readField(fields, 'description');

	if (!name) {
		return { success: false, error: 'GROUP_NAME_REQUIRED' };
	}

	if (name.length > 64) {
		return { success: false, error: 'GROUP_NAME_TOO_LONG' };
	}

	if (description && description.length > 256) {
		return { success: false, error: 'GROUP_DESCRIPTION_TOO_LONG' };
	}

	return {
		success: true,
		data: {
			name,
			description: description || null
		}
	};
}

function readField(
	fields: Record<string, FormDataEntryValue | null>,
	key: string
): string | null {
	const value = fields[key];

	if (!value) {
		return null;
	}

	if (typeof value === 'string') {
		return value.trim();
	}

	return null;
}

export function toGroupSummary(row: {
	id: string;
	name: string | null;
	description: string | null;
	membersCount: number | string | null;
	createdAt: Date | string | null;
}): GroupSummary {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		membersCount:
			typeof row.membersCount === 'number'
				? row.membersCount
				: Number(row.membersCount ?? 0),
		createdAt: formatDate(row.createdAt)
	};
}

function formatDate(value: Date | string | null): string {
	if (!value) {
		return new Date(0).toISOString();
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return new Date(value).toISOString();
}
