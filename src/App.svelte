<script lang="ts">
  import { router, href } from './lib/router.svelte.ts';
  import { user, setTheme } from './lib/user.svelte.ts';
  import { session } from './lib/session.svelte.ts';
  import { activeMistakeCount } from './lib/progress.ts';
  import type { ThemeSetting } from './lib/types.ts';
  import Catalog from './routes/Catalog.svelte';
  import TopicPage from './routes/TopicPage.svelte';
  import Quiz from './routes/Quiz.svelte';
  import Result from './routes/Result.svelte';
  import Mistakes from './routes/Mistakes.svelte';
  import Exam from './routes/Exam.svelte';
  import Stats from './routes/Stats.svelte';
  import DataPage from './routes/DataPage.svelte';

  const route = $derived(router.route);
  const theme = $derived(user.data.settings.theme);
  const mistakeCount = $derived(activeMistakeCount(user.data));

  // Chiều cao thanh điều hướng, để các phần sticky khác (thanh làm bài) nằm ngay bên dưới.
  let topbarHeight = $state(54);
  $effect(() => {
    document.documentElement.style.setProperty('--topbar-h', `${topbarHeight}px`);
  });

  $effect(() => {
    const el = document.documentElement;
    if (theme === 'system') delete el.dataset.theme;
    else el.dataset.theme = theme;
  });

  const NEXT_THEME: Record<ThemeSetting, ThemeSetting> = { system: 'light', light: 'dark', dark: 'system' };
  const THEME_LABEL: Record<ThemeSetting, string> = {
    system: 'Theo hệ thống',
    light: 'Sáng',
    dark: 'Tối',
  };
  const THEME_ICON: Record<ThemeSetting, string> = { system: '◐', light: '☀', dark: '☾' };

  const nav = [
    { name: 'catalog', path: '/', label: 'Chủ đề' },
    { name: 'mistakes', path: '/mistakes', label: 'Sổ lỗi sai' },
    { name: 'exam', path: '/exam', label: 'Thi thử' },
    { name: 'stats', path: '/stats', label: 'Thống kê' },
    { name: 'data', path: '/data', label: 'Sao lưu' },
  ];
  const activeNav = $derived(route.name === 'topic' ? 'catalog' : route.name);
</script>

<header class="topbar" bind:offsetHeight={topbarHeight}>
  <div class="inner">
    <a class="brand" href={href('/')}>
      <span class="logo">Gr</span>
      <span>Luyện ngữ pháp</span>
    </a>
    <nav>
      {#each nav as item (item.name)}
        <a href={href(item.path)} class:active={activeNav === item.name}>
          {item.label}
          {#if item.name === 'mistakes' && mistakeCount > 0}<span class="count">{mistakeCount}</span>{/if}
        </a>
      {/each}
    </nav>
    <button
      class="btn ghost theme"
      type="button"
      title="Giao diện: {THEME_LABEL[theme]} (bấm để đổi)"
      aria-label="Đổi giao diện, hiện tại: {THEME_LABEL[theme]}"
      onclick={() => setTheme(NEXT_THEME[theme])}
    >
      {THEME_ICON[theme]}
    </button>
  </div>
</header>

{#if user.saveFailed}
  <div class="save-warning">
    Không lưu được dữ liệu vào trình duyệt (localStorage bị chặn hoặc đầy). Hãy xuất file sao lưu ở trang Sao lưu.
  </div>
{/if}

<main class="container">
  {#if route.name === 'catalog'}
    <Catalog />
  {:else if route.name === 'topic'}
    {#key route.params.id}
      <TopicPage topicId={route.params.id} />
    {/key}
  {:else if route.name === 'quiz'}
    {#if session.current}
      {#key session.nonce}
        <Quiz config={session.current} />
      {/key}
    {:else}
      <div class="card empty">
        <p>Không có bài nào đang làm.</p>
        <a class="btn primary" href={href('/')}>Chọn chủ đề</a>
      </div>
    {/if}
  {:else if route.name === 'result'}
    <Result />
  {:else if route.name === 'mistakes'}
    <Mistakes initialTopic={route.query.get('topic') ?? ''} />
  {:else if route.name === 'exam'}
    <Exam />
  {:else if route.name === 'stats'}
    <Stats />
  {:else if route.name === 'data'}
    <DataPage />
  {:else}
    <div class="card empty">
      <p>Không tìm thấy trang.</p>
      <a class="btn primary" href={href('/')}>Về trang chủ đề</a>
    </div>
  {/if}
</main>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
  }
  .brand:hover {
    text-decoration: none;
  }
  .logo {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--primary);
    color: var(--on-primary);
    font-size: 0.85rem;
  }
  nav {
    flex: 1;
    display: flex;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  nav a {
    padding: 6px 12px;
    border-radius: 8px;
    color: var(--muted);
    font-weight: 500;
    white-space: nowrap;
    font-size: 0.95rem;
  }
  nav a:hover {
    background: var(--surface-2);
    color: var(--text);
    text-decoration: none;
  }
  nav a.active {
    background: var(--primary-soft);
    color: var(--primary);
  }
  .count {
    display: inline-block;
    min-width: 18px;
    padding: 0 5px;
    margin-left: 4px;
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    text-align: center;
    line-height: 18px;
  }
  .theme {
    font-size: 1.15rem;
    padding: 4px 10px;
  }
  .save-warning {
    background: var(--warning-soft);
    color: var(--warning);
    padding: 8px 16px;
    text-align: center;
    font-size: 0.9rem;
  }
  @media (max-width: 640px) {
    .brand span:last-child {
      display: none;
    }
    .inner {
      gap: 8px;
    }
  }
</style>
