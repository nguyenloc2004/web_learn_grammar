<script lang="ts">
  import type { Question } from '../lib/types.ts';
  import { renderInline } from '../lib/markdown.ts';

  interface Props {
    question: Question;
    /** Đáp án người dùng chọn (null = bỏ trống, undefined = không có ngữ cảnh làm bài). */
    chosen?: number | null;
  }
  let { question, chosen }: Props = $props();

  const LETTERS = ['A', 'B', 'C', 'D'];
  const ex = $derived(question.explanation);
  const isCorrect = $derived(chosen === question.answer);
  const wrongItems = $derived(
    question.options
      .map((opt, i) => ({ i, opt, why: ex.wrong[String(i)] }))
      .filter((x) => x.i !== question.answer),
  );
</script>

<section class="explain" aria-label="Giải thích">
  {#if chosen !== undefined}
    <div class="verdict {isCorrect ? 'ok' : 'bad'}">
      {#if isCorrect}
        Chính xác!
      {:else if chosen === null}
        Bạn chưa trả lời câu này. Đáp án đúng là <strong>{LETTERS[question.answer]}</strong>.
      {:else}
        Chưa đúng. Bạn chọn <strong>{LETTERS[chosen]}</strong>, đáp án đúng là
        <strong>{LETTERS[question.answer]}</strong>.
      {/if}
    </div>
  {/if}

  <details open>
    <summary>1. Đáp án đúng</summary>
    <div class="body">
      <p>
        <strong class="ok-text">{LETTERS[question.answer]}. {@html renderInline(question.options[question.answer])}</strong>
      </p>
      <p>{@html renderInline(ex.correct)}</p>
    </div>
  </details>

  <details open>
    <summary>2. Quy tắc ngữ pháp</summary>
    <div class="body rule">{@html renderInline(ex.rule)}</div>
  </details>

  <details open>
    <summary>3. Vì sao các đáp án còn lại sai</summary>
    <div class="body">
      <ul class="wrong-list">
        {#each wrongItems as w (w.i)}
          <li class:picked={chosen === w.i}>
            <strong>{LETTERS[w.i]}. {@html renderInline(w.opt)}</strong>
            {#if chosen === w.i}<span class="badge danger">Bạn chọn</span>{/if}
            <div>{@html renderInline(w.why ?? '(Chưa có giải thích)')}</div>
          </li>
        {/each}
      </ul>
    </div>
  </details>

  <details open>
    <summary>4. Ví dụ</summary>
    <div class="body">
      <ul class="examples">
        {#each ex.examples as e, i (i)}
          <li lang="en">{@html renderInline(e)}</li>
        {/each}
      </ul>
    </div>
  </details>

  <details open>
    <summary>5. Lỗi thường gặp của người Việt</summary>
    <div class="body">
      {#if ex.common_mistake && ex.common_mistake.trim()}
        {@html renderInline(ex.common_mistake)}
      {:else}
        <span class="muted">Không có lưu ý đặc biệt cho câu này.</span>
      {/if}
    </div>
  </details>
</section>

<style>
  .explain {
    margin-top: 20px;
    display: grid;
    gap: 8px;
  }
  .verdict {
    padding: 10px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
  .verdict.ok {
    background: var(--success-soft);
    color: var(--success);
  }
  .verdict.bad {
    background: var(--danger-soft);
    color: var(--danger);
  }
  details {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  summary {
    cursor: pointer;
    padding: 9px 14px;
    font-weight: 600;
    font-size: 0.95rem;
    user-select: none;
  }
  details[open] summary {
    border-bottom: 1px solid var(--border);
  }
  .body {
    padding: 10px 14px 12px;
  }
  .body p {
    margin: 0 0 6px;
  }
  .body p:last-child {
    margin-bottom: 0;
  }
  .ok-text {
    color: var(--success);
  }
  .wrong-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .wrong-list li.picked {
    border-left: 3px solid var(--danger);
    padding-left: 10px;
  }
  .rule {
    background: var(--primary-soft);
    border-radius: 0 0 8px 8px;
  }
  .examples {
    margin: 0;
    padding-left: 1.2em;
  }
  .examples li {
    font-style: italic;
  }
</style>
