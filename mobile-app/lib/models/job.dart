class Job {
  final String id;
  final String type; // "forfait" | "transfert"
  final String operateur; // "mtn" | "moov" | "celtiis"
  final int montant;
  final String numeroClient;
  final String statut; // "pending" | "processing" | "success" | "failed" | "refunded"
  final String? reponseBrute;
  final String? erreur;
  final int createdAt;

  Job({
    required this.id,
    required this.type,
    required this.operateur,
    required this.montant,
    required this.numeroClient,
    required this.statut,
    this.reponseBrute,
    this.erreur,
    required this.createdAt,
  });

  factory Job.fromMap(String id, Map<String, dynamic> map) {
    return Job(
      id: id,
      type: map['type'] ?? '',
      operateur: map['operateur'] ?? '',
      montant: (map['montant'] ?? 0) as int,
      numeroClient: map['numeroClient'] ?? '',
      statut: map['statut'] ?? 'pending',
      reponseBrute: map['reponseBrute'],
      erreur: map['erreur'],
      createdAt: (map['createdAt'] ?? 0) as int,
    );
  }

  bool get isFinished => statut == 'success' || statut == 'failed' || statut == 'refunded';
  bool get isSuccess => statut == 'success';
}
