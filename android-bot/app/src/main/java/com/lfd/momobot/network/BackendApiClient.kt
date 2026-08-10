package com.lfd.momobot.network

import com.lfd.momobot.BotConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class BackendApiClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    /** Filet de sécurité : récupère les jobs en attente si l'écoute Firestore temps réel échoue. */
    fun fetchPendingJobs(): JSONArray {
        val request = Request.Builder()
            .url("${BotConfig.BACKEND_BASE_URL}/api/jobs/pending")
            .addHeader("x-internal-api-key", BotConfig.INTERNAL_API_KEY)
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: "{}"
            if (!response.isSuccessful) throw Exception("Erreur API ($response.code): $body")
            return JSONObject(body).optJSONArray("jobs") ?: JSONArray()
        }
    }

    /** Pousse le résultat d'exécution d'un job vers le backend (déclenche la notif client). */
    fun pushJobResult(
        jobId: String,
        statut: String,
        reponseBrute: String?,
        erreur: String?,
        sequenceUsed: List<String>
    ) {
        val payload = JSONObject().apply {
            put("statut", statut)
            put("reponseBrute", reponseBrute)
            put("erreur", erreur)
            put("ussdSequenceUsed", JSONArray(sequenceUsed))
        }

        val request = Request.Builder()
            .url("${BotConfig.BACKEND_BASE_URL}/api/jobs/$jobId/result")
            .addHeader("x-internal-api-key", BotConfig.INTERNAL_API_KEY)
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw Exception("Échec envoi résultat job $jobId : ${response.code}")
            }
        }
    }
}
