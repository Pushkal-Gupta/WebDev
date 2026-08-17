package com.pghub.mobile.feature.practice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pghub.mobile.data.model.Difficulty
import com.pghub.mobile.data.model.Problem
import com.pghub.mobile.data.repository.DataResult
import com.pghub.mobile.data.repository.ProblemsRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

data class PracticeUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val query: String = "",
    val difficultyFilter: Difficulty? = null,
    private val allProblems: List<Problem> = emptyList()
) {
    /** Client-side difficulty filter over whatever the query returned. */
    val visibleProblems: List<Problem>
        get() = allProblems.filter {
            difficultyFilter == null || it.normalizedDifficulty == difficultyFilter
        }
}

@OptIn(FlowPreview::class)
class PracticeViewModel(
    private val repository: ProblemsRepository = ProblemsRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(PracticeUiState())
    val state: StateFlow<PracticeUiState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        load()
        queryFlow
            .debounce(350)
            .distinctUntilChanged()
            .onEach { term ->
                if (term.isBlank()) load() else search(term)
            }
            .launchIn(viewModelScope)
    }

    fun onQueryChange(value: String) {
        _state.value = _state.value.copy(query = value)
        queryFlow.value = value
    }

    fun onDifficultySelected(difficulty: Difficulty?) {
        _state.value = _state.value.copy(difficultyFilter = difficulty)
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch { apply(repository.loadProblems()) }
    }

    private fun search(term: String) {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch { apply(repository.search(term)) }
    }

    private fun apply(result: DataResult<List<Problem>>) {
        _state.value = when (result) {
            is DataResult.Success ->
                _state.value.copy(loading = false, error = null, allProblems = result.data)
            is DataResult.Failure ->
                _state.value.copy(loading = false, error = result.message)
        }
    }
}
