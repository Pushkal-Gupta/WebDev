package com.pghub.mobile.data

import com.pghub.mobile.BuildConfig

/**
 * Central access to the PG Hub Supabase credentials.
 *
 * Values originate from `local.properties` (git-ignored) and are injected into
 * [BuildConfig] at build time — nothing is hardcoded in source. The anon key is
 * a public client key by design, but is still kept out of version control so the
 * repository ships without embedded credentials.
 */
object SupabaseConfig {
    val url: String = BuildConfig.SUPABASE_URL.trimEnd('/')
    val anonKey: String = BuildConfig.SUPABASE_ANON_KEY

    /** Base URL for the auto-generated PostgREST endpoint. */
    val restBaseUrl: String get() = "$url/rest/v1/"

    val isConfigured: Boolean get() = url.isNotBlank() && anonKey.isNotBlank()
}
