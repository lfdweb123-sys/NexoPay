package com.lfd.momobot.data

data class UssdStep(
    val input: String = "",
    val label: String = "",
    val waitMs: Long = 5000L
)

data class UssdCode(
    val id: String = "",
    val operateur: String = "",
    val categorie: String = "",
    val label: String = "",
    val sequenceBrute: String = "",
    val etapes: List<UssdStep> = emptyList(),
    val actif: Boolean = true
)

data class MessageUssd(
    val id: String = "",
    val operateur: String = "",
    val type: String = "",
    val motsClesDetection: String = "",
    val messageAffichéClient: String = "",
    val actif: Boolean = true
)

data class Job(
    val id: String = "",
    val clientUid: String = "",
    val clientPhone: String = "",
    val type: String = "",
    val operateur: String = "",
    val sousType: String? = null,
    val palier: String? = null,
    val ussdCodeId: String = "",
    val montant: Long = 0,
    val numeroClient: String = "",
    val statut: String = "pending",
    val retryCount: Long = 0,
    val createdAt: Long = 0
)

/** Résultat renvoyé après exécution d'un job, pour reporting au backend. */
data class JobResult(
    val statut: String, // "success" | "failed"
    val reponseBrute: String?,
    val erreur: String?,
    val ussdSequenceUsed: List<String>
)
