<script lang="ts">
  import type { MistakeEntry, Question } from '../lib/types.ts';
  import { questionById, topicById, topics } from '../lib/content-loader.ts';
  import { user, setMastered, removeMistake } from '../lib/user.svelte.ts';
  import { startQuiz } from '../lib/session.svelte.ts';
  import { href } from '../lib/router.svelte.ts';
  import { shuffle } from '../lib/quiz-builder.ts';
  import QuestionReview from '../components/QuestionReview.svelte';

  let { initialTopic = '' }: { initialTopic?: string } = $props();

  // svelte-ignore state_referenced_locally
  let topicFilter = $state(initialTopic);
  let showMastered = $state(false);

  type Row = { q: Question; m: MistakeEntry };
  const allRows = $derived(
    Object.entries(user.data.mistakes)
      .map(([id, m]) => ({ q: questionById.get(id), m }))
      .filter((r): r is Row => !!r.q)
      .sort((a, b) => (a.m.lastWrongAt < b.m.lastWrongAt ? 1 : -1)),
  );
  const rows = $derived(
    allRows.filter((r) => (!topicFilter || r.q.topic === topicFilter) && (showMastered || !r.m.mastered)),
  );
  const activeRows = $derived(rows.filter((r) => !r.m.mastered));
  const countByTopic = $derived.by(() => {
    const c = new Map<string, number>();
    for (const r of allRows) if (!r.m.mastered) c.set(r.q.topic, (c.get(r.q.topic) ?? 0) + 1);
    return c;
  });

  function practice() {
    if (activeRows.length === 0) return;
    const name = topicFilter ? topicById.get(topicFilter)?.name : null;
    startQuiz({
      kind: 'mistakes',
      title: name ? `Sổ lỗi sai — ${name}` : 'Ôn sổ lỗi sai',
      questionIds: shuffle(activeRows.map((r) => r.q.id)),
      examMode: false,
      topicId: topicFilter || undefined,
    });
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
</script>

<header class="head">
  <div>
    <h1>Sổ lỗi sai</h1>
    <p class="muted">Các câu bạn từng trả lời sai được tự động lưu ở đây. Đánh dấu “Đã thuộc” để loại khỏi sổ.</p>
  </div>
  <button class="btn primary" type="button" disabled={activeRows.length === 0} onclick={practice}>
    Luyện {activeRows.length} câu này
  </button>
</header>

<div class="row filters">
  <select bind:value={topicFilter} aria-label="Lọc theo chủ đề">
    <option value="">Tất cả chủ đề ({[...countByTopic.values()].reduce((a, b) => a + b, 0)})</option>
    {#each topics as t (t.id)}
      {#if countByTopic.has(t.id) || t.id === topicFilter}
        <option value={t.id}>{t.name} ({countByTopic.get(t.id) ?? 0})</option>
      {/if}
    {/each}
  </select>
  <label class="check small"><input type="checkbox" bind:checked={showMastered} /> Hiện cả câu đã thuộc</label>
</div>

{#if rows.length === 0}
  <div class="card empty">
    {#if allRows.length === 0}
      <p>Sổ lỗi sai đang trống. Làm bài để bắt đầu!</p>
      <a class="btn primary" href={href('/')}>Chọn chủ đề</a>
    {:else}
      <p>Không có câu nào trong bộ lọc này.</p>
    {/if}
  </div>
{:else}
  <div class="list">
    {#each rows as r (r.q.id)}
      <QuestionReview question={r.q}>
        {#snippet actions()}
          {#if r.m.mastered}
            <button class="btn small" type="button" onclick={() => setMastered(r.q.id, false)}>Đưa lại vào sổ</button>
            <button class="btn small ghost" type="button" title="Xóa hẳn khỏi sổ" onclick={() => removeMistake(r.q.id)}
              >Xóa</button
            >
          {:else}
            <button class="btn small" type="button" onclick={() => setMastered(r.q.id, true)}>✓ Đã thuộc</button>
          {/if}
        {/snippet}
        {#snippet extra()}
          <div class="small muted meta">
            <span>{topicById.get(r.q.topic)?.name}</span>
            <span>Sai {r.m.count} lần</span>
            <span>Lần sai gần nhất: {fmtDate(r.m.lastWrongAt)}</span>
            {#if user.data.attempts[r.q.id]?.lastCorrect}<span class="badge success">Lần gần nhất đã đúng</span>{/if}
            {#if r.m.mastered}<span class="badge">Đã thuộc</span>{/if}
          </div>
        {/snippet}
      </QuestionReview>
    {/each}
  </div>
{/if}

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .head p {
    margin: 0;
  }
  .filters {
    margin-bottom: 16px;
  }
  .list {
    display: grid;
    gap: 8px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    align-items: center;
  }
</style>
