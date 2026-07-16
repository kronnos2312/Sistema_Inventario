package com.inventory.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Primary = Color(0xFF1B5E20)
private val PrimaryDark = Color(0xFF66BB6A)

private val LightColors = lightColorScheme(
    primary = Primary,
    secondary = Color(0xFF37474F)
)

private val DarkColors = darkColorScheme(
    primary = PrimaryDark,
    secondary = Color(0xFF90A4AE)
)

@Composable
fun SistemaInventarioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
