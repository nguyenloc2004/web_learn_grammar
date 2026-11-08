<script lang="ts">
  import { getQuestions, loadTheory, topicById } from '../lib/content-loader.ts';
  import { user } from '../lib/user.svelte.ts';
  import { startQuiz } from '../lib/session.svelte.ts';
  import { href } from '../lib/router.svelte.ts';
  import { filterQuestions, pickQuestions, type PracticeOptions } from '../lib/quiz-builder.ts';
  import { renderMarkdown } from '../lib/markdown.ts';
  import { STATUS_LABELS, percent, topicStats } from '../lib/scoring.ts';
  import { activeMistakeCount } from '../lib/progress.ts';
  import { LEVELS, LEVEL_LABELS, type Level } from '../lib/types.ts';

  let { topicId }: { topicId: string } = $props();

  const topic = $derived(topicById.get(topicId));
  const questions = $derived(getQuestions(topicId));
  const stats = $derived(topicStats(questions, user.data));
  const mistakeCount = $derived(activeMistakeCount(user.data, topicId));

  let level = $state<Level | 'all'>('all');
  let count = $state<10 | 20 | 'all'>(10);
  let order = $state<'random' | 'file'>('random');
  let onlyWrong = $state(false);
  let examMode = $state(false);

  const levelCounts = $derived(
    Object.fromEntries(LEVELS.map((l) => [l, questions.filter((q) => q.level === l).length])) as Record<Level, number>,
  );
  const available = $derived(filterQuestions(questions, { level, onlyWrong }, user.data.mistakes).length);
  const willTake = $derived(count === 'all' ? available : Math.min(count, available));

  $effect(() => {
    if (mistakeCount === 0) onlyWrong = false;
  });

  let theoryHtml = $state<string | null>(null);
  $effect(() => {
    const id = topicId;
    theoryHtml = null;
    loadTheory(id).then((md) => {
      if (id === topicId) theoryHtml = renderMarkdown(md);
    });
  });

  function start() {
    const opts: PracticeOptions = { level, count, order, onlyWrong };
    const picked = pickQuestions(questions, opts, user.data.mistakes);
    if (!topic || picked.length === 0) return;
    startQuiz({
      kind: onlyWrong ? 'retry' : 'topic',
      title: topic.name + (onlyWrong ? ' — câu đã sai' : ''),
      questionIds: picked.map((q) => q.id),
      examMode,
      topicId,
    });
  }
</script>

{#if !topic}
  <div class="card empty">
    <p>Không tìm thấy chủ đề “{topicId}”.</p>
    <a class="btn primary" href={href('/')}>Về danh mục</a>
  </div>
{:else}
  <nav class="crumbs small"><a href={href('/')}>Chủ đề</a> › {topic.group}</nav>
  <header class="head">
    <h1>{topic.name}</h1>
    <div class="row small muted">
      <span class="badge {stats.status === 'passed' ? 'success' : stats.status === 'learning' ? 'warning' : ''}">
        {STATUS_LABELS[stats.status]}
      </span>
      <span>{stats.total} câu hỏi</span>
      <span>Đã làm {stats.answered}/{stats.total}</span>
      <span>Tỷ lệ đúng {percent(stats.rate)}</span>
      {#if mistakeCount > 0}
        <a href={href(`/mistakes?topic=${topic.id}`)}>{mistakeCount} câu trong sổ lỗi sai</a>
      {/if}
    </div>
    {#if topic.prerequisites.length > 0}
      <p class="small muted pre">
        Nên học trước:
        {#each topic.prerequisites as p, i (p)}
          <a href={href(`/topic/${p}`)}>{topicById.get(p)?.name ?? p}</a>{i < topic.prerequisites.length - 1 ? ', ' : ''}
        {/each}
      </p>
    {/if}
  </header>

  <div class="layout">
    <article class="card prose theory">
      {#if theoryHtml === null}
        <p class="muted">Đang tải lý thuyết…</p>
      {:else}
        {@html theoryHtml}
      {/if}
    </article>

    <aside class="card setup">
      <h2>Làm bài</h2>
      {#if questions.length === 0}
        <p class="muted">Chủ đề này chưa có câu hỏi.</p>
      {:else}
        <div class="field">
          <span class="label">Mức độ</span>
          <div class="choice-group">
            <label><input type="radio" bind:group={level} value="all" />Tất cả ({questions.length})</label>
            {#each LEVELS as l (l)}
              <label>
                <input type="radio" bind:group={level} value={l} disabled={levelCounts[l] === 0} />
                {LEVEL_LABELS[l]} ({levelCounts[l]})
              </label>
            {/each}
          </div>
        </div>

        <div class="field">
          <span class="label">Số lượng câu</span>
          <div class="choice-group">
            <label><input type="radio" bind:group={count} value={10} />10</label>
            <label><input type="radio" bind:group={count} value={20} />20</label>
            <label><input type="radio" bind:group={count} value="all" />Tất cả</label>
          </div>
        </div>

        <div class="field">
          <span class="label">Thứ tự</span>
          <div class="choice-group">
            <label><input type="radio" bind:group={order} value="random" />Ngẫu nhiên</label>
            <label><input type="radio" bind:group={order} value="file" />Theo thứ tự</label>
          </div>
        </div>

        <div class="field">
          <label class="check">
            <input type="checkbox" bind:checked={onlyWrong} disabled={mistakeCount === 0} />
            <span>
              Chỉ làm các câu đã sai trước đó
              <span class="muted small">({mistakeCount} câu)</span>
            </span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={examMode} />
            <span>
              Chế độ thi
              <span class="muted small d">Không hiện đúng/sai cho đến khi nộp bài.</span>
            </span>
          </label>
        </div>

        <button class="btn primary start" type="button" disabled={willTake === 0} onclick={start}>
          {willTake === 0 ? 'Không có câu phù hợp' : `Bắt đầu (${willTake} câu)`}
        </button>
        <p class="small muted keys">
          Phím tắt: <kbd>A</kbd>–<kbd>D</kbd> chọn đáp án, <kbd>Enter</kbd> kiểm tra / câu tiếp theo.
        </p>
      {/if}
    </aside>
  </div>
{/if}

<style>
  .crumbs {
    color: var(--muted);
    margin-bottom: 6px;
  }
  .head {
    margin-bottom: 20px;
  }
  .head h1 {
    margin-bottom: 6px;
  }
  .pre {
    margin: 8px 0 0;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
    align-items: start;
  }
  .setup {
    position: sticky;
    top: 70px;
  }
  .start {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
  }
  .keys {
    margin: 10px 0 0;
  }
  .check + .check {
    margin-top: 10px;
  }
  .d {
    display: block;
  }
  .theory > :global(:first-child) {
    margin-top: 0;
  }
  /* Tiêu đề H1 của topic.md trùng với tiêu đề trang. */
  .theory > :global(h1:first-child) {
    display: none;
  }
  .theory > :global(h1:first-child + *) {
    margin-top: 0;
  }
  @media (max-width: 860px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .setup {
      position: static;
      order: -1;
    }
  }
</style>
