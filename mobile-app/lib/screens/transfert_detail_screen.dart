import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/catalog.dart';
import 'payment_screen.dart';

class TransfertDetailScreen extends StatefulWidget {
  final String operateur;
  const TransfertDetailScreen({super.key, required this.operateur});

  @override
  State<TransfertDetailScreen> createState() => _TransfertDetailScreenState();
}

class _TransfertDetailScreenState extends State<TransfertDetailScreen> {
  final _montantController = TextEditingController();
  final _numeroController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final montant = int.tryParse(_montantController.text.trim());
    final canContinue = montant != null && montant > 0 && _numeroController.text.trim().length >= 8;

    return Scaffold(
      appBar: AppBar(title: Text('${widget.operateur.toUpperCase()} — Transfert')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Montant à envoyer (FCFA)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _montantController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(hintText: 'Ex: 5000'),
              ),
              const SizedBox(height: 20),
              const Text('Numéro du bénéficiaire', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _numeroController,
                keyboardType: TextInputType.phone,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(hintText: 'Ex: 01 XX XX XX XX'),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: !canContinue
                    ? null
                    : () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => PaymentScreen(
                              type: 'transfert',
                              operateur: widget.operateur,
                              ussdCodeId: transfertUssdCodeIdParOperateur[widget.operateur]!,
                              montant: montant!,
                              numeroClient: _numeroController.text.trim(),
                              recapLabel: 'Transfert de $montant FCFA',
                            ),
                          ),
                        ),
                child: const Text('Continuer vers le paiement'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
