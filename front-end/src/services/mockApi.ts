import {
  User,
  Group,
  FicheContribution,
  MemberFicheRecord,
  Payment,
  DepenseProjet,
  TreasuryOverview,
  MobileMoneyProvider,
  UserRole,
  PublicPortalSettings,
  PaymentRecordResult,
  ContactMessageItem,
  RemindResult,
} from '../types';
import { apiDownload, apiPostForm, questGet, questPost, questPostForm, setQuestToken } from './questClient';

export function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/[^\d+]/g, '').trim();
}

export function comparePhones(p1: string, p2: string): boolean {
  const clean1 = normalizePhone(p1);
  const clean2 = normalizePhone(p2);
  if (clean1 === clean2) return true;
  const digits1 = clean1.replace(/^\+/, '').replace(/^0+/, '');
  const digits2 = clean2.replace(/^\+/, '').replace(/^0+/, '');
  if (digits1 === digits2) return true;
  if (digits1.length >= 8 && digits2.length >= 8) {
    return digits1.slice(-8) === digits2.slice(-8);
  }
  return false;
}

type AuthPayload = { user: User; token: string } | null;

export class MockApiService {
  public async loginClient(phone: string, pin: string): Promise<User | null> {
    const result = await questPost<AuthPayload>('auth.login.client', { phone, pin });
    if (!result?.user || !result.token) return null;
    setQuestToken(result.token);
    return result.user;
  }

  public async loginAdmin(username: string, password: string): Promise<User | null> {
    const result = await questPost<AuthPayload>('auth.login.admin', { username, password });
    if (!result?.user || !result.token) return null;
    setQuestToken(result.token);
    return result.user;
  }

  public async me(): Promise<User | null> {
    const result = await questGet<{ user: User } | null>('auth.me');
    return result?.user ?? null;
  }

  public async logout(): Promise<void> {
    try {
      await questPost<boolean>('auth.logout');
    } finally {
      setQuestToken(null);
    }
  }

  public async addMember(data: {
    name: string;
    phone: string;
    pin: string;
    email?: string;
    solde_credit?: number;
    group_ids?: string[];
    avatar?: string;
  }): Promise<User> {
    return questPost<User>('users.add', { ...data });
  }

  public async updateMemberPin(userId: string, newPin: string): Promise<boolean> {
    return questPost<boolean>('users.update.pin', { userId, newPin });
  }

  public async updateMember(userId: string, data: Partial<User>): Promise<User | null> {
    return questPost<User | null>('users.update', { userId, data });
  }

  public async updateProfile(data: {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
  }): Promise<User> {
    return questPost<User>('users.profile.update', { ...data });
  }

  public async getAdmins(): Promise<User[]> {
    return questGet<User[]>('admins.list');
  }

  public async createAdmin(data: {
    name: string;
    username: string;
    password: string;
    email?: string;
    role: 'principal' | 'admin';
  }): Promise<User> {
    return questPost<User>('admins.create', { ...data });
  }

  public async updateAdmin(
    adminId: string,
    data: {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: 'principal' | 'admin';
    },
  ): Promise<User> {
    return questPost<User>('admins.update', { adminId, data });
  }

  public async setAdminActive(adminId: string, isActive: boolean): Promise<User> {
    return questPost<User>('admins.setActive', { adminId, isActive });
  }

  public async updateAvatar(photo: File): Promise<User> {
    const form = new FormData();
    form.append('photo', photo);
    return questPostForm<User>('users.avatar.update', form);
  }

  public async getGroups(): Promise<Group[]> {
    return questGet<Group[]>('groups.list');
  }

