export type Operateur = "mtn" | "moov" | "celtiis";
export type TypeJob = "forfait" | "transfert";
export type SousTypeForfait = "internet" | "appel" | "illimite" | "gopack" | "maxi" | "mymix";
export type Palier = "jour" | "semaine" | "mois";
export type StatutJob =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "refunded";

export interface UssdStep {
  /** Ce que le bot doit envoyer à cette étape (numéro composé, ou réponse à un menu) */
  input: string;
  /** Description humaine pour le dashboard / debug */
  label?: string;
  /** Délai d'attente (ms) avant l'étape suivante */
  waitMs?: number;
}

export interface UssdCode {
  id: string; // ex: "mtn_forfait_internet_jour"
  operateur: Operateur;
  categorie: string; // "forfait" | "transfert" | "retrait" | "commission" | "credit_simple" | ...
  label: string; // libellé humain affiché à l'admin
  /**
   * Séquence brute façon USSD classique, ex: "*840*123*1*{numero}#"
   * Placeholders possibles : {numero}, {montant}, {code}, {numero2}
   */
  sequenceBrute: string;
  /**
   * Étapes détaillées si le code nécessite une navigation menu par menu
   * (laisser vide si sequenceBrute suffit en un seul jet)
   */
  etapes?: UssdStep[];
  actif: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface MessageUssd {
  id: string; // ex: "mtn_success" / "mtn_solde_insuffisant"
  operateur: Operateur;
  type: "success" | "solde_insuffisant" | "numero_invalide" | "erreur_generique" | "timeout";
  /** Sous-chaîne(s) à rechercher dans la réponse USSD brute pour matcher ce cas, séparées par | */
  motsClesDetection: string;
  messageAffichéClient: string;
  actif: boolean;
  updatedAt?: number;
}

export interface Job {
  id: string;
  clientUid: string;
  clientPhone: string;
  type: TypeJob;
  operateur: Operateur;
  sousType?: SousTypeForfait;
  palier?: Palier;
  ussdCodeId: string;
  montant: number;
  numeroClient: string;
  feexpayTransactionId: string;
  montantPaye: number;
  frais: number;
  statut: StatutJob;
  ussdSequenceUsed?: string[];
  reponseBrute?: string;
  erreur?: string | null;
  retryCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface SimAccount {
  operateur: Operateur;
  numero: string;
  soldePrincipal: number;
  soldeCommission: number;
  seuilAlerte: number;
  actif: boolean;
  dernierMaj: number;
}

export interface ContactInfo {
  telephoneMobile: string;
  telephoneFixe: string;
  whatsapp?: string;
  email?: string;
  adresse?: string;
  horaires?: string;
  updatedAt?: number;
}

export interface AppConfig {
  fraisParOperateur: Record<Operateur, number>;
  seuilAlerteSoldeGlobal: number;
  remboursementAutomatique: boolean;
  maintenance: boolean;
  messageMaintenance?: string;
}
