<script lang="ts">
  import { user, replaceData, resetProgress, setTheme } from '../lib/user.svelte.ts';
  import { exportFile, importFile } from '../lib/storage.ts';
  import type { ThemeSetting } from '../lib/types.ts';

  let message = $state<{ kind: 'ok' | 'err'; text: string } | null>(null);
  let fileInput: HTMLInputElement | undefined = $state();

  const counts = $derived({
    attempts: Object.keys(user.data.attempts).length,
    mistakes: Object.keys(user.data.mistakes).length,
    history: user.data.history.length,
  });

  function doExport() {
    exportFile($state.snapshot(user.data));
    message = { kind: 'ok', text: 'Đã tạo file sao lưu.' };
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const data = await importFile(file);
      const summary = `${Object.keys(data.attempts).length} câu đã làm, ${Object.keys(data.mistakes).length} câu trong sổ lỗi, ${data.history.length} bài làm`;
      if (!confirm(`Nhập dữ liệu từ “${file.name}” (${summary})?\nDữ liệu hiện tại sẽ bị thay thế.`)) return;
      replaceData(data);
      message = { kind: 'ok', text: `Đã nhập dữ liệu: ${summary}.` };
    } catch (err) {
      message = { kind: 'err', text: `Không nhập được: ${(err as Error).message}` };
    }
  }

  function doReset() {
    if (!confirm('Xóa toàn bộ tiến độ, sổ lỗi sai và lịch sử? Hãy xuất file sao lưu trước nếu cần.')) return;
    resetProgress();
    message = { kind: 'ok', text: 'Đã xóa toàn bộ dữ liệu học tập.' };
  }

  const themes: { v: ThemeSetting; label: string }[] = [
    { v: 'system', label: 'Theo hệ thống' },
    { v: 'light', label: 'Sáng' },
    { v: 'dark', label: 'Tối' },
  ];
</script>

<div class="wrap">
  <h1>Sao lưu & cài đặt</h1>

  {#if message}
    <div class="msg {message.kind}" role="status">{message.text}</div>
  {/if}

  <section class="card">
    <h2>Dữ liệu học tập</h2>
    <p class="muted">
      Dữ liệu được lưu trong trình duyệt này (localStorage): {counts.attempts} câu đã làm, {counts.mistakes} câu trong sổ
      lỗi sai, {counts.history} bài làm. Xóa dữ liệu trình duyệt sẽ mất tiến độ, nên hãy xuất file sao lưu định kỳ.
    </p>
    <div class="row">
      <button class="btn primary" type="button" onclick={doExport}>Xuất file JSON</button>
      <button class="btn" type="button" onclick={() => fileInput?.click()}>Nhập từ file JSON…</button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={onFile} />
    </div>
  </section>

  <section class="card">
    <h2>Giao diện</h2>
    <div class="choice-group">
      {#each themes as t (t.v)}
        <label>
          <input
            type="radio"
            name="theme"
            checked={user.data.settings.theme === t.v}
            onchange={() => setTheme(t.v)}
          />{t.label}
        </label>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2>Xóa dữ liệu</h2>
    <p class="muted">Xóa toàn bộ tiến độ, sổ lỗi sai và lịch sử làm bài. Không thể hoàn tác.</p>
    <button class="btn danger" type="button" onclick={doReset}>Xóa toàn bộ dữ liệu</button>
  </section>
</div>

<style>
  .wrap {
    max-width: 720px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  h1 {
    margin: 0;
  }
  .msg {
    padding: 10px 14px;
    border-radius: 8px;
    font-weight: 500;
  }
  .msg.ok {
    background: var(--success-soft);
    color: var(--success);
  }
  .msg.err {
    background: var(--danger-soft);
    color: var(--danger);
  }
</style>
