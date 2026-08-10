/// Catalogue affiché côté client. Chaque entrée doit correspondre EXACTEMENT
/// à un `id` de code USSD existant côté backend (/admin/ussd-codes).
/// Si l'admin désactive un code, il faudrait idéalement que l'app filtre les
/// options dynamiquement — pour une V1 simple on garde ce catalogue statique
/// et on affiche une erreur claire si jamais le code choisi est inactif côté
/// serveur (le backend refusera si tu ajoutes cette vérification côté
/// /api/feexpay/initiate, actuellement non bloquant — voir README).
class ForfaitOption {
  final String ussdCodeId;
  final String label;
  final int prixFcfa;

  const ForfaitOption({required this.ussdCodeId, required this.label, required this.prixFcfa});
}

const Map<String, Map<String, List<ForfaitOption>>> catalogueForfaits = {
  "mtn": {
    "internet": [
      ForfaitOption(ussdCodeId: "mtn_forfait_internet_jour", label: "166 Mo / 24h", prixFcfa: 101),
      ForfaitOption(ussdCodeId: "mtn_forfait_internet_semaine", label: "1 Go / 7 jours", prixFcfa: 505),
      ForfaitOption(ussdCodeId: "mtn_forfait_internet_mois", label: "4 Go / 30 jours", prixFcfa: 2525),
    ],
    "gopack": [
      ForfaitOption(ussdCodeId: "mtn_forfait_gopack_jour", label: "GoPack Jour", prixFcfa: 200),
      ForfaitOption(ussdCodeId: "mtn_forfait_gopack_semaine", label: "GoPack Semaine", prixFcfa: 1000),
      ForfaitOption(ussdCodeId: "mtn_forfait_gopack_mois", label: "GoPack Mois", prixFcfa: 3500),
    ],
    "maxi": [
      ForfaitOption(ussdCodeId: "mtn_forfait_maxi_jour", label: "Maxi Jour", prixFcfa: 300),
      ForfaitOption(ussdCodeId: "mtn_forfait_maxi_semaine", label: "Maxi Semaine", prixFcfa: 1500),
      ForfaitOption(ussdCodeId: "mtn_forfait_maxi_mois", label: "Maxi Mois", prixFcfa: 5000),
    ],
  },
  "moov": {
    "internet": [
      ForfaitOption(ussdCodeId: "moov_forfait_internet", label: "Forfait Internet", prixFcfa: 200),
    ],
    "appel": [
      ForfaitOption(ussdCodeId: "moov_forfait_minute", label: "Forfait Minute", prixFcfa: 200),
      ForfaitOption(ussdCodeId: "moov_pass_bonus", label: "Pass Bonus", prixFcfa: 500),
    ],
  },
  "celtiis": {
    "appel": [
      ForfaitOption(ussdCodeId: "celtiis_forfait_appel_jour", label: "Appel Jour", prixFcfa: 101),
      ForfaitOption(ussdCodeId: "celtiis_forfait_appel_semaine", label: "Appel Semaine", prixFcfa: 535),
      ForfaitOption(ussdCodeId: "celtiis_forfait_appel_mois", label: "Appel Mois", prixFcfa: 1785),
    ],
    "internet": [
      ForfaitOption(ussdCodeId: "celtiis_forfait_interne_jour", label: "Interne Jour", prixFcfa: 167),
      ForfaitOption(ussdCodeId: "celtiis_forfait_interne_semaine", label: "Interne Semaine", prixFcfa: 333),
      ForfaitOption(ussdCodeId: "celtiis_forfait_interne_mois", label: "Interne Mois", prixFcfa: 758),
    ],
    "mymix": [
      ForfaitOption(ussdCodeId: "celtiis_forfait_mymix_jour", label: "My Mix Jour", prixFcfa: 150),
      ForfaitOption(ussdCodeId: "celtiis_forfait_mymix_semaine", label: "My Mix Semaine", prixFcfa: 750),
      ForfaitOption(ussdCodeId: "celtiis_forfait_mymix_mois", label: "My Mix Mois", prixFcfa: 2500),
    ],
  },
};

const Map<String, String> transfertUssdCodeIdParOperateur = {
  "mtn": "mtn_transfert",
  "moov": "moov_transfert",
  "celtiis": "celtiis_transfert",
};
