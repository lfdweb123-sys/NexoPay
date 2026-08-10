import 'package:firebase_auth/firebase_auth.dart';

/// Authentification EXCLUSIVEMENT par numéro de téléphone (SMS OTP).
/// Pas d'email/mot de passe, pas de Google/Apple sign-in — conformément
/// à la demande : "connexion facile avec le numéro de téléphone juste pas
/// autre chose".
class PhoneAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Envoie le code OTP par SMS. [onCodeSent] fournit le verificationId
  /// nécessaire pour confirmer le code ensuite.
  Future<void> sendOtp({
    required String phoneNumber, // format international, ex: +2290100000000
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Auto-validation sur certains Android (détection SMS automatique)
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        onError(e.message ?? "Erreur de vérification du numéro");
      },
      codeSent: (String verificationId, int? resendToken) {
        onCodeSent(verificationId);
      },
      codeAutoRetrievalTimeout: (String verificationId) {},
    );
  }

  Future<UserCredential> confirmOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return _auth.signInWithCredential(credential);
  }

  Future<String?> getIdToken() async {
    return _auth.currentUser?.getIdToken();
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
