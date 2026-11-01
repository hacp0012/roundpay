import React, { useMemo, useState } from 'react';
import { Group, User, FicheContribution } from '../../types';
import { Modal } from '../modals/Modal';
import { MemberAvatar } from '../common/MemberAvatar';
import { Button, Input, Label, Select } from '../ui';
import { formatMoney } from '../../config/currency';

interface GroupsViewProps {
  groups: Group[];
  users: User[];
  fiches: FicheContribution[];
  onOpenFicheDetail: (ficheId: string) => void;
  onCreateGroup: (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    periodicite?: string;
  }) => Promise<void>;
  onUpdateGroup: (
    groupId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      periodicite?: string;
    },
  ) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onAddMemberToGroup: (groupId: string, userId: string) => Promise<void>;
  onRemoveMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
  onShowToast: (msg: string) => void;
}

const ICON_OPTIONS = ['groups', 'diversity_3', 'public', 'shield_person', 'volunteer_activism', 'account_balance'];
const COLOR_OPTIONS = ['#3f3bbd', '#047857', '#b45309', '#be123c', '#475e90', '#111418'];

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  users,
  fiches,
  onOpenFicheDetail,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddMemberToGroup,
  onRemoveMemberFromGroup,
  onShowToast,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPeriodicite, setGroupPeriodicite] = useState('Mensuelle');
  const [groupColor, setGroupColor] = useState(COLOR_OPTIONS[0]);
  const [groupIcon, setGroupIcon] = useState(ICON_OPTIONS[0]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState('');

  const groupMembers = useMemo(
    () => users.filter((u) => selectedGroup && u.group_ids.includes(selectedGroup.id)),
    [users, selectedGroup],
  );
  const groupFiches = useMemo(
    () => fiches.filter((f) => selectedGroup && f.group_id === selectedGroup.id),
    [fiches, selectedGroup],
  );
  const candidates = useMemo(
    () =>
      users.filter(
        (u) => u.is_member && selectedGroup && !u.group_ids.includes(selectedGroup.id),
      ),
    [users, selectedGroup],
  );

  const totalCreditGroup = groupMembers.reduce((sum, u) => sum + (u.solde_credit || 0), 0);

  const openCreateModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupPeriodicite('Mensuelle');
    setGroupColor(COLOR_OPTIONS[0]);
    setGroupIcon(ICON_OPTIONS[0]);
    setIsGroupModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setGroupPeriodicite(group.periodicite || 'Mensuelle');
    setGroupColor(group.color || COLOR_OPTIONS[0]);
    setGroupIcon(group.icon || ICON_OPTIONS[0]);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      onShowToast('Le nom du groupe est obligatoire.');
      return;
    }
    setIsSavingGroup(true);
    try {
      const payload = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        periodicite: groupPeriodicite,
        color: groupColor,
        icon: groupIcon,
      };
      if (editingGroup) {
        await onUpdateGroup(editingGroup.id, payload);
        onShowToast('Groupe mis à jour.');
      } else {
        await onCreateGroup(payload);
        onShowToast('Groupe créé.');
      }
      setIsGroupModalOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast("Échec de l'enregistrement du groupe.");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!window.confirm(`Supprimer le groupe « ${group.name} » ?`)) return;
    try {
      await onDeleteGroup(group.id);
      if (selectedGroupId === group.id) {
        setSelectedGroupId(groups.find((g) => g.id !== group.id)?.id || '');
      }
      onShowToast('Groupe supprimé.');
    } catch (err) {
      console.error(err);
      onShowToast('Suppression impossible (groupe peut-être lié à des fiches).');
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !memberToAdd) return;
    try {
      await onAddMemberToGroup(selectedGroup.id, memberToAdd);
      setMemberToAdd('');
      setIsAddMemberOpen(false);
      onShowToast('Membre ajouté au groupe.');
    } catch (err) {
      console.error(err);
      onShowToast("Impossible d'ajouter ce membre.");
    }
  };

  if (!selectedGroup && groups.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-6 border border-[#eceef3] text-center space-y-4">
        <h1 className="font-sora text-2xl font-bold text-[#181c20]">Aucun groupe pour l’instant</h1>
        <p className="text-sm text-[#777585]">Créez votre premier groupe de cotisation.</p>
        <Button type="button" onClick={openCreateModal}>
          Créer un groupe
        </Button>
        <Modal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          modalId="group-form-empty"
          panelClassName="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-[#eceef3] my-auto"
        >
          <form onSubmit={handleSaveGroup} className="space-y-3">
            <h3 className="font-sora text-base font-bold">Nouveau groupe</h3>
            <div>
              <Label>Nom</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={isSavingGroup} className="w-full">
              Créer
            </Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            COMMUNAUTÉS &amp; TONTINES
          </span>
          <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
            Groupes de cotisation
          </h1>
          <p className="text-sm text-[#464554]">
            Créez des groupes, gérez leurs membres et assignez des fiches obligatoires.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <span className="material-symbols-outlined text-[16px]">add</span>
          Nouveau groupe
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroup?.id;
          const count = users.filter((u) => u.group_ids.includes(group.id)).length;
          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`p-5 rounded-[24px] cursor-pointer transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-secondary-container text-[#001943] border-primary shadow-[0_8px_24px_-4px_rgb(var(--app-color-rgb)/0.2)]'
                  : 'bg-white text-[#181c20] border-[#eceef3] hover:border-secondary-container'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-[#181c20] text-white' : 'bg-[#f1f4f9] text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{group.icon}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(group);
                    }}
                    className="p-1 rounded-lg hover:bg-white/60 text-[#464554]"
                    title="Modifier"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteGroup(group);
                    }}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-600"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-sora text-base font-bold truncate">{group.name}</h2>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected ? 'bg-white/80 text-[#001943]' : 'bg-[#f1f4f9] text-[#464554]'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                {group.periodicite && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#777585]">
                    {group.periodicite}
                  </span>
                )}
                <p
                  className={`text-xs mt-1 line-clamp-2 ${
                    isSelected ? 'text-[#2e4676]' : 'text-[#777585]'
                  }`}
                >
                  {group.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedGroup && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-[32px] p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="font-sora text-lg font-bold text-[#181c20]">
                  Membres · {selectedGroup.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#f1f4f9] text-[#464554] text-xs font-semibold">
                  {groupMembers.length} adhérents
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setMemberToAdd(candidates[0]?.id || '');
                  setIsAddMemberOpen(true);
                }}
                disabled={candidates.length === 0}
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Ajouter un membre
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#eceef3] text-[#777585] uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-2.5 px-3">Adhérent</th>
                    <th className="py-2.5 px-2">Téléphone</th>
                    <th className="py-2.5 px-2">Rôle</th>
                    <th className="py-2.5 px-3">Avance</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef3]/60">
                  {groupMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-[#f7f9fe] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar src={member.avatar} name={member.name} className="w-8 h-8" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[#181c20]">{member.name}</span>
                            <span className="font-mono text-[10px] text-[#777585]">{member.member_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-[#464554]">{member.phone}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#f1f4f9] text-[#464554] text-[10px] font-semibold uppercase">
                          {member.role === 'admin' ? 'Trésorier' : 'Membre'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono font-bold text-[#181c20]">
                          {formatMoney(member.solde_credit || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => void onRemoveMemberFromGroup(selectedGroup.id, member.id).then(() => onShowToast('Membre retiré du groupe.'))}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {groupMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#777585]">
                        Aucun membre dans ce groupe. Ajoutez-en depuis le bouton ci-dessus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sora text-base font-bold text-[#181c20]">Fiches du groupe</h2>
                <span className="text-xs text-primary font-bold">{groupFiches.length} actives</span>
              </div>

              <div className="flex flex-col gap-3">
                {groupFiches.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onOpenFicheDetail(f.id)}
                    className="p-3.5 bg-[#f7f9fe] hover:bg-[#eceef3] rounded-2xl border border-[#e0e2e7]/80 cursor-pointer transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">{f.code}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {f.montant_impose != null ? `${formatMoney(f.montant_impose)} / pers.` : 'Libre'}
                      </span>
                    </div>
                    <span className="font-semibold text-sm text-[#181c20]">{f.titre}</span>
                  </div>
                ))}
                {groupFiches.length === 0 && (
                  <p className="text-xs text-[#777585]">Aucune fiche rattachée à ce groupe.</p>
                )}
              </div>
            </div>

            <div className="bg-secondary-container text-[#001943] rounded-[28px] p-6 shadow-sm flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2e4676]">
                Crédits d’avance dans ce groupe
              </span>
              <span className="font-sora text-3xl font-bold">{formatMoney(totalCreditGroup)}</span>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        modalId="group-form"
        panelClassName="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-[#eceef3] my-auto"
      >
        <form onSubmit={handleSaveGroup} className="space-y-3">
          <h3 className="font-sora text-base font-bold text-[#181c20]">
            {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe de cotisation'}
          </h3>
          <div>
            <Label htmlFor="group-name">Nom</Label>
            <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="group-desc">Description</Label>
            <Input id="group-desc" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="group-period">Périodicité</Label>
            <Select id="group-period" value={groupPeriodicite} onChange={(e) => setGroupPeriodicite(e.target.value)}>
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Mensuelle">Mensuelle</option>
              <option value="Trimestrielle">Trimestrielle</option>
              <option value="Annuelle">Annuelle</option>
              <option value="Libre">Libre</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Icône</Label>
              <Select value={groupIcon} onChange={(e) => setGroupIcon(e.target.value)}>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Couleur</Label>
              <Select value={groupColor} onChange={(e) => setGroupColor(e.target.value)}>
                {COLOR_OPTIONS.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsGroupModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSavingGroup}>
              {isSavingGroup ? 'Enregistrement…' : editingGroup ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        modalId="group-add-member"
        panelClassName="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-[#eceef3] my-auto"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-sora text-base font-bold text-[#181c20]">Ajouter un membre</h3>
            <p className="text-xs text-[#777585] mt-1">
              Sélectionnez un membre existant à rattacher à {selectedGroup?.name}.
            </p>
          </div>
          <div>
            <Label>Membre</Label>
            <Select value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)}>
              <option value="">Choisir…</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.phone}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>Annuler</Button>
            <Button type="button" onClick={() => void handleAddMember()} disabled={!memberToAdd}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
