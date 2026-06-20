#!/usr/bin/env node
// Atomic splice: 3 design problems with inline viz + 6-lang solutions.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function designTwitterViz(')
  || src.includes("'design-twitter':")
  || src.includes('"design-twitter":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function designTwitterViz() {
  const frames = [];
  const ops = [
    { kind: 'postTweet', user: 1, tweet: 5 },
    { kind: 'postTweet', user: 2, tweet: 6 },
    { kind: 'follow', who: 1, whom: 2 },
    { kind: 'postTweet', user: 2, tweet: 7 },
    { kind: 'postTweet', user: 1, tweet: 8 },
    { kind: 'getNewsFeed', user: 1 },
    { kind: 'follow', who: 1, whom: 3 },
    { kind: 'postTweet', user: 3, tweet: 9 },
    { kind: 'postTweet', user: 1, tweet: 10 },
    { kind: 'getNewsFeed', user: 1 },
    { kind: 'unfollow', who: 1, whom: 2 },
    { kind: 'getNewsFeed', user: 1 },
  ];

  const tweets = new Map();
  const follows = new Map();
  let clock = 0;

  const ensureUser = (u) => {
    if (!tweets.has(u)) tweets.set(u, []);
    if (!follows.has(u)) follows.set(u, new Set([u]));
  };

  const snapshot = () => {
    const out = [];
    for (const [u, list] of [...tweets.entries()].sort((a, b) => a[0] - b[0])) {
      out.push('u' + u + ': [' + list.map(t => 't' + t.id + '@' + t.time).join(', ') + ']');
    }
    return out;
  };

  const followSnap = () => {
    const out = [];
    for (const [u, set] of [...follows.entries()].sort((a, b) => a[0] - b[0])) {
      out.push('u' + u + ' -> {' + [...set].sort((a, b) => a - b).map(x => 'u' + x).join(',') + '}');
    }
    return out;
  };

  frames.push({
    array: ['Twitter()'],
    chip: [
      { label: 'API', value: 'postTweet · follow · unfollow · getNewsFeed', tone: 'violet' },
      { label: 'feed', value: '10 most-recent across self + followees', tone: 'violet' },
    ],
    caption: 'Three maps do all the work: tweets[user] -> list of (tweetId, timestamp), follows[user] -> set of followee userIds (always includes self), and a single global clock that ticks on every postTweet so feeds can sort by recency.',
  });

  for (const op of ops) {
    if (op.kind === 'postTweet') {
      ensureUser(op.user);
      const t = { id: op.tweet, time: ++clock };
      tweets.get(op.user).push(t);
      frames.push({
        array: snapshot(),
        chip: [
          { label: 'op', value: 'postTweet(u' + op.user + ', t' + op.tweet + ')', tone: 'pink' },
          { label: 'clock', value: String(clock), tone: 'violet' },
        ],
        caption: 'Append (t' + op.tweet + ', time=' + clock + ') to user ' + op.user + '\\'s personal tweet list. The global clock ticks once per post — that single counter is what lets the feed be sorted across users without comparing wall times.',
      });
    } else if (op.kind === 'follow') {
      ensureUser(op.who); ensureUser(op.whom);
      follows.get(op.who).add(op.whom);
      frames.push({
        array: followSnap(),
        chip: [
          { label: 'op', value: 'follow(u' + op.who + ', u' + op.whom + ')', tone: 'pink' },
        ],
        caption: 'Add u' + op.whom + ' to u' + op.who + '\\'s followee set. Self-follow is implicit — your own tweets must appear in your own feed.',
      });
    } else if (op.kind === 'unfollow') {
      ensureUser(op.who);
      if (op.who !== op.whom) follows.get(op.who).delete(op.whom);
      frames.push({
        array: followSnap(),
        chip: [
          { label: 'op', value: 'unfollow(u' + op.who + ', u' + op.whom + ')', tone: 'pink' },
        ],
        caption: 'Remove u' + op.whom + ' from u' + op.who + '\\'s followee set. Guard the self-unfollow: a user should never drop themselves.',
      });
    } else if (op.kind === 'getNewsFeed') {
      ensureUser(op.user);
      const pool = [];
      for (const f of follows.get(op.user)) {
        for (const t of (tweets.get(f) || [])) pool.push({ ...t, user: f });
      }
      pool.sort((a, b) => b.time - a.time);
      const feed = pool.slice(0, 10);
      frames.push({
        array: feed.map(t => 'u' + t.user + ' · t' + t.id + ' @' + t.time),
        chip: [
          { label: 'op', value: 'getNewsFeed(u' + op.user + ')', tone: 'pink' },
          { label: 'merged', value: pool.length + ' tweets', tone: 'violet' },
          { label: 'returned', value: 'top ' + feed.length + ' by time', tone: 'violet' },
        ],
        caption: 'Gather tweets from every followee (including self), sort by timestamp descending, take 10. Naive merge is fine for the contract; the heap upgrade (k-way merge of per-user lists) only matters when one user follows millions.',
      });
    }
  }

  frames.push({
    array: ['three maps', 'one global clock', 'O(n log n) feed'],
    chip: [
      { label: 'insight', value: 'no SQL, no graph — just dicts', tone: 'pink' },
      { label: 'scale-up', value: 'min-heap over per-user iterators', tone: 'violet' },
    ],
    caption: 'Total complexity: postTweet/follow/unfollow are O(1) amortized; getNewsFeed is O(T log T) where T is the total tweets across followees. With a min-heap that limits to the 10 most recent per followee, you can drop it to O(F log F + 10 log F).',
  });

  return { renderer: 'array', title: 'Design Twitter — three maps + one global clock', frames };
}

