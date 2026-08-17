package com.pghub.mobile.data.remote

import com.pghub.mobile.data.model.ExternalContest
import com.pghub.mobile.data.model.Problem
import com.pghub.mobile.data.model.Profile
import com.pghub.mobile.data.model.UserProgress
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * PostgREST endpoint for the PG Hub Supabase project. Table names are prefixed
 * `PGcode_` and are passed already URL-encoded in the [GET] paths.
 *
 * The `apikey` + `Authorization` headers are attached globally by
 * [SupabaseAuthInterceptor], so they are not declared per-method here.
 */
interface SupabaseApi {

    @GET("PGcode_problems")
    suspend fun getProblems(
        @Query("select") select: String = "id,topic_id,difficulty,title,name",
        @Query("order") order: String = "id.asc",
        @Query("limit") limit: Int = 200,
        @Query("offset") offset: Int = 0
    ): List<Problem>

    /** PostgREST full-text-ish filter: title=ilike.*term* */
    @GET("PGcode_problems")
    suspend fun searchProblems(
        @Query("select") select: String = "id,topic_id,difficulty,title,name",
        @Query("title") titleFilter: String,
        @Query("order") order: String = "id.asc",
        @Query("limit") limit: Int = 100
    ): List<Problem>

    @GET("PGcode_profiles")
    suspend fun getProfileByUsername(
        @Query("select") select: String = "user_id,username,display_name,leetcode_handle,theme_preset",
        @Query("username") usernameFilter: String,
        @Query("limit") limit: Int = 1
    ): List<Profile>

    @GET("PGcode_user_progress")
    suspend fun getProgressForUser(
        @Query("select") select: String = "user_id,problem_id,is_completed",
        @Query("user_id") userIdFilter: String,
        @Query("is_completed") completedFilter: String = "eq.true"
    ): List<UserProgress>

    @GET("PGcode_external_contests")
    suspend fun getUpcomingContests(
        @Query("select") select: String = "id,name,platform,start_time,duration_seconds,url",
        @Query("order") order: String = "start_time.asc",
        @Query("limit") limit: Int = 50,
        @Query("start_time") startTimeFilter: String? = null
    ): List<ExternalContest>
}
