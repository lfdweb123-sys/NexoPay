package com.lfd.momobot.ussd

import com.lfd.momobot.data.MessageUssd
import java.text.Normalizer

object UssdResponseMatcher {

    /** Normalise le texte : minuscule, sans accents, pour un matching robuste. */
    private fun normalize(text: String): String {
        val temp = Normalizer.normalize(text.lowercase(), Normalizer.Form.NFD)
        return temp.replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")
    }

    /**
     * Compare le texte de réponse USSD brut aux messages de détection
     * configurés côté admin (chargés depuis Firestore) pour cet opérateur,
     * et renvoie le type détecté ("success", "solde_insuffisant", etc.)
     * ou null si aucun match (à traiter comme "erreur_generique" par défaut).
     */
    fun detect(reponseBrute: String, messages: List<MessageUssd>): MessageUssd? {
        val normalized = normalize(reponseBrute)
        for (msg in messages.filter { it.actif }) {
            val motsClefs = msg.motsClesDetection.split("|").map { normalize(it.trim()) }
            if (motsClefs.any { it.isNotBlank() && normalized.contains(it) }) {
                return msg
            }
        }
        return null
    }
}
