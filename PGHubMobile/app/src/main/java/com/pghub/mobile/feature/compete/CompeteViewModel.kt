package com.pghub.mobile.feature.compete

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pghub.mobile.data.model.ExternalContest
import com.pghub.mobile.data.model.LeetCodeProfile
import com.pghub.mobile.data.repository.ContestRepository
import com.pghub.mobile.data.repository.DataResult
import com.pghub.mobile.data.repository.LeetCodeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CompeteUiState(
    val handleInput: String = "",
    val lookupLoading: Boolean = false,
    val lookupError: String? = null,
    val profile: LeetCodeProfile? = null,
    val contestsLoading: Boolean = true,
    val contestsError: String? = null,
    val contests: List<ExternalContest> = emptyList()
)

class CompeteViewModel(
    private val leetCodeRepository: LeetCodeRepository = LeetCodeRepository(),
    private val contestRepository: ContestRepository = ContestRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(CompeteUiState())
    val state: StateFlow<CompeteUiState> = _state.asStateFlow()

    init { loadContests() }

    fun onHandleChange(value: String) {
        _state.value = _state.value.copy(handleInput = value)
    }

    fun lookup() {
        val handle = _state.value.handleInput.trim()
        if (handle.isBlank()) {
            _state.value = _state.value.copy(lookupError = "Enter a LeetCode handle.", profile = null)
            return
        }
        _state.value = _state.value.copy(lookupLoading = true, lookupError = null)
        viewModelScope.launch {
            _state.value = when (val r = leetCodeRepository.profile(handle)) {
                is DataResult.Success ->
                    _state.value.copy(lookupLoading = false, profile = r.data, lookupError = null)
                is DataResult.Failure ->
                    _state.value.copy(lookupLoading = false, profile = null, lookupError = r.message)
            }
        }
    }

    fun loadContests() {
        _state.value = _state.value.copy(contestsLoading = true, contestsError = null)
        viewModelScope.launch {
            _state.value = when (val r = contestRepository.upcoming()) {
                is DataResult.Success ->
                    _state.value.copy(contestsLoading = false, contests = r.data, contestsError = null)
                is DataResult.Failure ->
                    _state.value.copy(contestsLoading = false, contestsError = r.message)
            }
        }
    }
}
