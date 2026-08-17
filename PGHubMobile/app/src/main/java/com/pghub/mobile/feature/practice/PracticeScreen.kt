package com.pghub.mobile.feature.practice

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pghub.mobile.data.model.Difficulty
import com.pghub.mobile.data.model.Problem
import com.pghub.mobile.ui.components.DifficultyChip
import com.pghub.mobile.ui.components.ErrorState
import com.pghub.mobile.ui.components.LoadingState
import com.pghub.mobile.ui.components.MessageState
import com.pghub.mobile.ui.components.PGCard
import com.pghub.mobile.ui.theme.PgBorder
import com.pghub.mobile.ui.theme.PgDim

@Composable
fun PracticeScreen(viewModel: PracticeViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = state.query,
            onValueChange = viewModel::onQueryChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("Search problems", color = PgDim) },
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = PgDim) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = PgBorder,
                cursorColor = MaterialTheme.colorScheme.primary,
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
            )
        )

        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DifficultyFilterChip("All", state.difficultyFilter == null) {
                viewModel.onDifficultySelected(null)
            }
            listOf(Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD).forEach { diff ->
                DifficultyFilterChip(diff.label, state.difficultyFilter == diff) {
                    viewModel.onDifficultySelected(
                        if (state.difficultyFilter == diff) null else diff
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)
            state.visibleProblems.isEmpty() -> MessageState("No problems match your filters.")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.visibleProblems, key = { it.id }) { problem ->
                    ProblemRow(problem)
                }
            }
        }
    }
}

@Composable
private fun DifficultyFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = MaterialTheme.typography.labelLarge) },
        colors = FilterChipDefaults.filterChipColors(
            containerColor = MaterialTheme.colorScheme.surface,
            labelColor = PgDim,
            selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.16f),
            selectedLabelColor = MaterialTheme.colorScheme.primary
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = PgBorder,
            selectedBorderColor = MaterialTheme.colorScheme.primary
        )
    )
}

@Composable
private fun ProblemRow(problem: Problem) {
    PGCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "#${problem.id}",
                style = MaterialTheme.typography.labelSmall,
                color = PgDim
            )
            Text(
                text = problem.displayTitle,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            DifficultyChip(problem.normalizedDifficulty)
        }
    }
}
