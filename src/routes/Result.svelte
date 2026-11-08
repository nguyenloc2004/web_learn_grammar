<script lang="ts">
  import type { Question } from '../lib/types.ts';
  import { questionById, topicById, topics } from '../lib/content-loader.ts';
  import { session, startQuiz } from '../lib/session.svelte.ts';
  import { user } from '../lib/user.svelte.ts';
  import { href } from '../lib/router.svelte.ts';
  import { formatDuration, percent, scoreResult, PASS_RATE } from '../lib/scoring.ts';
  import { statsMap } from '../lib/progress.ts';
  import { recommend } from '../lib/recommend.ts';
  import { shuffle } from '../lib/quiz-builder.ts';
  import QuestionReview from '../components/QuestionReview.svelte';

  const result = session.result;
  const score = result ? scoreResult(result, (id) => questionById.get(id)) : null;

  const rows = result
    ? result.config.questionIds
        .map((id, i) => ({ q: questionById.get(id), chosen: result.answers[i], n: i + 1 }))
        .filter((r): r is { q: Question; chosen: number | null; n: number } => !!r.q)
    : [];
  const wrongRows = rows.filter((r) => r.chosen !== r.q.answer);

  // Tỷ lệ đúng theo từng chủ đề trong bài vừa làm.
  const perTopic = (() => {
    const m = new Map<string, { total: number; correct: number }>();
    for (const r of rows) {
      const cur = m.get(r.q.topic) ?? { total: 0, correct: 0 };
      cur.total++;
      if (r.chosen === r.q.answer) cur.correct++;
      m.set(r.q.topic, cur);
    }
    return [...m.entries()].map(([topicId, v]) => ({ topicId, ...v, rate: v.correct / v.total }));
  })();

  const recs = $derived(
    recommend({
      topics,
      stats: statsMap(user.data),
      session: perTopic.map((p) => ({ topicId: p.topicId, rate: p.rate })),
    }),
  );

  let showAll = $state(false);

  function retryWrong() {
    if (!result || wrongRows.length === 0) return;
    startQuiz({
      kind: 'retry',
      title: `Làm lại câu sai — ${result.config.title}`,
      questionIds: wrongRows.map((r) => r.q.id),
      examMode: false,
      topicId: result.config.topicId,
    });
  }

  function retryAll() {
    if (!result) return;
    const ids = result.config.questionIds;
    startQuiz({ ...result.config, questionIds: result.config.kind === 'exam' ? shuffle(ids) : ids });
  }

  const tone = score ? (score.rate >= PASS_RATE ? 'success' : score.rate >= 0.5 ? 'warning' : 'danger') : '';
  const message = score
    ? score.rate === 1
      ? 'Tuyệt đối! Bạn trả lời đúng tất cả.'
      : score.rate >= PASS_RATE
        ? 'Rất tốt! Bạn đã nắm vững phần này.'
        : score.rate >= 0.5
          ? 'Khá ổn, hãy xem lại các câu sai bên dưới.'
          : 'Cần ôn thêm. Đọc lại lý thuyết rồi làm lại các câu sai nhé.'
    : '';
</script>

