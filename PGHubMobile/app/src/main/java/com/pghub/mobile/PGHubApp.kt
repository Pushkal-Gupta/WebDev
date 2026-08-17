package com.pghub.mobile

import android.app.Application

/**
 * Application entry point. Kept intentionally light — the network stack and
 * repositories are plain singletons/factories, so no DI container is needed for
 * an app of this size.
 */
class PGHubApp : Application()
