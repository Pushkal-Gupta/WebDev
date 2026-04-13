BEGIN;

-- 1. move-zeroes: add return nums
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[] moveZeroes(int[] nums) {
        int slow = 0;
        for (int fast = 0; fast < nums.length; fast++) {
            if (nums[fast] != 0) {
                int temp = nums[slow]; nums[slow] = nums[fast]; nums[fast] = temp;
                slow++;
            }
        }
        return nums;
    }
}$JAVA$
WHERE problem_id = 'move-zeroes' AND approach_number = 1;

-- 2. sort-colors: add return nums
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[] sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) { int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t; low++; mid++; }
            else if (nums[mid] == 1) mid++;
            else { int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t; high--; }
        }
        return nums;
    }
}$JAVA$
WHERE problem_id = 'sort-colors' AND approach_number = 1;

-- 3. rotate-image: add return matrix
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[][] rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) { int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t; }
        for (int[] row : matrix) { int l = 0, r = n - 1; while (l < r) { int t = row[l]; row[l] = row[r]; row[r] = t; l++; r--; } }
        return matrix;
    }
}$JAVA$
WHERE problem_id = 'rotate-image' AND approach_number = 1;

-- 4. set-matrix-zeroes: add return matrix
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[][] setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean fr = false, fc = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) fr = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) fc = true;
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (fr) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (fc) for (int i = 0; i < m; i++) matrix[i][0] = 0;
        return matrix;
    }
}$JAVA$
WHERE problem_id = 'set-matrix-zeroes' AND approach_number = 1;

-- 5. number-of-1-bits: remove public from class
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) { n &= (n - 1); count++; }
        return count;
    }
}$JAVA$
WHERE problem_id = 'number-of-1-bits' AND approach_number = 1;

-- 6. reverse-bits: remove public from class
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) { result = (result << 1) | (n & 1); n >>= 1; }
        return result;
    }
}$JAVA$
WHERE problem_id = 'reverse-bits' AND approach_number = 1;

-- 7. non-overlapping-intervals: add empty guard
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
        int kept = 1, end = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] >= end) { kept++; end = intervals[i][1]; }
        }
        return intervals.length - kept;
    }
}$JAVA$
WHERE problem_id = 'non-overlapping-intervals' AND approach_number = 1;

-- 8. word-break: accept String[] instead of List<String>
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public boolean wordBreak(String s, String[] wordDict) {
        Set<String> dict = new HashSet<>(Arrays.asList(wordDict));
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++)
            for (int j = 0; j < i; j++)
                if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
        return dp[s.length()];
    }
}$JAVA$
WHERE problem_id = 'word-break' AND approach_number = 1;

-- 9. task-scheduler: accept String[] tasks
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int leastInterval(String[] tasks, int n) {
        int[] freq = new int[26];
        for (String t : tasks) freq[t.charAt(0) - 'A']++;
        Arrays.sort(freq);
        int maxFreq = freq[25] - 1;
        int idle = maxFreq * n;
        for (int i = 24; i >= 0 && freq[i] > 0; i--) idle -= Math.min(freq[i], maxFreq);
        return Math.max(tasks.length, tasks.length + idle);
    }
}$JAVA$
WHERE problem_id = 'task-scheduler' AND approach_number = 1;

-- 10. word-ladder: accept String[]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int ladderLength(String beginWord, String endWord, String[] wordList) {
        Set<String> words = new HashSet<>(Arrays.asList(wordList));
        if (!words.contains(endWord)) return 0;
        Queue<String> q = new LinkedList<>();
        q.add(beginWord);
        int level = 1;
        while (!q.isEmpty()) {
            int size = q.size();
            for (int s = 0; s < size; s++) {
                char[] arr = q.poll().toCharArray();
                for (int i = 0; i < arr.length; i++) {
                    char orig = arr[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        arr[i] = c;
                        String next = new String(arr);
                        if (next.equals(endWord)) return level + 1;
                        if (words.remove(next)) q.add(next);
                    }
                    arr[i] = orig;
                }
            }
            level++;
        }
        return 0;
    }
}$JAVA$
WHERE problem_id = 'word-ladder' AND approach_number = 1;

-- 11. replace-words: accept String[]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public String replaceWords(String[] dictionary, String sentence) {
        Set<String> roots = new HashSet<>(Arrays.asList(dictionary));
        String[] words = sentence.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int w = 0; w < words.length; w++) {
            String word = words[w];
            String prefix = word;
            for (int i = 1; i <= word.length(); i++) {
                if (roots.contains(word.substring(0, i))) { prefix = word.substring(0, i); break; }
            }
            if (w > 0) sb.append(" ");
            sb.append(prefix);
        }
        return sb.toString();
    }
}$JAVA$
WHERE problem_id = 'replace-words' AND approach_number = 1;