{#if !result || !score}
  <div class="card empty">
    <p>Chưa có kết quả bài làm nào.</p>
    <a class="btn primary" href={href('/')}>Chọn chủ đề</a>
  </div>
{:else}
  <div class="wrap">
    <section class="card summary">
      <div class="score {tone}">
        <div class="big">{score.correct}/{score.total}</div>
        <div class="pct">{percent(score.rate)}</div>
      </div>
      <div class="info">
        <h1>{result.config.title}</h1>
        <p class="msg">{message}</p>
        <div class="row small muted">
          <span>⏱ {formatDuration(result.durationSec)}</span>
          <span>Sai {score.total - score.correct - score.unanswered}</span>
          {#if score.unanswered > 0}<span>Bỏ trống {score.unanswered}</span>{/if}
          {#if result.timedOut}<span class="badge danger">Hết giờ — tự động nộp</span>{/if}
        </div>
        <div class="row btns">
          <button class="btn primary" type="button" disabled={wrongRows.length === 0} onclick={retryWrong}>
            Làm lại các câu sai ({wrongRows.length})
          </button>
          <button class="btn" type="button" onclick={retryAll}>Làm lại toàn bộ</button>
          {#if result.config.topicId}
            <a class="btn ghost" href={href(`/topic/${result.config.topicId}`)}>Về chủ đề</a>
          {:else}
            <a class="btn ghost" href={href('/')}>Về danh mục</a>
          {/if}
        </div>
      </div>
    </section>

    {#if perTopic.length > 1}
      <section class="card">
        <h2>Theo chủ đề</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Chủ đề</th><th>Đúng</th><th>Tỷ lệ</th></tr></thead>
            <tbody>
              {#each [...perTopic].sort((a, b) => a.rate - b.rate) as p (p.topicId)}
                <tr>
                  <td><a href={href(`/topic/${p.topicId}`)}>{topicById.get(p.topicId)?.name ?? p.topicId}</a></td>
                  <td>{p.correct}/{p.total}</td>
                  <td>{percent(p.rate)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    {#if recs.length > 0}
      <section class="card">
        <h2>Gợi ý học tiếp</h2>
        <ul class="recs">
          {#each recs as r (r.topicId)}
            <li>
              <a href={href(`/topic/${r.topicId}`)}><strong>{topicById.get(r.topicId)?.name}</strong></a>
              <span class="muted small">{r.reason}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section>
      <div class="row list-head">
        <h2>{showAll ? 'Tất cả câu hỏi' : `Câu sai (${wrongRows.length})`}</h2>
        <span class="spacer"></span>
        <label class="check small"><input type="checkbox" bind:checked={showAll} /> Hiện cả câu đúng</label>
      </div>
      {#if !showAll && wrongRows.length === 0}
        <div class="card empty">Không có câu sai nào. 🎉</div>
      {/if}
      <div class="list">
        {#each showAll ? rows : wrongRows as r (r.q.id)}
          <QuestionReview question={r.q} chosen={r.chosen} number={r.n}>
            {#snippet actions()}
              {#if r.chosen === r.q.answer}
                <span class="badge success">Đúng</span>
              {:else if r.chosen === null}
                <span class="badge">Bỏ trống</span>
              {:else}
                <span class="badge danger">Sai</span>
              {/if}
            {/snippet}
          </QuestionReview>
        {/each}
      </div>
    </section>
  </div>
{/if}

<style>
  .wrap {
    max-width: 860px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  .summary {
    display: flex;
    gap: 24px;
    align-items: center;
    flex-wrap: wrap;
  }
  .score {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    display: grid;
    place-content: center;
    text-align: center;
    background: var(--surface-2);
    border: 6px solid var(--border);
    flex: none;
  }
  .score.success {
    border-color: var(--success);
    color: var(--success);
  }
  .score.warning {
    border-color: var(--warning);
    color: var(--warning);
  }
  .score.danger {
    border-color: var(--danger);
    color: var(--danger);
  }
  .big {
    font-size: 1.9rem;
    font-weight: 800;
    line-height: 1.1;
  }
  .pct {
    font-weight: 600;
  }
  .info {
    flex: 1;
    min-width: 240px;
  }
  .info h1 {
    font-size: 1.3rem;
    margin-bottom: 4px;
  }
  .msg {
    margin: 0 0 8px;
  }
  .btns {
    margin-top: 14px;
  }
  .recs {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .recs li {
    display: flex;
    flex-direction: column;
  }
  .list-head h2 {
    margin: 0;
  }
  .list-head {
    margin-bottom: 10px;
  }
  .list {
    display: grid;
    gap: 8px;
  }
</style>
