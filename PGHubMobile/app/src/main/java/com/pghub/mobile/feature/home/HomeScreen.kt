package com.pghub.mobile.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pghub.mobile.ui.components.DifficultyChip
import com.pghub.mobile.ui.components.ErrorState
import com.pghub.mobile.ui.components.LoadingState
import com.pghub.mobile.ui.components.PGCard
import com.pghub.mobile.ui.components.SectionHeader
import com.pghub.mobile.ui.components.StatTile
import com.pghub.mobile.ui.theme.PgDim

@Composable
fun HomeScreen(viewModel: HomeViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    when {
        state.loading -> LoadingState()
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::refresh)
        else -> Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column {
                Text(
                    text = "PG Hub",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Your DSA and interview-prep companion",
                    style = MaterialTheme.typography.bodyMedium,
                    color = PgDim
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatTile(
                    value = state.streakDays.toString(),
                    label = "Day streak",
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    value = state.solvedCount.toString(),
                    label = "Solved",
                    modifier = Modifier.weight(1f)
                )
            }

            StatTile(
                value = state.totalProblems.toString(),
                label = "Problems in the bank",
                accent = MaterialTheme.colorScheme.onSurface
            )

            SectionHeader("Problem of the day")
            PGCard {
                val potd = state.problemOfTheDay
                if (potd == null) {
                    Text(
                        "No problem available yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PgDim
                    )
                } else {
                    Text(
                        text = potd.displayTitle,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(8.dp))
                    DifficultyChip(potd.normalizedDifficulty)
                }
            }

            PGCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.LocalFireDepartment,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(0.dp))
                    Text(
                        text = "  Keep a daily streak by solving at least one problem each day.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PgDim
                    )
                }
            }
        }
    }
}
