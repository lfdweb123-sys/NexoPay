package com.lfd.momobot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.lfd.momobot.data.Job
import com.lfd.momobot.data.MessageUssd
import com.lfd.momobot.data.SecureCredentialsStore
import com.lfd.momobot.data.UssdCode
import com.lfd.momobot.data.UssdStep
import com.lfd.momobot.network.BackendApiClient
import com.lfd.momobot.ussd.SimAccountResolver
import com.lfd.momobot.ussd.UssdAccessibilityService
import com.lfd.momobot.ussd.UssdResponseMatcher
import java.util.LinkedList

/**
 * Service de fond : écoute la collection `jobs` (statut == "pending") en
 * temps réel, les empile dans une file FIFO (contrainte : un seul device
 * pour 3 SIM => une seule opération USSD à la fois, jamais en parallèle),
 * et les exécute un par un via UssdAccessibilityService.
 */
class JobQueueService : Service() {

    private val db = FirebaseFirestore.getInstance()
    private val api = BackendApiClient()
    private val queue = LinkedList<Job>()
    private var processing = false

    private var ussdCodesCache: Map<String, UssdCode> = emptyMap()
    private var messagesCache: Map<String, List<MessageUssd>> = emptyMap()

    override fun onCreate() {
        super.onCreate()
        startForegroundWithNotification()
        loadReferenceData()
        listenForPendingJobs()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundWithNotification() {
        val channelId = "lfd_momo_bot_channel"
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(channelId, "LFD MoMo Bot", NotificationManager.IMPORTANCE_LOW)
        )
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("LFD MoMo Bot actif")
            .setContentText("En attente d'opérations à traiter…")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setOngoing(true)
            .build()
        startForeground(1, notification)
    }

    /**
     * Charge les codes USSD et messages de détection depuis Firestore
     * (alimentés/édités par l'admin via le dashboard) et les tient à jour
     * en temps réel, pour que toute modification admin soit prise en
     * compte immédiatement sans redéployer le bot.
     */
    private fun loadReferenceData() {
        db.collection("ussd_codes").addSnapshotListener { snapshot, _ ->
            if (snapshot == null) return@addSnapshotListener
            ussdCodesCache = snapshot.documents.associate { doc ->
                val steps = (doc.get("etapes") as? List<Map<String, Any>>)?.map {
                    UssdStep(
                        input = it["input"] as? String ?: "",
                        label = it["label"] as? String ?: "",
                        waitMs = (it["waitMs"] as? Long) ?: 5000L
                    )
                } ?: emptyList()
                doc.id to UssdCode(
                    id = doc.id,
                    operateur = doc.getString("operateur") ?: "",
                    categorie = doc.getString("categorie") ?: "",
                    label = doc.getString("label") ?: "",
                    sequenceBrute = doc.getString("sequenceBrute") ?: "",
                    etapes = steps,
                    actif = doc.getBoolean("actif") ?: true
                )
            }
        }

        db.collection("ussd_messages").addSnapshotListener { snapshot, _ ->
            if (snapshot == null) return@addSnapshotListener
            val all = snapshot.documents.map { doc ->
                MessageUssd(
                    id = doc.id,
                    operateur = doc.getString("operateur") ?: "",
                    type = doc.getString("type") ?: "",
                    motsClesDetection = doc.getString("motsClesDetection") ?: "",
                    messageAffichéClient = doc.getString("messageAffichéClient") ?: "",
                    actif = doc.getBoolean("actif") ?: true
                )
            }
            messagesCache = all.groupBy { it.operateur }
        }
    }