-- 12. valid-sudoku: accept String[][]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public boolean isValidSudoku(String[][] board) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                String c = board[i][j];
                if (c.equals(".")) continue;
                if (!seen.add(c + "r" + i) || !seen.add(c + "c" + j) || !seen.add(c + "b" + i/3 + j/3))
                    return false;
            }
        }
        return true;
    }
}$JAVA$
WHERE problem_id = 'valid-sudoku' AND approach_number = 1;

-- 13. word-search: accept String[][]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public boolean exist(String[][] board, String word) {
        for (int i = 0; i < board.length; i++)
            for (int j = 0; j < board[0].length; j++)
                if (dfs(board, word, i, j, 0)) return true;
        return false;
    }
    private boolean dfs(String[][] board, String word, int i, int j, int k) {
        if (k == word.length()) return true;
        if (i < 0 || i >= board.length || j < 0 || j >= board[0].length) return false;
        if (!board[i][j].equals(String.valueOf(word.charAt(k)))) return false;
        String tmp = board[i][j]; board[i][j] = "#";
        boolean f = dfs(board,word,i+1,j,k+1)||dfs(board,word,i-1,j,k+1)||dfs(board,word,i,j+1,k+1)||dfs(board,word,i,j-1,k+1);
        board[i][j] = tmp; return f;
    }
}$JAVA$
WHERE problem_id = 'word-search' AND approach_number = 1;

-- 14. num-islands: accept String[][]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int numIslands(String[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++)
            for (int j = 0; j < grid[0].length; j++)
                if (grid[i][j].equals("1")) { dfs(grid, i, j); count++; }
        return count;
    }
    private void dfs(String[][] grid, int i, int j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || !grid[i][j].equals("1")) return;
        grid[i][j] = "0";
        dfs(grid,i+1,j); dfs(grid,i-1,j); dfs(grid,i,j+1); dfs(grid,i,j-1);
    }
}$JAVA$
WHERE problem_id = 'num-islands' AND approach_number = 1;

-- 15. word-search-ii: accept String[][] and String[], return sorted String[]
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public String[] findWords(String[][] board, String[] words) {
        Set<String> result = new TreeSet<>();
        for (String word : words)
            for (int i = 0; i < board.length && !result.contains(word); i++)
                for (int j = 0; j < board[0].length && !result.contains(word); j++)
                    if (dfs(board, word, i, j, 0)) result.add(word);
        return result.toArray(new String[0]);
    }
    private boolean dfs(String[][] b, String w, int i, int j, int k) {
        if (k == w.length()) return true;
        if (i<0||i>=b.length||j<0||j>=b[0].length||!b[i][j].equals(String.valueOf(w.charAt(k)))) return false;
        String t=b[i][j]; b[i][j]="#";
        boolean f=dfs(b,w,i+1,j,k+1)||dfs(b,w,i-1,j,k+1)||dfs(b,w,i,j+1,k+1)||dfs(b,w,i,j-1,k+1);
        b[i][j]=t; return f;
    }
}$JAVA$
WHERE problem_id = 'word-search-ii' AND approach_number = 1;

-- 16. accounts-merge: accept String[][], return List<List<String>>
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public List<List<String>> accountsMerge(String[][] accounts) {
        Map<String,String> parent = new HashMap<>(), name = new HashMap<>();
        for (String[] a : accounts) {
            for (int i = 1; i < a.length; i++) { parent.putIfAbsent(a[i], a[i]); name.put(a[i], a[0]); if (i>1) union(parent, a[1], a[i]); }
        }
        Map<String, TreeSet<String>> groups = new HashMap<>();
        for (String e : parent.keySet()) groups.computeIfAbsent(find(parent,e), k->new TreeSet<>()).add(e);
        List<List<String>> res = new ArrayList<>();
        for (var entry : groups.entrySet()) { List<String> m = new ArrayList<>(); m.add(name.get(entry.getKey())); m.addAll(entry.getValue()); res.add(m); }
        res.sort((a,b) -> { for (int i=0;i<Math.min(a.size(),b.size());i++) { int c=a.get(i).compareTo(b.get(i)); if(c!=0)return c; } return a.size()-b.size(); });
        return res;
    }
    String find(Map<String,String> p, String x) { while(!p.get(x).equals(x)){p.put(x,p.get(p.get(x)));x=p.get(x);} return x; }
    void union(Map<String,String> p, String a, String b) { p.put(find(p,a),find(p,b)); }
}$JAVA$
WHERE problem_id = 'accounts-merge' AND approach_number = 1;

-- 17. reconstruct-itinerary: accept String[][], return List<String>
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public List<String> findItinerary(String[][] tickets) {
        Map<String, PriorityQueue<String>> graph = new HashMap<>();
        for (String[] t : tickets) graph.computeIfAbsent(t[0], k -> new PriorityQueue<>()).add(t[1]);
        LinkedList<String> result = new LinkedList<>();
        dfs("JFK", graph, result);
        return result;
    }
    private void dfs(String node, Map<String, PriorityQueue<String>> g, LinkedList<String> result) {
        PriorityQueue<String> q = g.get(node);
        while (q != null && !q.isEmpty()) dfs(q.poll(), g, result);
        result.addFirst(node);
    }
}$JAVA$
WHERE problem_id = 'reconstruct-itinerary' AND approach_number = 1;

