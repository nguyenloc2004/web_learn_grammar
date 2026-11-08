// Chấm điểm và tính thống kê. Module thuần (không phụ thuộc trình duyệt) để dễ kiểm thử.
import type { HistoryEntry, Question, QuizResult, UserData } from './types.ts';

/** Ngưỡng tỷ lệ đúng để coi một chủ đề là "đã đạt". */
export const PASS_RATE = 0.8;

export type TopicStatus = 'new' | 'learning' | 'passed';

export const STATUS_LABELS: Record<TopicStatus, string> = {
  new: 'Chưa làm',
  learning: 'Đang làm',
  passed: 'Đã đạt',
};

export interface TopicStats {
  total: number; // số câu hiện có
  answered: number; // số câu đã làm ít nhất một lần
  attempts: number; // tổng lượt trả lời
  correctAttempts: number;
  rate: number | null; // tỷ lệ đúng trên mọi lượt, null nếu chưa làm
  lastCorrectCount: number; // số câu mà lần gần nhất trả lời đúng
  status: TopicStatus;
}

export function topicStats(questions: Question[], data: UserData): TopicStats {
  let answered = 0;
  let attempts = 0;
  let correctAttempts = 0;
  let lastCorrectCount = 0;
  for (const q of questions) {
    const a = data.attempts[q.id];
    if (!a) continue;
    answered++;
    attempts += a.correct + a.wrong;
    correctAttempts += a.correct;
    if (a.lastCorrect) lastCorrectCount++;
  }
  const total = questions.length;
  const rate = attempts > 0 ? correctAttempts / attempts : null;
  let status: TopicStatus = 'new';
  if (answered > 0) {
    // Đạt: đã làm hết mọi câu và lần gần nhất đúng ít nhất 80% số câu.
    status = answered === total && lastCorrectCount / total >= PASS_RATE ? 'passed' : 'learning';
  }
  return { total, answered, attempts, correctAttempts, rate, lastCorrectCount, status };
}

export interface ScoredResult {
  total: number;
  correct: number;
  unanswered: number;
  rate: number;
  wrongIds: string[]; // gồm cả câu bỏ trống
}

export function scoreResult(
  result: QuizResult,
  getQuestion: (id: string) => Question | undefined,
): ScoredResult {
  const ids = result.config.questionIds;
  let correct = 0;
  let unanswered = 0;
  const wrongIds: string[] = [];
  ids.forEach((id, i) => {
    const q = getQuestion(id);
    const a = result.answers[i];
    if (a === null || a === undefined) unanswered++;
    if (q && a === q.answer) correct++;
    else wrongIds.push(id);
  });
  const total = ids.length;
  return { total, correct, unanswered, rate: total ? correct / total : 0, wrongIds };
}

/** Chủ đề yếu nhất: tỷ lệ đúng thấp, đã làm đủ nhiều lượt. */
export function weakestTopics<T extends { stats: TopicStats }>(items: T[], minAttempts = 5, limit = 5): T[] {
  return items
    .filter((t) => t.stats.rate !== null && t.stats.attempts >= minAttempts && t.stats.rate < 1)
    .sort((a, b) => a.stats.rate! - b.stats.rate! || b.stats.attempts - a.stats.attempts)
    .slice(0, limit);
}

export interface DayHistory {
  day: string; // YYYY-MM-DD theo giờ máy
  sessions: number;
  total: number;
  correct: number;
  durationSec: number;
}

export function localDay(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function historyByDay(history: HistoryEntry[]): DayHistory[] {
  const map = new Map<string, DayHistory>();
  for (const h of history) {
    const day = localDay(h.at);
    const cur = map.get(day) ?? { day, sessions: 0, total: 0, correct: 0, durationSec: 0 };
    cur.sessions++;
    cur.total += h.total;
    cur.correct += h.correct;
    cur.durationSec += h.durationSec;
    map.set(day, cur);
  }
  return [...map.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

export function formatDuration(sec: number): string {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function percent(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}
