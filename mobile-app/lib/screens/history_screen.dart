import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../theme/app_theme.dart';

const Map<String, Color> _statutColors = {
  'pending': AppColors.gray,
  'processing': AppColors.orange,
  'success': AppColors.success,
  'failed': AppColors.danger,
  'refunded': AppColors.gray,
};

const Map<String, String> _statutLabels = {
  'pending': 'En attente',
  'processing': 'En cours',
  'success': 'Réussi',
  'failed': 'Échoué',
  'refunded': 'Remboursé',
};

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _filtreType = 'tous';
  String _filtreOperateur = 'tous';

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    Query query = FirebaseFirestore.instance
        .collection('jobs')
        .where('clientUid', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .limit(100);

    return Scaffold(
      appBar: AppBar(title: const Text('Historique')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _FilterDropdown(
                    value: _filtreType,
                    options: const {'tous': 'Tous types', 'forfait': 'Forfaits', 'transfert': 'Transferts'},
                    onChanged: (v) => setState(() => _filtreType = v),
                  ),
                  const SizedBox(width: 8),
                  _FilterDropdown(
                    value: _filtreOperateur,
                    options: const {
                      'tous': 'Tous opérateurs',
                      'mtn': 'MTN',
                      'moov': 'Moov',
                      'celtiis': 'Celtiis',
                    },
                    onChanged: (v) => setState(() => _filtreOperateur = v),
                  ),
                ],
              ),
            ),
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: query.snapshots(),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  var docs = snapshot.data!.docs;
                  if (_filtreType != 'tous') {
                    docs = docs.where((d) => (d.data() as Map)['type'] == _filtreType).toList();
                  }
                  if (_filtreOperateur != 'tous') {
                    docs = docs.where((d) => (d.data() as Map)['operateur'] == _filtreOperateur).toList();
                  }
                  if (docs.isEmpty) {
                    return const Center(
                      child: Text('Aucune transaction pour l\'instant', style: TextStyle(color: AppColors.gray)),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: docs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final job = docs[index].data() as Map<String, dynamic>;
                      final statut = job['statut'] as String? ?? 'pending';
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.lightGray,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${(job['type'] as String? ?? '').toUpperCase()} — ${(job['operateur'] as String? ?? '').toUpperCase()}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${job['montant'] ?? 0} FCFA · ${job['numeroClient'] ?? ''}',
                                    style: const TextStyle(color: AppColors.gray, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: (_statutColors[statut] ?? AppColors.gray).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _statutLabels[statut] ?? statut,
                                style: TextStyle(
                                  color: _statutColors[statut] ?? AppColors.gray,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterDropdown extends StatelessWidget {
  final String value;
  final Map<String, String> options;
  final void Function(String) onChanged;

  const _FilterDropdown({required this.value, required this.options, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.lightGray,
          borderRadius: BorderRadius.circular(10),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            isExpanded: true,
            items: options.entries
                .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 13))))
                .toList(),
            onChanged: (v) {
              if (v != null) onChanged(v);
            },
          ),
        ),
      ),
    );
  }
}