function designAddAndSearchWordsDataStructureViz() {
  const frames = [];

  const root = { ch: '*', children: new Map(), end: false };
  let nodeId = 0;
  const idOf = new WeakMap();
  idOf.set(root, nodeId++);

  const layout = () => {
    const lines = [];
    const visit = (node, prefix, isLast, depth) => {
      const marker = depth === 0 ? '*' : (node.ch + (node.end ? '$' : ''));
      lines.push(prefix + (depth === 0 ? '' : (isLast ? '└─ ' : '├─ ')) + marker);
      const kids = [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      kids.forEach(([, child], i) => {
        const childIsLast = i === kids.length - 1;
        visit(child, prefix + (depth === 0 ? '' : (isLast ? '   ' : '│  ')), childIsLast, depth + 1);
      });
    };
    visit(root, '', true, 0);
    return lines;
  };

  const insert = (word) => {
    let cur = root;
    for (const ch of word) {
      if (!cur.children.has(ch)) {
        const next = { ch, children: new Map(), end: false };
        idOf.set(next, nodeId++);
        cur.children.set(ch, next);
      }
      cur = cur.children.get(ch);
    }
    cur.end = true;
  };

  const search = (word) => {
    const path = [];
    const dfs = (node, i) => {
      if (i === word.length) return node.end;
      const ch = word[i];
      if (ch === '.') {
        for (const [k, child] of node.children) {
          path.push({ from: idOf.get(node), to: idOf.get(child), via: k, wild: true });
          if (dfs(child, i + 1)) return true;
          path.push({ backtrack: true, from: idOf.get(child) });
        }
        return false;
      }
      const child = node.children.get(ch);
      if (!child) return false;
      path.push({ from: idOf.get(node), to: idOf.get(child), via: ch, wild: false });
      return dfs(child, i + 1);
    };
    const found = dfs(root, 0);
    return { found, path };
  };

  frames.push({
    array: layout(),
    chip: [
      { label: 'data', value: 'Trie + DFS for "."', tone: 'violet' },
      { label: 'invariant', value: 'every node has children + end-marker bit', tone: 'violet' },
    ],
    caption: 'Empty trie. addWord just walks-or-creates one child per letter and flips a boolean at the terminal node. search walks letter-by-letter; the dot wildcard branches across every child via DFS.',
  });

  const adds = ['bad', 'dad', 'mad'];
  for (const w of adds) {
    insert(w);
    frames.push({
      array: layout(),
      chip: [
        { label: 'op', value: 'addWord("' + w + '")', tone: 'pink' },
        { label: 'nodes', value: String(nodeId), tone: 'violet' },
      ],
      caption: 'Walk down the trie; create nodes for missing children; mark the terminal node with $ to record that "' + w + '" is a complete stored word.',
    });
  }

  const queries = [
    { q: 'pad', expect: false },
    { q: 'bad', expect: true },
    { q: '.ad', expect: true },
    { q: 'b..', expect: true },
    { q: '..b', expect: false },
  ];

  for (const { q, expect } of queries) {
    const { found } = search(q);
    if (q.includes('.')) {
      frames.push({
        array: layout(),
        chip: [
          { label: 'op', value: 'search("' + q + '")', tone: 'pink' },
          { label: 'wildcard', value: '"."', tone: 'violet' },
          { label: 'visits', value: 'DFS over every child at "." positions', tone: 'violet' },
        ],
        caption: 'Dots fan out: at each "." the recursion tries every child of the current node. Concrete letters take one branch. Backtrack on a dead end and try the next sibling.',
      });
    }
    frames.push({
      array: layout(),
      chip: [
        { label: 'op', value: 'search("' + q + '")', tone: 'pink' },
        { label: 'result', value: String(found), tone: found ? 'violet' : 'pink' },
      ],
      caption: 'search("' + q + '") returns ' + found + '. ' + (found ? 'Some DFS branch consumed all ' + q.length + ' characters and landed on an end-marked node.' : 'Every branch either ran out of children or reached length ' + q.length + ' without an end marker.'),
    });
    if (found !== expect) {
      // sanity guard — never expected to trigger.
      frames[frames.length - 1].caption += ' (mismatch vs expected)';
    }
  }

  frames.push({
    array: layout(),
    chip: [
      { label: 'add', value: 'O(L) per word', tone: 'violet' },
      { label: 'search exact', value: 'O(L)', tone: 'violet' },
      { label: 'search wildcards', value: 'O(26^d * L)', tone: 'pink' },
    ],
    caption: 'Bookkeeping: a single bit per terminal node, one child-map per node. The cost of dots is the only place where the wildcard explodes — at most 26 branches per dot, multiplied by the remaining word length.',
  });

  return { renderer: 'array', title: 'Word Dictionary — Trie + dot-wildcard DFS', frames };
}

function designHitCounterViz() {
  const frames = [];
  const WINDOW = 300;
  const q = [];

  const evict = (now) => {
    while (q.length && q[0] <= now - WINDOW) q.shift();
  };

  const showQueue = (now) => {
    if (q.length === 0) return ['queue: []'];
    const compact = q.length <= 12 ? q.slice() : [...q.slice(0, 5), '...', ...q.slice(-5)];
    return [
      'queue head -> tail',
      '[' + compact.join(', ') + ']',
      'size = ' + q.length + (now != null ? ' · valid window [' + Math.max(1, now - WINDOW + 1) + ', ' + now + ']' : ''),
    ];
  };

  frames.push({
    array: ['HitCounter()', 'window = 300 seconds (5 min)'],
    chip: [
      { label: 'API', value: 'hit(t) · getHits(t)', tone: 'violet' },
      { label: 'queue', value: 'FIFO of timestamps within window', tone: 'violet' },
    ],
    caption: 'A queue of timestamps does everything. hit(t) enqueues t; getHits(t) first drops every timestamp older than t-299, then returns the remaining size. Monotonically non-decreasing t means evictions only happen from the front — that is what keeps each op amortized O(1).',
  });

  const ops = [
    { kind: 'hit', t: 1 },
    { kind: 'hit', t: 2 },
    { kind: 'hit', t: 3 },
    { kind: 'getHits', t: 4 },
    { kind: 'hit', t: 50 },
    { kind: 'hit', t: 300 },
    { kind: 'getHits', t: 300 },
    { kind: 'getHits', t: 301 },
    { kind: 'hit', t: 305 },
    { kind: 'hit', t: 305 },
    { kind: 'getHits', t: 305 },
    { kind: 'getHits', t: 350 },
    { kind: 'getHits', t: 605 },
  ];

  for (const op of ops) {
    if (op.kind === 'hit') {
      q.push(op.t);
      frames.push({
        array: showQueue(op.t),
        chip: [
          { label: 'op', value: 'hit(' + op.t + ')', tone: 'pink' },
          { label: 'size', value: String(q.length), tone: 'violet' },
        ],
        caption: 'Append timestamp ' + op.t + ' to the tail. Equal timestamps are allowed (multiple hits in the same second) and each gets its own slot — getHits counts them all.',
      });
    } else {
      const before = q.length;
      evict(op.t);
      const evicted = before - q.length;
      frames.push({
        array: showQueue(op.t),
        chip: [
          { label: 'op', value: 'getHits(' + op.t + ')', tone: 'pink' },
          { label: 'evicted', value: String(evicted), tone: evicted ? 'pink' : 'violet' },
          { label: 'returned', value: String(q.length), tone: 'violet' },
        ],
        caption: 'Drop every front timestamp <= ' + (op.t - WINDOW) + ' (i.e. outside [' + (op.t - WINDOW + 1) + ', ' + op.t + ']). ' + (evicted ? 'Evicted ' + evicted + ' stale hit' + (evicted === 1 ? '' : 's') + '.' : 'Nothing to evict.') + ' Remaining queue size is the answer: ' + q.length + '.',
      });
    }
  }

  frames.push({
    array: ['amortized O(1) per hit', 'O(k) per getHits, k = evicted', 'space O(hits in last 300s)'],
    chip: [
      { label: 'follow-up', value: 'thousands of hits/sec -> bucket by second', tone: 'pink' },
      { label: 'circular', value: '300 buckets, (time, count) pairs', tone: 'violet' },
    ],
    caption: 'Scale-up: replace the queue with 300 buckets of (timestamp, count). hit(t) writes to bucket t%300 — if the stored timestamp matches, increment count; else overwrite. getHits(t) sums buckets whose stored timestamp is within the window. Fixed O(300) memory, O(1) hit, O(300) getHits.',
  });

  return { renderer: 'array', title: 'Design Hit Counter — sliding-window queue of timestamps', frames };
}

`;

const ENTRY_BLOCK = `  'design-twitter': {
    tags: ['design', 'hash-table', 'linked-list', 'heap', 'sorting'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: designTwitterViz(),
    solutions: {
      python: {
        code: \`from collections import defaultdict
import heapq

class Twitter:
    def __init__(self):
        self.tweets = defaultdict(list)          # user -> list[(time, tweetId)]
        self.follows = defaultdict(set)          # user -> set(followees)
        self.clock = 0

    def postTweet(self, userId: int, tweetId: int) -> None:
        self.clock += 1
        self.tweets[userId].append((self.clock, tweetId))

    def getNewsFeed(self, userId: int) -> list[int]:
        candidates = set(self.follows[userId]) | {userId}
        heap = []
        for u in candidates:
            for t, tid in self.tweets[u][-10:]:
                heapq.heappush(heap, (-t, tid))
        return [tid for _, tid in (heapq.heappop(heap) for _ in range(min(10, len(heap))))]

    def follow(self, followerId: int, followeeId: int) -> None:
        if followerId != followeeId:
            self.follows[followerId].add(followeeId)

    def unfollow(self, followerId: int, followeeId: int) -> None:
        self.follows[followerId].discard(followeeId)\`,
        complexity: { time: 'post/follow/unfollow O(1); getNewsFeed O(F log F)', space: 'O(U + T)' },
        approach: 'Three maps + one global clock. postTweet stamps the tweet with the next clock tick so feeds sort across users without comparing wall times. getNewsFeed only looks at the last 10 tweets of each followee (capped by tweets[u][-10:]) and pushes them into a max-heap keyed by -time.',
      },
      javascript: {
        code: \`class Twitter {
  constructor() {
    this.tweets = new Map();   // user -> [{time, id}]
    this.follows = new Map();  // user -> Set<userId>
    this.clock = 0;
  }
  _ensure(u) {
    if (!this.tweets.has(u)) this.tweets.set(u, []);
    if (!this.follows.has(u)) this.follows.set(u, new Set());
  }
  postTweet(userId, tweetId) {
    this._ensure(userId);
    this.tweets.get(userId).push({ time: ++this.clock, id: tweetId });
  }
  getNewsFeed(userId) {
    this._ensure(userId);
    const pool = [];
    const users = new Set(this.follows.get(userId));
    users.add(userId);
    for (const u of users) {
      const list = this.tweets.get(u) || [];
      for (let i = Math.max(0, list.length - 10); i < list.length; i++) pool.push(list[i]);
    }
    pool.sort((a, b) => b.time - a.time);
    return pool.slice(0, 10).map(t => t.id);
  }
  follow(followerId, followeeId) {
    this._ensure(followerId);
    if (followerId !== followeeId) this.follows.get(followerId).add(followeeId);
  }
  unfollow(followerId, followeeId) {
    this._ensure(followerId);
    this.follows.get(followerId).delete(followeeId);
  }
}\`,
        complexity: { time: 'post/follow/unfollow O(1); getNewsFeed O(F log F)', space: 'O(U + T)' },
        approach: 'Map of arrays for tweets, Map of Sets for follows. Cap the per-user scan to the last 10 tweets — that bounds the work even if a single user has posted millions.',
      },
      java: {
        code: \`import java.util.*;

class Twitter {
    private static class Tweet {
        int time, id;
        Tweet(int t, int i) { time = t; id = i; }
    }
    private final Map<Integer, List<Tweet>> tweets = new HashMap<>();
    private final Map<Integer, Set<Integer>> follows = new HashMap<>();
    private int clock = 0;

    public Twitter() {}

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new Tweet(++clock, tweetId));
    }

    public List<Integer> getNewsFeed(int userId) {
        Set<Integer> users = new HashSet<>(follows.getOrDefault(userId, Set.of()));
        users.add(userId);
        PriorityQueue<Tweet> heap = new PriorityQueue<>((a, b) -> b.time - a.time);
        for (int u : users) {
            List<Tweet> list = tweets.getOrDefault(u, List.of());
            for (int i = Math.max(0, list.size() - 10); i < list.size(); i++) heap.offer(list.get(i));
        }
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < 10 && !heap.isEmpty(); i++) out.add(heap.poll().id);
        return out;
    }

    public void follow(int followerId, int followeeId) {
        if (followerId == followeeId) return;
        follows.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        Set<Integer> s = follows.get(followerId);
        if (s != null) s.remove(followeeId);
    }
}\`,
        complexity: { time: 'post/follow/unfollow O(1); getNewsFeed O(F log F)', space: 'O(U + T)' },
        approach: 'Inner static Tweet record holds (time, id). Max-heap by time gives the top 10 in O(F log F) where F is total tweets considered (already capped at 10 per followee).',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Twitter {
    struct Tweet { int time, id; };
    unordered_map<int, vector<Tweet>> tweets;
    unordered_map<int, unordered_set<int>> follows;
    int clock = 0;
public:
    Twitter() {}

    void postTweet(int userId, int tweetId) {
        tweets[userId].push_back({++clock, tweetId});
    }

    vector<int> getNewsFeed(int userId) {
        unordered_set<int> users(follows[userId].begin(), follows[userId].end());
        users.insert(userId);
        priority_queue<pair<int,int>> heap; // (time, id)
        for (int u : users) {
            auto& list = tweets[u];
            for (int i = max(0, (int)list.size() - 10); i < (int)list.size(); i++)
                heap.push({list[i].time, list[i].id});
        }
        vector<int> out;
        for (int i = 0; i < 10 && !heap.empty(); i++) {
            out.push_back(heap.top().second);
            heap.pop();
        }
        return out;
    }

    void follow(int followerId, int followeeId) {
        if (followerId != followeeId) follows[followerId].insert(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        follows[followerId].erase(followeeId);
    }
};\`,
        complexity: { time: 'post/follow/unfollow O(1); getNewsFeed O(F log F)', space: 'O(U + T)' },
        approach: 'Default max-heap of pair<int,int> sorts lexicographically — time comes first so newest wins. Cap per-user scan at 10 to keep F bounded.',
      },
      c: {
        code: \`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Simplified: linked list of tweets per user, linked list of followees per user.
typedef struct Tweet { int time, id; struct Tweet* next; } Tweet;
typedef struct Follow { int user; struct Follow* next; } Follow;
typedef struct {
    Tweet* tweetsByUser[10001];
    Follow* followsByUser[10001];
    int clock;
} Twitter;

Twitter* twitterCreate(void) {
    Twitter* t = (Twitter*)calloc(1, sizeof(Twitter));
    return t;
}

void twitterPostTweet(Twitter* t, int userId, int tweetId) {
    Tweet* n = (Tweet*)malloc(sizeof(Tweet));
    n->time = ++t->clock; n->id = tweetId; n->next = t->tweetsByUser[userId];
    t->tweetsByUser[userId] = n;
}

static int cmpDesc(const void* a, const void* b) {
    int ta = ((int*)a)[0], tb = ((int*)b)[0];
    return tb - ta;
}

int* twitterGetNewsFeed(Twitter* t, int userId, int* returnSize) {
    int pairs[2000][2]; int n = 0;
    for (Tweet* p = t->tweetsByUser[userId]; p; p = p->next) {
        pairs[n][0] = p->time; pairs[n][1] = p->id; n++;
    }
    for (Follow* f = t->followsByUser[userId]; f; f = f->next) {
        for (Tweet* p = t->tweetsByUser[f->user]; p; p = p->next) {
            pairs[n][0] = p->time; pairs[n][1] = p->id; n++;
        }
    }
    qsort(pairs, n, sizeof(pairs[0]), cmpDesc);
    int k = n < 10 ? n : 10;
    int* out = (int*)malloc(sizeof(int) * k);
    for (int i = 0; i < k; i++) out[i] = pairs[i][1];
    *returnSize = k;
    return out;
}

void twitterFollow(Twitter* t, int followerId, int followeeId) {
    if (followerId == followeeId) return;
    for (Follow* f = t->followsByUser[followerId]; f; f = f->next) if (f->user == followeeId) return;
    Follow* n = (Follow*)malloc(sizeof(Follow));
    n->user = followeeId; n->next = t->followsByUser[followerId];
    t->followsByUser[followerId] = n;
}

void twitterUnfollow(Twitter* t, int followerId, int followeeId) {
    Follow** pp = &t->followsByUser[followerId];
    while (*pp) {
        if ((*pp)->user == followeeId) { Follow* d = *pp; *pp = d->next; free(d); return; }
        pp = &(*pp)->next;
    }
}

void twitterFree(Twitter* t) { free(t); }\`,
        complexity: { time: 'post/follow/unfollow O(1) (follow O(F) for dedup); getNewsFeed O(N log N)', space: 'O(U + T)' },
        approach: 'Fixed-size hash by userId (problem caps user ids). Linked lists per user for tweets + follows. qsort the merged tuples by time descending.',
      },
      go: {
        code: \`package twitter

import (
    "container/heap"
    "sort"
)

type tweet struct{ time, id int }

type Twitter struct {
    tweets  map[int][]tweet
    follows map[int]map[int]bool
    clock   int
}

func Constructor() Twitter {
    return Twitter{tweets: map[int][]tweet{}, follows: map[int]map[int]bool{}}
}

func (t *Twitter) PostTweet(userId, tweetId int) {
    t.clock++
    t.tweets[userId] = append(t.tweets[userId], tweet{t.clock, tweetId})
}

func (t *Twitter) GetNewsFeed(userId int) []int {
    users := map[int]bool{userId: true}
    for u := range t.follows[userId] { users[u] = true }
    pool := []tweet{}
    for u := range users {
        list := t.tweets[u]
        start := len(list) - 10
        if start < 0 { start = 0 }
        pool = append(pool, list[start:]...)
    }
    sort.Slice(pool, func(i, j int) bool { return pool[i].time > pool[j].time })
    n := 10
    if len(pool) < n { n = len(pool) }
    out := make([]int, n)
    for i := 0; i < n; i++ { out[i] = pool[i].id }
    return out
}

func (t *Twitter) Follow(followerId, followeeId int) {
    if followerId == followeeId { return }
    if t.follows[followerId] == nil { t.follows[followerId] = map[int]bool{} }
    t.follows[followerId][followeeId] = true
}

func (t *Twitter) Unfollow(followerId, followeeId int) {
    if t.follows[followerId] != nil { delete(t.follows[followerId], followeeId) }
}

var _ = heap.Interface(nil) // keep import valid if you swap sort for heap\`,
        complexity: { time: 'post/follow/unfollow O(1); getNewsFeed O(F log F)', space: 'O(U + T)' },
        approach: 'Same idea in Go. sort.Slice with a descending comparator is simpler than container/heap here because F is already small (10 per followee).',
      },
    },
  },
  'design-add-and-search-words-data-structure': {
    tags: ['design', 'trie', 'string', 'depth-first-search', 'backtracking'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: designAddAndSearchWordsDataStructureViz(),
    solutions: {
      python: {
        code: \`class WordDictionary:
    def __init__(self):
        self.children = {}
        self.end = False

    def addWord(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = WordDictionary()
            node = node.children[ch]
        node.end = True

    def search(self, word: str) -> bool:
        def dfs(node, i):
            if i == len(word):
                return node.end
            ch = word[i]
            if ch == '.':
                return any(dfs(child, i + 1) for child in node.children.values())
            child = node.children.get(ch)
            return bool(child) and dfs(child, i + 1)
        return dfs(self, 0)\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(total chars)' },
        approach: 'Trie of nested dicts. addWord is straight insertion. search is a DFS where the dot wildcard branches across every child — that is the only place the cost grows beyond O(L). Concrete characters take exactly one branch.',
      },
      javascript: {
        code: \`class WordDictionary {
  constructor() {
    this.children = new Map();
    this.end = false;
  }
  addWord(word) {
    let node = this;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new WordDictionary());
      node = node.children.get(ch);
    }
    node.end = true;
  }
  search(word) {
    const dfs = (node, i) => {
      if (i === word.length) return node.end;
      const ch = word[i];
      if (ch === '.') {
        for (const child of node.children.values()) {
          if (dfs(child, i + 1)) return true;
        }
        return false;
      }
      const child = node.children.get(ch);
      return !!child && dfs(child, i + 1);
    };
    return dfs(this, 0);
  }
}\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(total chars)' },
        approach: 'Each node IS a WordDictionary — no separate Node class. Map keeps insertion-order semantics; for ASCII you could swap to a 26-element array for marginal speed.',
      },
      java: {
        code: \`import java.util.*;

class WordDictionary {
    private final WordDictionary[] children = new WordDictionary[26];
    private boolean end = false;

    public WordDictionary() {}

    public void addWord(String word) {
        WordDictionary node = this;
        for (int i = 0; i < word.length(); i++) {
            int idx = word.charAt(i) - 'a';
            if (node.children[idx] == null) node.children[idx] = new WordDictionary();
            node = node.children[idx];
        }
        node.end = true;
    }

    public boolean search(String word) {
        return dfs(word, 0, this);
    }

    private boolean dfs(String word, int i, WordDictionary node) {
        if (i == word.length()) return node.end;
        char c = word.charAt(i);
        if (c == '.') {
            for (WordDictionary child : node.children) {
                if (child != null && dfs(word, i + 1, child)) return true;
            }
            return false;
        }
        WordDictionary child = node.children[c - 'a'];
        return child != null && dfs(word, i + 1, child);
    }
}\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(26 * total nodes)' },
        approach: 'Fixed 26-slot array per node — faster than a HashMap and the problem guarantees lowercase letters. Recursive DFS keeps the wildcard branching natural.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class WordDictionary {
    WordDictionary* children[26] = {nullptr};
    bool end = false;
public:
    WordDictionary() {}

    void addWord(string word) {
        WordDictionary* node = this;
        for (char c : word) {
            int idx = c - 'a';
            if (!node->children[idx]) node->children[idx] = new WordDictionary();
            node = node->children[idx];
        }
        node->end = true;
    }

    bool search(string word) {
        return dfs(word, 0, this);
    }

private:
    bool dfs(const string& w, int i, WordDictionary* node) {
        if (i == (int)w.size()) return node->end;
        char c = w[i];
        if (c == '.') {
            for (int k = 0; k < 26; k++) {
                if (node->children[k] && dfs(w, i + 1, node->children[k])) return true;
            }
            return false;
        }
        WordDictionary* child = node->children[c - 'a'];
        return child && dfs(w, i + 1, child);
    }
};\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(26 * total nodes)' },
        approach: 'Raw-pointer trie keeps each node tiny. Pass the word by const reference to the helper so the recursion is allocation-free.',
      },
      c: {
        code: \`#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct WordDictionary {
    struct WordDictionary* children[26];
    bool end;
} WordDictionary;

WordDictionary* wordDictionaryCreate(void) {
    return (WordDictionary*)calloc(1, sizeof(WordDictionary));
}

void wordDictionaryAddWord(WordDictionary* obj, char* word) {
    WordDictionary* node = obj;
    for (int i = 0; word[i]; i++) {
        int idx = word[i] - 'a';
        if (!node->children[idx]) node->children[idx] = (WordDictionary*)calloc(1, sizeof(WordDictionary));
        node = node->children[idx];
    }
    node->end = true;
}

static bool dfs(WordDictionary* node, const char* w, int i, int n) {
    if (i == n) return node->end;
    char c = w[i];
    if (c == '.') {
        for (int k = 0; k < 26; k++) {
            if (node->children[k] && dfs(node->children[k], w, i + 1, n)) return true;
        }
        return false;
    }
    WordDictionary* child = node->children[c - 'a'];
    return child && dfs(child, w, i + 1, n);
}

bool wordDictionarySearch(WordDictionary* obj, char* word) {
    return dfs(obj, word, 0, (int)strlen(word));
}

void wordDictionaryFree(WordDictionary* obj) {
    for (int k = 0; k < 26; k++) if (obj->children[k]) wordDictionaryFree(obj->children[k]);
    free(obj);
}\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(26 * total nodes)' },
        approach: 'Same 26-slot trie. Manual recursive free so the destructor walks the whole tree.',
      },
      go: {
        code: \`package worddict

type WordDictionary struct {
    children [26]*WordDictionary
    end      bool
}

func Constructor() WordDictionary { return WordDictionary{} }

func (w *WordDictionary) AddWord(word string) {
    node := w
    for i := 0; i < len(word); i++ {
        idx := int(word[i] - 'a')
        if node.children[idx] == nil { node.children[idx] = &WordDictionary{} }
        node = node.children[idx]
    }
    node.end = true
}

func (w *WordDictionary) Search(word string) bool {
    var dfs func(node *WordDictionary, i int) bool
    dfs = func(node *WordDictionary, i int) bool {
        if i == len(word) { return node.end }
        c := word[i]
        if c == '.' {
            for _, child := range node.children {
                if child != nil && dfs(child, i+1) { return true }
            }
            return false
        }
        child := node.children[c-'a']
        return child != nil && dfs(child, i+1)
    }
    return dfs(w, 0)
}\`,
        complexity: { time: 'addWord O(L); search O(26^d * L)', space: 'O(26 * total nodes)' },
        approach: 'Closure captures word so the recursion only carries (node, i). Fixed-size array is the cleanest fit because Go arrays are value-typed inside the struct.',
      },
    },
  },
  'design-hit-counter': {
    tags: ['design', 'queue', 'binary-search', 'sliding-window'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: designHitCounterViz(),
    solutions: {
      python: {
        code: \`from collections import deque

class HitCounter:
    WINDOW = 300

    def __init__(self):
        self.q = deque()

    def hit(self, timestamp: int) -> None:
        self.q.append(timestamp)

    def getHits(self, timestamp: int) -> int:
        cutoff = timestamp - self.WINDOW
        while self.q and self.q[0] <= cutoff:
            self.q.popleft()
        return len(self.q)\`,
        complexity: { time: 'hit O(1); getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'Queue of timestamps. hit appends; getHits drops every front timestamp that fell out of the window, then returns the remaining size. Each timestamp is enqueued and evicted once — amortized O(1) per op.',
      },
      javascript: {
        code: \`class HitCounter {
  constructor() {
    this.q = [];
    this.head = 0;
    this.WINDOW = 300;
  }
  hit(timestamp) {
    this.q.push(timestamp);
  }
  getHits(timestamp) {
    const cutoff = timestamp - this.WINDOW;
    while (this.head < this.q.length && this.q[this.head] <= cutoff) this.head++;
    // periodic compaction to keep memory bounded
    if (this.head > 1024 && this.head * 2 > this.q.length) {
      this.q = this.q.slice(this.head);
      this.head = 0;
    }
    return this.q.length - this.head;
  }
}\`,
        complexity: { time: 'hit O(1); getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'Array + head index acts like a deque without shift\\'s O(n) cost. Periodic compaction reclaims memory once the dead prefix dominates.',
      },
      java: {
        code: \`import java.util.ArrayDeque;
import java.util.Deque;

class HitCounter {
    private static final int WINDOW = 300;
    private final Deque<Integer> q = new ArrayDeque<>();

    public HitCounter() {}

    public void hit(int timestamp) {
        q.addLast(timestamp);
    }

    public int getHits(int timestamp) {
        int cutoff = timestamp - WINDOW;
        while (!q.isEmpty() && q.peekFirst() <= cutoff) q.pollFirst();
        return q.size();
    }
}\`,
        complexity: { time: 'hit O(1); getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'ArrayDeque gives O(1) at both ends. Inclusive vs exclusive window: a hit at t-300 is OUT, a hit at t-299 is IN, so cutoff = t-300 and the test is "<=".',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class HitCounter {
    deque<int> q;
    static constexpr int WINDOW = 300;
public:
    HitCounter() {}

    void hit(int timestamp) {
        q.push_back(timestamp);
    }

    int getHits(int timestamp) {
        int cutoff = timestamp - WINDOW;
        while (!q.empty() && q.front() <= cutoff) q.pop_front();
        return (int)q.size();
    }
};\`,
        complexity: { time: 'hit O(1); getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'std::deque is the textbook fit — O(1) push_back and pop_front. For follow-up (thousands of hits per second) switch to a 300-bucket circular array.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

#define WINDOW 300
#define CAP 10000

typedef struct {
    int* buf;
    int cap, head, tail; // ring buffer indices
    int size;
} HitCounter;

HitCounter* hitCounterCreate(void) {
    HitCounter* c = (HitCounter*)calloc(1, sizeof(HitCounter));
    c->cap = CAP;
    c->buf = (int*)malloc(sizeof(int) * c->cap);
    return c;
}

static void grow(HitCounter* c) {
    int newCap = c->cap * 2;
    int* nb = (int*)malloc(sizeof(int) * newCap);
    for (int i = 0; i < c->size; i++) nb[i] = c->buf[(c->head + i) % c->cap];
    free(c->buf);
    c->buf = nb; c->cap = newCap; c->head = 0; c->tail = c->size;
}

void hitCounterHit(HitCounter* c, int timestamp) {
    if (c->size == c->cap) grow(c);
    c->buf[c->tail] = timestamp;
    c->tail = (c->tail + 1) % c->cap;
    c->size++;
}

int hitCounterGetHits(HitCounter* c, int timestamp) {
    int cutoff = timestamp - WINDOW;
    while (c->size > 0 && c->buf[c->head] <= cutoff) {
        c->head = (c->head + 1) % c->cap;
        c->size--;
    }
    return c->size;
}

void hitCounterFree(HitCounter* c) { free(c->buf); free(c); }\`,
        complexity: { time: 'hit O(1) amortized; getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'Hand-rolled ring buffer — no library queue in C. Doubles on overflow so amortized hit cost stays O(1).',
      },
      go: {
        code: \`package hitcounter

const window = 300

type HitCounter struct {
    q []int
}

func Constructor() HitCounter {
    return HitCounter{q: make([]int, 0, 64)}
}

func (h *HitCounter) Hit(timestamp int) {
    h.q = append(h.q, timestamp)
}

func (h *HitCounter) GetHits(timestamp int) int {
    cutoff := timestamp - window
    i := 0
    for i < len(h.q) && h.q[i] <= cutoff { i++ }
    if i > 0 { h.q = h.q[i:] }
    return len(h.q)
}\`,
        complexity: { time: 'hit O(1); getHits amortized O(1)', space: 'O(hits in last 300s)' },
        approach: 'Slice reslicing drops the dead prefix in O(1) without copying. Underlying array eventually gets garbage-collected once no slice keeps it alive.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
// String/template-literal aware brace matcher.
let depth = 0, closeIdx = -1;
let state = 'code'; // code | sq | dq | tpl | line-comment | block-comment
for (let p = openBracePos; p < src.length; p++) {
  const ch = src[p];
  const nx = src[p + 1];
  if (state === 'code') {
    if (ch === '/' && nx === '/') { state = 'line-comment'; p++; continue; }
    if (ch === '/' && nx === '*') { state = 'block-comment'; p++; continue; }
    if (ch === "'") { state = 'sq'; continue; }
    if (ch === '"') { state = 'dq'; continue; }
    if (ch === '`') { state = 'tpl'; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { closeIdx = p; break; }
    }
  } else if (state === 'line-comment') {
    if (ch === '\n') state = 'code';
  } else if (state === 'block-comment') {
    if (ch === '*' && nx === '/') { state = 'code'; p++; }
  } else if (state === 'sq') {
    if (ch === '\\') { p++; continue; }
    if (ch === "'") state = 'code';
  } else if (state === 'dq') {
    if (ch === '\\') { p++; continue; }
    if (ch === '"') state = 'code';
  } else if (state === 'tpl') {
    if (ch === '\\') { p++; continue; }
    if (ch === '`') state = 'code';
    // NOTE: ignoring ${ interpolation — none of our entries use it.
  }
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced 3 design viz fns + 3 entries into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
