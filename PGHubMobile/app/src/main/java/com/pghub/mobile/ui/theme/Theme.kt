package com.pghub.mobile.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// PG Hub is a dark-first product, so we commit to a single dark scheme regardless
// of the system setting — matching the web app which does not offer a light mode.
private val PGHubColorScheme = darkColorScheme(
    primary = PgAccent,
    onPrimary = PgBg,
    primaryContainer = PgBorder,
    onPrimaryContainer = PgAccent,
    secondary = PgDim,
    onSecondary = PgBg,
    background = PgBg,
    onBackground = PgText,
    surface = PgSurface,
    onSurface = PgText,
    surfaceVariant = PgSurfaceElevated,
    onSurfaceVariant = PgDim,
    outline = PgBorder,
    outlineVariant = PgBorder,
    error = DifficultyHard,
    onError = PgBg
)

@Composable
fun PGHubTheme(
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = PgBg.toArgb()
            window.navigationBarColor = PgBg.toArgb()
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = false
            controller.isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = PGHubColorScheme,
        typography = PGHubTypography,
        content = content
    )
}
