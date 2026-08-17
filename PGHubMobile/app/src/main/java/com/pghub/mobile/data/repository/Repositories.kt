package com.pghub.mobile.data.repository

import com.pghub.mobile.data.SupabaseConfig
import com.pghub.mobile.data.model.ExternalContest
import com.pghub.mobile.data.model.GraphQLRequest
import com.pghub.mobile.data.model.LeetCodeProfile
import com.pghub.mobile.data.model.Problem
import com.pghub.mobile.data.model.Profile
import com.pghub.mobile.data.remote.LeetCodeApi
import com.pghub.mobile.data.remote.NetworkModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** Lightweight error carrier so screens can render friendly empty/error states. */
sealed interface DataResult<out T> {
    data class Success<T>(val data: T) : DataResult<T>
    data class Failure(val message: String) : DataResult<Nothing>
}

private inline fun <T> guardConfigured(block: () -> DataResult<T>): DataResult<T> =
    if (!SupabaseConfig.isConfigured) {
        DataResult.Failure("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in local.properties.")
    } else {
        block()
    }

class ProblemsRepository(
    private val api: com.pghub.mobile.data.remote.SupabaseApi = NetworkModule.supabaseApi
) {
    suspend fun loadProblems(limit: Int = 200): DataResult<List<Problem>> =
        withContext(Dispatchers.IO) {
            guardConfigured {
                runCatching { api.getProblems(limit = limit) }
                    .fold(
                        onSuccess = { DataResult.Success(it) },
                        onFailure = { DataResult.Failure(it.friendlyMessage()) }
                    )
            }
        }

    suspend fun search(term: String): DataResult<List<Problem>> =
        withContext(Dispatchers.IO) {
            guardConfigured {
                runCatching { api.searchProblems(titleFilter = "ilike.*${term.trim()}*") }
                    .fold(
                        onSuccess = { DataResult.Success(it) },
                        onFailure = { DataResult.Failure(it.friendlyMessage()) }
                    )
            }
        }
}

class ProfileRepository(
    private val api: com.pghub.mobile.data.remote.SupabaseApi = NetworkModule.supabaseApi
) {
    suspend fun profileByUsername(username: String): DataResult<Profile?> =
        withContext(Dispatchers.IO) {
            guardConfigured {
                runCatching { api.getProfileByUsername(usernameFilter = "eq.${username.trim()}") }
                    .fold(
                        onSuccess = { DataResult.Success(it.firstOrNull()) },
                        onFailure = { DataResult.Failure(it.friendlyMessage()) }
                    )
            }
        }

    /** Count of completed problems for a user id, used on the Profile tab. */
    suspend fun completedCount(userId: String): DataResult<Int> =
        withContext(Dispatchers.IO) {
            guardConfigured {
                runCatching { api.getProgressForUser(userIdFilter = "eq.$userId") }
                    .fold(
                        onSuccess = { rows -> DataResult.Success(rows.count { it.isCompleted }) },
                        onFailure = { DataResult.Failure(it.friendlyMessage()) }
                    )
            }
        }
}

class ContestRepository(
    private val api: com.pghub.mobile.data.remote.SupabaseApi = NetworkModule.supabaseApi
) {
    suspend fun upcoming(): DataResult<List<ExternalContest>> =
        withContext(Dispatchers.IO) {
            guardConfigured {
                val nowIso = isoUtc(Date())
                runCatching { api.getUpcomingContests(startTimeFilter = "gte.$nowIso") }
                    .fold(
                        onSuccess = { DataResult.Success(it) },
                        onFailure = { DataResult.Failure(it.friendlyMessage()) }
                    )
            }
        }

    private fun isoUtc(date: Date): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        return fmt.format(date)
    }
}

class LeetCodeRepository(
    private val api: LeetCodeApi = NetworkModule.leetCodeApi
) {
    suspend fun profile(handle: String): DataResult<LeetCodeProfile> =
        withContext(Dispatchers.IO) {
            val clean = handle.trim()
            if (clean.isBlank()) return@withContext DataResult.Failure("Enter a LeetCode handle.")

            runCatching {
                api.profile(
                    GraphQLRequest(
                        query = LeetCodeApi.PROFILE_QUERY,
                        variables = mapOf("username" to clean)
                    )
                )
            }.fold(
                onSuccess = { resp ->
                    val user = resp.data?.matchedUser
                    when {
                        !resp.errors.isNullOrEmpty() ->
                            DataResult.Failure(resp.errors.first().message ?: "LeetCode returned an error.")
                        user == null ->
                            DataResult.Failure("No LeetCode user found for \"$clean\".")
                        else -> DataResult.Success(LeetCodeProfile.from(user))
                    }
                },
                onFailure = { DataResult.Failure(it.friendlyMessage()) }
            )
        }
}

private fun Throwable.friendlyMessage(): String = when (this) {
    is java.net.UnknownHostException -> "No network connection."
    is java.net.SocketTimeoutException -> "The request timed out. Try again."
    else -> message ?: "Something went wrong."
}
