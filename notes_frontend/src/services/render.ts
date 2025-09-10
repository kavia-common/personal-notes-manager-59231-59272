import type { Note } from './api';

// PUBLIC_INTERFACE
export function renderNoteCard(n: Note): string {
  const updated = n.updatedAt ? new Date(n.updatedAt).toLocaleString() : '';
  const excerpt = (n.content || '').trim();
  const content = excerpt.length > 180 ? excerpt.slice(0, 180) + '…' : excerpt;

  return `
    <article class="note-card">
      <div class="note-meta">
        <h3 class="note-title">${escapeHtml(n.title || 'Untitled')}</h3>
        <span class="note-updated" title="Last updated">${escapeHtml(updated)}</span>
      </div>
      <div class="note-content">${escapeHtml(content || 'No content')}</div>
      <div class="note-actions">
        <a href="/notes/${encodeURIComponent(n.id)}">Edit</a>
        <button class="danger" data-action="delete" data-id="${encodeURIComponent(n.id)}">Delete</button>
      </div>
    </article>
  `;
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
