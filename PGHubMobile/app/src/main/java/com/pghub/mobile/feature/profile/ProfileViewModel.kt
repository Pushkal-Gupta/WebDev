package com.pghub.mobile.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pghub.mobile.data.model.LeetCodeProfile
import com.pghub.mobile.data.model.Profile
import com.pghub.mobile.data.repository.DataResult
import com.pghub.mobile.data.repository.LeetCodeRepository
import com.pghub.mobile.data.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val usernameInput: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val profile: Profile? = null,
    val completedCount: Int? = null,
    val leetCode: LeetCodeProfile? = null,
    val hasSearched: Boolean = false
)

/**
 * Profile tab. Until an authenticated session exists, the user enters a PG Hub
 * username; we resolve the `PGcode_profiles` row, count their completed problems,
 * and — if the profile stores a `leetcode_handle` — pull solved-by-difficulty
 * plus the GitHub-style stat strip from LeetCode.
 */
class ProfileViewModel(
    private val profileRepository: ProfileRepository = ProfileRepository(),
    private val leetCodeRepository: LeetCodeRepository = LeetCodeRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    fun onUsernameChange(value: String) {
        _state.value = _state.value.copy(usernameInput = value)
    }

    fun loadProfile() {
        val username = _state.value.usernameInput.trim()
        if (username.isBlank()) {
            _state.value = _state.value.copy(error = "Enter a PG Hub username.")
            return
        }
        _state.value = _state.value.copy(
            loading = true, error = null, profile = null,
            completedCount = null, leetCode = null, hasSearched = true
        )
        viewModelScope.launch {
            when (val result = profileRepository.profileByUsername(username)) {
                is DataResult.Failure ->
                    _state.value = _state.value.copy(loading = false, error = result.message)
                is DataResult.Success -> {
                    val profile = result.data
                    if (profile == null) {
                        _state.value = _state.value.copy(
                            loading = false,
                            error = "No PG Hub profile found for \"$username\"."
                        )
                    } else {
                        _state.value = _state.value.copy(loading = false, profile = profile)
                        profile.userId?.let { loadCompletedCount(it) }
                        profile.leetcodeHandle?.takeIf { it.isNotBlank() }?.let { loadLeetCode(it) }
                    }
                }
            }
        }
    }

    private fun loadCompletedCount(userId: String) {
        viewModelScope.launch {
            (profileRepository.completedCount(userId) as? DataResult.Success)?.let {
                _state.value = _state.value.copy(completedCount = it.data)
            }
        }
    }

    private fun loadLeetCode(handle: String) {
        viewModelScope.launch {
            (leetCodeRepository.profile(handle) as? DataResult.Success)?.let {
                _state.value = _state.value.copy(leetCode = it.data)
            }
        }
    }
}
