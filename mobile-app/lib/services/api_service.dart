import 'dart:convert';
import 'package:http/http.dart' as http;
import 'app_config.dart';

class ApiService {
  Future<List<Map<String, dynamic>>> fetchUssdCodesPublic() async {
    // Route publique côté client à ajouter côté backend si tu veux filtrer
    // dynamiquement les forfaits affichés à partir des codes actifs admin.
    // Pour l'instant, l'app embarque un catalogue statique (voir catalog.dart)
    // et se contente d'initier le paiement avec l'ussdCodeId correspondant.
    return [];
  }

  Future<Map<String, dynamic>> initiatePayment({
    required String idToken,
    required String type,
    required String operateur,
    String? sousType,
    String? palier,
    required String ussdCodeId,
    required int montant,
    required String numeroClient,
    required String numeroPaiement,
    required String reseauPaiement,
  }) async {
    final res = await http.post(
      Uri.parse("${AppConfig.backendBaseUrl}/api/feexpay/initiate"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "idToken": idToken,
        "type": type,
        "operateur": operateur,
        "sousType": sousType,
        "palier": palier,
        "ussdCodeId": ussdCodeId,
        "montant": montant,
        "numeroClient": numeroClient,
        "numeroPaiement": numeroPaiement,
        "reseauPaiement": reseauPaiement,
      }),
    );

    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data["error"]?.toString() ?? "Erreur lors de l'initiation du paiement");
    }
    return data;
  }

  Future<Map<String, dynamic>> fetchContactInfo() async {
    final res = await http.get(Uri.parse("${AppConfig.backendBaseUrl}/api/contact"));
    final data = jsonDecode(res.body);
    return data["contact"] ?? {};
  }
}
