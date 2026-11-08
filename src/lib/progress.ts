// Ghép nội dung học với dữ liệu người dùng để tính tiến độ từng chủ đề.
import type { UserData } from './types.ts';
import { getQuestions, topics } from './content-loader.ts';
import { topicStats, type TopicStats } from './scoring.ts';

export function statsMap(data: UserData): Map<string, TopicStats> {
  return new Map(topics.map((t) => [t.id, topicStats(getQuestions(t.id), data)]));
}

export function activeMistakeCount(data: UserData, topicId?: string): number {
  return Object.values(data.mistakes).filter((m) => !m.mastered && (!topicId || m.topic === topicId)).length;
}
