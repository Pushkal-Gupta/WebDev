-- Fix last 3 Java failures
BEGIN;

-- top-k-frequent: use bucket sort to match Python behavior
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new LinkedHashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);
        List<Integer>[] buckets = new List[nums.length + 1];
        for (int i = 0; i < buckets.length; i++) buckets[i] = new ArrayList<>();
        for (var e : freq.entrySet()) buckets[e.getValue()].add(e.getKey());
        int[] result = new int[k];
        int idx = 0;
        for (int i = buckets.length - 1; i > 0 && idx < k; i--)
            for (int num : buckets[i]) { result[idx++] = num; if (idx == k) break; }
        return result;
    }
}$JAVA$
WHERE problem_id = 'top-k-frequent' AND approach_number = 1;

-- number-of-1-bits: parse as long to handle unsigned 32-bit values, cast to int for bit ops
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        // Treat as unsigned: use >>> for unsigned right shift
        while (n != 0) {
            count += (n & 1);
            n >>>= 1;
        }
        return count;
    }
}$JAVA$
WHERE problem_id = 'number-of-1-bits' AND approach_number = 1;

-- reverse-bits: return long to handle unsigned 32-bit result
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public long reverseBits(int n) {
        long result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);
            n >>>= 1;
        }
        return result;
    }
}$JAVA$
WHERE problem_id = 'reverse-bits' AND approach_number = 1;

COMMIT;
