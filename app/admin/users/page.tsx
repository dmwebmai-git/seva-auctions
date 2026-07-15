import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManageUsers, normalizeRole } from '@/lib/roles'
import { UserManagement } from '@/components/admin/user-management'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect('/auth/login')
  }
  return (
    <UserManagement
      currentUserId={session.user.id}
      currentUserRole={normalizeRole(session.user.role)}
    />
  )
}
