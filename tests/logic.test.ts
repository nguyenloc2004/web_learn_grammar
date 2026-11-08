// Kiểm thử logic thuần: chấm điểm, thống kê, gợi ý, chọn câu hỏi. Chạy: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Question, QuizResult, Topic, UserData } from '../src/lib/types.ts';
import { scoreResult, topicStats, weakestTopics, historyByDay, formatDuration } from '../src/lib/scoring.ts';
import { recommend } from '../src/lib/recommend.ts';
import { pickQuestions, buildMixedExam, shuffle } from '../src/lib/quiz-builder.ts';
import { normalize, emptyData } from '../src/lib/storage.ts';

const q = (id: string, topic: string, answer = 0, level: Question['level'] = 'basic'): Question => ({
  id,
  topic,
  level,
  type: 'choose',
  question: `${id} ___`,
  options: ['a', 'b', 'c', 'd'],
  answer,
  explanation: { correct: 'x', wrong: {}, rule: 'r', examples: ['e1', 'e2'] },
  tags: [],
  source: 'human',
  created_at: '2026-11-08',
});

const data = (patch: Partial<UserData> = {}): UserData => ({ ...emptyData(), ...patch });
const att = (correct: number, wrong: number, lastCorrect: boolean) => ({ correct, wrong, lastCorrect, lastAt: '2026-11-08T00:00:00Z' });

// Bộ sinh số giả ngẫu nhiên cố định để kết quả lặp lại được.
const seeded = (seed = 42) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('scoreResult đếm đúng, sai và bỏ trống', () => {
  const qs = [q('a', 't', 0), q('b', 't', 1), q('c', 't', 2)];
  const map = new Map(qs.map((x) => [x.id, x]));
  const result: QuizResult = {
    config: { kind: 'topic', title: 't', questionIds: ['a', 'b', 'c'], examMode: true },
    answers: [0, 3, null],
    durationSec: 10,
    timedOut: false,
    finishedAt: '2026-11-08T00:00:00Z',
  };
  const s = scoreResult(result, (id) => map.get(id));
  assert.equal(s.correct, 1);
  assert.equal(s.unanswered, 1);
  assert.deepEqual(s.wrongIds, ['b', 'c']);
});

test('topicStats xác định trạng thái chưa làm / đang làm / đã đạt', () => {
  const qs = [q('a', 't'), q('b', 't')];
  assert.equal(topicStats(qs, data()).status, 'new');
  assert.equal(topicStats(qs, data({ attempts: { a: att(1, 0, true) } })).status, 'learning');
  const passed = topicStats(qs, data({ attempts: { a: att(1, 1, true), b: att(1, 0, true) } }));
  assert.equal(passed.status, 'passed');
  assert.equal(passed.rate, 2 / 3);
});

test('weakestTopics chỉ lấy chủ đề đủ lượt và xếp từ thấp đến cao', () => {
  const mk = (id: string, attempts: number, rate: number) => ({
    id,
    stats: { total: 5, answered: 5, attempts, correctAttempts: 0, rate, lastCorrectCount: 0, status: 'learning' as const },
  });
  const res = weakestTopics([mk('x', 10, 0.6), mk('y', 2, 0.1), mk('z', 8, 0.3)]);
  assert.deepEqual(res.map((r) => r.id), ['z', 'x']);
});

test('historyByDay gộp theo ngày, mới nhất trước', () => {
  const h = (at: string, correct: number) => ({ id: at, at, kind: 'topic' as const, title: '', topics: [], total: 5, correct, durationSec: 60 });
  const days = historyByDay([h('2026-11-01T10:00:00', 3), h('2026-11-01T11:00:00', 4), h('2026-11-03T09:00:00', 5)]);
  assert.equal(days.length, 2);
  assert.equal(days[0].day, '2026-11-03');
  assert.equal(days[1].correct, 7);
  assert.equal(days[1].sessions, 2);
});

