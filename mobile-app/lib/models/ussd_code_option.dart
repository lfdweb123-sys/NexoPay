class UssdCodeOption {
  final String id;
  final String operateur;
  final String categorie;
  final String label;
  final bool actif;

  UssdCodeOption({
    required this.id,
    required this.operateur,
    required this.categorie,
    required this.label,
    required this.actif,
  });

  factory UssdCodeOption.fromMap(Map<String, dynamic> map) {
    return UssdCodeOption(
      id: map['id'] ?? '',
      operateur: map['operateur'] ?? '',
      categorie: map['categorie'] ?? '',
      label: map['label'] ?? '',
      actif: map['actif'] ?? false,
    );
  }
}
