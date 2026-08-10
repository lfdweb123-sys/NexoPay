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
    final raw = _phoneController.text.trim();
    if (raw.length < 8) {
      setState(() => _error = "Numéro invalide");
      return;
    }
    // Numéro béninois : on préfixe +229 si l'utilisateur a tapé le format local
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
      onError: (error) {
        setState(() {
          _loading = false;
          _error = error;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'LFD MoMo',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppColors.black,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Forfaits et transferts d\'argent, en un instant.',
                style: TextStyle(color: AppColors.gray, fontSize: 15),
              ),
              const SizedBox(height: 40),
              const Text(
                'Numéro de téléphone',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  prefixText: '+229 ',
                  hintText: '01 XX XX XX XX',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
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
            ],
          ),
        ),
      ),
    );
  }
}
