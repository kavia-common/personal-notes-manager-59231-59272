//
// API service for notes. This file centralizes all calls to the backend API.
// It transparently falls back to a localStorage-based mock when API_BASE_URL
// is not configured or requests fail.
//
// PUBLIC_INTERFACE
export const api = {
  /** List all notes (sorted by updatedAt desc). */
  // PUBLIC_INTERFACE
  async listNotes(): Promise<Note[]> {
    const live = await tryLive(async (base) => {
      const res = await fetch(`${base}/notes`, { headers: headersJson() });
      if (!res.ok) throw new Error(`Live list failed: ${res.status}`);
      return (await res.json()) as Note[];
    });
    if (live.ok) return normalize(live.data as Note[]);

    const notes = readLocal();
    return normalize(notes).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  /** Fetch a single note by id. */
  // PUBLIC_INTERFACE
  async getNote(id: string): Promise<Note | null> {
    const live = await tryLive(async (base) => {
      const res = await fetch(`${base}/notes/${encodeURIComponent(id)}`, { headers: headersJson() });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Live get failed: ${res.status}`);
      return (await res.json()) as Note;
    });
    if (live.ok) return live.data as Note | null;

    const notes = readLocal();
    return notes.find(n => n.id === id) || null;
  },

  /** Create a new note. */
  // PUBLIC_INTERFACE
  async createNote(payload: NoteCreate): Promise<Note> {
    const now = Date.now();

    const live = await tryLive(async (base) => {
      const res = await fetch(`${base}/notes`, {
        method: 'POST',
        headers: headersJson(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Live create failed: ${res.status}`);
      return (await res.json()) as Note;
    });
    if (live.ok) return live.data;

    // mock
    const notes = readLocal();
    const note: Note = {
      id: genId(),
      title: payload.title,
      content: payload.content || '',
      createdAt: now,
      updatedAt: now,
    };
    notes.push(note);
    writeLocal(notes);
    return note;
  },

  /** Update an existing note by id. */
  // PUBLIC_INTERFACE
  async updateNote(id: string, payload: NoteUpdate): Promise<Note> {
    const now = Date.now();

    const live = await tryLive(async (base) => {
      const res = await fetch(`${base}/notes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: headersJson(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Live update failed: ${res.status}`);
      return (await res.json()) as Note;
    });
    if (live.ok) return live.data;

    // mock
    const notes = readLocal();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Note not found');
    const updated: Note = {
      ...notes[idx],
      title: payload.title ?? notes[idx].title,
      content: payload.content ?? notes[idx].content,
      updatedAt: now,
    };
    notes[idx] = updated;
    writeLocal(notes);
    return updated;
  },

  /** Delete a note by id. */
  // PUBLIC_INTERFACE
  async deleteNote(id: string): Promise<void> {
    const live = await tryLive(async (base) => {
      const res = await fetch(`${base}/notes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: headersJson(),
      });
      if (res.status === 404) return;
      if (!res.ok) throw new Error(`Live delete failed: ${res.status}`);
      return;
    });
    if (live.ok) return;

    // mock
    const notes = readLocal().filter(n => n.id !== id);
    writeLocal(notes);
  },
};

/** Types for notes domain. */
export type Note = {
  id: string;
  title: string;
  content?: string;
  createdAt?: number;
  updatedAt?: number;
};
export type NoteCreate = {
  title: string;
  content?: string;
};
export type NoteUpdate = Partial<NoteCreate>;

/* Internal helpers */

const STORAGE_KEY = 'notes_frontend__notes';

function headersJson() {
  return { 'Content-Type': 'application/json' };
}

function readLocal(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedInitial();
  } catch {
    return seedInitial();
  }
}

function writeLocal(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function genId() {
  // simple nanoid-ish
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function seedInitial(): Note[] {
  const now = Date.now();
  const demo: Note[] = [
    {
      id: genId(),
      title: 'Welcome to Notes',
      content: 'This is a demo note. You can edit or delete it.',
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    },
    {
      id: genId(),
      title: 'Second Note',
      content: 'Use the + New Note button to create more.',
      createdAt: now - 6000000,
      updatedAt: now - 1200000,
    },
  ];
  writeLocal(demo);
  return demo;
}

function normalize(list: Note[]): Note[] {
  return (list || []).map(n => ({
    ...n,
    title: n.title ?? '',
    content: n.content ?? '',
    createdAt: n.createdAt ?? Date.now(),
    updatedAt: n.updatedAt ?? Date.now(),
  }));
}

/**
 * Try to talk to a live backend using API_BASE_URL.
 * If missing or call fails, returns {ok:false}.
 */
async function tryLive<T>(fn: (base: string) => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; data: null }> {
  const base = getApiBase();
  if (!base) return { ok: false, data: null };
  try {
    const data = await fn(base);
    return { ok: true, data };
  } catch {
    return { ok: false, data: null };
  }
}

/** Resolve API base URL from environment variable injected at build or runtime. */
// PUBLIC_INTERFACE
export function getApiBase(): string | null {
  // For Astro client code, import.meta.env is statically injected.
  // We support multiple common names for flexibility.
  type EnvShape = { PUBLIC_API_BASE_URL?: string; PUBLIC_BACKEND_URL?: string };
  const env = (import.meta as unknown as { env?: EnvShape })?.env ?? {};
  const win = typeof window !== 'undefined' ? (window as Window & { __API_BASE_URL__?: string }) : undefined;

  const candidates = [
    env.PUBLIC_API_BASE_URL,
    env.PUBLIC_BACKEND_URL,
    win?.__API_BASE_URL__,
  ].filter(Boolean);
  return candidates.length ? String(candidates[0]) : null;
}
