// Phiên làm bài hiện tại và kết quả gần nhất.
import type { Question, QuizConfig, QuizResult } from './types.ts';
import { questionById } from './content-loader.ts';
import { scoreResult } from './scoring.ts';
import { addHistory, recordAnswers } from './user.svelte.ts';
import { navigate } from './router.svelte.ts';

const RESULT_KEY = 'gp:last-result';

function loadLastResult(): QuizResult | null {
  try {
    const t = sessionStorage.getItem(RESULT_KEY);
    return t ? (JSON.parse(t) as QuizResult) : null;
  } catch {
    return null;
  }
}

export const session = $state<{ current: QuizConfig | null; result: QuizResult | null; nonce: number }>({
  current: null,
  result: loadLastResult(),
  nonce: 0,
});

export function startQuiz(config: QuizConfig) {
  if (config.questionIds.length === 0) return;
  session.current = config;
  session.nonce++; // buộc tạo lại component làm bài
  navigate('/quiz');
}

/**
 * Kết thúc bài: ghi lịch sử, (ở chế độ thi) ghi nhận toàn bộ đáp án, rồi chuyển sang trang kết quả.
 * Ở chế độ luyện tập, đáp án đã được ghi nhận ngay khi bấm "Kiểm tra".
 */
export function finishQuiz(result: QuizResult) {
  const getQ = (id: string) => questionById.get(id);
  if (result.config.examMode) {
    // Câu bỏ trống vẫn tính sai trong điểm bài thi, nhưng không ghi vào thống kê/sổ lỗi sai
    // (tránh làm đầy sổ khi hết giờ).
    const items = result.config.questionIds
      .map((id, i) => ({ q: getQ(id), chosen: result.answers[i] }))
      .filter((x): x is { q: Question; chosen: number } => !!x.q && x.chosen !== null);
    recordAnswers(items);
  }
  const score = scoreResult(result, getQ);
  const topicIds = [...new Set(result.config.questionIds.map((id) => getQ(id)?.topic).filter(Boolean))] as string[];
  addHistory({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: result.finishedAt,
    kind: result.config.kind,
    title: result.config.title,
    topics: topicIds,
    total: score.total,
    correct: score.correct,
    durationSec: result.durationSec,
  });
  session.result = result;
  session.current = null;
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    /* không quan trọng */
  }
  navigate('/result');
}
