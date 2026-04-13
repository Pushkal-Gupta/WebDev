-- Fix last 2 JS failures
BEGIN;

-- k-closest-points: sort by x then y to match Python's sorted() behavior
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var kClosest = function(points, k) {
    return points
        .map(p => [p[0] * p[0] + p[1] * p[1], p])
        .sort((a, b) => a[0] - b[0])
        .slice(0, k)
        .map(x => x[1])
        .sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
};$JS$
WHERE problem_id = 'k-closest-points' AND approach_number = 1;

-- reorganize-string: rewrite to match Python's heap-greedy approach exactly
UPDATE public."PGcode_solution_approaches" SET code_javascript =
$JS$var reorganizeString = function(s) {
    const count = {};
    for (const ch of s) count[ch] = (count[ch] || 0) + 1;
    if (Math.max(...Object.values(count)) > Math.floor((s.length + 1) / 2)) return "";

    // Max-heap: [freq, char] — use array sorted on each pop (simple for small alphabet)
    const heap = Object.entries(count).map(([ch, f]) => [f, ch]);
    const heapPop = () => {
        let maxI = 0;
        for (let i = 1; i < heap.length; i++) {
            if (heap[i][0] > heap[maxI][0] || (heap[i][0] === heap[maxI][0] && heap[i][1] < heap[maxI][1])) maxI = i;
        }
        return heap.splice(maxI, 1)[0];
    };

    const result = [];
    let prevFreq = 0, prevCh = '';
    while (heap.length > 0) {
        const [freq, ch] = heapPop();
        result.push(ch);
        if (prevFreq > 0) heap.push([prevFreq, prevCh]);
        prevFreq = freq - 1;
        prevCh = ch;
    }
    return result.join('');
};$JS$
WHERE problem_id = 'reorganize-string' AND approach_number = 1;

COMMIT;
