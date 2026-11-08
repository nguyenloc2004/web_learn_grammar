// Đọc/ghi dữ liệu người dùng vào localStorage, xuất/nhập JSON để sao lưu.
import type { UserData } from './types.ts';

export const STORAGE_KEY = 'gp:data:v1';

export function emptyData(): UserData {
  return { version: 1, attempts: {}, mistakes: {}, history: [], settings: { theme: 'system' } };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Chuẩn hóa dữ liệu đọc từ localStorage hoặc file sao lưu; ném lỗi nếu không hợp lệ. */
export function normalize(raw: unknown): UserData {
  if (!isObj(raw)) throw new Error('Dữ liệu không phải đối tượng JSON.');
  if (raw.version !== 1) throw new Error('Phiên bản dữ liệu không được hỗ trợ (cần version = 1).');
  const theme = isObj(raw.settings) ? raw.settings.theme : undefined;
  return {
    version: 1,
    attempts: isObj(raw.attempts) ? (raw.attempts as UserData['attempts']) : {},
    mistakes: isObj(raw.mistakes) ? (raw.mistakes as UserData['mistakes']) : {},
    history: Array.isArray(raw.history) ? (raw.history as UserData['history']) : [],
    settings: { theme: theme === 'light' || theme === 'dark' ? theme : 'system' },
  };
}

export function loadData(): UserData {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? normalize(JSON.parse(text)) : emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: UserData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportFile(data: UserData): void {
  const payload = { ...data, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const a = document.createElement('a');
  a.href = url;
  a.download = `grammar-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importFile(file: File): Promise<UserData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('File không phải JSON hợp lệ.');
  }
  return normalize(parsed);
}
