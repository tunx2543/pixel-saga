export const PERMANENT_GM_EMAILS = new Set(['ffsmilepay53@gmail.com'])

export function isPermanentGm(email: string | null | undefined) {
  return email ? PERMANENT_GM_EMAILS.has(email.trim().toLowerCase()) : false
}
