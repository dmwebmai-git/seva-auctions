/**
 * Centralized role definitions and permission helpers for Seva Auctions.
 *
 * Role hierarchy (lowest -> highest privilege):
 *   user        (0) - can browse, bid, buy, save
 *   creator     (1) - can create & manage auction listings
 *   admin       (2) - full admin: settings, terms, content, integrations, users
 *   super_admin (3) - everything admin can do, plus manage other Super Admins
 */

export const ROLES = ['user', 'creator', 'admin', 'super_admin'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  creator: 'Creator',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: 'Can browse listings, place bids, buy now, and save auctions.',
  creator: 'Can create and manage auction listings.',
  admin: 'Full admin access: listings, settings, content, integrations, and users.',
  super_admin: 'Complete control, including managing other Super Admins.',
}

const ROLE_LEVEL: Record<Role, number> = {
  user: 0,
  creator: 1,
  admin: 2,
  super_admin: 3,
}

/** Normalize an arbitrary role string to a known Role, defaulting to 'user'. */
export function normalizeRole(role?: string | null): Role {
  return (ROLES as readonly string[]).includes(role || '') ? (role as Role) : 'user'
}

/** Numeric privilege level for a role string (unknown -> 0). */
export function roleLevel(role?: string | null): number {
  return ROLE_LEVEL[normalizeRole(role)]
}

/** True if `role` is at least as privileged as `min`. */
export function isAtLeast(role: string | null | undefined, min: Role): boolean {
  return roleLevel(role) >= ROLE_LEVEL[min]
}

// ---- Feature permissions ---------------------------------------------------

/** Can reach the admin area at all (creator and above). */
export function canAccessAdmin(role?: string | null): boolean {
  return isAtLeast(role, 'creator')
}

/** Can create / edit / delete auction listings (creator and above). */
export function canManagePackages(role?: string | null): boolean {
  return isAtLeast(role, 'creator')
}

/** Can manage site settings, terms, content pages, integrations, settlement (admin and above). */
export function canManageSettings(role?: string | null): boolean {
  return isAtLeast(role, 'admin')
}

/** Can view and manage user accounts & roles (admin and above). */
export function canManageUsers(role?: string | null): boolean {
  return isAtLeast(role, 'admin')
}

/** Can create or assign the Super Admin role (super_admin only). */
export function canManageSuperAdmins(role?: string | null): boolean {
  return isAtLeast(role, 'super_admin')
}

/**
 * Whether `actorRole` may assign `targetRole` to an account.
 * You can grant any role at or below your own level.
 */
export function canAssignRole(actorRole: string | null | undefined, targetRole: Role): boolean {
  return roleLevel(actorRole) >= ROLE_LEVEL[targetRole]
}

/**
 * Whether an actor may modify (change role of / delete) an existing account
 * that currently has `subjectRole`. Requires the actor to be at least as
 * privileged as the subject. Self-modification is handled separately.
 */
export function canManageSubject(actorRole: string | null | undefined, subjectRole: string | null | undefined): boolean {
  return roleLevel(actorRole) >= roleLevel(subjectRole)
}
