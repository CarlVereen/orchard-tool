export type ActionFailure = { ok: false; error: string }

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  return 'Something went wrong'
}
