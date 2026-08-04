'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { UserPlus, MoreVertical, Shield, ShieldCheck, Wrench, Truck, User } from 'lucide-react';

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-red-400' },
  shop_admin: { label: 'Shop Admin', icon: Shield, color: 'text-wg-blue' },
  service_advisor: { label: 'Service Advisor', icon: User, color: 'text-wg-green' },
  technician: { label: 'Technician', icon: Wrench, color: 'text-wg-amber' },
  delivery_specialist: { label: 'Delivery Specialist', icon: Truck, color: 'text-purple-400' },
  customer: { label: 'Customer', icon: User, color: 'text-wg-muted' },
};

const ASSIGNABLE_ROLES = ['shop_admin', 'service_advisor', 'technician', 'delivery_specialist'];

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

interface Props {
  members: MemberRow[];
  orgId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function TeamManagement({ members, orgId, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('technician');
  const [inviting, setInviting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'shop_admin' || currentUserRole === 'super_admin';
  const validMembers = members.filter((m) => m.user != null);
  const activeMembers = validMembers.filter((m) => m.is_active);
  const inactiveMembers = validMembers.filter((m) => !m.is_active);

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setInviting(true);
    setError(null);

    const supabase = createClient();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', inviteEmail)
      .single();

    let userId = existingUser?.id;

    if (!userId) {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, fullName: inviteName, organizationId: orgId, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to invite');
        setInviting(false);
        return;
      }
      userId = data.userId;
    } else {
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({ user_id: userId, organization_id: orgId, role: inviteRole, is_active: true });

      if (membershipError) {
        setError(membershipError.message);
        setInviting(false);
        return;
      }
    }

    setInviting(false);
    setShowInvite(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('technician');
    router.refresh();
  }

  async function handleRoleChange(membershipId: string, newRole: string) {
    const supabase = createClient();
    await supabase
      .from('memberships')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', membershipId);
    setEditingId(null);
    router.refresh();
  }

  async function handleToggleActive(membershipId: string, isActive: boolean) {
    const supabase = createClient();
    await supabase
      .from('memberships')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', membershipId);
    setEditingId(null);
    router.refresh();
  }

  function getInitials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-wg-text">
          Team Members <span className="text-wg-muted font-normal">({activeMembers.length})</span>
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-3 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90"
          >
            <UserPlus size={16} />
            Add Member
          </button>
        )}
      </div>

      {/* Invite dialog */}
      {showInvite && (
        <div className="bg-wg-card border border-wg-border rounded-xl p-5 mb-5">
          <h3 className="text-sm font-medium text-wg-text mb-3">Add Team Member</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-wg-muted mb-1">Full Name</label>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 bg-wg-bg border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-wg-muted mb-1">Email</label>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@example.com"
                type="email"
                className="w-full px-3 py-2 bg-wg-bg border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-wg-muted mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 bg-wg-bg border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>
              ))}
            </select>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail || !inviteName}
              className="px-4 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90 disabled:opacity-50"
            >
              {inviting ? 'Adding...' : 'Add Member'}
            </button>
            <button
              onClick={() => { setShowInvite(false); setError(null); }}
              className="px-4 py-2 bg-wg-card border border-wg-border text-wg-text2 rounded-lg text-sm hover:text-wg-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active members table */}
      <div className="bg-wg-card border border-wg-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-wg-border">
              <th className="text-left py-3 px-4 text-xs text-wg-muted font-medium uppercase">Member</th>
              <th className="text-left py-3 px-4 text-xs text-wg-muted font-medium uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs text-wg-muted font-medium uppercase">Contact</th>
              {isAdmin && <th className="text-right py-3 px-4 text-xs text-wg-muted font-medium uppercase w-20">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {activeMembers.map((member) => {
              const roleInfo = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.customer;
              const RoleIcon = roleInfo.icon;
              const isSelf = member.user_id === currentUserId;
              const isEditing = editingId === member.id;

              return (
                <tr key={member.id} className="border-b border-wg-border/50 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-wg-bg2 flex items-center justify-center text-xs font-medium text-wg-text2">
                        {getInitials(member.user.full_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-wg-text">
                          {member.user.full_name}
                          {isSelf && <span className="text-wg-muted text-xs ml-2">(you)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="px-2 py-1 bg-wg-bg border border-wg-border rounded text-sm text-wg-text"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RoleIcon size={14} className={roleInfo.color} />
                        <span className="text-sm text-wg-text2">{roleInfo.label}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-wg-text2">{member.user.email}</p>
                    {member.user.phone && <p className="text-xs text-wg-muted">{member.user.phone}</p>}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      {!isSelf && (
                        <div className="relative">
                          <button
                            onClick={() => setEditingId(isEditing ? null : member.id)}
                            className="p-1.5 rounded hover:bg-wg-bg2 text-wg-muted hover:text-wg-text transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {isEditing && (
                            <div className="absolute right-0 top-8 bg-wg-card border border-wg-border rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                              <button
                                onClick={() => handleToggleActive(member.id, member.is_active)}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-wg-bg2"
                              >
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-wg-muted mb-3">Deactivated ({inactiveMembers.length})</h3>
          <div className="bg-wg-card border border-wg-border rounded-xl overflow-hidden opacity-60">
            <table className="w-full">
              <tbody>
                {inactiveMembers.map((member) => {
                  const roleInfo = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.customer;
                  return (
                    <tr key={member.id} className="border-b border-wg-border/50 last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-wg-bg2 flex items-center justify-center text-xs font-medium text-wg-text2">
                            {getInitials(member.user.full_name)}
                          </div>
                          <p className="text-sm text-wg-text">{member.user.full_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-wg-muted">{roleInfo.label}</td>
                      <td className="py-3 px-4 text-sm text-wg-muted">{member.user.email}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleActive(member.id, member.is_active)}
                            className="text-xs text-wg-blue hover:underline"
                          >
                            Reactivate
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
