/**
 * Simple admin auth — checks Authorization header for the admin password.
 * For MVP; replace with proper auth in Phase 4.
 */
export function isAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return authHeader === `Bearer ${adminPassword}`
}
