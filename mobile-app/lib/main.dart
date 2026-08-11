import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'theme/app_theme.dart';
import 'screens/login_phone_screen.dart';
import 'screens/home_screen.dart';
import 'services/phone_auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    // Généré automatiquement par `flutterfire configure` — voir README.
    // options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const NexoPayApp());
}

class NexoPayApp extends StatelessWidget {
  const NexoPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NexoPay',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: PhoneAuthService().authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasData) {
          return const HomeScreen();
        }
        return const LoginPhoneScreen();
      },
    );
  }
}
