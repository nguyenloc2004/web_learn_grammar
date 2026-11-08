// Tính thống kê câu hỏi theo chủ đề, mức độ, dạng câu. Dùng chung cho `stats.ts` và `validate.ts`.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUP_ORDER, LEVELS, QUESTION_TYPES } from '../src/lib/types.ts';

export const STATS_FILE = 'question-stats.json';

type Counts<K extends string> = Record<K, number>;
type LevelCounts = Counts<(typeof LEVELS)[number]>;
type TypeCounts = Counts<(typeof QUESTION_TYPES)[number]>;

export interface StatsTopic {
  id: string;
  name: string;
  group: string;
  order: number;
  prerequisites: string[];
  /** created: đã có trong content/topics.json; planned: mới nằm trong lộ trình. */
  status: 'created' | 'planned';
  total: number;
  by_level: LevelCounts;
  by_type: TypeCounts;
}

export interface StatsFile {
  _readme: string;
  updated_at: string;
  summary: {
    topics_total: number;
    topics_created: number;
    topics_planned: number;
    questions: number;
    by_level: LevelCounts;
    by_type: TypeCounts;
  };
  topics: StatsTopic[];
}

const README =
  'File tự sinh bởi `npm run stats`, không sửa số liệu bằng tay. ' +
  'Danh sách "topics" là lộ trình ngữ pháp đầy đủ: status "created" là chủ đề đã có trong content/, ' +
  '"planned" là chủ đề chưa tạo (agent có thể thêm/sửa mục planned: id, name, group, order, prerequisites). ' +
  'Khi tạo chủ đề mới, lấy đúng id/name/group/order/prerequisites từ đây sang content/topics.json.';

const zeroLevels = (): LevelCounts => Object.fromEntries(LEVELS.map((l) => [l, 0])) as LevelCounts;
const zeroTypes = (): TypeCounts => Object.fromEntries(QUESTION_TYPES.map((t) => [t, 0])) as TypeCounts;

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Meta =Pick<StatsTopic, 'id' | 'name' | 'group' | 'order' | 'prerequisites'>;

/** Gộp lộ trình trong question-stats.json hiện có với nội dung thật trong content/. */
export function buildStats(root: string, today = localToday()): StatsFile {
  const created = readJson<Meta[]>(join(root, 'content', 'topics.json'), []);
  const previous = readJson<Partial<StatsFile>>(join(root, STATS_FILE), {});
  const planned = Array.isArray(previous.topics) ? previous.topics : [];

  const byId = new Map<string, StatsTopic>();
  for (const p of planned) {
    if (!p || typeof p.id !== 'string') continue;
    byId.set(p.id, {
      id: p.id,
      name: p.name ?? p.id,
      group: p.group ?? '',
      order: typeof p.order === 'number' ? p.order : 9999,
      prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites : [],
      status: 'planned',
      total: 0,
      by_level: zeroLevels(),
      by_type: zeroTypes(),
    });
  }

  for (const t of created) {
    const entry: StatsTopic = {
      id: t.id,
      name: t.name,
      group: t.group,
      order: t.order,
      prerequisites: t.prerequisites ?? [],
      status: 'created',
      total: 0,
      by_level: zeroLevels(),
      by_type: zeroTypes(),
    };
    const qPath = join(root, 'content', 'topics', t.id, 'questions.json');
    const questions = existsSync(qPath) ? readJson<{ level?: string; type?: string }[]>(qPath, []) : [];
    for (const q of Array.isArray(questions) ? questions : []) {
      entry.total++;
      if (q.level && q.level in entry.by_level) entry.by_level[q.level as keyof LevelCounts]++;
      if (q.type && q.type in entry.by_type) entry.by_type[q.type as keyof TypeCounts]++;
    }
    byId.set(t.id, entry);
  }

  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  const topics = [...byId.values()].sort(
    (a, b) => rank(a.group) - rank(b.group) || a.order - b.order || a.id.localeCompare(b.id),
  );

  const summary: StatsFile['summary'] = {
    topics_total: topics.length,
    topics_created: topics.filter((t) => t.status === 'created').length,
    topics_planned: topics.filter((t) => t.status === 'planned').length,
    questions: 0,
    by_level: zeroLevels(),
    by_type: zeroTypes(),
  };
  for (const t of topics) {
    summary.questions += t.total;
    for (const l of LEVELS) summary.by_level[l] += t.by_level[l];
    for (const ty of QUESTION_TYPES) summary.by_type[ty] += t.by_type[ty];
  }

  return { _readme: README, updated_at: today, summary, topics };
}

/** So sánh bỏ qua ngày cập nhật. */
export function sameStats(a: Partial<StatsFile>, b: StatsFile): boolean {
  return JSON.stringify(a.summary) === JSON.stringify(b.summary) && JSON.stringify(a.topics) === JSON.stringify(b.topics);
}
