import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Check, Plus, ListPlus, Loader2 } from 'lucide-react';
import {
  useMyLists,
  useProblemListMembership,
  useToggleListMembership,
  useCreateListWithProblem,
} from '../lib/queries';
import './SaveToListButton.css';

// Per-problem "Save to list" affordance. Renders a bookmark icon button; click
// opens a themed pick-or-create popover listing the user's custom lists with a
// toggle each (already-in-list shown checked), plus a "+ New list" inline input
// that creates-and-adds in one step. Toggling adds/removes immediately
// (optimistic, via React Query). Click-outside + Escape close. Signed-out users
// see a sign-in prompt instead of the list picker.
//
// `variant` controls the trigger styling so the same component fits a dense
// table row ("row") or a problem-detail header ("detail").
export default function SaveToListButton({ session, problemId, variant = 'row', align = 'right' }) {
  const userId = session?.user?.id;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const wrapRef = useRef(null);
  const newInputRef = useRef(null);

  const { data: lists = [] } = useMyLists(userId);
  const { data: membership = new Set() } = useProblemListMembership(userId, problemId);
  const toggle = useToggleListMembership(userId, problemId);
  const createWithProblem = useCreateListWithProblem(userId);

  const inAnyList = membership.size > 0;

  const close = useCallback(() => setOpen(false), []);

  // Click-outside + Escape close, only while open.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const handleTrigger = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(o => !o);
  };

  const onToggleList = (listId) => {
    const next = !membership.has(listId);
    toggle.mutate({ listId, next, position: 0 });
  };

  const submitNew = () => {
    const name = newName.trim();
    if (!name || createWithProblem.isPending) return;
    createWithProblem.mutate(
      { name, problemId },
      { onSuccess: () => setNewName('') },
    );
  };

  const TriggerIcon = inAnyList ? BookmarkCheck : Bookmark;

  return (
    <div className={`stl-wrap stl-align-${align}`} ref={wrapRef}>
      <button
        type="button"
        className={`stl-trigger stl-trigger-${variant} ${inAnyList ? 'is-saved' : ''} ${open ? 'is-open' : ''}`}
        onClick={handleTrigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={inAnyList ? 'Saved to a list — edit lists' : 'Save to a list'}
        title={inAnyList ? 'Saved to a list' : 'Save to list'}
      >
        <TriggerIcon size={variant === 'detail' ? 15 : 16} />
        {variant === 'detail' && <span className="stl-trigger-text">{inAnyList ? 'Saved' : 'Save to list'}</span>}
      </button>

      {open && (
        <div
          className="stl-pop"
          role="dialog"
          aria-label="Save to list"
          onClick={(e) => e.stopPropagation()}
        >
          {!userId ? (
            <div className="stl-signin">
              <ListPlus size={22} className="stl-signin-icon" />
              <p className="stl-signin-title">Sign in to save</p>
              <p className="stl-signin-sub">Custom lists let you group problems however you want.</p>
              <button
                type="button"
                className="stl-signin-btn"
                onClick={() => { close(); navigate('/lists'); }}
              >
                Go to My Lists
              </button>
            </div>
          ) : (
            <>
              <div className="stl-pop-head">Save to list</div>

              {lists.length > 0 ? (
                <ul className="stl-list">
                  {lists.map(l => {
                    const checked = membership.has(l.id);
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          className={`stl-row ${checked ? 'is-checked' : ''}`}
                          onClick={() => onToggleList(l.id)}
                          role="checkbox"
                          aria-checked={checked}
                        >
                          <span className="stl-check" aria-hidden="true">
                            {checked && <Check size={12} />}
                          </span>
                          <span className="stl-row-name">{l.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="stl-empty">No lists yet. Create one below.</p>
              )}

              <div className="stl-new">
                <Plus size={13} className="stl-new-icon" />
                <input
                  ref={newInputRef}
                  className="stl-new-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNew(); }}
                  placeholder="New list…"
                  aria-label="New list name"
                />
                <button
                  type="button"
                  className="stl-new-btn"
                  onClick={submitNew}
                  disabled={!newName.trim() || createWithProblem.isPending}
                  aria-label="Create list and add this problem"
                >
                  {createWithProblem.isPending
                    ? <Loader2 size={13} className="stl-spin" />
                    : 'Add'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
