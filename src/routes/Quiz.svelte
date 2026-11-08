<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { Question, QuizConfig } from '../lib/types.ts';
  import { questionById } from '../lib/content-loader.ts';
  import { recordAnswer } from '../lib/user.svelte.ts';
  import { finishQuiz } from '../lib/session.svelte.ts';
  import { navigate } from '../lib/router.svelte.ts';
  import { formatDuration } from '../lib/scoring.ts';
  import QuestionCard from '../components/QuestionCard.svelte';
  import ExplanationBlock from '../components/ExplanationBlock.svelte';
  import ProgressBar from '../components/ProgressBar.svelte';

  let { config }: { config: QuizConfig } = $props();

  // Cấu hình cố định trong suốt phiên làm bài (component được tạo lại khi bắt đầu bài mới).
  // svelte-ignore state_referenced_locally
  const cfg = $state.snapshot(config) as QuizConfig;
  const questions: Question[] = cfg.questionIds
    .map((id) => questionById.get(id))
    .filter((q): q is Question => !!q);
  const examMode = cfg.examMode;
  const timeLimit = cfg.timeLimitSec;

  let index = $state(0);
  let answers = $state<(number | null)[]>(questions.map(() => null));
  let checked = $state<boolean[]>(questions.map(() => false));
  let finished = false;

  const startedAt = Date.now();
  let now = $state(Date.now());
  const timer = setInterval(() => (now = Date.now()), 250);
  onDestroy(() => clearInterval(timer));

  const elapsed = $derived(Math.floor((now - startedAt) / 1000));
  const remaining = $derived(timeLimit ? Math.max(0, timeLimit - elapsed) : null);

  const q = $derived(questions[index]);
  const isLast = $derived(index === questions.length - 1);
  const answeredCount = $derived(answers.filter((a) => a !== null).length);
  const checkedCount = $derived(checked.filter(Boolean).length);
  const correctSoFar = $derived(questions.filter((qq, i) => checked[i] && answers[i] === qq.answer).length);
  const progressValue = $derived(examMode ? answeredCount : checkedCount);

  $effect(() => {
    if (remaining === 0 && !finished) submit(true);
  });

  let cardEl: HTMLElement | undefined = $state();

  function select(i: number) {
    if (!examMode && checked[index]) return;
    answers[index] = i;
  }

  function check() {
    if (examMode || checked[index] || answers[index] === null) return;
    checked[index] = true;
    recordAnswer(q, answers[index]);
  }

  async function goTo(i: number) {
    if (i < 0 || i >= questions.length) return;
    index = i;
    await tick();
    window.scrollTo({ top: 0 });
  }

  function next() {
    if (isLast) {
      if (!examMode) submit(false);
      return;
    }
    goTo(index + 1);
  }

  function submit(timedOut: boolean) {
    if (finished) return;
    if (!timedOut && examMode) {
      const missing = questions.length - answeredCount;
      if (missing > 0 && !confirm(`Còn ${missing} câu chưa trả lời. Vẫn nộp bài?`)) return;
    }
    finished = true;
    let ids = cfg.questionIds.filter((id) => questionById.has(id));
    let ans = $state.snapshot(answers) as (number | null)[];
    if (!examMode) {
      // Luyện tập: chỉ tính các câu đã kiểm tra (trường hợp kết thúc sớm).
      const keep = checked.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
      ids = keep.map((i) => questions[i].id);
      ans = keep.map((i) => ans[i]);
      if (ids.length === 0) {
        navigate(cfg.topicId ? `/topic/${cfg.topicId}` : '/');
        return;
      }
    }
    finishQuiz({
      config: { ...cfg, questionIds: ids },
      answers: ans,
      durationSec: timeLimit ? Math.min(elapsed, timeLimit) : elapsed,
      timedOut,
      finishedAt: new Date().toISOString(),
    });
  }

  function quit() {
    if (examMode) {
      if (confirm('Thoát bài thi? Bài làm sẽ không được lưu.')) {
        finished = true;
        navigate(cfg.topicId ? `/topic/${cfg.topicId}` : '/');
      }
      return;
    }
    const left = questions.length - checkedCount;
    if (left === 0 || confirm(`Kết thúc sớm? ${left} câu chưa làm sẽ không được tính.`)) submit(false);
  }

  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    const k = e.key.toLowerCase();
    const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
    if (k in map && map[k] < q.options.length) {
      e.preventDefault();
      select(map[k]);
    } else if (k === 'enter') {
      e.preventDefault();
      if (examMode) next();
      else if (!checked[index]) check();
      else next();
    } else if (examMode && k === 'arrowright') {
      goTo(index + 1);
    } else if (examMode && k === 'arrowleft') {
      goTo(index - 1);
    }
  }
