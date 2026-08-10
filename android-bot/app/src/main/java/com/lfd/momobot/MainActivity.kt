package com.lfd.momobot

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.lfd.momobot.data.SecureCredentialsStore
import com.lfd.momobot.databinding.ActivityMainBinding
import com.lfd.momobot.ussd.SimAccountResolver

/**
 * Écran de configuration unique du bot :
 * - Demande des permissions (appel téléphonique, état SIM, notifications)
 * - Lien direct vers Paramètres > Accessibilité (impossible d'activer par code)
 * - Association SIM physique <-> opérateur (mtn/moov/celtiis)
 * - Saisie des codes secrets marchands (stockés chiffrés, jamais en clair)
 * - Démarrage du service de fond JobQueueService
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var secureStore: SecureCredentialsStore

    private val requiredPermissions = arrayOf(
        Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.POST_NOTIFICATIONS
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        secureStore = SecureCredentialsStore(this)

        binding.btnGrantPermissions.setOnClickListener { requestAllPermissions() }
        binding.btnOpenAccessibility.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        binding.btnSaveConfig.setOnClickListener { saveConfig() }
        binding.btnStartService.setOnClickListener { startBotService() }
        binding.btnListSims.setOnClickListener { listAvailableSims() }

        loadExistingConfig()
    }

    private fun requestAllPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 100)
        } else {
            Toast.makeText(this, "Toutes les permissions sont déjà accordées", Toast.LENGTH_SHORT).show()
        }
    }

    private fun listAvailableSims() {
        val accounts = SimAccountResolver(this).listAvailableAccounts()
        val description = accounts.mapIndexed { index, handle ->
            "Slot $index : ${handle.id}"
        }.joinToString("\n")
        Toast.makeText(
            this,
            if (description.isBlank()) "Aucune SIM détectée (vérifie les permissions)" else description,
            Toast.LENGTH_LONG
        ).show()
    }

    private fun saveConfig() {
        val mtnSlot = binding.inputMtnSlot.text.toString().trim().toIntOrNull()
        val moovSlot = binding.inputMoovSlot.text.toString().trim().toIntOrNull()
        val celtiisSlot = binding.inputCeltiisSlot.text.toString().trim().toIntOrNull()

        mtnSlot?.let { secureStore.setSimSlot("mtn", it) }
        moovSlot?.let { secureStore.setSimSlot("moov", it) }
        celtiisSlot?.let { secureStore.setSimSlot("celtiis", it) }

        val mtnCode = binding.inputMtnCode.text.toString().trim()
        val moovCode = binding.inputMoovCode.text.toString().trim()
        val celtiisCode = binding.inputCeltiisCode.text.toString().trim()

        if (mtnCode.isNotEmpty()) secureStore.setMerchantCode("mtn", mtnCode)
        if (moovCode.isNotEmpty()) secureStore.setMerchantCode("moov", moovCode)
        if (celtiisCode.isNotEmpty()) secureStore.setMerchantCode("celtiis", celtiisCode)

        // On efface les champs de code juste après sauvegarde pour ne pas
        // les laisser affichés en clair à l'écran plus longtemps que nécessaire.
        binding.inputMtnCode.text?.clear()
        binding.inputMoovCode.text?.clear()
        binding.inputCeltiisCode.text?.clear()

        Toast.makeText(this, "Configuration enregistrée", Toast.LENGTH_SHORT).show()
    }

    private fun loadExistingConfig() {
        secureStore.getSimSlot("mtn")?.let { binding.inputMtnSlot.setText(it.toString()) }
        secureStore.getSimSlot("moov")?.let { binding.inputMoovSlot.setText(it.toString()) }
        secureStore.getSimSlot("celtiis")?.let { binding.inputCeltiisSlot.setText(it.toString()) }
    }

    private fun startBotService() {
        val intent = Intent(this, JobQueueService::class.java)
        ContextCompat.startForegroundService(this, intent)
        Toast.makeText(this, "Bot démarré — traitement des opérations en cours", Toast.LENGTH_SHORT).show()
    }
}
