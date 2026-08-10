package com.lfd.momobot.ussd

import android.content.Context
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import com.lfd.momobot.data.SecureCredentialsStore

/**
 * Associe chaque opérateur (mtn/moov/celtiis) au bon PhoneAccountHandle
 * (= la bonne carte SIM physique), selon la config choisie dans l'app par
 * l'utilisateur (voir MainActivity, écran "Configuration des SIM").
 */
class SimAccountResolver(private val context: Context) {

    private val store = SecureCredentialsStore(context)

    @Suppress("MissingPermission") // READ_PHONE_STATE demandé au runtime avant tout appel
    fun resolve(operateur: String): PhoneAccountHandle? {
        val slotIndex = store.getSimSlot(operateur) ?: return null
        val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        val accounts = telecomManager.callCapablePhoneAccounts
        // L'ordre renvoyé par callCapablePhoneAccounts correspond généralement
        // à l'ordre des slots SIM physiques, mais CE N'EST PAS GARANTI sur tous
        // les OEM. À vérifier/ajuster lors du calibrage (voir README).
        return accounts.getOrNull(slotIndex)
    }

    fun listAvailableAccounts(): List<PhoneAccountHandle> {
        val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        return telecomManager.callCapablePhoneAccounts
    }
}
