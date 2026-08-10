package com.lfd.momobot

object BotConfig {
    /** À remplacer par ton URL Vercel une fois déployé. */
    const val BACKEND_BASE_URL = "https://ton-domaine.vercel.app"

    /** Doit être identique à INTERNAL_API_KEY côté backend (.env). */
    const val INTERNAL_API_KEY = "CHANGE_MOI_CLE_INTERNE_LONGUE_ET_ALEATOIRE"

    /** Délai par défaut entre deux étapes d'un menu USSD (en ms). */
    const val DEFAULT_STEP_DELAY_MS = 5000L

    /** Délai max total avant d'abandonner un job (timeout global). */
    const val JOB_TIMEOUT_MS = 90_000L

    /** Nombre de tentatives de lecture d'écran avant d'abandonner une étape. */
    const val MAX_READ_ATTEMPTS = 8
}
