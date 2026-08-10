import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  Map<String, dynamic>? _contact;

  @override
  void initState() {
    super.initState();
    ApiService().fetchContactInfo().then((data) {
      if (mounted) setState(() => _contact = data);
    });
  }

  Future<void> _call(String number) async {
    final uri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    if (_contact == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Nous contacter')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_contact!['telephoneMobile'] != null)
                _ContactTile(
                  icon: Icons.phone_android_rounded,
                  label: 'Téléphone mobile',
                  value: _contact!['telephoneMobile'],
                  onTap: () => _call(_contact!['telephoneMobile']),
                ),
              const SizedBox(height: 12),
              if (_contact!['telephoneFixe'] != null)
                _ContactTile(
                  icon: Icons.call_rounded,
                  label: 'Téléphone fixe',
                  value: _contact!['telephoneFixe'],
                  onTap: () => _call(_contact!['telephoneFixe']),
                ),
              const SizedBox(height: 12),
              if (_contact!['whatsapp'] != null)
                _ContactTile(
                  icon: Icons.chat_rounded,
                  label: 'WhatsApp',
                  value: _contact!['whatsapp'],
                  onTap: () => _call(_contact!['whatsapp']),
                ),
              const SizedBox(height: 12),
              if (_contact!['horaires'] != null)
                _ContactTile(
                  icon: Icons.access_time_rounded,
                  label: 'Horaires',
                  value: _contact!['horaires'],
                ),
              if (_contact!['adresse'] != null) ...[
                const SizedBox(height: 12),
                _ContactTile(
                  icon: Icons.location_on_rounded,
                  label: 'Adresse',
                  value: _contact!['adresse'],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _ContactTile({required this.icon, required this.label, required this.value, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.lightGray,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.orange),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(color: AppColors.gray, fontSize: 12)),
                  Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (onTap != null) const Icon(Icons.chevron_right, color: AppColors.gray),
          ],
        ),
      ),
    );
  }
}
