package com.pghub.mobile.feature.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pghub.mobile.data.model.LeetCodeProfile
import com.pghub.mobile.data.model.Profile
import com.pghub.mobile.ui.components.HDivider
import com.pghub.mobile.ui.components.PGCard
import com.pghub.mobile.ui.components.SectionHeader
import com.pghub.mobile.ui.components.StatStripItem
import com.pghub.mobile.ui.theme.DifficultyEasy
import com.pghub.mobile.ui.theme.DifficultyHard
import com.pghub.mobile.ui.theme.DifficultyMedium
import com.pghub.mobile.ui.theme.PgBorder
import com.pghub.mobile.ui.theme.PgDim

@Composable
fun ProfileScreen(viewModel: ProfileViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        SectionHeader("Profile")

        PGCard {
            OutlinedTextField(
                value = state.usernameInput,
                onValueChange = viewModel::onUsernameChange,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("PG Hub username", color = PgDim) },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    imeAction = ImeAction.Search
                ),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                    onSearch = { viewModel.loadProfile() }
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = PgBorder,
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                )
            )
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = viewModel::loadProfile,
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.loading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) { Text("Load profile") }
        }

        when {
            state.loading -> Box(
                Modifier.fillMaxWidth().padding(24.dp),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator(color = MaterialTheme.colorScheme.primary) }

            state.error != null -> Text(
                state.error!!,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error
            )

            state.profile != null -> {
                ProfileHeaderCard(state.profile!!, state.completedCount)
                state.leetCode?.let { SolvedByDifficulty(it) }
            }

            !state.hasSearched -> Text(
                "Enter your PG Hub username to see your stats.",
                style = MaterialTheme.typography.bodyMedium,
                color = PgDim
            )
        }
    }
}

@Composable
private fun ProfileHeaderCard(profile: Profile, completedCount: Int?) {
    PGCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Outlined.AccountCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp).clip(CircleShape)
            )
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    profile.shownName,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                profile.username?.let {
                    Text("@$it", style = MaterialTheme.typography.bodyMedium, color = PgDim)
                }
            }
        }

        profile.themePreset?.let {
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.Palette,
                    contentDescription = null,
                    tint = PgDim,
                    modifier = Modifier.size(15.dp)
                )
                Text(
                    "  Theme: $it",
                    style = MaterialTheme.typography.labelSmall,
                    color = PgDim
                )
            }
        }

        Spacer(Modifier.height(14.dp))
        HDivider()
        Spacer(Modifier.height(14.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
            StatStripItem((completedCount ?: 0).toString(), "Solved")
            StatStripItem(profile.leetcodeHandle?.let { "Linked" } ?: "None", "LeetCode")
            StatStripItem((profile.themePreset ?: "default"), "Theme")
        }
    }
}

@Composable
private fun SolvedByDifficulty(leetCode: LeetCodeProfile) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionHeader("Solved by difficulty")
        PGCard {
            Text(
                "LeetCode @${leetCode.username}" +
                    (leetCode.ranking?.let { "  ·  Rank #$it" } ?: ""),
                style = MaterialTheme.typography.labelSmall,
                color = PgDim
            )
            Spacer(Modifier.height(14.dp))
            DifficultyBar("Easy", leetCode.easySolved, leetCode.totalSolved, DifficultyEasy)
            Spacer(Modifier.height(10.dp))
            DifficultyBar("Medium", leetCode.mediumSolved, leetCode.totalSolved, DifficultyMedium)
            Spacer(Modifier.height(10.dp))
            DifficultyBar("Hard", leetCode.hardSolved, leetCode.totalSolved, DifficultyHard)
            Spacer(Modifier.height(16.dp))
            HDivider()
            Spacer(Modifier.height(14.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                StatStripItem(leetCode.totalSolved.toString(), "Total")
                StatStripItem(leetCode.easySolved.toString(), "Easy")
                StatStripItem(leetCode.mediumSolved.toString(), "Medium")
                StatStripItem(leetCode.hardSolved.toString(), "Hard")
            }
        }
    }
}

@Composable
private fun DifficultyBar(
    label: String,
    value: Long,
    total: Long,
    color: androidx.compose.ui.graphics.Color
) {
    val fraction = if (total <= 0) 0f else (value.toFloat() / total.toFloat()).coerceIn(0f, 1f)
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = color)
            Text(value.toString(), style = MaterialTheme.typography.labelSmall, color = PgDim)
        }
        Spacer(Modifier.height(6.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(3.dp))
                .background(PgBorder)
        ) {
            Box(
                Modifier
                    .fillMaxWidth(fraction)
                    .height(6.dp)
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(3.dp))
                    .background(color)
            )
        }
    }
}
