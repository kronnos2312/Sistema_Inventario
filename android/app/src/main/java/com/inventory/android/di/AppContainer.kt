package com.inventory.android.di

import android.content.Context
import com.google.gson.Gson
import com.inventory.android.BuildConfig
import com.inventory.android.auth.SessionManager
import com.inventory.android.auth.TokenStore
import com.inventory.android.data.local.AppDatabase
import com.inventory.android.data.remote.ApiService
import com.inventory.android.data.remote.AuthInterceptor
import com.inventory.android.data.remote.DynamicBaseUrlInterceptor
import com.inventory.android.data.repository.AuthRepository
import com.inventory.android.data.repository.CategoryRepository
import com.inventory.android.data.repository.InventoryRepository
import com.inventory.android.data.repository.ProductRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {

    val gson: Gson = Gson()
    val database: AppDatabase = AppDatabase.getInstance(context)
    val tokenStore: TokenStore = TokenStore(context)
    val sessionManager: SessionManager = SessionManager(tokenStore)

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
    }

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(DynamicBaseUrlInterceptor(tokenStore))
        .addInterceptor(AuthInterceptor(tokenStore, sessionManager))
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    // Host/puerto reales los resuelve DynamicBaseUrlInterceptor en cada request;
    // esta baseUrl solo necesita ser sintácticamente válida para Retrofit.
    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl("http://localhost/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    val apiService: ApiService = retrofit.create(ApiService::class.java)

    val authRepository = AuthRepository(apiService, sessionManager, database.localCredentialDao())
    val productRepository = ProductRepository(apiService, database.productDao(), database.pendingOperationDao())
    val categoryRepository = CategoryRepository(apiService, database.categoryDao(), database.pendingOperationDao())
    val inventoryRepository = InventoryRepository(apiService, database.inventoryItemDao(), database.pendingOperationDao(), gson)

    companion object {
        @Volatile lateinit var instance: AppContainer
            private set

        fun init(context: Context) {
            if (!::instance.isInitialized) {
                instance = AppContainer(context.applicationContext)
            }
        }
    }
}
