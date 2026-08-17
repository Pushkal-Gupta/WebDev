package com.pghub.mobile.data.remote

import com.pghub.mobile.data.model.GraphQLRequest
import com.pghub.mobile.data.model.LeetCodeResponse
import retrofit2.http.Body
import retrofit2.http.Headers
import retrofit2.http.POST

/**
 * LeetCode's public GraphQL endpoint. The PG Hub web app performs the same
 * profile lookup through an edge function; here we call it directly.
 */
interface LeetCodeApi {

    @Headers(
        "Content-Type: application/json",
        "Referer: https://leetcode.com"
    )
    @POST("graphql")
    suspend fun profile(@Body body: GraphQLRequest): LeetCodeResponse

    companion object {
        const val BASE_URL = "https://leetcode.com/"

        /** Matches the fields the web app reads for a handle. */
        val PROFILE_QUERY = """
            query getUserProfile(${'$'}username: String!) {
              matchedUser(username: ${'$'}username) {
                username
                profile { realName ranking userAvatar }
                submitStatsGlobal { acSubmissionNum { difficulty count } }
              }
            }
        """.trimIndent()
    }
}
