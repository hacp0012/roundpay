export type UserRole = 'admin' | 'member';
export type AppCurrency = 'CDF' | 'USD';

export interface User {
  id: string;
  member_number: string;
  name: string;
  phone: string;
  pin?: string;
  password?: string;
  username?: string;
  email?: string;
  avatar: string;
  is_member: boolean;
  role: UserRole;
  solde_credit: number;
  group_ids: string[];
  created_at?: string;
  admin_role?: 'principal' | 'admin';
  is_principal?: boolean;
  is_active?: boolean;
  last_login_at?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  periodicite?: string | null;
  member_count: number;
}

export type FicheType = 'obligatoire' | 'libre';
export type FicheStatus = 'ouverte' | 'fermee' | 'terminee';

export interface FicheContribution {
  id: string;
  code: string;
  titre: string;
  motif: string;
  type: FicheType;
  group_id: string | null;
  montant_impose: number | null;
  cagnotte_cible?: number;
  date_debut: string;
  date_fin: string | null;
  statut: FicheStatus;
  created_at: string;
  description?: string;
  is_public?: boolean;
  beneficiaire?: string;
  categorie?: string;
}

export interface ContactMessageItem {
  id: string;
  nom: string;
  contact: string;
  email: string | null;
  objet: string;
  message: string;
  reply_message?: string | null;
  replied_at?: string | null;
  created_at?: string;
}

export interface RemindResult {
  late: number;
  sent: number;
  without_email: number;
}

export interface PublicPortalSettings {
  nom_collectif: string;
  slogan: string;
  about_us: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_adresse: string;
  contact_horaires: string;
  message_bienvenue: string;
  devise?: AppCurrency;
  updated_at?: string;
}

export type ContributorStatus = 'paye' | 'partiel' | 'retard' | 'paye_avance';

export interface MemberFicheRecord {
  user_id: string;
  fiche_id: string;
  montant_impose: number;
  montant_paye: number;
  reste: number;
  statut: ContributorStatus;
  last_payment_date?: string;
}

export type MobileMoneyProvider = 'orange_money' | 'mpesa' | 'airtel_money' | 'mtn_momo' | 'wave' | 'cash_guichet';

export interface Payment {
  id: string;
  fiche_id: string;
  fiche_titre?: string;
  user_id: string | null;
  nom_donateur_libre?: string;
  is_anonymous: boolean;
  montant: number;
  date: string;
  mobile_provider: MobileMoneyProvider;
  phone_number?: string;
  reference: string;
  statut: 'valide' | 'en_attente' | 'echoue';
  payment_gateway?: 'local' | 'maishapay' | 'flexpay' | null;
  currency?: AppCurrency | null;
  gateway_order_number?: string | null;
  provider_reference?: string | null;
  allocation?: {
    regle_fiche: number;
    credite_solde: number;
  };
  note?: string;
}

export interface PaymentRecordResult {
  payment: Payment;
  userUpdated?: User | null;
  allocation?: {
    regle_fiche: number;
    credite_solde: number;
  } | null;
  pending: boolean;
}

export interface DepenseProjet {
  id: string;
  titre: string;
  montant: number;
  date: string;
  categorie: string;
  description: string;
  cree_par: string;
  preuve_ref?: string;
  preuve_disponible?: boolean;
}

export interface TreasuryOverview {
  solde_total_caisse: number;
  total_collecte: number;
  total_depense: number;
  total_solde_credits: number;
  fiches_obligatoires_count: number;
  collectes_libres_count: number;
  cotisants_a_jour_count: number;
  cotisants_total_count: number;
  donateurs_actifs_count: number;
}
