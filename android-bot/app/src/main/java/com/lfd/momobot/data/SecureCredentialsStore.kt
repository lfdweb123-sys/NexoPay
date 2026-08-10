package com.lfd.momobot.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Stocke les codes secrets marchands (PIN Mobile Money) et la config locale
 * du bot de façon chiffrée sur le device (Android Keystore), jamais en
 * clair dans le code ni dans les logs.
 */
class SecureCredentialsStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "lfd_momo_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun setMerchantCode(operateur: String, code: String) {
        prefs.edit().putString("code_$operateur", code).apply()
    }

    fun getMerchantCode(operateur: String): String? {
        return prefs.getString("code_$operateur", null)
    }

    /** slot 0, 1 ou 2 correspondant à l'opérateur (mtn/moov/celtiis) sur ce device */
    fun setSimSlot(operateur: String, slotIndex: Int) {
        prefs.edit().putInt("slot_$operateur", slotIndex).apply()
    }

    fun getSimSlot(operateur: String): Int? {
        val v = prefs.getInt("slot_$operateur", -1)
        return if (v == -1) null else v
    }
}
