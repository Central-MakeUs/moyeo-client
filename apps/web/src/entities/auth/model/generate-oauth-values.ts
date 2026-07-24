export function generateState(): string {
  return crypto.randomUUID();
}

export function generateNonce(): string {
  return crypto.randomUUID();
}
