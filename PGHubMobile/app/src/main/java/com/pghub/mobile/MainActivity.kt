package com.pghub.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.pghub.mobile.ui.navigation.PGHubApp
import com.pghub.mobile.ui.theme.PGHubTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PGHubTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    PGHubApp()
                }
            }
        }
    }
}
