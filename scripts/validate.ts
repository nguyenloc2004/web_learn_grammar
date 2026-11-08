// Kiểm tra dữ liệu trong content/. Chạy: npm run validate
// Thoát với mã 1 nếu có lỗi. Cảnh báo không làm script thất bại.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS, QUESTION_TYPES } from '../src/lib/types.ts';
import { buildStats, sameStats, STATS_FILE, type StatsFile } from './stats-lib.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = join(ROOT, 'content');
const TOPICS_DIR = join(CONTENT, 'topics');
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const errors: string[] = [];
const warnings: string[] = [];
const rel = (p: string) => relative(ROOT, p).replaceAll('\\', '/');
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(rel(path), `không đọc được JSON (${(e as Error).message})`);
    return undefined;
  }
}

/** Chuẩn hóa nội dung câu hỏi để phát hiện trùng lặp. */
export function normalizeText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([A-D]\)/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, ' ')
    .trim();
}

// ---------- topics.json ----------
const topicsPath = join(CONTENT, 'topics.json');
const topicsRaw = existsSync(topicsPath) ? readJson(topicsPath) : (err('content/topics.json', 'không tồn tại'), undefined);
const topicIds = new Set<string>();
const topicList: { id: string; prerequisites: string[] }[] = [];

if (topicsRaw !== undefined && !Array.isArray(topicsRaw)) err('content/topics.json', 'phải là một mảng');
if (Array.isArray(topicsRaw)) {
  topicsRaw.forEach((t, i) => {
    const where = `content/topics.json[${i}]`;
    if (!isObj(t)) return err(where, 'phải là đối tượng');
    const id = t.id;
    if (!isStr(id) || !ID_RE.test(id)) return err(where, `"id" không hợp lệ (chữ thường, nối bằng "-"): ${JSON.stringify(id)}`);
    const w = `content/topics.json (${id})`;
    if (topicIds.has(id)) err(w, 'id chủ đề bị trùng');
    topicIds.add(id);
    if (!isStr(t.name)) err(w, 'thiếu "name"');
    if (!isStr(t.group)) err(w, 'thiếu "group"');
    if (typeof t.order !== 'number') err(w, '"order" phải là số');
    if (!Array.isArray(t.prerequisites) || !t.prerequisites.every((p) => typeof p === 'string')) {
      err(w, '"prerequisites" phải là mảng id');
    }
    const prerequisites = Array.isArray(t.prerequisites) ? (t.prerequisites as string[]) : [];
    if (prerequisites.includes(id)) err(w, 'chủ đề không thể là tiên quyết của chính nó');
    topicList.push({ id, prerequisites });

    const dir = join(TOPICS_DIR, id);
    if (!existsSync(dir)) err(w, `thiếu thư mục ${rel(dir)}`);
    else {
      if (!existsSync(join(dir, 'topic.md'))) err(w, `thiếu ${rel(join(dir, 'topic.md'))}`);
      if (!existsSync(join(dir, 'questions.json'))) err(w, `thiếu ${rel(join(dir, 'questions.json'))}`);
    }
  });

  for (const t of topicList) {
    for (const p of t.prerequisites) {
      if (!topicIds.has(p)) err(`content/topics.json (${t.id})`, `chủ đề tiên quyết "${p}" không tồn tại`);
    }
  }

  // Phát hiện vòng lặp tiên quyết.
  const byId = new Map(topicList.map((t) => [t.id, t]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      err('content/topics.json', `vòng lặp tiên quyết: ${[...path, id].join(' → ')}`);
      return;
    }
    state.set(id, 1);
    for (const p of byId.get(id)?.prerequisites ?? []) if (byId.has(p)) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const t of topicList) visit(t.id, []);
}

if (existsSync(TOPICS_DIR)) {
  for (const name of readdirSync(TOPICS_DIR)) {
    if (statSync(join(TOPICS_DIR, name)).isDirectory() && !topicIds.has(name)) {
      warn(`content/topics/${name}`, 'thư mục chưa được khai báo trong topics.json (sẽ không hiển thị)');
    }
  }
}

// ---------- questions.json ----------
const seenIds = new Map<string, string>();
const seenText = new Map<string, string>();
let totalQuestions = 0;
const summary: string[] = [];

