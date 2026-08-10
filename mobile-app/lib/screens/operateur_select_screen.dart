import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'forfait_type_select_screen.dart';
import 'transfert_detail_screen.dart';

const Map<String, Color> operateurColors = {
  'mtn': Color(0xFFFFCC00),
  'moov': Color(0xFF0066B3),
  'celtiis': Color(0xFF1A237E),
};

class OperateurSelectScreen extends StatelessWidget {
  final String type; // "forfait" | "transfert"
  const OperateurSelectScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(type == 'forfait' ? 'Choisissez l\'opérateur' : 'Réseau de réception'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final op in ['mtn', 'moov', 'celtiis']) ...[
                _OperateurCard(
                  operateur: op,
                  onTap: () {
                    if (type == 'forfait') {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => ForfaitTypeSelectScreen(operateur: op)),
                      );
                    } else {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => TransfertDetailScreen(operateur: op)),
                      );
                    }
                  },
                ),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _OperateurCard extends StatelessWidget {
  final String operateur;
  final VoidCallback onTap;

  const _OperateurCard({required this.operateur, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = operateurColors[operateur] ?? AppColors.orange;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.lightGray, width: 1.5),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            CircleAvatar(radius: 20, backgroundColor: color),
            const SizedBox(width: 16),
            Text(
              operateur.toUpperCase(),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const Spacer(),
            const Icon(Icons.chevron_right, color: AppColors.gray),
          ],
        ),
      ),
    );
  }
}
