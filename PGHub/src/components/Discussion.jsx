import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Reply, MessageSquare, Loader2, Send } from 'lucide-react';
import { useComments, usePostComment, useVoteComment } from '../lib/queries';
import './Discussion.css';

const SORTS = [
  { value: 'top', label: 'Top' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const DEPTH_VISIBLE = 1;

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, (Date.now() - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)}w ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}mo ago`;
  return `${Math.floor(diff / 86400 / 365)}y ago`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdownBody(text) {
  if (!text) return '';
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const fence = block.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
      if (fence) {
        return `<pre class="dsc-code"><code>${escapeHtml(fence[2])}</code></pre>`;
      }
      const lines = block.split('\n');
      const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
      if (isList) {
        const items = lines
          .map((l) => `<li>${renderInlineMarkdown(l.replace(/^\s*[-*]\s+/, ''))}</li>`)
          .join('');
        return `<ul class="dsc-list">${items}</ul>`;
      }
      return `<p>${renderInlineMarkdown(block).replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

function authorInitials(name, fallbackId) {
  const source = name || fallbackId || '';
  const cleaned = String(source).trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

function buildTree(rows) {
  const byId = new Map();
  rows.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function sortNodes(nodes, mode) {
  const sorted = [...nodes];
  if (mode === 'top') {
    sorted.sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(b.created_at) - new Date(a.created_at));
  } else if (mode === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  return sorted.map((n) => ({ ...n, children: sortNodes(n.children, mode) }));
}

function CommentNode({ node, depth, onReply, onVote, replyingTo, replyDraft, setReplyDraft, submitReply, posting, session, currentUserId, targetKind, targetId }) {
  const [collapsed, setCollapsed] = useState(false);
  const isOver = depth > DEPTH_VISIBLE;
  const isReplying = replyingTo === node.id;
  const myVote = node.my_vote || 0;

  return (
    <li className={`dsc-comment dsc-depth-${Math.min(depth, 4)}`}>
      <div className="dsc-row">
        <div className="dsc-vote-col">
          <button
            type="button"
            className={`dsc-vote-btn ${myVote === 1 ? 'is-up' : ''}`}
            aria-label="Upvote"
            disabled={!session}
            onClick={() => onVote(node.id, 1)}
          >
            <ArrowUp size={14} />
          </button>
          <span className={`dsc-score ${myVote === 1 ? 'is-up' : myVote === -1 ? 'is-down' : ''}`}>{node.score || 0}</span>
          <button
            type="button"
            className={`dsc-vote-btn ${myVote === -1 ? 'is-down' : ''}`}
            aria-label="Downvote"
            disabled={!session}
            onClick={() => onVote(node.id, -1)}
          >
            <ArrowDown size={14} />
          </button>
        </div>
        <div className="dsc-body-col">
          <div className="dsc-meta">
            <span className="dsc-avatar" aria-hidden="true">{authorInitials(node.author_name, node.user_id)}</span>
            <span className="dsc-author">{node.author_name || 'Anonymous'}</span>
            <span className="dsc-dot" aria-hidden="true" />
            <span className="dsc-time">{timeAgo(node.created_at)}</span>
            {node.children?.length > 0 && (
              <button
                type="button"
                className="dsc-collapse"
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? `Show ${node.children.length} repl${node.children.length === 1 ? 'y' : 'ies'}` : 'Hide replies'}
              </button>
            )}
          </div>
          <div
            className="dsc-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdownBody(node.body) }}
          />
          <div className="dsc-actions">
            <button
              type="button"
              className="dsc-action"
              disabled={!session}
              onClick={() => onReply(isReplying ? null : node.id)}
            >
              <Reply size={12} /> Reply
            </button>
          </div>

          {isReplying && session && (
            <form
              className="dsc-reply-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitReply(node.id);
              }}
            >
              <textarea
                className="dsc-textarea dsc-textarea-reply"
                placeholder="Write a reply…"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="dsc-form-actions">
                <button type="button" className="dsc-btn-ghost" onClick={() => onReply(null)}>Cancel</button>
                <button type="submit" className="dsc-btn-primary" disabled={posting || !replyDraft.trim()}>
                  {posting ? <Loader2 size={12} className="dsc-spin" /> : <Send size={12} />} Reply
                </button>
              </div>
            </form>
          )}

          {!collapsed && node.children?.length > 0 && (
            isOver ? (
              <details className="dsc-deep-replies">
                <summary>Continue thread ({node.children.length})</summary>
                <ul className="dsc-children">
                  {node.children.map((child) => (
                    <CommentNode
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      onReply={onReply}
                      onVote={onVote}
                      replyingTo={replyingTo}
                      replyDraft={replyDraft}
                      setReplyDraft={setReplyDraft}
                      submitReply={submitReply}
                      posting={posting}
                      session={session}
                      currentUserId={currentUserId}
                      targetKind={targetKind}
                      targetId={targetId}
                    />
                  ))}
                </ul>
              </details>
            ) : (
              <ul className="dsc-children">
                {node.children.map((child) => (
                  <CommentNode
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    onReply={onReply}
                    onVote={onVote}
                    replyingTo={replyingTo}
                    replyDraft={replyDraft}
                    setReplyDraft={setReplyDraft}
                    submitReply={submitReply}
                    posting={posting}
                    session={session}
                    currentUserId={currentUserId}
                    targetKind={targetKind}
                    targetId={targetId}
                  />
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </li>
  );
}

export default function Discussion({ targetKind, targetId, session }) {
  const userId = session?.user?.id || null;
  const { data: comments = [], isLoading, isError, error } = useComments(targetKind, targetId, userId);
  const postComment = usePostComment();
  const voteComment = useVoteComment();

  const [sort, setSort] = useState('top');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');

  const tree = useMemo(() => sortNodes(buildTree(comments), sort), [comments, sort]);
  const totalCount = comments.length;

  const submitTop = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setPosting(true);
    setPostError(null);
    try {
      await postComment({ targetKind, targetId, userId, body: draft });
      setDraft('');
    } catch (err) {
      setPostError(err?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (parentId) => {
    if (!userId) return;
    setPosting(true);
    setPostError(null);
    try {
      await postComment({ targetKind, targetId, userId, body: replyDraft, parentId });
      setReplyDraft('');
      setReplyingTo(null);
    } catch (err) {
      setPostError(err?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (commentId, value) => {
    if (!userId) return;
    try {
      await voteComment({ commentId, userId, value, targetKind, targetId });
    } catch {
      // optimistic state will be reconciled by invalidate on settle
    }
  };

  return (
    <div className="dsc-root">
      <header className="dsc-head">
        <div className="dsc-head-title">
          <MessageSquare size={14} />
          <h3>Discussion</h3>
          <span className="dsc-count">{totalCount}</span>
        </div>
        <div className="dsc-sorts" role="tablist" aria-label="Sort comments">
          {SORTS.map((s) => (
            <button
              key={s.value}
              role="tab"
              aria-selected={sort === s.value}
              className={`dsc-sort ${sort === s.value ? 'active' : ''}`}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <form className="dsc-compose" onSubmit={submitTop}>
        <textarea
          className="dsc-textarea"
          placeholder={session ? 'Share your approach, ask a question, or help others…' : 'Sign in to comment'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          disabled={!session || posting}
        />
        <div className="dsc-form-actions">
          {postError && <span className="dsc-error">{postError}</span>}
          <span className="dsc-hint">Supports `code`, **bold**, *italic*, lists, links.</span>
          <button type="submit" className="dsc-btn-primary" disabled={!session || posting || !draft.trim()}>
            {posting ? <Loader2 size={12} className="dsc-spin" /> : <Send size={12} />} {session ? 'Post' : 'Sign in to comment'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="dsc-state">
          <Loader2 size={14} className="dsc-spin" /> Loading discussion…
        </div>
      )}
      {isError && (
        <div className="dsc-state dsc-state-error">{error?.message || 'Failed to load comments'}</div>
      )}

      {!isLoading && !isError && tree.length === 0 && (
        <div className="dsc-empty">
          <MessageSquare size={18} />
          <p>No comments yet. Be the first to start the conversation.</p>
        </div>
      )}

      {tree.length > 0 && (
        <ul className="dsc-thread">
          {tree.map((node) => (
            <CommentNode
              key={node.id}
              node={node}
              depth={0}
              onReply={setReplyingTo}
              onVote={handleVote}
              replyingTo={replyingTo}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              submitReply={submitReply}
              posting={posting}
              session={session}
              currentUserId={userId}
              targetKind={targetKind}
              targetId={targetId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
