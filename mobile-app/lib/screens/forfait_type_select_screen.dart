import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/catalog.dart';
import 'forfait_detail_screen.dart';

class ForfaitTypeSelectScreen extends StatelessWidget {
  final String operateur;
  const ForfaitTypeSelectScreen({super.key, required this.operateur});

  @override
  Widget build(BuildContext context) {
    final categories = catalogueForfaits[operateur]?.keys.toList() ?? [];

    return Scaffold(
      appBar: AppBar(title: Text('${operateur.toUpperCase()} — Type de forfait')),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(24),
          itemCount: categories.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final categorie = categories[index];
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ForfaitDetailScreen(operateur: operateur, categorie: categorie),
                ),
              ),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.lightGray,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Text(
                      _labelCategorie(categorie),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const Spacer(),
                    const Icon(Icons.chevron_right, color: AppColors.gray),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  String _labelCategorie(String c) {
    switch (c) {
      case 'internet':
        return 'Internet';
      case 'appel':
        return 'Appels';
      case 'illimite':
        return 'Illimité';
      case 'gopack':
        return 'GoPack';
      case 'maxi':
        return 'Maxi';
      case 'mymix':
        return 'My Mix';
      default:
        return c;
    }
  }
}
