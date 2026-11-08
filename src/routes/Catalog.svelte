<script lang="ts">
  import { groupedTopics } from '../lib/content-loader.ts';
  import { user } from '../lib/user.svelte.ts';
  import { statsMap, activeMistakeCount } from '../lib/progress.ts';
  import { STATUS_LABELS, percent } from '../lib/scoring.ts';
  import { foldText } from '../lib/markdown.ts';
  import { href } from '../lib/router.svelte.ts';
  import ProgressBar from '../components/ProgressBar.svelte';

  let query = $state('');

  const stats = $derived(statsMap(user.data));
  const groups = $derived.by(() => {
    const q = foldText(query);
    return groupedTopics()
      .map((g) => ({ ...g, topics: g.topics.filter((t) => !q || foldText(t.name).includes(q) || t.id.includes(q)) }))
      .filter((g) => g.topics.length > 0);
  });
  const summary = $derived.by(() => {
    const all = [...stats.values()];
    return {
      topics: all.length,
      passed: all.filter((s) => s.status === 'passed').length,
      questions: all.reduce((n, s) => n + s.total, 0),
      answered: all.reduce((n, s) => n + s.answered, 0),
    };
  });
  const mistakes = $derived(activeMistakeCount(user.data));
  const statusTone = { new: '', learning: 'warning', passed: 'success' } as const;
</script>

<section class="hero">
  <div>
    <h1>Chủ đề ngữ pháp</h1>
    <p class="muted">
      {summary.topics} chủ đề · {summary.questions} câu hỏi · đã làm {summary.answered} câu · đạt {summary.passed}/{summary.topics}
      chủ đề
    </p>
  </div>
  <div class="row">
    {#if mistakes > 0}<a class="btn" href={href('/mistakes')}>Ôn {mistakes} câu sai</a>{/if}
    <a class="btn primary" href={href('/exam')}>Thi thử tổng hợp</a>
  </div>
</section>

<input
  class="search"
  type="search"
  placeholder="Tìm chủ đề (ví dụ: hoàn thành, present perfect)…"
  aria-label="Tìm chủ đề"
  bind:value={query}
/>

{#each groups as g (g.group)}
  <section class="group">
    <h2>{g.group}</h2>
    <div class="grid">
      {#each g.topics as t (t.id)}
        {@const s = stats.get(t.id)!}
        <a class="topic card" href={href(`/topic/${t.id}`)}>
          <div class="top">
            <h3>{t.name}</h3>
            <span class="badge {statusTone[s.status]}">{STATUS_LABELS[s.status]}</span>
          </div>
          <div class="info muted small">
            <span>{s.total} câu</span>
            <span>Đã làm {s.answered}/{s.total}</span>
            <span>Tỷ lệ đúng: <strong class="rate">{percent(s.rate)}</strong></span>
          </div>
          <ProgressBar
            value={s.answered}
            max={s.total}
            tone={s.status === 'passed' ? 'success' : 'primary'}
            label="Tiến độ {t.name}"
          />
        </a>
      {/each}
    </div>
  </section>
{:else}
  <div class="card empty">Không có chủ đề nào khớp với “{query}”.</div>
{/each}

<style>
  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .hero h1 {
    margin-bottom: 2px;
  }
  .hero p {
    margin: 0;
  }
  .search {
    width: 100%;
    padding: 11px 14px;
    margin-bottom: 24px;
  }
  .group {
    margin-bottom: 28px;
  }
  .group h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 12px;
  }
  .topic {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--text);
    padding: 16px;
    transition:
      border-color 0.12s,
      transform 0.12s;
  }
  .topic:hover {
    border-color: var(--primary);
    text-decoration: none;
    transform: translateY(-1px);
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: flex-start;
  }
  .top h3 {
    margin: 0;
    font-size: 1rem;
  }
  .info {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }
  .rate {
    color: var(--text);
  }
</style>
