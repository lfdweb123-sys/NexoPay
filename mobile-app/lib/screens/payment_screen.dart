import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/phone_auth_service.dart';
import 'waiting_screen.dart';

class PaymentScreen extends StatefulWidget {
  final String type; // "forfait" | "transfert"
  final String operateur;
  final String? sousType;
  final String ussdCodeId;
  final int montant;
  final String numeroClient;
  final String recapLabel;

  const PaymentScreen({
    super.key,
    required this.type,
    required this.operateur,
    this.sousType,
    required this.ussdCodeId,
    required this.montant,
    required this.numeroClient,
    required this.recapLabel,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _numeroPaiementController = TextEditingController();
  String _reseauPaiement = 'mtn';
  bool _loading = false;
  String? _error;

  Future<void> _payer() async {
    if (_numeroPaiementController.text.trim().length < 8) {
      setState(() => _error = "Numéro de paiement invalide");
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final idToken = await PhoneAuthService().getIdToken();
      if (idToken == null) throw Exception("Session expirée, reconnectez-vous.");

      final result = await ApiService().initiatePayment(
        idToken: idToken,
        type: widget.type,
        operateur: widget.operateur,
        sousType: widget.sousType,
        ussdCodeId: widget.ussdCodeId,
        montant: widget.montant,
        numeroClient: widget.numeroClient,
        numeroPaiement: _numeroPaiementController.text.trim(),
        reseauPaiement: _reseauPaiement,
      );

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => WaitingScreen(reference: result['reference'] as String),
        ),
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirmation et paiement')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.lightGray,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.recapLabel,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    _RecapLine('Opérateur', widget.operateur.toUpperCase()),
                    _RecapLine('Numéro bénéficiaire', widget.numeroClient),
                    _RecapLine('Montant', '${widget.montant} FCFA'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('Réseau de paiement', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                children: [
                  for (final op in ['mtn', 'moov', 'celtiis'])
                    ChoiceChip(
                      label: Text(op.toUpperCase()),
                      selected: _reseauPaiement == op,
                      selectedColor: AppColors.orange,
                      labelStyle: TextStyle(
                        color: _reseauPaiement == op ? Colors.white : AppColors.black,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (_) => setState(() => _reseauPaiement = op),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              const Text('Numéro de paiement', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _numeroPaiementController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(hintText: 'Ex: 01 XX XX XX XX'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _payer,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Payer ${widget.montant} FCFA'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecapLine extends StatelessWidget {
  final String label;
  final String value;
  const _RecapLine(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.gray)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
