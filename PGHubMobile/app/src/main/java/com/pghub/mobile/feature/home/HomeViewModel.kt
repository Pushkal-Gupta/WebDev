package com.pghub.mobile.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pghub.mobile.data.model.Problem
import com.pghub.mobile.data.repository.DataResult
import com.pghub.mobile.data.repository.ProblemsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar

data class HomeUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val solvedCount: Int = 0,
    val streakDays: Int = 0,
    val totalProblems: Int = 0,
    val problemOfTheDay: Problem? = null
)

/**
 * Home aggregates a few headline numbers. Solved count and streak are local
 * placeholders (the app has no authenticated session yet); the problem of the
 * day is chosen deterministically from the live problem set by day-of-year.
 */
class HomeViewModel(
    private val problemsRepository: ProblemsRepository = ProblemsRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = problemsRepository.loadProblems(limit = 300)) {
                is DataResult.Success -> {
                    val problems = result.data
                    val potd = problems.takeIf { it.isNotEmpty() }?.let {
                        it[dayOfYear() % it.size]
                    }
                    _state.value = HomeUiState(
                        loading = false,
                        solvedCount = LOCAL_SOLVED_PLACEHOLDER,
                        streakDays = LOCAL_STREAK_PLACEHOLDER,
                        totalProblems = problems.size,
                        problemOfTheDay = potd
                    )
                }
                is DataResult.Failure ->
                    _state.value = HomeUiState(loading = false, error = result.message)
            }
        }
    }

    private fun dayOfYear(): Int = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)

    private companion object {
        // Stand-ins until an authenticated progress source is wired in.
        const val LOCAL_SOLVED_PLACEHOLDER = 0
        const val LOCAL_STREAK_PLACEHOLDER = 0
    }
}
