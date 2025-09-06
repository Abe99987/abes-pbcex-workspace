// Time utilities: enforce UTC milliseconds and formatting helpers

export function nowUtcMs(): number {
  return Date.now();
}

export function toUtcIso(input?: number | Date): string {
  if (input instanceof Date) return input.toISOString();
  if (typeof input === 'number') return new Date(input).toISOString();
  return new Date().toISOString();
}