test('formatDuration', () => {
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3725), '1:02:05');
});

test('recommend: làm kém thì gợi ý chủ đề tiên quyết chưa đạt trước', () => {
  const topics: Topic[] = [
    { id: 'a', name: 'A', group: 'g', order: 1, prerequisites: [] },
    { id: 'b', name: 'B', group: 'g', order: 2, prerequisites: ['a'] },
  ];
  const stats = new Map([
    ['a', topicStats([q('a1', 'a')], data({ attempts: { a1: att(0, 1, false) } }))],
    ['b', topicStats([q('b1', 'b')], data({ attempts: { b1: att(0, 1, false) } }))],
  ]);
  const recs = recommend({ topics, stats, session: [{ topicId: 'b', rate: 0.2 }] });
  assert.deepEqual(recs.map((r) => r.topicId), ['a', 'b']);
});

test('recommend: làm tốt thì gợi ý chủ đề kế tiếp', () => {
  const topics: Topic[] = [
    { id: 'a', name: 'A', group: 'g', order: 1, prerequisites: [] },
    { id: 'b', name: 'B', group: 'g', order: 2, prerequisites: ['a'] },
  ];
  const stats = new Map([
    ['a', topicStats([q('a1', 'a')], data({ attempts: { a1: att(1, 0, true) } }))],
    ['b', topicStats([q('b1', 'b')], data())],
  ]);
  const recs = recommend({ topics, stats, session: [{ topicId: 'a', rate: 1 }] });
  assert.equal(recs[0].topicId, 'b');
  assert.ok(recs.length <= 3);
});

test('pickQuestions lọc theo mức độ, câu sai và số lượng', () => {
  const qs = [q('a', 't', 0, 'basic'), q('b', 't', 0, 'advanced'), q('c', 't', 0, 'basic'), q('d', 't', 0, 'basic')];
  const mistakes = {
    c: { topic: 't', addedAt: '', lastWrongAt: '', count: 1, mastered: false },
    d: { topic: 't', addedAt: '', lastWrongAt: '', count: 1, mastered: true },
  };
  const basic = pickQuestions(qs, { level: 'basic', count: 'all', order: 'file', onlyWrong: false }, mistakes);
  assert.deepEqual(basic.map((x) => x.id), ['a', 'c', 'd']);
  const wrong = pickQuestions(qs, { level: 'all', count: 'all', order: 'file', onlyWrong: true }, mistakes);
  assert.deepEqual(wrong.map((x) => x.id), ['c']);
  assert.equal(pickQuestions(qs, { level: 'all', count: 2, order: 'random', onlyWrong: false }, {}, seeded()).length, 2);
});

test('buildMixedExam phân bố đều các chủ đề và không trùng câu', () => {
  const pools = [
    Array.from({ length: 10 }, (_, i) => q(`x${i}`, 'x')),
    Array.from({ length: 10 }, (_, i) => q(`y${i}`, 'y')),
    Array.from({ length: 2 }, (_, i) => q(`z${i}`, 'z')),
  ];
  const exam = buildMixedExam(pools, 12, seeded());
  assert.equal(exam.length, 12);
  assert.equal(new Set(exam.map((e) => e.id)).size, 12);
  assert.equal(exam.filter((e) => e.topic === 'z').length, 2);
  assert.equal(buildMixedExam(pools, 100, seeded()).length, 22);
});

test('shuffle giữ nguyên phần tử', () => {
  const arr = [1, 2, 3, 4, 5];
  assert.deepEqual([...shuffle(arr, seeded())].sort(), arr);
});

test('normalize từ chối dữ liệu sai phiên bản và điền giá trị mặc định', () => {
  assert.throws(() => normalize({ version: 2 }));
  assert.throws(() => normalize('abc'));
  const d = normalize({ version: 1, settings: { theme: 'weird' } });
  assert.equal(d.settings.theme, 'system');
  assert.deepEqual(d.history, []);
});
