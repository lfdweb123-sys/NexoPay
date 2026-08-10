package com.lfd.momobot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Relance automatiquement le service de traitement des jobs après un
 * redémarrage du téléphone, pour éviter d'avoir à rouvrir l'app à chaque
 * fois (important puisque tu ne surveilles pas 24h/24).
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, JobQueueService::class.java)
            ContextCompat.startForegroundService(context, serviceIntent)
        }
    }
}
