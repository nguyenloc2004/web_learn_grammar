// Kiểu dữ liệu dùng chung cho nội dung học và dữ liệu người dùng.

export const LEVELS = ['basic', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const QUESTION_TYPES = ['choose', 'fix-error', 'fill-form', 'rewrite', 'arrange'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Thứ tự nhóm lớn theo thiết kế; nhóm lạ được xếp cuối. */
export const GROUP_ORDER = [
  'Thì',
  'Động từ',
  'Danh từ/Mạo từ/Đại từ',
  'Tính từ/Trạng từ',
  'Câu và cấu trúc',
  'Từ loại khác',
];

export const LEVEL_LABELS: Record<Level, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export const TYPE_LABELS: Record<QuestionType, string> = {
  choose: 'Chọn đáp án đúng',
  'fix-error': 'Tìm lỗi sai',
  'fill-form': 'Chia dạng đúng của từ',
  rewrite: 'Chọn câu viết lại đúng nghĩa',
  arrange: 'Chọn cách sắp xếp đúng',
};

export interface Topic {
  id: string;
  name: string;
  group: string;
  order: number;
  prerequisites: string[];
}

export interface Explanation {
  correct: string;
  wrong: Record<string, string>;
  rule: string;
  examples: string[];
  common_mistake?: string;
}

export interface Question {
  id: string;
  topic: string;
  level: Level;
  type: QuestionType;
  question: string;
  options: string[];
  answer: number;
  explanation: Explanation;
  tags: string[];
  source: 'ai' | 'human';
  created_at: string;
}

// ---- Dữ liệu người dùng (localStorage) ----

export interface AttemptStat {
  correct: number;
  wrong: number;
  lastCorrect: boolean;
  lastAt: string; // ISO
}

export interface MistakeEntry {
  topic: string;
  addedAt: string; // ISO, lần sai đầu tiên
  lastWrongAt: string; // ISO
  count: number; // số lần sai
  mastered: boolean;
}

export type SessionKind = 'topic' | 'exam' | 'retry' | 'mistakes';

export interface HistoryEntry {
  id: string;
  at: string; // ISO thời điểm nộp bài
  kind: SessionKind;
  title: string;
  topics: string[];
  total: number;
  correct: number;
  durationSec: number;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface UserData {
  version: 1;
  attempts: Record<string, AttemptStat>;
  mistakes: Record<string, MistakeEntry>;
  history: HistoryEntry[];
  settings: { theme: ThemeSetting };
}

// ---- Phiên làm bài ----

export interface QuizConfig {
  kind: SessionKind;
  title: string;
  questionIds: string[];
  examMode: boolean; // không hiện đúng/sai cho tới khi nộp
  timeLimitSec?: number; // có thì đếm ngược, hết giờ tự nộp
  topicId?: string; // chủ đề gốc (nếu là bài theo chủ đề)
}

export interface QuizResult {
  config: QuizConfig;
  answers: (number | null)[]; // theo thứ tự config.questionIds
  durationSec: number;
  timedOut: boolean;
  finishedAt: string;
}
