package com.lfd.momobot.ussd

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.lfd.momobot.BotConfig
import com.lfd.momobot.data.UssdStep

/**
 * Service d'accessibilité qui pilote la boîte de dialogue USSD système :
 * lit le texte affiché à chaque étape, saisit la réponse attendue (numéro,
 * montant, code secret, choix de menu), clique sur OK/Envoyer, et répète
 * jusqu'à la fin de la séquence ou jusqu'à un message final.
 *
 * IMPORTANT — CALIBRAGE OBLIGATOIRE SUR TON DEVICE :
 * Les libellés des boutons ("OK", "ENVOYER", "Annuler"...) et le nom du
 * paquet qui affiche la fenêtre USSD varient selon le fabricant (Samsung,
 * Tecno, Infinix, Xiaomi...). Le service ci-dessous couvre les cas les plus
 * courants mais DOIT être testé et ajusté avec de vrais menus USSD sur ton
 * téléphone avant mise en production (voir README section "Calibrage").
 */
class UssdAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "UssdAccessibilityService"

        // Libellés usuels des boutons de confirmation (à compléter selon ton device)
        private val CONFIRM_LABELS = listOf("ok", "envoyer", "send", "valider", "soumettre")
        private val CANCEL_LABELS = listOf("annuler", "cancel", "fermer")

        @Volatile
        var instance: UssdAccessibilityService? = null
    }

    private val handler = Handler(Looper.getMainLooper())

    // État de la séquence en cours d'exécution
    private var currentSteps: List<UssdStep> = emptyList()
    private var currentStepIndex = 0
    private var onFinalMessage: ((String) -> Unit)? = null
    private var onTimeoutOrError: ((String) -> Unit)? = null
    private var lastSeenText: String = ""
    private var jobActive = false
    private val executedInputsLog = mutableListOf<String>()

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Service d'accessibilité connecté")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    override fun onInterrupt() {
        Log.w(TAG, "Service interrompu")
    }

    /**
     * Lance une séquence USSD complète sur la SIM indiquée.
     * [initialUssd] est le code de départ (ex: "*840#").
     * [steps] sont les étapes de menu à répondre après l'ouverture du dialogue
     * (vide si le code se suffit à lui-même, ex: "*840*50*XX*1000#").
     */
    fun runSequence(
        context: Context,
        initialUssd: String,
        steps: List<UssdStep>,
        phoneAccountHandle: PhoneAccountHandle?,
        onFinal: (String) -> Unit,
        onError: (String) -> Unit
    ) {
        currentSteps = steps
        currentStepIndex = 0
        onFinalMessage = onFinal
        onTimeoutOrError = onError
        jobActive = true
        executedInputsLog.clear()
        executedInputsLog.add(initialUssd)

        dialUssd(context, initialUssd, phoneAccountHandle)

        // Timeout de sécurité global : si aucune réponse finale après X secondes,
        // on abandonne le job pour ne pas bloquer la queue indéfiniment.
        handler.postDelayed({
            if (jobActive) {
                jobActive = false
                onTimeoutOrError?.invoke("Timeout : aucune réponse USSD reçue dans le délai imparti")
            }
        }, BotConfig.JOB_TIMEOUT_MS)
    }

    private fun dialUssd(context: Context, code: String, phoneAccountHandle: PhoneAccountHandle?) {
        try {
            val encoded = code.replace("#", Uri.encode("#"))
            val uri = Uri.parse("tel:$encoded")
            val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            val extras = Bundle()
            if (phoneAccountHandle != null) {
                extras.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, phoneAccountHandle)
            }
            telecomManager.placeCall(uri, extras)
        } catch (e: SecurityException) {
            jobActive = false
            onTimeoutOrError?.invoke("Permission CALL_PHONE manquante ou refusée : ${e.message}")
        } catch (e: Exception) {
            jobActive = false
            onTimeoutOrError?.invoke("Erreur lors de la composition USSD : ${e.message}")
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!jobActive || event == null) return

        val root = rootInActiveWindow ?: return
        val (messageText, inputNode, confirmButton) = extractDialogParts(root)

        if (messageText.isNullOrBlank()) return
        if (messageText == lastSeenText) return // évite de re-traiter le même écran plusieurs fois
        lastSeenText = messageText

        Log.d(TAG, "Texte USSD détecté : $messageText")

        if (inputNode != null && confirmButton != null) {
            // Le dialogue attend une saisie (numéro, montant, code, choix de menu)
            respondToStep(inputNode, confirmButton)
        } else if (confirmButton != null) {
            // Écran final : un message + un bouton OK, sans champ de saisie
            jobActive = false
            confirmButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            onFinalMessage?.invoke(messageText)
        }
        // Si rien n'est actionnable, on attend le prochain événement (écran en cours de chargement)
    }

    private fun respondToStep(inputNode: AccessibilityNodeInfo, confirmButton: AccessibilityNodeInfo) {
        if (currentStepIndex >= currentSteps.size) {
            // Plus d'étape prévue mais le menu demande encore une saisie :
            // séquence USSD mal calibrée pour cette opération → on arrête proprement.
            jobActive = false
            onTimeoutOrError?.invoke(
                "Le menu USSD demande une saisie supplémentaire non prévue dans la séquence (étape ${currentStepIndex + 1}). " +
                    "Vérifie/complète cette séquence depuis le dashboard admin."
            )
            return
        }

        val step = currentSteps[currentStepIndex]
        executedInputsLog.add(step.input)

        val args = Bundle()
        args.putCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
            step.input
        )
        inputNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)

        currentStepIndex++

        handler.postDelayed({
            confirmButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        }, 400)
    }

    /**
     * Explore l'arbre de la fenêtre active pour trouver :
     * - le texte du message USSD affiché
     * - le champ de saisie (EditText) s'il existe
     * - le bouton de confirmation (OK/Envoyer)
     *
     * NOTE CALIBRAGE : la structure exacte (TextView/EditText/Button) et
     * leurs identifiants varient selon l'OEM. Cette fonction se base sur les
     * types de vue standard Android — teste avec tes vrais menus USSD et
     * ajuste si besoin (ex: certains OEM utilisent des vues personnalisées).
     */
    private fun extractDialogParts(
        root: AccessibilityNodeInfo
    ): Triple<String?, AccessibilityNodeInfo?, AccessibilityNodeInfo?> {
        var message: String? = null
        var input: AccessibilityNodeInfo? = null
        var confirmBtn: AccessibilityNodeInfo? = null

        fun traverse(node: AccessibilityNodeInfo?) {
            if (node == null) return
            val className = node.className?.toString() ?: ""

            if (className.contains("EditText") && input == null) {
                input = node
            } else if (className.contains("Button")) {
                val text = node.text?.toString()?.trim()?.lowercase() ?: ""
                if (CONFIRM_LABELS.any { text.contains(it) } && confirmBtn == null) {
                    confirmBtn = node
                }
            } else if (className.contains("TextView")) {
                val text = node.text?.toString()
                if (!text.isNullOrBlank() && (message == null || text.length > (message?.length ?: 0))) {
                    // On garde le texte le plus long trouvé : généralement le
                    // message USSD est plus long que les libellés de bouton.
                    val lower = text.lowercase()
                    if (CONFIRM_LABELS.none { lower == it } && CANCEL_LABELS.none { lower == it }) {
                        message = text
                    }
                }
            }

            for (i in 0 until node.childCount) {
                traverse(node.getChild(i))
            }
        }

        traverse(root)
        return Triple(message, input, confirmBtn)
    }

    fun getExecutedSequenceLog(): List<String> = executedInputsLog.toList()
}
