import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/catalog.dart';
import 'payment_screen.dart';

class ForfaitDetailScreen extends StatefulWidget {
  final String operateur;
  final String categorie;
  const ForfaitDetailScreen({super.key, required this.operateur, required this.categorie});

  @override
  State<ForfaitDetailScreen> createState() => _ForfaitDetailScreenState();
}

class _ForfaitDetailScreenState extends State<ForfaitDetailScreen> {
  ForfaitOption? _selected;
  final _numeroController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final options = catalogueForfaits[widget.operateur]?[widget.categorie] ?? [];

    return Scaffold(
      appBar: AppBar(title: Text('${widget.operateur.toUpperCase()} — Sélection')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Sélectionnez votre forfait', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              for (final option in options) ...[
                _OptionTile(
                  option: option,
                  selected: _selected?.ussdCodeId == option.ussdCodeId,
                  onTap: () => setState(() => _selected = option),
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 16),
              const Text('Numéro à activer', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _numeroController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(hintText: 'Ex: 01 XX XX XX XX'),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _selected == null || _numeroController.text.trim().length < 8
                    ? null
                    : () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => PaymentScreen(
                              type: 'forfait',
                              operateur: widget.operateur,
                              sousType: widget.categorie,
                              ussdCodeId: _selected!.ussdCodeId,
                              montant: _selected!.prixFcfa,
                              numeroClient: _numeroController.text.trim(),
                              recapLabel: _selected!.label,
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

class _OptionTile extends StatelessWidget {
  final ForfaitOption option;
  final bool selected;
  final VoidCallback onTap;

  const _OptionTile({required this.option, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: selected ? AppColors.orange : AppColors.lightGray, width: 1.5),
          borderRadius: BorderRadius.circular(14),
          color: selected ? AppColors.orange.withOpacity(0.06) : Colors.white,
        ),
        child: Row(
          children: [
            Expanded(child: Text(option.label, style: const TextStyle(fontWeight: FontWeight.w600))),
            Text(
              '${option.prixFcfa} FCFA',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.orange),
            ),
          ],
        ),
      ),
    );
  }
}
