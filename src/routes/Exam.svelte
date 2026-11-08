<script lang="ts">
  import { getQuestions, groupedTopics, topics } from '../lib/content-loader.ts';
  import { startQuiz } from '../lib/session.svelte.ts';
  import { buildMixedExam } from '../lib/quiz-builder.ts';

  let count = $state<30 | 50>(30);
  let minutes = $state(30);
  let selected = $state<string[]>(topics.filter((t) => getQuestions(t.id).length > 0).map((t) => t.id));

  // Mặc định 1 phút mỗi câu (30 phút cho 30 câu).
  function setCount(c: 30 | 50) {
    count = c;
    minutes = c;
  }

  const available = $derived(selected.reduce((n, id) => n + getQuestions(id).length, 0));
  const willTake = $derived(Math.min(count, available));
  const allSelected = $derived(selected.length === topics.length);

  function toggleAll() {
    selected = allSelected ? [] : topics.map((t) => t.id);
  }

  function start() {
    const picked = buildMixedExam(
      selected.map((id) => getQuestions(id)),
      count,
    );
    if (picked.length === 0) return;
    const m = Math.max(1, Math.min(300, Math.round(minutes || count)));
    startQuiz({
      kind: 'exam',
      title: `Thi thử tổng hợp — ${picked.length} câu`,
      questionIds: picked.map((q) => q.id),
      examMode: true,
      timeLimitSec: m * 60,
    });
  }
</script>

<div class="wrap">
  <h1>Thi thử tổng hợp</h1>
  <p class="muted">
    Câu hỏi được trộn ngẫu nhiên từ nhiều chủ đề. Không hiện đáp án cho tới khi nộp bài; hết giờ sẽ tự động nộp.
  </p>

  <section class="card">
    <div class="field">
      <span class="label">Số câu</span>
      <div class="choice-group">
        <label><input type="radio" name="count" checked={count === 30} onchange={() => setCount(30)} />30 câu</label>
        <label><input type="radio" name="count" checked={count === 50} onchange={() => setCount(50)} />50 câu</label>
      </div>
    </div>

    <div class="field">
      <label class="label" for="minutes">Thời gian (phút)</label>
      <input id="minutes" type="number" min="1" max="300" bind:value={minutes} />
    </div>

    <div class="field">
      <div class="row">
        <span class="label">Chủ đề ({selected.length}/{topics.length})</span>
        <span class="spacer"></span>
        <button class="btn small ghost" type="button" onclick={toggleAll}>
          {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      {#each groupedTopics() as g (g.group)}
        <div class="group">
          <div class="small muted gname">{g.group}</div>
          {#each g.topics as t (t.id)}
            <label class="check">
              <input type="checkbox" value={t.id} bind:group={selected} disabled={getQuestions(t.id).length === 0} />
              <span>{t.name} <span class="muted small">({getQuestions(t.id).length} câu)</span></span>
            </label>
          {/each}
        </div>
      {/each}
    </div>

    {#if available > 0 && available < count}
      <p class="badge warning note">
        Các chủ đề đã chọn chỉ có {available} câu, bài thi sẽ gồm {available} câu.
      </p>
    {/if}

    <button class="btn primary start" type="button" disabled={willTake === 0} onclick={start}>
      {willTake === 0 ? 'Hãy chọn ít nhất một chủ đề' : `Bắt đầu thi (${willTake} câu, ${minutes} phút)`}
    </button>
  </section>
</div>

<style>
  .wrap {
    max-width: 720px;
    margin: 0 auto;
  }
  #minutes {
    width: 120px;
  }
  .group {
    margin-top: 10px;
    display: grid;
    gap: 4px;
  }
  .gname {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .note {
    display: block;
    white-space: normal;
    padding: 8px 12px;
    border-radius: 8px;
    margin: 0 0 14px;
  }
  .start {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
  }
</style>
