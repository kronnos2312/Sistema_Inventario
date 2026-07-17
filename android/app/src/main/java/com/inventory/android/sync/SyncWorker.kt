package com.inventory.android.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.inventory.android.data.local.entity.EntityType
import com.inventory.android.data.local.entity.OperationType
import com.inventory.android.data.local.entity.PendingOperationEntity
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

private const val MAX_ATTEMPTS = 5

/**
 * Sincroniza en dos fases: primero drena la cola de PendingOperation (push), luego
 * refresca cada colección desde el servidor (pull). Un fallo de red aborta el resto
 * del push y reintenta con el backoff de WorkManager; un fallo de negocio (barcode
 * duplicado, etc.) descarta o deja la operación para reintento sin frenar la cola.
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val container = AppContainer.instance
        val pendingDao = container.database.pendingOperationDao()

        var networkFailure = false

        for (op in pendingDao.getAllOrdered()) {
            try {
                processOperation(op)
                pendingDao.remove(op)
            } catch (e: IOException) {
                networkFailure = true
                break
            } catch (e: Exception) {
                val attempts = op.attempts + 1
                pendingDao.recordFailure(op.id, e.message)
                if (attempts >= MAX_ATTEMPTS) {
                    pendingDao.remove(op)
                }
            }
        }

        if (!networkFailure) {
            try {
                val fullySynced = pendingDao.getAllOrdered().isEmpty() &&
                    !container.categoryRepository.hasDirty() &&
                    !container.productRepository.hasDirty() &&
                    !container.inventoryRepository.hasDirty()

                if (fullySynced) {
                    // Todo quedó sincronizado y sin cambios locales pendientes: se libera
                    // la caché local y se recarga estrictamente desde el servidor.
                    container.categoryRepository.replaceFromServer()
                    container.productRepository.replaceFromServer()
                    container.inventoryRepository.replaceFromServer()
                } else {
                    // Quedan cambios locales sin resolver (reintentos de negocio aún
                    // dentro del límite de intentos): merge conservador, sin destruirlos.
                    container.categoryRepository.pullFromServer()
                    container.productRepository.pullFromServer()
                    container.inventoryRepository.pullFromServer()
                }
                SyncStatus.reportSuccess()
            } catch (e: IOException) {
                networkFailure = true
            } catch (e: Exception) {
                // Antes este catch no existía: cualquier fallo que no fuera IOException
                // (respuesta del servidor con forma inesperada, error de Room, etc.)
                // se propagaba fuera de doWork() y el pull quedaba silenciosamente sin
                // aplicar en cada intento, sin ningún indicio visible para el usuario.
                SyncStatus.reportError(e.message ?: e::class.java.simpleName)
                return@withContext Result.failure()
            }
        }

        if (networkFailure) Result.retry() else Result.success()
    }

    // api.xxx() de Retrofit lanza HttpException (RuntimeException) en 4xx/5xx, no IOException,
    // así que un error de negocio cae en el catch(Exception) del loop, no en el de red.
    private suspend fun processOperation(op: PendingOperationEntity) {
        when (op.entityType) {
            EntityType.PRODUCT -> processProduct(op)
            EntityType.CATEGORY -> processCategory(op)
            EntityType.INVENTORY_ITEM -> processInventory(op)
        }
    }

    private suspend fun processProduct(op: PendingOperationEntity) {
        val repo = AppContainer.instance.productRepository
        when (op.operation) {
            OperationType.CREATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                val synced = repo.pushCreate(entity)
                repo.applySynced(synced)
            }
            OperationType.UPDATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                repo.pushUpdate(entity)
                repo.markPushedUpdate(op.localEntityId)
            }
            OperationType.DELETE -> {
                val entity = repo.getByLocalId(op.localEntityId)
                val remoteId = entity?.remoteId
                if (remoteId != null) repo.pushDelete(remoteId)
                repo.deleteLocal(op.localEntityId)
            }
        }
    }

    private suspend fun processCategory(op: PendingOperationEntity) {
        val repo = AppContainer.instance.categoryRepository
        when (op.operation) {
            OperationType.CREATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                val synced = repo.pushCreate(entity)
                repo.applySynced(synced)
            }
            OperationType.UPDATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                repo.pushUpdate(entity)
                repo.markPushedUpdate(op.localEntityId)
            }
            OperationType.DELETE -> {
                val entity = repo.getByLocalId(op.localEntityId)
                val remoteId = entity?.remoteId
                if (remoteId != null) repo.pushDelete(remoteId)
                repo.deleteLocal(op.localEntityId)
            }
        }
    }

    private suspend fun processInventory(op: PendingOperationEntity) {
        val repo = AppContainer.instance.inventoryRepository
        when (op.operation) {
            OperationType.CREATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                val synced = repo.pushCreate(entity)
                repo.applySynced(synced)
            }
            OperationType.UPDATE -> {
                val entity = repo.getByLocalId(op.localEntityId) ?: return
                repo.pushUpdate(entity)
                repo.markPushedUpdate(op.localEntityId)
            }
            OperationType.DELETE -> {
                val entity = repo.getByLocalId(op.localEntityId)
                val remoteId = entity?.remoteId
                if (remoteId != null) repo.pushDelete(remoteId)
                repo.deleteLocal(op.localEntityId)
            }
            OperationType.WITHDRAW -> {
                repo.pushWithdraw(op.payloadJson)
            }
        }
    }
}
