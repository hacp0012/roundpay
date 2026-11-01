import React, { useEffect, useState } from "react";
import { User } from "../../types";
import { mockApi } from "../../services/mockApi";
import { Modal } from "../modals/Modal";
import { Button, Input, Label, Select } from "../ui";

type AdminRoleValue = "principal" | "admin";

const ROLE_LABELS: Record<AdminRoleValue, string> = {
  principal: "Principal",
  admin: "Administrateur",
};

interface AdminsViewProps {
  currentAdminId: string;
  onShowToast: (msg: string) => void;
}

export const AdminsView: React.FC<AdminsViewProps> = ({ currentAdminId, onShowToast }) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminRoleValue>("admin");

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      setAdmins(await mockApi.getAdmins());
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de charger les administrateurs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingAdmin(null);
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("admin");
    setIsFormOpen(true);
  };

  const openEditForm = (admin: User) => {
    setEditingAdmin(admin);
    setFormName(admin.name);
    setFormUsername(admin.username || "");
    setFormEmail(admin.email || "");
    setFormPassword("");
    setFormRole(admin.admin_role === "principal" ? "principal" : "admin");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingAdmin) {
        const isSelf = editingAdmin.id === currentAdminId;
        await mockApi.updateAdmin(editingAdmin.id, {
          name: formName.trim(),
          username: formUsername.trim(),
          email: formEmail.trim(),
          ...(formPassword ? { password: formPassword } : {}),
          ...(isSelf ? {} : { role: formRole }),
        });
        onShowToast("Administrateur mis à jour.");
      } else {
        await mockApi.createAdmin({
          name: formName.trim(),
          username: formUsername.trim(),
          password: formPassword,
          email: formEmail.trim() || undefined,
          role: formRole,
        });
        onShowToast("Administrateur créé.");
      }
      setIsFormOpen(false);
      await loadAdmins();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (admin: User) => {
    try {
      await mockApi.setAdminActive(admin.id, !admin.is_active);
      onShowToast(admin.is_active ? "Administrateur désactivé." : "Administrateur réactivé.");
      await loadAdmins();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de modifier le statut.");
    }
  };

  const isEditingSelf = editingAdmin?.id === currentAdminId;

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} modalId="admin-account-form">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="font-sora text-lg font-bold text-[#181c20]">
              {editingAdmin ? "Modifier l'administrateur" : "Nouvel administrateur"}
            </h2>
            <p className="text-xs text-[#777585]">
              Compte d'accès à l'espace administrateur, distinct d'un compte membre.
            </p>
          </div>
          <div>
            <Label htmlFor="admin-form-name">Nom complet</Label>
            <Input id="admin-form-name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="admin-form-username">Identifiant de connexion</Label>
            <Input
              id="admin-form-username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="ex: awa.tresor"
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-form-email">Email (optionnel)</Label>
            <Input id="admin-form-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="admin-form-password">
              {editingAdmin ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
            </Label>
            <Input
              id="admin-form-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required={!editingAdmin}
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="admin-form-role">Rôle</Label>
            <Select
              id="admin-form-role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as AdminRoleValue)}
              disabled={isEditingSelf}
            >
              <option value="admin">Administrateur</option>
              <option value="principal">Principal (gère les administrateurs)</option>
            </Select>
            {isEditingSelf && (
              <p className="text-[11px] text-[#777585] mt-1">Vous ne pouvez pas modifier votre propre rôle.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setIsFormOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">ADMINISTRATION</span>
          <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
            Gestion des administrateurs
          </h1>
          <p className="text-sm text-[#464554]">
            Ajoutez, modifiez ou désactivez les comptes administrateurs. Ces comptes ne sont pas des comptes membres.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          Nouvel administrateur
        </Button>
      </div>

      <div className="bg-white rounded-[28px] border border-[#eceef3] divide-y divide-[#eceef3] overflow-hidden">
        {isLoading && <div className="p-6 text-sm text-[#777585]">Chargement...</div>}

        {!isLoading && admins.length === 0 && (
          <div className="p-6 text-sm text-[#777585]">Aucun administrateur.</div>
        )}

        {!isLoading &&
          admins.map((admin) => {
            const isSelf = admin.id === currentAdminId;
            const isPrincipal = admin.admin_role === "principal";

            return (
              <div key={admin.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sora font-bold text-[#181c20]">{admin.name}</span>
                    {isSelf && <span className="text-[11px] font-semibold text-[#777585]">(vous)</span>}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isPrincipal ? "bg-secondary-container text-[#001943]" : "bg-[#eceef3] text-[#464554]"
                      }`}
                    >
                      {ROLE_LABELS[isPrincipal ? "principal" : "admin"]}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        admin.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {admin.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  <span className="text-xs text-[#777585]">
                    Identifiant : <span className="font-mono text-[#181c20]">{admin.username}</span>
                    {admin.email ? ` · ${admin.email}` : ""}
                    {admin.last_login_at ? ` · Dernière connexion : ${admin.last_login_at}` : " · Jamais connecté"}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" onClick={() => openEditForm(admin)}>
                    Modifier
                  </Button>
                  <Button type="button" disabled={isSelf} onClick={() => handleToggleActive(admin)}>
                    {admin.is_active ? "Désactiver" : "Réactiver"}
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
