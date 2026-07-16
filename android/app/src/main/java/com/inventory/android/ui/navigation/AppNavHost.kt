package com.inventory.android.ui.navigation

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.inventory.android.auth.SessionState
import com.inventory.android.di.AppContainer
import com.inventory.android.sync.SyncScheduler
import com.inventory.android.ui.category.CategoryFormScreen
import com.inventory.android.ui.category.CategoryListScreen
import com.inventory.android.ui.home.HomeScreen
import com.inventory.android.ui.inventory.InventoryFormScreen
import com.inventory.android.ui.inventory.InventoryListScreen
import com.inventory.android.ui.login.LoginScreen
import com.inventory.android.ui.product.ProductFormScreen
import com.inventory.android.ui.product.ProductListScreen
import com.inventory.android.ui.scan.BarcodeScanScreen
import com.inventory.android.ui.settings.SettingsScreen
import com.inventory.android.ui.withdraw.WithdrawHistoryScreen
import com.inventory.android.ui.withdraw.WithdrawScreen
import com.inventory.android.util.ServerQrParser
import kotlinx.coroutines.launch

private object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val PRODUCTS = "products"
    const val PRODUCT_FORM = "product_form?localId={localId}"
    const val CATEGORIES = "categories"
    const val CATEGORY_FORM = "category_form?localId={localId}"
    const val INVENTORY = "inventory"
    const val INVENTORY_FORM = "inventory_form?localId={localId}&barcode={barcode}"
    const val SCAN = "scan"
    const val SCAN_SERVER = "scan_server"
    const val WITHDRAW = "withdraw/{localId}"
    const val WITHDRAW_HISTORY = "withdraw_history"
    const val SETTINGS = "settings"
}

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val sessionManager = AppContainer.instance.sessionManager
    val scope = rememberCoroutineScope()

    val startDestination = if (sessionManager.state.value is SessionState.LoggedIn) Routes.HOME else Routes.LOGIN

    LaunchedEffect(Unit) {
        sessionManager.forceLogoutEvents.collect {
            SyncScheduler.cancelPeriodic(context)
            navController.navigate(Routes.LOGIN) {
                popUpTo(0)
            }
        }
    }

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    SyncScheduler.schedulePeriodic(context)
                    SyncScheduler.triggerManualSync(context)
                    navController.navigate(Routes.HOME) { popUpTo(0) }
                },
                onScanServerQr = { navController.navigate(Routes.SCAN_SERVER) }
            )
        }

        composable(Routes.HOME) {
            HomeScreen(
                onProducts = { navController.navigate(Routes.PRODUCTS) },
                onInventory = { navController.navigate(Routes.INVENTORY) },
                onCategories = { navController.navigate(Routes.CATEGORIES) },
                onWithdrawHistory = { navController.navigate(Routes.WITHDRAW_HISTORY) },
                onSettings = { navController.navigate(Routes.SETTINGS) },
                onLoggedOut = {
                    SyncScheduler.cancelPeriodic(context)
                    navController.navigate(Routes.LOGIN) { popUpTo(0) }
                }
            )
        }

        composable(Routes.PRODUCTS) {
            ProductListScreen(
                onBack = { navController.popBackStack() },
                onAdd = { navController.navigate("product_form") },
                onEdit = { localId -> navController.navigate("product_form?localId=$localId") }
            )
        }

        composable(
            Routes.PRODUCT_FORM,
            arguments = listOf(navArgument("localId") { type = NavType.LongType; defaultValue = -1L })
        ) { backStackEntry ->
            val localId = backStackEntry.arguments?.getLong("localId")?.takeIf { it != -1L }
            ProductFormScreen(localId = localId, onBack = { navController.popBackStack() })
        }

        composable(Routes.CATEGORIES) {
            CategoryListScreen(
                onBack = { navController.popBackStack() },
                onAdd = { navController.navigate("category_form") },
                onEdit = { localId -> navController.navigate("category_form?localId=$localId") }
            )
        }

        composable(
            Routes.CATEGORY_FORM,
            arguments = listOf(navArgument("localId") { type = NavType.LongType; defaultValue = -1L })
        ) { backStackEntry ->
            val localId = backStackEntry.arguments?.getLong("localId")?.takeIf { it != -1L }
            CategoryFormScreen(localId = localId, onBack = { navController.popBackStack() })
        }

        composable(Routes.INVENTORY) {
            InventoryListScreen(
                onBack = { navController.popBackStack() },
                onAdd = { navController.navigate("inventory_form") },
                onScan = { navController.navigate(Routes.SCAN) },
                onEdit = { localId -> navController.navigate("inventory_form?localId=$localId") },
                onWithdraw = { localId -> navController.navigate("withdraw/$localId") }
            )
        }

        composable(
            Routes.INVENTORY_FORM,
            arguments = listOf(
                navArgument("localId") { type = NavType.LongType; defaultValue = -1L },
                navArgument("barcode") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val localId = backStackEntry.arguments?.getLong("localId")?.takeIf { it != -1L }
            val barcode = backStackEntry.arguments?.getString("barcode")
            InventoryFormScreen(localId = localId, prefillBarcode = barcode, onBack = { navController.popBackStack() })
        }

        composable(Routes.SCAN) {
            BarcodeScanScreen(
                onBack = { navController.popBackStack() },
                onBarcodeScanned = { code ->
                    scope.launch {
                        val existing = AppContainer.instance.inventoryRepository.findByBarcode(code)
                        navController.popBackStack()
                        if (existing != null) {
                            navController.navigate("inventory_form?localId=${existing.localId}")
                        } else {
                            navController.navigate("inventory_form?barcode=$code")
                        }
                    }
                }
            )
        }

        composable(
            Routes.WITHDRAW,
            arguments = listOf(navArgument("localId") { type = NavType.LongType })
        ) { backStackEntry ->
            val localId = backStackEntry.arguments?.getLong("localId") ?: return@composable
            WithdrawScreen(localId = localId, onBack = { navController.popBackStack() })
        }

        composable(Routes.WITHDRAW_HISTORY) {
            WithdrawHistoryScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onScanServerQr = { navController.navigate(Routes.SCAN_SERVER) }
            )
        }

        composable(Routes.SCAN_SERVER) {
            BarcodeScanScreen(
                onBack = { navController.popBackStack() },
                onBarcodeScanned = { scanned ->
                    val address = ServerQrParser.parse(scanned)
                    if (address != null) {
                        AppContainer.instance.tokenStore.setBackendServer(address.host, address.port)
                        Toast.makeText(context, "Servidor actualizado: ${address.host}:${address.port}", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "El código QR no contiene una URL de servidor válida", Toast.LENGTH_SHORT).show()
                    }
                    navController.popBackStack()
                }
            )
        }
    }
}
