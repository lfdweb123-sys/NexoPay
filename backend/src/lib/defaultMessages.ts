import { MessageUssd } from "./types";

/**
 * Messages de détection par défaut — VALEURS PLACEHOLDER À AFFINER.
 * L'admin doit les remplacer par les vrais textes renvoyés par chaque
 * opérateur (visibles depuis /admin/ussd-codes -> onglet "Messages").
 * Le bot Android compare la réponse USSD brute (en minuscule, sans accents)
 * aux "motsClesDetection" (séparés par |) pour déterminer le statut du job.
 */
export const DEFAULT_MESSAGES: MessageUssd[] = [
  {
    id: "mtn_success",
    operateur: "mtn",
    type: "success",
    motsClesDetection: "transaction reussie|transaction effectuee|paiement reussi",
    messageAffichéClient: "Opération effectuée avec succès.",
    actif: true,
  },
  {
    id: "mtn_solde_insuffisant",
    operateur: "mtn",
    type: "solde_insuffisant",
    motsClesDetection: "solde insuffisant|fonds insuffisants",
    messageAffichéClient: "Solde marchand insuffisant, réessayez plus tard.",
    actif: true,
  },
  {
    id: "mtn_numero_invalide",
    operateur: "mtn",
    type: "numero_invalide",
    motsClesDetection: "numero invalide|numero incorrect|abonne inconnu",
    messageAffichéClient: "Le numéro renseigné est invalide.",
    actif: true,
  },
  {
    id: "mtn_timeout",
    operateur: "mtn",
    type: "timeout",
    motsClesDetection: "session expiree|delai depasse",
    messageAffichéClient: "La transaction a expiré, réessayez.",
    actif: true,
  },
  {
    id: "mtn_erreur_generique",
    operateur: "mtn",
    type: "erreur_generique",
    motsClesDetection: "erreur|echec",
    messageAffichéClient: "Une erreur est survenue, notre équipe a été alertée.",
    actif: true,
  },

  {
    id: "moov_success",
    operateur: "moov",
    type: "success",
    motsClesDetection: "transaction reussie|operation effectuee",
    messageAffichéClient: "Opération effectuée avec succès.",
    actif: true,
  },
  {
    id: "moov_solde_insuffisant",
    operateur: "moov",
    type: "solde_insuffisant",
    motsClesDetection: "solde insuffisant",
    messageAffichéClient: "Solde marchand insuffisant, réessayez plus tard.",
    actif: true,
  },
  {
    id: "moov_numero_invalide",
    operateur: "moov",
    type: "numero_invalide",
    motsClesDetection: "numero invalide|numero incorrect",
    messageAffichéClient: "Le numéro renseigné est invalide.",
    actif: true,
  },
  {
    id: "moov_timeout",
    operateur: "moov",
    type: "timeout",
    motsClesDetection: "session expiree|delai depasse",
    messageAffichéClient: "La transaction a expiré, réessayez.",
    actif: true,
  },
  {
    id: "moov_erreur_generique",
    operateur: "moov",
    type: "erreur_generique",
    motsClesDetection: "erreur|echec",
    messageAffichéClient: "Une erreur est survenue, notre équipe a été alertée.",
    actif: true,
  },

  {
    id: "celtiis_success",
    operateur: "celtiis",
    type: "success",
    motsClesDetection: "transaction reussie|operation effectuee",
    messageAffichéClient: "Opération effectuée avec succès.",
    actif: true,
  },
  {
    id: "celtiis_solde_insuffisant",
    operateur: "celtiis",
    type: "solde_insuffisant",
    motsClesDetection: "solde insuffisant",
    messageAffichéClient: "Solde marchand insuffisant, réessayez plus tard.",
    actif: true,
  },
  {
    id: "celtiis_numero_invalide",
    operateur: "celtiis",
    type: "numero_invalide",
    motsClesDetection: "numero invalide|numero incorrect",
    messageAffichéClient: "Le numéro renseigné est invalide.",
    actif: true,
  },
  {
    id: "celtiis_timeout",
    operateur: "celtiis",
    type: "timeout",
    motsClesDetection: "session expiree|delai depasse",
    messageAffichéClient: "La transaction a expiré, réessayez.",
    actif: true,
  },
  {
    id: "celtiis_erreur_generique",
    operateur: "celtiis",
    type: "erreur_generique",
    motsClesDetection: "erreur|echec",
    messageAffichéClient: "Une erreur est survenue, notre équipe a été alertée.",
    actif: true,
  },
];
