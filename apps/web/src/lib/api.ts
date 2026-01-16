const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface CreateRoomResponse {
  roomCode: string;
}

interface ApiError {
  error: string;
}

export async function createRoom(): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error || 'Failed to create room');
  }

  return response.json();
}

export function getWebSocketUrl(roomCode: string): string {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return `${wsBase}/rooms/${roomCode}`;
}
