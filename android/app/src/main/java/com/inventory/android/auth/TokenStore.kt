package com.inventory.android.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.inventory.android.BuildConfig

private const val PREFS_NAME = "auth_store"

/**
 * Único almacén cifrado local: sesión (token/usuario/rol) y configuración del
 * servidor (host:puerto), editable desde la pantalla de Configuración.
 */
class TokenStore(context: Context) {

    private val prefs: SharedPreferences = createPrefs(context)

    private fun createPrefs(context: Context): SharedPreferences {
        return try {
            createEncryptedPrefs(context)
        } catch (e: Exception) {
            // La clave del Keystore y el archivo cifrado quedaron desincronizados
            // (típico tras restaurar un backup o clonar el dispositivo). Se borra
            // el almacén corrupto y se regenera desde cero en vez de crashear.
            Log.w("TokenStore", "Almacén cifrado corrupto, regenerando", e)
            context.deleteSharedPreferences(PREFS_NAME)
            createEncryptedPrefs(context)
        }
    }

    private fun createEncryptedPrefs(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveSession(token: String, username: String, role: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USERNAME, username)
            .putString(KEY_ROLE, role)
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USERNAME)
            .remove(KEY_ROLE)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)
    fun getRole(): String? = prefs.getString(KEY_ROLE, null)

    fun getBackendHost(): String = prefs.getString(KEY_HOST, null) ?: BuildConfig.DEFAULT_BACKEND_HOST
    fun getBackendPort(): String = prefs.getString(KEY_PORT, null) ?: BuildConfig.DEFAULT_BACKEND_PORT

    fun setBackendServer(host: String, port: String) {
        prefs.edit()
            .putString(KEY_HOST, host)
            .putString(KEY_PORT, port)
            .apply()
    }

    private companion object {
        const val KEY_TOKEN = "token"
        const val KEY_USERNAME = "username"
        const val KEY_ROLE = "role"
        const val KEY_HOST = "backend_host"
        const val KEY_PORT = "backend_port"
    }
}