  public async createGroup(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    periodicite?: string;
  }): Promise<Group> {
    return questPost<Group>('groups.create', { ...data });
  }

  public async updateGroup(
    groupId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      periodicite?: string;
    },
  ): Promise<Group | null> {
    return questPost<Group | null>('groups.update', { groupId, ...data });
  }

  public async deleteGroup(groupId: string): Promise<boolean> {
    return questPost<boolean>('groups.delete', { groupId });
  }

  public async addMemberToGroup(groupId: string, userId: string): Promise<Group> {
    return questPost<Group>('groups.members.add', { groupId, userId });
  }

  public async removeMemberFromGroup(groupId: string, userId: string): Promise<Group> {
    return questPost<Group>('groups.members.remove', { groupId, userId });
  }

  public async setGroupMembers(groupId: string, user_ids: string[]): Promise<Group> {
    return questPost<Group>('groups.members.set', { groupId, user_ids });
  }

  public async getTreasuryOverview(): Promise<TreasuryOverview> {
    return questGet<TreasuryOverview>('treasury.overview');
  }

  public async getUsers(): Promise<User[]> {
    return questGet<User[]>('users.list');
  }

  public async getUserById(id: string): Promise<User | null> {
    return questGet<User | null>('users.get', { id });
  }

  public async getFiches(): Promise<FicheContribution[]> {
    return questGet<FicheContribution[]>('fiches.list');
  }

  public async getFicheById(id: string): Promise<FicheContribution | null> {
    return questGet<FicheContribution | null>('fiches.get', { id });
  }

  public async getMemberRecordsForFiche(fiche_id: string): Promise<MemberFicheRecord[]> {
    return questGet<MemberFicheRecord[]>('fiches.records', { fiche_id });
  }

  public async createFiche(data: {
    titre: string;
    motif: string;
    description?: string;
    type: 'obligatoire' | 'libre';
    group_id: string | null;
    montant_impose: number | null;
    cagnotte_cible?: number;
    date_debut: string;
    date_fin: string | null;
    is_public?: boolean;
    beneficiaire?: string;
    categorie?: string;
  }): Promise<FicheContribution> {
    return questPost<FicheContribution>('fiches.create', { ...data });
  }

  public async recordPayment(payload: {
    fiche_id: string;
    user_id: string | null;
    nom_donateur_libre?: string;
    is_anonymous?: boolean;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    phone_number?: string;
    reference?: string;
    note?: string;
  }): Promise<PaymentRecordResult> {
    return questPost<PaymentRecordResult>('payments.record', { ...payload });
  }

  public async useCreditWallet(user_id: string, fiche_id: string, amountToUse: number): Promise<boolean> {
    return questPost<boolean>('credit.use', { user_id, fiche_id, amountToUse });
  }

  public async getPayments(): Promise<Payment[]> {
    return questGet<Payment[]>('payments.list');
  }

  public async getDepenses(): Promise<DepenseProjet[]> {
    return questGet<DepenseProjet[]>('depenses.list');
  }

  public async addDepense(data: {
    titre: string;
    montant: number;
    categorie: string;
    description: string;
    cree_par: string;
    preuve?: File | null;
  }): Promise<DepenseProjet> {
    const form = new FormData();
    form.append('titre', data.titre);
    form.append('montant', String(data.montant));
    form.append('categorie', data.categorie);
    form.append('description', data.description);
    if (data.preuve) {
      form.append('preuve', data.preuve);
    }
    return apiPostForm<DepenseProjet>('depenses', form);
  }

  public async downloadDepenseProof(depenseId: string, filename: string): Promise<void> {
    return apiDownload(`depenses/${encodeURIComponent(depenseId)}/preuve`, filename);
  }

  public async getPublicSettings(): Promise<PublicPortalSettings> {
    return questGet<PublicPortalSettings>('portal.settings.get');
  }

  public async updatePublicSettings(newSettings: Partial<PublicPortalSettings>): Promise<PublicPortalSettings> {
    return questPost<PublicPortalSettings>('portal.settings.update', { settings: newSettings });
  }

  public async getPublicFiches(): Promise<FicheContribution[]> {
    return questGet<FicheContribution[]>('portal.fiches.list');
  }

  public async sendContactMessage(data: {
    nom: string;
    contact?: string;
    objet: string;
    message: string;
  }): Promise<{ id: string; received: boolean }> {
    return questPost<{ id: string; received: boolean }>('portal.contact.send', { ...data });
  }

  public async getContactMessages(): Promise<ContactMessageItem[]> {
    return questGet<ContactMessageItem[]>('portal.contacts.list');
  }

  public async replyToContactMessage(
    messageId: string,
    body: string,
  ): Promise<{ id: string; email: string; reply_message: string; replied_at?: string }> {
    return questPost<{ id: string; email: string; reply_message: string; replied_at?: string }>(
      'portal.contacts.reply',
      { messageId, body },
    );
  }

  public async remindLateMembers(ficheId: string): Promise<RemindResult> {
    return questPost<RemindResult>('fiches.remind', { ficheId });
  }

  public async toggleFichePublicStatus(ficheId: string, isPublic: boolean): Promise<FicheContribution | null> {
    return questPost<FicheContribution | null>('fiches.toggle.public', { ficheId, isPublic });
  }

  public async updateFiche(ficheId: string, updates: Partial<FicheContribution>): Promise<FicheContribution | null> {
    return questPost<FicheContribution | null>('fiches.update', { ficheId, updates });
  }

  public async getPaymentsForFiche(fiche_id: string): Promise<Payment[]> {
    return questGet<Payment[]>('payments.forFiche', { fiche_id });
  }

  public resetToDefault() {
    console.warn('Réinitialisation distante non disponible : les données vivent désormais en base.');
  }
}

export const mockApi = new MockApiService();