</script>

<svelte:window onkeydown={onKey} />

{#if questions.length === 0}
  <div class="card empty">Bài làm không có câu hỏi hợp lệ.</div>
{:else}
  <div class="quiz">
    <div class="sticky">
    <header class="qhead">
      <div class="title">
        <h1>{cfg.title}</h1>
        <span class="badge {examMode ? 'warning' : 'primary'}">{examMode ? 'Chế độ thi' : 'Luyện tập'}</span>
      </div>
      <div class="row toolbar">
        <span class="clock" class:low={remaining !== null && remaining <= 60} title={remaining !== null ? 'Thời gian còn lại' : 'Thời gian đã làm'}>
          ⏱ {remaining !== null ? formatDuration(remaining) : formatDuration(elapsed)}
        </span>
        {#if !examMode && checkedCount > 0}
          <span class="small muted">Đúng {correctSoFar}/{checkedCount}</span>
        {/if}
        <button class="btn small" type="button" onclick={quit}>{examMode ? 'Thoát' : 'Kết thúc'}</button>
        {#if !examMode}
          <span class="spacer"></span>
          {#if !checked[index]}
            <button class="btn primary" type="button" disabled={answers[index] === null} onclick={check}>
              Kiểm tra
            </button>
          {:else}
            <button class="btn primary" type="button" onclick={next}>
              {isLast ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </button>
          {/if}
        {/if}
      </div>
    </header>

    <div class="progress">
      <span class="small muted">Câu {index + 1}/{questions.length}</span>
      <ProgressBar value={progressValue} max={questions.length} label="Tiến độ bài làm" />
    </div>
    </div>

    {#if examMode}
      <div class="grid-nav" aria-label="Danh sách câu">
        {#each questions as _, i (i)}
          <button
            type="button"
            class="cell"
            class:done={answers[i] !== null}
            class:current={i === index}
            aria-label="Câu {i + 1}{answers[i] !== null ? ', đã trả lời' : ''}"
            onclick={() => goTo(i)}>{i + 1}</button
          >
        {/each}
      </div>
    {/if}

    <section class="card" bind:this={cardEl}>
      {#key index}
        <QuestionCard
          question={q}
          number={index + 1}
          selected={answers[index]}
          revealed={!examMode && checked[index]}
          showTopic={cfg.kind === 'exam' || cfg.kind === 'mistakes'}
          onselect={select}
        />
        {#if !examMode && checked[index]}
          <ExplanationBlock question={q} chosen={answers[index]} />
        {/if}
      {/key}

      {#if examMode}
        <div class="actions">
          <button class="btn" type="button" disabled={index === 0} onclick={() => goTo(index - 1)}>← Câu trước</button>
          <span class="spacer"></span>
          {#if !isLast}
            <button class="btn" type="button" onclick={next}>Câu tiếp →</button>
          {/if}
          <button class="btn primary" type="button" onclick={() => submit(false)}>
            Nộp bài ({answeredCount}/{questions.length})
          </button>
        </div>
      {/if}
    </section>
  </div>
{/if}

<style>
  .quiz {
    max-width: 780px;
    margin: 0 auto;
  }
  /* Tiêu đề, đồng hồ, nút hành động và thanh tiến độ luôn hiển thị khi cuộn. */
  .sticky {
    position: sticky;
    top: var(--topbar-h, 54px);
    z-index: 5;
    background: var(--bg);
    margin: -12px -16px 14px;
    padding: 12px 16px 10px;
    border-bottom: 1px solid var(--border);
  }
  .sticky .progress {
    margin-bottom: 0;
  }
  .qhead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .title {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .title h1 {
    font-size: 1.25rem;
    margin: 0;
  }
  .clock {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .clock.low {
    color: var(--danger);
  }
  .progress {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
  }
  .grid-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 14px;
  }
  .cell {
    width: 34px;
    height: 32px;
    font: inherit;
    font-size: 0.8rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
  }
  .cell.done {
    background: var(--primary-soft);
    color: var(--primary);
    border-color: var(--primary-soft);
    font-weight: 600;
  }
  .cell.current {
    border-color: var(--primary);
    outline: 1px solid var(--primary);
  }
  .actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  /* Thanh công cụ chiếm trọn chiều ngang để nút hành động luôn nằm sát bên phải. */
  .toolbar {
    flex: 1 1 100%;
  }
</style>
