package com.pghub.mobile.feature.compete

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.EmojiEvents
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.pghub.mobile.data.model.ExternalContest
import com.pghub.mobile.data.model.LeetCodeProfile
import com.pghub.mobile.ui.components.HDivider
import com.pghub.mobile.ui.components.PGCard
import com.pghub.mobile.ui.components.SectionHeader
import com.pghub.mobile.ui.components.StatStripItem
import com.pghub.mobile.ui.theme.PgBorder
import com.pghub.mobile.ui.theme.PgDim
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@Composable
fun CompeteScreen(viewModel: CompeteViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { SectionHeader("LeetCode lookup") }

        item {
            PGCard {
                OutlinedTextField(
                    value = state.handleInput,
                    onValueChange = viewModel::onHandleChange,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("LeetCode handle", color = PgDim) },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        imeAction = ImeAction.Search
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                        onSearch = { viewModel.lookup() }
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
                    onClick = viewModel::lookup,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.lookupLoading,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary
                    )
                ) {
                    if (state.lookupLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Look up")
                    }
                }

                state.lookupError?.let {
                    Spacer(Modifier.height(10.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
                }

                state.profile?.let {
                    Spacer(Modifier.height(14.dp))
                    LeetCodeProfileCard(it)
                }
            }
        }

        item { SectionHeader("Upcoming contests") }

        when {
            state.contestsLoading -> item {
                Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }
            state.contestsError != null -> item {
                PGCard {
                    Text(
                        state.contestsError!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = PgDim
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = viewModel::loadContests,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) { Text("Retry") }
                }
            }
            state.contests.isEmpty() -> item {
                PGCard {
                    Text(
                        "No upcoming contests on the calendar.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PgDim
                    )
                }
            }
            else -> items(state.contests, key = { it.id ?: it.hashCode().toLong() }) { contest ->
                ContestRow(contest)
            }
        }
    }
}

@Composable
private fun LeetCodeProfileCard(profile: LeetCodeProfile) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (profile.avatarUrl != null) {
                AsyncImage(
                    model = profile.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.size(44.dp)
                )
                Spacer(Modifier.width(12.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    profile.username,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    profile.realName ?: (profile.ranking?.let { "Rank #$it" } ?: "LeetCode"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = PgDim
                )
            }
        }
        Spacer(Modifier.height(14.dp))
        HDivider()
        Spacer(Modifier.height(14.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            StatStripItem(profile.totalSolved.toString(), "Total")
            StatStripItem(profile.easySolved.toString(), "Easy")
            StatStripItem(profile.mediumSolved.toString(), "Medium")
            StatStripItem(profile.hardSolved.toString(), "Hard")
        }
    }
}

@Composable
private fun ContestRow(contest: ExternalContest) {
    PGCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Outlined.EmojiEvents,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    contest.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Medium
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        contest.displayPlatform,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Icon(
                        Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        tint = PgDim,
                        modifier = Modifier.size(13.dp).padding(start = 0.dp)
                    )
                    Text(
                        "  ${formatStart(contest.startTime)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = PgDim
                    )
                }
            }
        }
    }
}

private fun formatStart(iso: String?): String {
    if (iso.isNullOrBlank()) return "TBD"
    val parsers = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd'T'HH:mm:ss"
    )
    for (pattern in parsers) {
        runCatching {
            val parser = SimpleDateFormat(pattern, Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val date = parser.parse(iso) ?: return@runCatching
            val out = SimpleDateFormat("MMM d, HH:mm", Locale.US).apply {
                timeZone = TimeZone.getDefault()
            }
            return out.format(date)
        }
    }
    return iso
}
