package com.pghub.mobile.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Row from `PGcode_problems`. The web schema exposes both `title` and `name` in
 * places, so both are accepted and [displayTitle] picks whichever is present.
 */
@Serializable
data class Problem(
    val id: Long,
    @SerialName("topic_id") val topicId: Long? = null,
    val difficulty: String? = null,
    val title: String? = null,
    val name: String? = null
) {
    val displayTitle: String get() = title ?: name ?: "Problem #$id"
    val normalizedDifficulty: Difficulty get() = Difficulty.from(difficulty)
}

enum class Difficulty(val label: String) {
    EASY("Easy"),
    MEDIUM("Medium"),
    HARD("Hard"),
    UNKNOWN("Unrated");

    companion object {
        fun from(raw: String?): Difficulty = when (raw?.trim()?.lowercase()) {
            "easy", "1" -> EASY
            "medium", "2" -> MEDIUM
            "hard", "3" -> HARD
            else -> UNKNOWN
        }
    }
}

/** Row from `PGcode_topics`. */
@Serializable
data class Topic(
    val id: Long,
    val name: String? = null,
    val title: String? = null
) {
    val displayName: String get() = name ?: title ?: "Topic #$id"
}

/** Row from `PGcode_user_progress`. */
@Serializable
data class UserProgress(
    @SerialName("user_id") val userId: String? = null,
    @SerialName("problem_id") val problemId: Long,
    @SerialName("is_completed") val isCompleted: Boolean = false
)

/** Row from `PGcode_profiles`. */
@Serializable
data class Profile(
    @SerialName("user_id") val userId: String? = null,
    val username: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("leetcode_handle") val leetcodeHandle: String? = null,
    @SerialName("theme_preset") val themePreset: String? = null
) {
    val shownName: String get() = displayName ?: username ?: "PG Hub member"
}

/** Row from `PGcode_external_contests` — the unified contest calendar. */
@Serializable
data class ExternalContest(
    val id: Long? = null,
    val name: String? = null,
    val platform: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    @SerialName("duration_seconds") val durationSeconds: Long? = null,
    val url: String? = null
) {
    val displayName: String get() = name ?: "Untitled contest"
    val displayPlatform: String get() = (platform ?: "Contest").replaceFirstChar { it.uppercase() }
}
