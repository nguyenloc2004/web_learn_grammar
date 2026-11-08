<script lang="ts">
  import { topics, topicById } from '../lib/content-loader.ts';
  import { user } from '../lib/user.svelte.ts';
  import { href } from '../lib/router.svelte.ts';
  import { statsMap } from '../lib/progress.ts';
  import {
    STATUS_LABELS,
    PASS_RATE,
    formatDuration,
    historyByDay,
    percent,
    weakestTopics,
  } from '../lib/scoring.ts';
  import ProgressBar from '../components/ProgressBar.svelte';

  const stats = $derived(statsMap(user.data));
  const rows = $derived(topics.map((t) => ({ topic: t, id: t.id, stats: stats.get(t.id)! })));
  const weak = $derived(weakestTopics(rows));
  const days = $derived(historyByDay(user.data.history).slice(0, 30));
  const recent = $derived([...user.data.history].reverse().slice(0, 20));
  const maxDayTotal = $derived(Math.max(1, ...days.map((d) => d.total)));

  const totals = $derived.by(() => {
    const attempts = Object.values(user.data.attempts);
    const correct = attempts.reduce((n, a) => n + a.correct, 0);
    const all = attempts.reduce((n, a) => n + a.correct + a.wrong, 0);
    return {
      questions: attempts.length,
      rate: all ? correct / all : null,
      sessions: user.data.history.length,
      time: user.data.history.reduce((n, h) => n + h.durationSec, 0),
    };
  });

  const toneOf = (r: number | null) =>
    r === null ? 'primary' : r >= PASS_RATE ? 'success' : r >= 0.5 ? 'warning' : 'danger';
  const fmtDay = (d: string) => {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  };
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  const KIND_LABEL = { topic: 'Chủ đề', exam: 'Thi thử', retry: 'Làm lại', mistakes: 'Sổ lỗi' } as const;
</script>

<h1>Thống kê</h1>

<div class="stat-grid">
  <div class="stat"><div class="value">{totals.questions}</div><div class="label">Câu đã làm</div></div>
  <div class="stat"><div class="value">{percent(totals.rate)}</div><div class="label">Tỷ lệ đúng chung</div></div>
  <div class="stat"><div class="value">{totals.sessions}</div><div class="label">Bài đã nộp</div></div>
  <div class="stat"><div class="value">{formatDuration(totals.time)}</div><div class="label">Tổng thời gian</div></div>
</div>

<section class="card">
  <h2>Tỷ lệ đúng theo chủ đề</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Chủ đề</th><th>Trạng thái</th><th>Đã làm</th><th>Lượt</th><th class="w">Tỷ lệ đúng</th></tr>
      </thead>
      <tbody>
        {#each rows as r (r.id)}
          <tr>
            <td><a href={href(`/topic/${r.id}`)}>{r.topic.name}</a></td>
            <td><span class="small">{STATUS_LABELS[r.stats.status]}</span></td>
            <td>{r.stats.answered}/{r.stats.total}</td>
            <td>{r.stats.attempts}</td>
            <td>
              <div class="ratecell">
                <ProgressBar value={r.stats.rate ?? 0} max={1} tone={toneOf(r.stats.rate)} label="Tỷ lệ đúng" />
                <span>{percent(r.stats.rate)}</span>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<div class="two">
  <section class="card">
    <h2>Chủ đề yếu nhất</h2>
    {#if weak.length === 0}
      <p class="muted">Chưa đủ dữ liệu (cần ít nhất 5 lượt trả lời mỗi chủ đề).</p>
    {:else}
      <ol class="weak">
        {#each weak as w (w.id)}
          <li>
            <a href={href(`/topic/${w.id}`)}>{w.topic.name}</a>
            <span class="muted small">— đúng {percent(w.stats.rate)} sau {w.stats.attempts} lượt</span>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <section class="card">
    <h2>Lịch sử theo ngày</h2>
    {#if days.length === 0}
      <p class="muted">Chưa có bài nào được nộp.</p>
    {:else}
      <div class="days">
        {#each days as d (d.day)}
          <div class="day">
            <span class="dlabel small">{fmtDay(d.day)}</span>
            <div class="dbar" title="{d.correct}/{d.total} câu đúng">
              <span class="ok" style:width="{(d.correct / maxDayTotal) * 100}%"></span>
              <span class="bad" style:width="{((d.total - d.correct) / maxDayTotal) * 100}%"></span>
            </div>
            <span class="small muted dinfo">{d.correct}/{d.total} · {d.sessions} bài</span>
          </div>
        {/each}
      </div>
      <p class="small muted legend"><span class="sw ok"></span> đúng <span class="sw bad"></span> sai</p>
    {/if}
  </section>
</div>

{#if recent.length > 0}
  <section class="card">
    <h2>Bài làm gần đây</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Thời gian</th><th>Loại</th><th>Bài</th><th>Điểm</th><th>Thời lượng</th></tr></thead>
        <tbody>
          {#each recent as h (h.id)}
            <tr>
              <td class="small">{fmtTime(h.at)}</td>
              <td><span class="badge">{KIND_LABEL[h.kind]}</span></td>
              <td>
                {h.title}
                {#if h.topics.length > 1}<span class="muted small">({h.topics.length} chủ đề)</span>{/if}
                {#if h.topics.length === 1 && !topicById.has(h.topics[0])}<span class="muted small">(chủ đề đã xóa)</span
                  >{/if}
              </td>
              <td>{h.correct}/{h.total} <span class="muted small">({percent(h.total ? h.correct / h.total : 0)})</span></td>
              <td>{formatDuration(h.durationSec)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

<style>
  h1 {
    margin-bottom: 16px;
  }
  section {
    margin-top: 16px;
  }
  .w {
    width: 32%;
  }
  .ratecell {
    display: grid;
    grid-template-columns: 1fr 44px;
    gap: 8px;
    align-items: center;
  }
  .ratecell span {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .two section {
    margin-top: 16px;
  }
  .weak {
    margin: 0;
    padding-left: 1.3em;
    display: grid;
    gap: 6px;
  }
  .days {
    display: grid;
    gap: 6px;
  }
  .day {
    display: grid;
    grid-template-columns: 84px 1fr auto;
    gap: 10px;
    align-items: center;
  }
  .dbar {
    display: flex;
    height: 12px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--surface-2);
  }
  .ok {
    background: var(--success);
  }
  .bad {
    background: var(--danger);
  }
  .dinfo {
    font-variant-numeric: tabular-nums;
  }
  .legend {
    margin: 10px 0 0;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .sw {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  @media (max-width: 760px) {
    .two {
      grid-template-columns: 1fr;
    }
  }
</style>
