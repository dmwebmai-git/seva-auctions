'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users, Plus, ArrowLeft, Loader2, Trash2, Search, Eye, EyeOff, Link2, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ROLES, Role, ROLE_LABELS, ROLE_DESCRIPTIONS, canAssignRole, canManageSubject,
} from '@/lib/roles'

interface ManagedUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: Role
  linkedToSeva: boolean
  createdAt: string
}

const ROLE_BADGE: Record<Role, string> = {
  user: 'bg-gray-100 text-gray-700',
  creator: 'bg-[#94B957]/10 text-[#6D8F3F]',
  admin: 'bg-[#332E28]/10 text-[#332E28]',
  super_admin: 'bg-[#B26B25]/15 text-[#B26B25]',
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user' as Role,
}

export function UserManagement({
  currentUserId,
  currentUserRole,
}: {
  currentUserId: string
  currentUserRole: Role
}) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null)

  // roles this actor is allowed to assign
  const assignableRoles = ROLES.filter((r) => canAssignRole(currentUserRole, r))

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(search)
  }, [load, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(query.trim())
  }

  const handleCreate = async () => {
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')
      toast.success(`${ROLE_LABELS[data.user.role as Role]} account created`)
      setCreateOpen(false)
      setForm({ ...emptyForm })
      setShowPassword(false)
      load(search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (u: ManagedUser, newRole: Role) => {
    if (newRole === u.role) return
    setRoleUpdatingId(u.id)
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)))
      toast.success(`${u.email} is now ${ROLE_LABELS[newRole]}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role')
    } finally {
      setRoleUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      toast.success('Account deleted')
      setDeleteTarget(null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const fullName = (u: ManagedUser) =>
    `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="seva-container">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-[#524C4C] hover:text-[#94B957] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#332E28] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#94B957]" /> User Management
            </h1>
            <p className="text-[#524C4C] mt-1">
              Manage accounts and assign roles across the platform.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#94B957] hover:bg-[#7A9941] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> New Account
          </Button>
        </div>

        {/* Role legend */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ROLES.map((r) => (
                <div key={r} className="flex items-start gap-2">
                  <Badge className={`${ROLE_BADGE[r]} border-0 mt-0.5`}>{ROLE_LABELS[r]}</Badge>
                  <span className="text-xs text-[#524C4C] leading-snug">{ROLE_DESCRIPTIONS[r]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Accounts</span>
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or email"
                    className="pl-9 w-56 h-9 text-sm font-normal"
                  />
                </div>
                <Button type="submit" variant="outline" size="sm" className="h-9">Search</Button>
              </form>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-[#524C4C]">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading accounts…
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-[#524C4C]">No accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#524C4C] border-b">
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Email</th>
                      <th className="py-3 pr-4 font-medium">Seva</th>
                      <th className="py-3 pr-4 font-medium">Joined</th>
                      <th className="py-3 pr-4 font-medium">Role</th>
                      <th className="py-3 pr-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === currentUserId
                      const manageable = !isSelf && canManageSubject(currentUserRole, u.role)
                      // roles selectable for this row: assignable by actor, but never below the
                      // target's current role unless actor outranks; keep it simple — show all
                      // assignable roles, and include the current role so the Select renders it.
                      const options = Array.from(new Set([u.role, ...assignableRoles])) as Role[]
                      return (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 text-[#332E28] font-medium">
                            {fullName(u)}
                            {isSelf && (
                              <span className="ml-2 text-xs text-[#94B957]">(you)</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-[#524C4C]">{u.email}</td>
                          <td className="py-3 pr-4">
                            {u.linkedToSeva ? (
                              <span className="inline-flex items-center text-xs text-[#0DA354]">
                                <Link2 className="w-3 h-3 mr-1" /> Linked
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-[#524C4C] whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                            })}
                          </td>
                          <td className="py-3 pr-4">
                            {manageable ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={u.role}
                                  onValueChange={(v) => handleRoleChange(u, v as Role)}
                                  disabled={roleUpdatingId === u.id}
                                >
                                  <SelectTrigger className="h-8 w-40 bg-white text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    {options.map((r) => (
                                      <SelectItem
                                        key={r}
                                        value={r}
                                        disabled={!canAssignRole(currentUserRole, r)}
                                      >
                                        {ROLE_LABELS[r]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {roleUpdatingId === u.id && (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#94B957]" />
                                )}
                              </div>
                            ) : (
                              <Badge className={`${ROLE_BADGE[u.role]} border-0`}>
                                {u.role === 'super_admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                                {ROLE_LABELS[u.role]}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!manageable}
                              onClick={() => setDeleteTarget(u)}
                              className="text-[#C4443B] hover:text-[#C4443B] hover:bg-[#C4443B]/10 disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create account dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setForm({ ...emptyForm }); setShowPassword(false) } }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Create a fresh account and assign its role. The person can sign in immediately with these credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-[#C4443B]">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password <span className="text-[#C4443B]">*</span></Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters.</p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger id="role" className="mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#94B957] hover:bg-[#7A9941] text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-medium">{deleteTarget?.email}</span> and
              all of their bids, saved and won items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="bg-[#C4443B] hover:bg-[#a83a32] text-white"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
