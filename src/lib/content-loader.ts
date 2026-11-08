// Đọc nội dung học từ thư mục content/ (đóng gói lúc build, chạy offline).
import { GROUP_ORDER, type Question, type Topic } from './types.ts';
import topicsRaw from '../../content/topics.json';

const questionModules = import.meta.glob<Question[]>('../../content/topics/*/questions.json', {
  eager: true,
  import: 'default',
});

const theoryModules = import.meta.glob<string>('../../content/topics/*/topic.md', {
  query: '?raw',
  import: 'default',
});

const folderOf = (path: string) => path.split('/').slice(-2)[0];

export const topics: Topic[] = [...(topicsRaw as Topic[])].sort((a, b) => a.order - b.order);

export const topicById = new Map(topics.map((t) => [t.id, t]));

export { GROUP_ORDER } from './types.ts';

export const questionsByTopic = new Map<string, Question[]>();
export const questionById = new Map<string, Question>();

for (const [path, list] of Object.entries(questionModules)) {
  const topicId = folderOf(path);
  if (!topicById.has(topicId)) continue;
  questionsByTopic.set(topicId, list);
  for (const q of list) questionById.set(q.id, q);
}

export function getQuestions(topicId: string): Question[] {
  return questionsByTopic.get(topicId) ?? [];
}

export function allQuestions(): Question[] {
  return topics.flatMap((t) => getQuestions(t.id));
}

export async function loadTheory(topicId: string): Promise<string> {
  const entry = Object.entries(theoryModules).find(([p]) => folderOf(p) === topicId);
  if (!entry) return '_Chủ đề này chưa có phần lý thuyết._';
  return entry[1]();
}

export function groupedTopics(): { group: string; topics: Topic[] }[] {
  const map = new Map<string, Topic[]>();
  for (const t of topics) {
    if (!map.has(t.group)) map.set(t.group, []);
    map.get(t.group)!.push(t);
  }
  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([group, topics]) => ({ group, topics }));
}
