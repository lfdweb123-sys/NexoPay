import 'package:flutter/material.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../theme/app_theme.dart';
import '../services/phone_auth_service.dart';

class OtpScreen extends StatefulWidget {
  final String verificationId;
  final String phoneNumber;

  const OtpScreen({super.key, required this.verificationId, required this.phoneNumber});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _authService = PhoneAuthService();
  bool _loading = false;
  String? _error;
  String _code = '';

  Future<void> _confirm() async {
    if (_code.length != 6) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _authService.confirmOtp(verificationId: widget.verificationId, smsCode: _code);
      // AuthGate redirige automatiquement vers HomeScreen via le stream authStateChanges
    } catch (e) {
      setState(() {
        _error = "Code incorrect, réessayez.";
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vérification')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text(
                'Entrez le code envoyé au ${widget.phoneNumber}',
                style: const TextStyle(color: AppColors.gray),
              ),
              const SizedBox(height: 24),
              PinCodeTextField(
                appContext: context,
                length: 6,
                onChanged: (value) => setState(() => _code = value),
                onCompleted: (value) {
                  _code = value;
                  _confirm();
                },
                pinTheme: PinTheme(
                  shape: PinCodeFieldShape.box,
                  borderRadius: BorderRadius.circular(12),
                  fieldHeight: 50,
                  fieldWidth: 44,
                  activeColor: AppColors.orange,
                  selectedColor: AppColors.orange,
                  inactiveColor: AppColors.lightGray,
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _confirm,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Valider'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
