const PREFIX = 'dejavu';

interface SessionData {
  token: string;
  playerId: string;
  expiry: number;
}

interface Preferences {
  theme: 'system' | 'light' | 'dark';
  defaultMuted: boolean;
}

export function getName(): string | null {
  return localStorage.getItem(`${PREFIX}:name`);
}

export function setName(name: string): void {
  localStorage.setItem(`${PREFIX}:name`, name);
}

export function getPreferences(): Preferences {
  const stored = localStorage.getItem(`${PREFIX}:preferences`);
  if (!stored) {
    return { theme: 'system', defaultMuted: false };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { theme: 'system', defaultMuted: false };
  }
}

export function setPreferences(prefs: Preferences): void {
  localStorage.setItem(`${PREFIX}:preferences`, JSON.stringify(prefs));
}

export function getSession(roomCode: string): SessionData | null {
  const stored = localStorage.getItem(`${PREFIX}:session:${roomCode}`);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored) as SessionData;
    if (data.expiry && Date.now() > data.expiry) {
      clearSession(roomCode);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setSession(roomCode: string, data: SessionData): void {
  localStorage.setItem(`${PREFIX}:session:${roomCode}`, JSON.stringify(data));
}

export function clearSession(roomCode: string): void {
  localStorage.removeItem(`${PREFIX}:session:${roomCode}`);
}
