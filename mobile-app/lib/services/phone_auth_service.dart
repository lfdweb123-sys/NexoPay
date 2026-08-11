import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Authentification EXCLUSIVEMENT par numéro de téléphone (SMS OTP).
/// Pas d'email/mot de passe, pas de Google/Apple sign-in — conformément
/// à la demande : "connexion facile avec le numéro de téléphone juste pas
/// autre chose".
class PhoneAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Envoie le code OTP par SMS. [onCodeSent] fournit le verificationId
  /// nécessaire pour confirmer le code ensuite. [onError] reçoit le code
  /// d'erreur Firebase (ex: "too-many-requests", "invalid-phone-number")
  /// PLUTÔT que le message brut, pour un mapping fiable côté UI —
  /// le message brut est volontairement aussi loggé en debug console pour
  /// diagnostiquer les cas non prévus (adb logcat / flutter logs).
  Future<void> sendOtp({
    required String phoneNumber, // format international, ex: +2290100000000
    required void Function(String verificationId) onCodeSent,
    required void Function(String errorCode, String errorMessage) onError,
  }) async {
    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _auth.signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          debugPrint('[PhoneAuthService] verificationFailed code=${e.code} message=${e.message}');
          onError(e.code, e.message ?? 'Erreur de vérification du numéro');
        },
        codeSent: (String verificationId, int? resendToken) {
          onCodeSent(verificationId);
        },
        codeAutoRetrievalTimeout: (String verificationId) {},
      );
    } catch (e) {
      debugPrint('[PhoneAuthService] Exception inattendue lors de verifyPhoneNumber: $e');
      onError('unknown', e.toString());
    }
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
