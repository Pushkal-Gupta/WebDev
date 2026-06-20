// Shared parser for topic-name display.
// Some `PGcode_topics.name` values include a literal "\n" or actual newline used
// to split a primary label from a longer descriptor. Centralized here so the
// regex doesn't drift across components.

const SPLITTER = /\\n|\n/;

export function primaryTopicLabel(raw) {
  return (raw || '').split(SPLITTER)[0].trim();
}

export function fullTopicLabel(raw) {
  return (raw || '').replace(/\\n/g, ' — ').replace(/\n/g, ' — ').trim();
}
