# PG Hub — Android Companion App

A native Android companion app for **PG Hub** (pushkalgupta.com), the coding /
DSA / interview-prep platform. It mirrors the web product's dark, cyan-accented
aesthetic and talks to the same Supabase backend, plus LeetCode's public API.

Built with **Kotlin + Jetpack Compose + Material 3**, single module, `minSdk 24`.

---

## What it does

Four tabs behind a Material 3 bottom navigation bar:

| Tab | Contents |
| --- | --- |
| **Home** | Day-streak + solved-count tiles, total problems in the bank, and a deterministic "problem of the day" pulled live from `PGcode_problems`. |
| **Practice** | The full problem list from `PGcode_problems` with a debounced server-side title search and Easy / Medium / Hard difficulty filter chips. |
| **Compete** | LeetCode handle lookup (live via LeetCode GraphQL) showing solved-by-difficulty and rank, plus the unified upcoming-contest calendar from `PGcode_external_contests`. |
| **Profile** | PG Hub username lookup against `PGcode_profiles` — display name, linked theme, completed-problem count from `PGcode_user_progress`, and a GitHub-style solved-by-difficulty strip driven by the profile's LeetCode handle. |

> Because the app has no authenticated session yet, the Home streak/solved
> figures are local placeholders, and Profile resolves stats by an entered
> username rather than a logged-in identity. See **Limitations**.

---

## Architecture

```
UI (Compose screens)  ->  ViewModel (StateFlow UiState)  ->  Repository  ->  Retrofit service
```

- **Data approach: Retrofit + Kotlinx Serialization** (not the community
  supabase-kt SDK). Supabase's PostgREST is a plain REST API and LeetCode is
  plain GraphQL-over-POST, so one small HTTP stack cleanly covers both with a
  smaller, more predictable dependency surface.
- `SupabaseConfig` reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` from
  `BuildConfig` (populated from `local.properties`). **No secret is hardcoded.**
- A `SupabaseAuthInterceptor` attaches the `apikey` + bearer headers to every
  PostgREST request.
- One `ViewModel` per feature, each exposing an immutable `StateFlow<…UiState>`.
- `Coil` renders LeetCode avatars.

### Project tree

```
PGHubMobile/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── gradle/
│   ├── libs.versions.toml         (version catalog)
│   └── wrapper/gradle-wrapper.properties   (Gradle 8.7)
├── gradlew  /  gradlew.bat
├── local.properties.example
├── README.md
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/values/{colors,strings,themes}.xml
        ├── res/drawable/ + res/mipmap-anydpi[-v26]/  (vector launcher icon)
        └── java/com/pghub/mobile/
            ├── MainActivity.kt
            ├── PGHubApp.kt                     (Application)
            ├── ui/theme/{Color,Type,Theme}.kt
            ├── ui/components/CommonUi.kt
            ├── ui/navigation/PGHubNavigation.kt
            ├── data/SupabaseConfig.kt
            ├── data/model/{Models,LeetCode}.kt
            ├── data/remote/{SupabaseApi,LeetCodeApi,NetworkModule}.kt
            ├── data/repository/Repositories.kt
            └── feature/{home,practice,compete,profile}/*ViewModel.kt + *Screen.kt
```

---

## Prerequisites

- **Android Studio** (Koala 2024.1.1 or newer recommended)
- **JDK 17** (required by Android Gradle Plugin 8.5)
- Android SDK Platform 34

## Key dependencies (`app/build.gradle.kts` via version catalog)

| Library | Version |
| --- | --- |
| Android Gradle Plugin | 8.5.2 |
| Kotlin | 1.9.24 |
| Compose Compiler ext. | 1.5.14 |
| Compose BOM | 2024.09.02 |
| Material 3 | (via BOM) |
| navigation-compose | 2.8.0 |
| lifecycle-* (viewmodel/runtime compose) | 2.8.5 |
| Retrofit | 2.11.0 |
| retrofit2-kotlinx-serialization-converter | 1.0.0 |
| kotlinx-serialization-json | 1.6.3 |
| OkHttp logging-interceptor | 4.12.0 |
| Coil Compose | 2.7.0 |
| Gradle | 8.7 |

---

## Setup

1. **Clone / open** the `PGHubMobile/` folder in Android Studio.

2. **Create `local.properties`** (git-ignored) from the template:

   ```bash
   cp local.properties.example local.properties
   ```

   Then fill in:

   ```properties
   sdk.dir=/Users/<you>/Library/Android/sdk
   SUPABASE_URL=https://ykpjmvoyatcrlqyqbgfu.supabase.co
   SUPABASE_ANON_KEY=<your PG Hub Supabase anon key>
   ```

   The anon key is a public client key, but is kept out of source control so the
   repo ships credential-free. Get it from the Supabase dashboard →
   Project Settings → API. Without it, screens render a clear "not configured"
   error state instead of crashing.

3. **Build & run** from Android Studio (Run ▶), or on the command line once the
   wrapper JAR exists (see below):

   ```bash
   ./gradlew :app:assembleDebug
   ```

---

## Limitations & honest notes

- **Not compile-verified.** This project was authored in an environment without
  the Android SDK / Gradle, so it has **not** been run through a real build.
  The code targets the pinned versions above and correct Compose/Material 3
  APIs, but expect to resolve minor issues (e.g. an import or an icon name) on
  first sync. No "build passing" claim is made.
- **`gradle/wrapper/gradle-wrapper.jar` is not included** — it is a binary that
  cannot be authored as text. Android Studio regenerates it automatically on
  first open, or run `gradle wrapper --gradle-version 8.7` if you have a system
  Gradle. `gradlew` / `gradlew.bat` scripts are included.
- **No authentication yet.** There is no Supabase Auth session, so Home's streak
  and solved counts are placeholders and Profile looks up stats by an entered
  username. Wiring `auth-kt` / GoTrue sign-in is the natural next step.
- **Row Level Security.** Reads assume the relevant `PGcode_*` tables are
  readable with the anon key (public read policies). Tables locked to
  authenticated users will return empty lists until auth is added.
- **LeetCode GraphQL is unofficial** and rate-limited; the lookup handles
  not-found / network / timeout cases with friendly states, but the endpoint
  can change without notice.
- **No app-icon raster assets** — the launcher icon is a self-contained vector
  adaptive icon, so no `mipmap-*dpi` PNGs are shipped.
```
