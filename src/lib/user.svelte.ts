// Trạng thái dữ liệu người dùng (phản ứng), tự lưu vào localStorage sau mỗi thay đổi.
import type { HistoryEntry, Question, ThemeSetting, UserData } from './types.ts';
import { emptyData, loadData, saveData, STORAGE_KEY, normalize } from './storage.ts';

export const user = $state<{ data: UserData; saveFailed: boolean }>({
  data: loadData(),
  saveFailed: false,
});

function persist() {
  user.saveFailed = !saveData($state.snapshot(user.data) as UserData);
}

// Đồng bộ khi mở nhiều tab cùng lúc.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      user.data = e.newValue ? normalize(JSON.parse(e.newValue)) : emptyData();
    } catch {
      /* bỏ qua dữ liệu hỏng từ tab khác */
    }
  });
}

/** Ghi nhận một lượt trả lời. `chosen = null` nghĩa là bỏ trống (tính là sai). */
export function recordAnswer(q: Question, chosen: number | null) {
  const now = new Date().toISOString();
  const ok = chosen === q.answer;
  const a = user.data.attempts[q.id] ?? { correct: 0, wrong: 0, lastCorrect: false, lastAt: now };
  if (ok) a.correct++;
  else a.wrong++;
  a.lastCorrect = ok;
  a.lastAt = now;
  user.data.attempts[q.id] = a;

  if (!ok) {
    const m = user.data.mistakes[q.id];
    if (m) {
      m.count++;
      m.lastWrongAt = now;
      m.mastered = false; // sai lại thì đưa về sổ
    } else {
      user.data.mistakes[q.id] = { topic: q.topic, addedAt: now, lastWrongAt: now, count: 1, mastered: false };
    }
  }
  persist();
}

export function recordAnswers(items: { q: Question; chosen: number | null }[]) {
  for (const { q, chosen } of items) recordAnswer(q, chosen);
}

export function addHistory(entry: HistoryEntry) {
  user.data.history.push(entry);
  persist();
}

export function setMastered(questionId: string, mastered: boolean) {
  const m = user.data.mistakes[questionId];
  if (!m) return;
  m.mastered = mastered;
  persist();
}

export function removeMistake(questionId: string) {
  delete user.data.mistakes[questionId];
  persist();
}

export function setTheme(theme: ThemeSetting) {
  user.data.settings.theme = theme;
  persist();
}

export function replaceData(data: UserData) {
  user.data = data;
  persist();
}

export function resetProgress() {
  user.data = { ...emptyData(), settings: { ...user.data.settings } };
  persist();
}
