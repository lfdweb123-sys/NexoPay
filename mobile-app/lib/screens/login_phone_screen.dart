import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/phone_auth_service.dart';
import 'otp_screen.dart';

class LoginPhoneScreen extends StatefulWidget {
  const LoginPhoneScreen({super.key});

  @override
  State<LoginPhoneScreen> createState() => _LoginPhoneScreenState();
}

class _LoginPhoneScreenState extends State<LoginPhoneScreen> {
  final _phoneController = TextEditingController();
  final _authService = PhoneAuthService();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    final raw = _phoneController.text.trim().replaceAll(' ', '');
    if (raw.length < 8) {
      setState(() => _error = "Numéro invalide");
      return;
    }
    final phoneNumber = raw.startsWith('+') ? raw : '+229$raw';

    setState(() {
      _loading = true;
      _error = null;
    });

    await _authService.sendOtp(
      phoneNumber: phoneNumber,
      onCodeSent: (verificationId) {
        setState(() => _loading = false);
        if (!mounted) return;
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OtpScreen(
              verificationId: verificationId,
              phoneNumber: phoneNumber,
            ),
          ),
        );
      },
      onError: (errorCode, errorMessage) {
        setState(() {
          _loading = false;
          _error = _friendlyError(errorCode, errorMessage);
        });
      },
    );
  }

  String _friendlyError(String code, String rawMessage) {
    switch (code) {
      case 'too-many-requests':
        return "Trop de tentatives. Réessayez dans quelques minutes.";
      case 'invalid-phone-number':
        return "Le numéro saisi n'est pas valide.";
      case 'quota-exceeded':
        return "Quota de SMS atteint pour aujourd'hui. Réessayez plus tard.";
      case 'app-not-authorized':
      case 'missing-client-identifier':
        return "Configuration de l'app incomplète (vérifiez SHA-1/SHA-256 et Play Integrity dans Firebase). [$code]";
      case 'network-request-failed':
        return "Connexion internet instable. Réessayez.";
      case 'operation-not-allowed':
        return "Ce mode de connexion n'est pas encore activé côté serveur.";
      default:
        // En phase de test, on affiche le code brut pour diagnostiquer vite —
        // à retirer ou simplifier une fois l'app stabilisée en production.
        return "Erreur : $rawMessage ($code)";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 3),

              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.orange.withOpacity(0.28),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 38),
                ),
              ),
              const SizedBox(height: 24),

              const Center(
                child: Text(
                  'NexoPay',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: AppColors.black,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              const Center(
                child: Text(
                  'Forfaits et transferts d\'argent,\nen un instant.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.gray, fontSize: 15, height: 1.4),
                ),
              ),

              const Spacer(flex: 3),

              const Text(
                'Numéro de téléphone',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.black),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.lightGray,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _error != null ? AppColors.danger.withOpacity(0.4) : Colors.transparent,
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Text(
                      '+229',
                      style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.gray, fontSize: 16),
                    ),
                    Container(
                      height: 24,
                      width: 1,
                      color: Colors.grey.shade300,
                      margin: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                        decoration: const InputDecoration(
                          hintText: '01 XX XX XX XX',
                          border: InputBorder.none,
                          filled: false,
                          contentPadding: EdgeInsets.symmetric(vertical: 16),
                        ),
                        onChanged: (_) {
                          if (_error != null) setState(() => _error = null);
                        },
                      ),
                    ),
                  ],
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 16),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppColors.danger, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Recevoir le code'),
              ),

              const Spacer(flex: 2),

              const Center(
                child: Text(
                  'En continuant, vous acceptez nos conditions d\'utilisation.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.gray, fontSize: 12),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
