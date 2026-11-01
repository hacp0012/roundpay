import React, { useState } from 'react';
import { User, Group, UserRole } from '../../types';
import { Modal } from '../../components/modals/Modal';
import { MemberAvatar } from '../../components/common/MemberAvatar';
import { Button, Input, Label, Select } from '../../components/ui';
import { formatMoney } from '../../config/currency';
import { APP_NAME } from '../../config/branding';

interface AdminMembersPageProps {
  users: User[];
  groups: Group[];
  onOpenAddMemberModal: () => void;
  onUpdateMemberPin: (userId: string, newPin: string) => Promise<void>;
  onUpdateMember: (userId: string, data: Partial<User>) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const AdminMembersPage: React.FC<AdminMembersPageProps> = ({
  users,
  groups,
  onOpenAddMemberModal,
  onUpdateMemberPin,
  onUpdateMember,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [editingPinUser, setEditingPinUser] = useState<User | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editSolde, setEditSolde] = useState('0');
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [isSavingMember, setIsSavingMember] = useState(false);

  const members = users.filter((u) => u.is_member);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.member_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroupFilter === 'all' || m.group_ids.includes(selectedGroupFilter);

    return matchesSearch && matchesGroup;
  });

  const openEditMember = (member: User) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditPhone(member.phone);
    setEditEmail(member.email || '');
    setEditRole(member.role);
    setEditSolde(String(member.solde_credit || 0));
    setEditGroupIds([...member.group_ids]);
  };

  const toggleEditGroup = (groupId: string) => {
    setEditGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  const handleCopyCredentials = (user: User) => {
    const text = `Bonjour ${user.name},\nVoici vos identifiants pour accéder à votre espace ${APP_NAME} :\n- Téléphone : ${user.phone}\n- Code PIN : à demander / définir auprès de la trésorerie\nAccédez à votre compte pour suivre vos cotisations et tontines.`;
    navigator.clipboard.writeText(text);
    onShowToast(`Coordonnées de ${user.name} copiées (PIN non exposé).`);
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPinUser || !newPinValue.trim()) return;
    await onUpdateMemberPin(editingPinUser.id, newPinValue.trim());
    onShowToast(`Code PIN de ${editingPinUser.name} mis à jour.`);
    setEditingPinUser(null);
    setNewPinValue('');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingMember(true);
    try {
      await onUpdateMember(editingMember.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        role: editRole,
        solde_credit: parseFloat(editSolde) || 0,
        group_ids: editGroupIds,
      });
      onShowToast(`Fiche de ${editName.trim()} mise à jour.`);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
      onShowToast('Impossible de modifier ce membre.');
    } finally {
      setIsSavingMember(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-sm border border-[#eceef3] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Gestion des Membres
            </span>
            <span className="text-xs text-[#777585]">
              {members.length} membres enregistrés
            </span>
          </div>
          <h1 className="font-sora text-2xl font-bold text-[#181c20]">
            Répertoire des Membres du Collectif
          </h1>
          <p className="text-xs text-[#777585] mt-1 max-w-xl">
            Modifiez les infos, les groupes et le PIN. Le code PIN n’apparaît plus dans le tableau.
          </p>
        </div>

        <button
          type="button"
          id="btn-open-add-member"
          onClick={onOpenAddMemberModal}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Ajouter un membre</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777585] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom, tél, N° membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs font-semibold text-[#181c20] placeholder:text-[#777585] border border-[#e0e2e7] focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-[#777585] whitespace-nowrap font-medium">Groupe :</label>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e0e2e7] rounded-full text-xs font-bold text-[#181c20] focus:outline-none"
          >
            <option value="all">Tous les groupes ({members.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-[#eceef3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f9fe] border-b border-[#eceef3] text-[#777585] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Membre</th>
                <th className="py-3.5 px-4">Identifiant Téléphone</th>
                <th className="py-3.5 px-4">Groupes / Tontines</th>
                <th className="py-3.5 px-4">Solde Avance</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f9]">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#f7f9fe]/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        src={member.avatar}
                        name={member.name}
                        className="w-10 h-10 border border-[#e0e2e7]"
                      />
                      <div>
                        <div className="font-bold text-[#181c20] text-sm flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.role === 'admin' && (
                            <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#777585] font-mono">
                          {member.member_number}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[#181c20]">
                    {member.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {member.group_ids.map((gid) => {
                        const grp = groups.find((g) => g.id === gid);
                        return (
                          <span
                            key={gid}
                            className="px-2 py-0.5 rounded-md bg-secondary-container/25 text-[#001943] text-[10px] font-semibold"
                          >
                            {grp ? grp.name : gid}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                        member.solde_credit > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#f1f4f9] text-[#777585]'
                      }`}
                    >
                      {member.solde_credit > 0
                        ? `+${formatMoney(member.solde_credit)}`
                        : formatMoney(0)}
                    </span>
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditMember(member)}
                        title="Modifier les informations"
                        className="p-1.5 rounded-lg text-[#777585] hover:text-primary hover:bg-secondary-container/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(member)}
                        title="Copier les coordonnées"
                        className="p-1.5 rounded-lg text-[#777585] hover:text-primary hover:bg-secondary-container/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPinUser(member);
                          setNewPinValue('');
                        }}
                        title="Modifier le code PIN"
                        className="p-1.5 rounded-lg text-[#777585] hover:text-[#181c20] hover:bg-[#eceef3] transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">password</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        modalId="admin-edit-member"
        panelClassName="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl border border-[#eceef3] my-auto"
      >
        {editingMember && (
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div>
              <h3 className="font-sora text-base font-bold text-[#181c20]">Modifier le membre</h3>
              <p className="text-xs text-[#777585] mt-1">
                {editingMember.member_number} · PIN masqué (utilisez l’action dédiée pour le changer)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="edit-member-name">Nom complet</Label>
                <Input id="edit-member-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="edit-member-phone">Téléphone</Label>
                <Input id="edit-member-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="edit-member-email">Email</Label>
                <Input id="edit-member-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-member-role">Rôle</Label>
                <Select id="edit-member-role" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                  <option value="member">Membre</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-member-solde">Solde d’avance</Label>
                <Input id="edit-member-solde" type="number" step="0.01" value={editSolde} onChange={(e) => setEditSolde(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Groupes de cotisation</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {groups.map((group) => {
                  const active = editGroupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleEditGroup(group.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                        active
                          ? 'bg-action text-white border-action'
                          : 'bg-white text-[#464554] border-[#e0e2e7] hover:bg-[#f7f9fe]'
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSavingMember}>
                {isSavingMember ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!editingPinUser}
        onClose={() => setEditingPinUser(null)}
        modalId="admin-pin"
        panelClassName="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-[#eceef3] my-auto"
      >
        {editingPinUser && (
          <>
            <h3 className="font-sora text-base font-bold text-[#181c20] mb-1">
              Changer le code PIN
            </h3>
            <p className="hidden lg:block text-xs text-[#777585] mb-4">
              Modifier le code PIN de <strong>{editingPinUser.name}</strong> ({editingPinUser.phone})
            </p>

            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#181c20] mb-1">
                  Nouveau Code PIN (4 à 6 chiffres)
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  maxLength={6}
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPinUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#464554] hover:bg-[#f1f4f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-bold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
};