for (const topicId of topicIds) {
  const path = join(TOPICS_DIR, topicId, 'questions.json');
  if (!existsSync(path)) continue;
  const data = readJson(path);
  if (data === undefined) continue;
  const file = rel(path);
  if (!Array.isArray(data)) {
    err(file, 'phải là một mảng câu hỏi');
    continue;
  }
  const levelCount: Record<string, number> = {};
  const answerCount = [0, 0, 0, 0];

  data.forEach((q, i) => {
    const qid = isObj(q) && typeof q.id === 'string' ? q.id : `#${i}`;
    const where = `${file} [${qid}]`;
    const e = (msg: string) => err(where, msg);
    if (!isObj(q)) return e('câu hỏi phải là đối tượng');
    totalQuestions++;

    // id
    if (!isStr(q.id)) e('thiếu "id"');
    else {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id)) e(`"id" chỉ gồm chữ thường, số và "-": ${q.id}`);
      const prev = seenIds.get(q.id);
      if (prev) e(`"id" bị trùng (đã có trong ${prev})`);
      else seenIds.set(q.id, file);
    }

    // topic
    if (q.topic !== topicId) e(`"topic" là ${JSON.stringify(q.topic)} nhưng câu nằm trong thư mục "${topicId}"`);

    // level, type
    if (!(LEVELS as readonly unknown[]).includes(q.level)) e(`"level" không hợp lệ: ${JSON.stringify(q.level)} (cho phép: ${LEVELS.join(', ')})`);
    else levelCount[q.level as string] = (levelCount[q.level as string] ?? 0) + 1;
    if (!(QUESTION_TYPES as readonly unknown[]).includes(q.type)) {
      e(`"type" không hợp lệ: ${JSON.stringify(q.type)} (cho phép: ${QUESTION_TYPES.join(', ')})`);
    }

    // question
    if (!isStr(q.question)) e('thiếu "question"');
    else {
      const norm = normalizeText(q.question);
      const prev = seenText.get(norm);
      if (prev) e(`nội dung câu hỏi trùng với ${prev}`);
      else seenText.set(norm, `${file} [${qid}]`);
      if (q.type !== 'fix-error' && !q.question.includes('___') && q.type !== 'rewrite' && q.type !== 'arrange') {
        warn(where, 'câu hỏi không có chỗ trống "___"');
      }
    }

    // options
    if (!Array.isArray(q.options) || q.options.length !== 4) e('"options" phải có đúng 4 phần tử');
    else {
      if (!q.options.every(isStr)) e('mọi lựa chọn phải là chuỗi khác rỗng');
      const normOpts = q.options.map((o) => (typeof o === 'string' ? o.trim().toLowerCase() : o));
      if (new Set(normOpts).size !== 4) e('có lựa chọn bị trùng nhau');
      const banned = /(tất cả đều đúng|không đáp án nào|all of the above|none of the above)/i;
      if (q.options.some((o) => typeof o === 'string' && banned.test(o))) e('không dùng lựa chọn kiểu "tất cả đều đúng"/"không đáp án nào đúng"');
    }

    // answer
    if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) > 3) e('"answer" phải là số nguyên 0–3');
    else answerCount[q.answer as number]++;

    // explanation
    const ex = q.explanation;
    if (!isObj(ex)) e('thiếu "explanation"');
    else {
      if (!isStr(ex.correct)) e('explanation.correct trống');
      if (!isStr(ex.rule)) e('explanation.rule trống');
      if (!Array.isArray(ex.examples) || ex.examples.length < 2 || ex.examples.length > 3 || !ex.examples.every(isStr)) {
        e('explanation.examples phải có 2–3 câu');
      }
      if (ex.common_mistake !== undefined && typeof ex.common_mistake !== 'string') e('explanation.common_mistake phải là chuỗi');
      if (!isObj(ex.wrong)) e('thiếu explanation.wrong');
      else if (Number.isInteger(q.answer) && (q.answer as number) >= 0 && (q.answer as number) <= 3) {
        const expected = [0, 1, 2, 3].filter((n) => n !== q.answer).map(String);
        const keys = Object.keys(ex.wrong).sort();
        if (keys.join(',') !== expected.join(',')) {
          e(`explanation.wrong phải có đúng các khóa ${expected.join(', ')} (hiện có: ${keys.join(', ') || 'không có'})`);
        }
        for (const k of keys) if (!isStr(ex.wrong[k])) e(`explanation.wrong["${k}"] trống`);
      }
    }

    // metadata
    if (!Array.isArray(q.tags) || !q.tags.every((t) => typeof t === 'string')) e('"tags" phải là mảng chuỗi');
    if (q.source !== 'ai' && q.source !== 'human') e('"source" phải là "ai" hoặc "human"');
    if (typeof q.created_at !== 'string' || !DATE_RE.test(q.created_at)) e('"created_at" phải có dạng YYYY-MM-DD');
  });

  // Cảnh báo phân bố đáp án lệch (từ 8 câu trở lên).
  if (data.length >= 8) {
    const max = Math.max(...answerCount);
    if (max > data.length * 0.4) {
      warn(file, `vị trí đáp án đúng chưa đều (A/B/C/D = ${answerCount.join('/')})`);
    }
  }
  const lv = LEVELS.map((l) => `${l}=${levelCount[l] ?? 0}`).join(' ');
  summary.push(`  ${topicId.padEnd(28)} ${String(data.length).padStart(4)} câu   ${lv}   đáp án A/B/C/D=${answerCount.join('/')}`);
}

// ---------- question-stats.json ----------
const statsPath = join(ROOT, STATS_FILE);
if (!existsSync(statsPath)) {
  warn(STATS_FILE, 'chưa có file thống kê, chạy `npm run stats` để tạo');
} else {
  const current = readJson(statsPath) as Partial<StatsFile> | undefined;
  if (current) {
    const fresh = buildStats(ROOT);
    if (!sameStats(current, fresh)) warn(STATS_FILE, 'số liệu chưa cập nhật, chạy `npm run stats`');
    const known = new Set(fresh.topics.map((t) => t.id));
    for (const t of fresh.topics) {
      if (!ID_RE.test(t.id)) err(`${STATS_FILE} (${t.id})`, 'id không hợp lệ');
      for (const p of t.prerequisites) {
        if (!known.has(p)) err(`${STATS_FILE} (${t.id})`, `chủ đề tiên quyết "${p}" không có trong lộ trình`);
      }
    }
  }
}

// ---------- Báo cáo ----------
console.log(`Chủ đề: ${topicIds.size}   Câu hỏi: ${totalQuestions}`);
for (const line of summary) console.log(line);

if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} cảnh báo:`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} lỗi:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n✓ Dữ liệu hợp lệ.');