-- 18. encode-decode-strings: use solve() method
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public String[] solve(String[] strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.length()).append('#').append(s);
        String encoded = sb.toString();
        List<String> result = new ArrayList<>();
        int i = 0;
        while (i < encoded.length()) {
            int j = i; while (encoded.charAt(j) != '#') j++;
            int len = Integer.parseInt(encoded.substring(i, j));
            result.add(encoded.substring(j+1, j+1+len));
            i = j+1+len;
        }
        return result.toArray(new String[0]);
    }
}$JAVA$
WHERE problem_id = 'encode-decode-strings' AND approach_number = 1;

-- 19. meeting-rooms: use minMeetingRooms
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals.length == 0) return 0;
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        Arrays.sort(starts); Arrays.sort(ends);
        int rooms = 0, max = 0, s = 0, e = 0;
        while (s < n) { if (starts[s] < ends[e]) { rooms++; s++; } else { rooms--; e++; } max = Math.max(max, rooms); }
        return max;
    }
}$JAVA$
WHERE problem_id = 'meeting-rooms' AND approach_number = 1;

-- 20. clone-graph: use int[][] adjacency list
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[][] cloneGraph(int[][] adjList) {
        int[][] result = new int[adjList.length][];
        for (int i = 0; i < adjList.length; i++) result[i] = Arrays.copyOf(adjList[i], adjList[i].length);
        return result;
    }
}$JAVA$
WHERE problem_id = 'clone-graph' AND approach_number = 1;

-- 21. group-anagrams: sort output
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) { char[] a = s.toCharArray(); Arrays.sort(a); map.computeIfAbsent(new String(a), k -> new ArrayList<>()).add(s); }
        List<List<String>> result = new ArrayList<>(map.values());
        for (List<String> g : result) Collections.sort(g);
        result.sort((a, b) -> a.get(0).compareTo(b.get(0)));
        return result;
    }
}$JAVA$
WHERE problem_id = 'group-anagrams' AND approach_number = 1;

-- 22. top-k-frequent: sort by freq desc, then value asc
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer,Integer> count = new HashMap<>();
        for (int n : nums) count.merge(n, 1, Integer::sum);
        List<Map.Entry<Integer,Integer>> entries = new ArrayList<>(count.entrySet());
        entries.sort((a,b) -> b.getValue()!=a.getValue() ? b.getValue()-a.getValue() : a.getKey()-b.getKey());
        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = entries.get(i).getKey();
        return result;
    }
}$JAVA$
WHERE problem_id = 'top-k-frequent' AND approach_number = 1;

-- 23. subsets: sort output
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        bt(nums, 0, new ArrayList<>(), result);
        result.sort((a,b) -> { if(a.size()!=b.size()) return a.size()-b.size(); for(int i=0;i<a.size();i++) if(!a.get(i).equals(b.get(i))) return a.get(i)-b.get(i); return 0; });
        return result;
    }
    void bt(int[] nums, int s, List<Integer> path, List<List<Integer>> res) {
        res.add(new ArrayList<>(path));
        for (int i = s; i < nums.length; i++) { path.add(nums[i]); bt(nums, i+1, path, res); path.remove(path.size()-1); }
    }
}$JAVA$
WHERE problem_id = 'subsets' AND approach_number = 1;

-- 24. k-closest-points: sort by x then y
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        Arrays.sort(points, (a,b) -> (a[0]*a[0]+a[1]*a[1]) - (b[0]*b[0]+b[1]*b[1]));
        int[][] result = Arrays.copyOf(points, k);
        Arrays.sort(result, (a,b) -> a[0]!=b[0] ? a[0]-b[0] : a[1]-b[1]);
        return result;
    }
}$JAVA$
WHERE problem_id = 'k-closest-points' AND approach_number = 1;

-- 25. reorganize-string: heap greedy matching Python
UPDATE public."PGcode_solution_approaches" SET code_java =
$JAVA$class Solution {
    public String reorganizeString(String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c-'a']++;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> b[1]!=a[1] ? b[1]-a[1] : a[0]-b[0]);
        for (int i = 0; i < 26; i++) if (count[i] > 0) pq.offer(new int[]{i, count[i]});
        if (pq.peek()[1] > (s.length()+1)/2) return "";
        StringBuilder result = new StringBuilder();
        int[] prev = {-1, 0};
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            result.append((char)(curr[0]+'a'));
            if (prev[1] > 0) pq.offer(prev);
            prev = new int[]{curr[0], curr[1]-1};
        }
        return result.toString();
    }
}$JAVA$
WHERE problem_id = 'reorganize-string' AND approach_number = 1;

COMMIT;
