// Gợi ý chủ đề học tiếp dựa trên kết quả và chủ đề tiên quyết.
import type { Topic } from './types.ts';
import { PASS_RATE, type TopicStats } from './scoring.ts';

export interface Recommendation {
  topicId: string;
  reason: string;
}

export interface RecommendInput {
  topics: Topic[];
  stats: Map<string, TopicStats>;
  /** Các chủ đề vừa làm, kèm tỷ lệ đúng trong bài vừa làm. */
  session: { topicId: string; rate: number }[];
  limit?: number;
}

export function recommend({ topics, stats, session, limit = 3 }: RecommendInput): Recommendation[] {
  const out: Recommendation[] = [];
  const seen = new Set<string>();
  const byId = new Map(topics.map((t) => [t.id, t]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const push = (topicId: string, reason: string) => {
    if (seen.has(topicId) || out.length >= limit || !byId.has(topicId)) return;
    seen.add(topicId);
    out.push({ topicId, reason });
  };
  const statusOf = (id: string) => stats.get(id)?.status ?? 'new';
  const rateOf = (id: string) => stats.get(id)?.rate ?? null;

  const weakInSession = session.filter((s) => s.rate < PASS_RATE).sort((a, b) => a.rate - b.rate);
  const strongInSession = session.filter((s) => s.rate >= PASS_RATE);

  // 1. Chủ đề vừa làm chưa tốt: ôn kiến thức tiên quyết còn yếu, rồi làm lại chính chủ đề đó.
  for (const s of weakInSession) {
    for (const pre of byId.get(s.topicId)?.prerequisites ?? []) {
      if (statusOf(pre) !== 'passed') {
        push(pre, `Kiến thức nền của «${nameOf(s.topicId)}» mà bạn chưa đạt.`);
      }
    }
    push(s.topicId, `Bài vừa làm đúng ${Math.round(s.rate * 100)}%, nên đọc lại lý thuyết và làm lại.`);
  }

  // 2. Chủ đề vừa làm tốt: mở các chủ đề nhận nó làm tiên quyết.
  for (const s of strongInSession) {
    for (const t of topics) {
      if (!t.prerequisites.includes(s.topicId) || statusOf(t.id) === 'passed') continue;
      const ready = t.prerequisites.every((p) => p === s.topicId || statusOf(p) !== 'new');
      if (ready) push(t.id, `Bước tiếp theo sau «${nameOf(s.topicId)}».`);
    }
  }

  // 3. Bù bằng các chủ đề yếu nhất đã từng làm.
  const weak = topics
    .filter((t) => {
      const r = rateOf(t.id);
      return r !== null && r < PASS_RATE;
    })
    .sort((a, b) => rateOf(a.id)! - rateOf(b.id)!);
  for (const t of weak) push(t.id, `Tỷ lệ đúng tổng thể mới ${Math.round(rateOf(t.id)! * 100)}%.`);

  // 4. Cuối cùng: chủ đề chưa làm mà đã có đủ kiến thức nền.
  for (const t of topics) {
    if (statusOf(t.id) !== 'new') continue;
    if (t.prerequisites.every((p) => statusOf(p) !== 'new')) {
      push(t.id, 'Chủ đề mới, bạn đã học phần kiến thức nền.');
    }
  }

  return out;
}