    private fun listenForPendingJobs() {
        db.collection("jobs")
            .whereEqualTo("statut", "pending")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot == null) return@addSnapshotListener
                for (change in snapshot.documentChanges) {
                    if (change.type.name == "ADDED") {
                        val doc = change.document
                        val job = Job(
                            id = doc.id,
                            clientUid = doc.getString("clientUid") ?: "",
                            clientPhone = doc.getString("clientPhone") ?: "",
                            type = doc.getString("type") ?: "",
                            operateur = doc.getString("operateur") ?: "",
                            sousType = doc.getString("sousType"),
                            palier = doc.getString("palier"),
                            ussdCodeId = doc.getString("ussdCodeId") ?: "",
                            montant = doc.getLong("montant") ?: 0,
                            numeroClient = doc.getString("numeroClient") ?: "",
                            statut = doc.getString("statut") ?: "pending",
                            retryCount = doc.getLong("retryCount") ?: 0,
                            createdAt = doc.getLong("createdAt") ?: 0
                        )
                        synchronized(queue) { queue.add(job) }
                        processNextIfIdle()
                    }
                }
            }
    }

    private fun processNextIfIdle() {
        if (processing) return
        val next = synchronized(queue) { if (queue.isEmpty()) null else queue.removeFirst() }
        if (next == null) return
        processing = true
        executeJob(next)
    }

    private fun executeJob(job: Job) {
        val ussdCode = ussdCodesCache[job.ussdCodeId]
        if (ussdCode == null || !ussdCode.actif) {
            markResult(
                job,
                "failed",
                null,
                "Code USSD introuvable ou inactif (${job.ussdCodeId}). Vérifie /admin/ussd-codes."
            )
            return
        }

        val accessibilityService = UssdAccessibilityService.instance
        if (accessibilityService == null) {
            markResult(
                job,
                "failed",
                null,
                "Service d'accessibilité non activé. Active-le dans Paramètres > Accessibilité > LFD MoMo Bot."
            )
            return
        }

        val phoneAccount = SimAccountResolver(this).resolve(job.operateur)

        db.collection("jobs").document(job.id)
            .update("statut", "processing", "startedAt", System.currentTimeMillis())

        val store = SecureCredentialsStore(this)
        val code = store.getMerchantCode(job.operateur) ?: ""

        val filledSteps = ussdCode.etapes.map { step ->
            step.copy(input = fillPlaceholders(step.input, job, code))
        }
        val initialUssd = fillPlaceholders(ussdCode.sequenceBrute, job, code)

        accessibilityService.runSequence(
            context = this,
            initialUssd = initialUssd,
            steps = filledSteps,
            phoneAccountHandle = phoneAccount,
            onFinal = { reponseBrute ->
                val messages = messagesCache[job.operateur] ?: emptyList()
                val matched = UssdResponseMatcher.detect(reponseBrute, messages)
                val statut = if (matched?.type == "success") "success" else "failed"
                val erreur = if (statut == "failed") (matched?.messageAffichéClient ?: "Échec non identifié — réponse brute enregistrée pour analyse.") else null
                markResult(job, statut, reponseBrute, erreur)
            },
            onError = { erreur ->
                markResult(job, "failed", null, erreur)
            }
        )
    }

    private fun fillPlaceholders(template: String, job: Job, code: String): String {
        return template
            .replace("{numero}", job.numeroClient)
            .replace("{montant}", job.montant.toString())
            .replace("{code}", code)
    }

    private fun markResult(job: Job, statut: String, reponseBrute: String?, erreur: String?) {
        val sequenceLog = UssdAccessibilityService.instance?.getExecutedSequenceLog() ?: emptyList()
        try {
            api.pushJobResult(job.id, statut, reponseBrute, erreur, sequenceLog)
        } catch (_: Exception) {
            // Filet de sécurité : si l'appel API échoue, on met quand même à jour
            // Firestore directement pour ne pas perdre l'information.
            db.collection("jobs").document(job.id)
                .update(
                    mapOf(
                        "statut" to statut,
                        "reponseBrute" to reponseBrute,
                        "erreur" to erreur,
                        "completedAt" to System.currentTimeMillis()
                    )
                )
        }
        processing = false
        processNextIfIdle()
    }
}
