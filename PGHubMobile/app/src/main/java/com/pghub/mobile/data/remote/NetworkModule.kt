package com.pghub.mobile.data.remote

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.pghub.mobile.data.SupabaseConfig
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

/**
 * Builds the Retrofit services. We chose Retrofit + kotlinx.serialization over
 * the community supabase-kt SDK for build stability and a smaller dependency
 * surface: PostgREST is a plain REST API and LeetCode is plain GraphQL-over-POST,
 * so a single HTTP stack covers both cleanly.
 */
object NetworkModule {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    private val jsonMediaType = "application/json".toMediaType()

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    /** Attaches the Supabase anon key + bearer token to every PostgREST call. */
    private class SupabaseAuthInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val request = chain.request().newBuilder()
                .addHeader("apikey", SupabaseConfig.anonKey)
                .addHeader("Authorization", "Bearer ${SupabaseConfig.anonKey}")
                .addHeader("Accept", "application/json")
                .build()
            return chain.proceed(request)
        }
    }

    private fun baseClient(): OkHttpClient.Builder = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(logging)

    val supabaseApi: SupabaseApi by lazy {
        val client = baseClient()
            .addInterceptor(SupabaseAuthInterceptor())
            .build()
        Retrofit.Builder()
            // Falls back to the known project ref if BuildConfig is empty, so the
            // path is always valid; requests still fail cleanly without a key.
            .baseUrl(SupabaseConfig.restBaseUrl.ifBlank {
                "https://ykpjmvoyatcrlqyqbgfu.supabase.co/rest/v1/"
            })
            .client(client)
            .addConverterFactory(json.asConverterFactory(jsonMediaType))
            .build()
            .create(SupabaseApi::class.java)
    }

    val leetCodeApi: LeetCodeApi by lazy {
        val client = baseClient().build()
        Retrofit.Builder()
            .baseUrl(LeetCodeApi.BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory(jsonMediaType))
            .build()
            .create(LeetCodeApi::class.java)
    }
}
