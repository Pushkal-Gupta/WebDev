package com.pghub.mobile.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// --- LeetCode public GraphQL request/response shapes ---

@Serializable
data class GraphQLRequest(
    val query: String,
    val variables: Map<String, String>
)

@Serializable
data class LeetCodeResponse(
    val data: LeetCodeData? = null,
    val errors: List<GraphQLError>? = null
)

@Serializable
data class GraphQLError(val message: String? = null)

@Serializable
data class LeetCodeData(
    val matchedUser: MatchedUser? = null
)

@Serializable
data class MatchedUser(
    val username: String,
    val profile: MatchedUserProfile? = null,
    val submitStatsGlobal: SubmitStats? = null
)

@Serializable
data class MatchedUserProfile(
    val realName: String? = null,
    val ranking: Long? = null,
    @SerialName("userAvatar") val userAvatar: String? = null
)

@Serializable
data class SubmitStats(
    @SerialName("acSubmissionNum") val acSubmissionNum: List<AcSubmission> = emptyList()
)

@Serializable
data class AcSubmission(
    val difficulty: String,
    val count: Long
)

/** Flattened, UI-friendly view of a LeetCode profile. */
data class LeetCodeProfile(
    val username: String,
    val realName: String?,
    val avatarUrl: String?,
    val ranking: Long?,
    val easySolved: Long,
    val mediumSolved: Long,
    val hardSolved: Long
) {
    val totalSolved: Long get() = easySolved + mediumSolved + hardSolved

    companion object {
        fun from(user: MatchedUser): LeetCodeProfile {
            val byDiff = user.submitStatsGlobal?.acSubmissionNum.orEmpty()
                .associate { it.difficulty.lowercase() to it.count }
            return LeetCodeProfile(
                username = user.username,
                realName = user.profile?.realName?.takeIf { it.isNotBlank() },
                avatarUrl = user.profile?.userAvatar,
                ranking = user.profile?.ranking?.takeIf { it > 0 },
                easySolved = byDiff["easy"] ?: 0,
                mediumSolved = byDiff["medium"] ?: 0,
                hardSolved = byDiff["hard"] ?: 0
            )
        }
    }
}
