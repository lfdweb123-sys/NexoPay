import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';

/// Suit d'abord `pending_payments/{reference}` jusqu'à ce que le webhook
/// FeexPay confirme le paiement et crée le job correspondant (champ jobId),
/// puis bascule sur l'écoute temps réel de `jobs/{jobId}` pour le statut final.
class WaitingScreen extends StatefulWidget {
  final String reference;
  const WaitingScreen({super.key, required this.reference});

  @override
  State<WaitingScreen> createState() => _WaitingScreenState();
}

class _WaitingScreenState extends State<WaitingScreen> {
  String? _jobId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('pending_payments')
              .doc(widget.reference)
              .snapshots(),
          builder: (context, pendingSnap) {
            if (!pendingSnap.hasData || !pendingSnap.data!.exists) {
              return _buildStatusView(
                icon: Icons.hourglass_top_rounded,
                title: 'En attente de votre validation…',
                subtitle:
                    'Une demande de paiement a été envoyée sur votre téléphone. Validez-la au plus vite.',
                color: AppColors.orange,
              );
            }

            final pendingData = pendingSnap.data!.data() as Map<String, dynamic>;
            final pendingStatut = pendingData['statut'] as String?;

            if (pendingStatut == 'echec_paiement') {
              return _buildStatusView(
                icon: Icons.error_outline_rounded,
                title: 'Paiement échoué',
                subtitle: 'Le paiement n\'a pas abouti. Vous pouvez réessayer.',
                color: AppColors.danger,
                showHomeButton: true,
              );
            }

            _jobId ??= pendingData['jobId'] as String?;

            if (_jobId == null) {
              return _buildStatusView(
                icon: Icons.hourglass_top_rounded,
                title: 'Paiement en cours de confirmation…',
                subtitle: 'Merci de patienter, cela prend généralement moins d\'une minute.',
                color: AppColors.orange,
              );
            }

            return StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance.collection('jobs').doc(_jobId).snapshots(),
              builder: (context, jobSnap) {
                if (!jobSnap.hasData || !jobSnap.data!.exists) {
                  return _buildStatusView(
                    icon: Icons.hourglass_top_rounded,
                    title: 'Préparation de votre opération…',
                    subtitle: '',
                    color: AppColors.orange,
                  );
                }
                final job = jobSnap.data!.data() as Map<String, dynamic>;
                final statut = job['statut'] as String? ?? 'pending';

                switch (statut) {
                  case 'success':
                    return _buildStatusView(
                      icon: Icons.check_circle_rounded,
                      title: 'Opération réussie !',
                      subtitle: job['type'] == 'forfait'
                          ? 'Votre forfait a été activé avec succès.'
                          : 'Le transfert a été envoyé avec succès.',
                      color: AppColors.success,
                      showHomeButton: true,
                    );
                  case 'failed':
                    return _buildStatusView(
                      icon: Icons.cancel_rounded,
                      title: 'Échec de l\'opération',
                      subtitle: (job['erreur'] as String?) ??
                          'Une erreur est survenue. Vous serez remboursé si applicable.',
                      color: AppColors.danger,
                      showHomeButton: true,
                    );
                  case 'refunded':
                    return _buildStatusView(
                      icon: Icons.replay_circle_filled_rounded,
                      title: 'Remboursé',
                      subtitle: 'L\'opération a échoué et votre paiement a été remboursé.',
                      color: AppColors.gray,
                      showHomeButton: true,
                    );
                  case 'processing':
                    return _buildStatusView(
                      icon: Icons.autorenew_rounded,
                      title: 'Traitement en cours…',
                      subtitle: 'Votre opération est en cours d\'exécution.',
                      color: AppColors.orange,
                      spinning: true,
                    );
                  default:
                    return _buildStatusView(
                      icon: Icons.hourglass_top_rounded,
                      title: 'En file d\'attente…',
                      subtitle: 'Votre opération va démarrer dans un instant.',
                      color: AppColors.orange,
                    );
                }
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatusView({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    bool showHomeButton = false,
    bool spinning = false,
  }) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          spinning
              ? SizedBox(
                  height: 72,
                  width: 72,
                  child: CircularProgressIndicator(strokeWidth: 3, color: color),
                )
              : Icon(icon, size: 72, color: color),
          const SizedBox(height: 24),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.black),
          ),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.gray),
            ),
          ],
          if (showHomeButton) ...[
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              ),
              child: const Text('Retour à l\'accueil'),
            ),
          ],
        ],
      ),
    );
  }
}
