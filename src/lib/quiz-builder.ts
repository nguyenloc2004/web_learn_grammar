// Chọn câu hỏi cho một bài làm theo tùy chọn của người dùng.
import type { Level, MistakeEntry, Question } from './types.ts';

export interface PracticeOptions {
  level: Level | 'all';
  count: number | 'all';
  order: 'random' | 'file';
  onlyWrong: boolean;
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isActiveMistake(m: MistakeEntry | undefined): boolean {
  return !!m && !m.mastered;
}

export function filterQuestions(
  questions: Question[],
  opts: Pick<PracticeOptions, 'level' | 'onlyWrong'>,
  mistakes: Record<string, MistakeEntry>,
): Question[] {
  return questions.filter(
    (q) => (opts.level === 'all' || q.level === opts.level) && (!opts.onlyWrong || isActiveMistake(mistakes[q.id])),
  );
}

export function pickQuestions(
  questions: Question[],
  opts: PracticeOptions,
  mistakes: Record<string, MistakeEntry>,
  rand: () => number = Math.random,
): Question[] {
  let list = filterQuestions(questions, opts, mistakes);
  if (opts.order === 'random') list = shuffle(list, rand);
  return opts.count === 'all' ? list : list.slice(0, opts.count);
}

/**
 * Trộn câu hỏi từ nhiều chủ đề cho bài thi thử: lấy luân phiên từng chủ đề
 * để phân bố đều, rồi xáo trộn toàn bộ.
 */
export function buildMixedExam(
  pools: Question[][],
  count: number,
  rand: () => number = Math.random,
): Question[] {
  const queues = pools.filter((p) => p.length > 0).map((p) => shuffle(p, rand));
  const picked: Question[] = [];
  let i = 0;
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    const q = queues[i % queues.length];
    const item = q.shift();
    if (item) picked.push(item);
    i++;
  }
  return shuffle(picked, rand);
}
