export type GroupInput = {
	name: string;
	description: string | null;
};

export type GroupInputResult =
	| {
			success: true;
			data: GroupInput;
	  }
	| {
			success: false;
			error: string;
	  };

export function validateGroupInput(
	fields: Record<string, FormDataEntryValue | null>
): GroupInputResult {
	const rawName = readField(fields, 'name');
	const rawDescription = readField(fields, 'description');

	if (!rawName) {
		return { success: false, error: 'GROUP_NAME_REQUIRED' };
	}

	if (rawName.length > 64) {
		return { success: false, error: 'GROUP_NAME_TOO_LONG' };
	}

	if (rawDescription && rawDescription.length > 256) {
		return { success: false, error: 'GROUP_DESCRIPTION_TOO_LONG' };
	}

	return {
		success: true,
		data: {
			name: rawName,
			description: rawDescription || null
		}
	};
}

function readField(fields: Record<string, FormDataEntryValue | null>, key: string): string {
	const value = fields[key];
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim();
}

export type GroupSummary = {
	id: string;
	name: string | null;
	description: string | null;
	membersCount: number;
	createdAt: string;
};

export function toGroupSummary(row: {
	id: string;
	name: string | null;
	description: string | null;
	membersCount: number | null;
}): GroupSummary {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		membersCount: Number(row.membersCount ?? 0)
	};
}

export function buildAuditPayload(data: Record<string, unknown>) {
	return data;
}
