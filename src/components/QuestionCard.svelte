<script lang="ts">
  import type { Question } from '../lib/types.ts';
  import { LEVEL_LABELS, TYPE_LABELS } from '../lib/types.ts';
  import { renderInline } from '../lib/markdown.ts';
  import { topicById } from '../lib/content-loader.ts';

  interface Props {
    question: Question;
    selected: number | null;
    /** Hiện đúng/sai (xanh/đỏ) và khóa lựa chọn. */
    revealed?: boolean;
    /** Khóa lựa chọn nhưng không hiện đúng/sai. */
    locked?: boolean;
    number?: number;
    showTopic?: boolean;
    onselect?: (index: number) => void;
  }

  let { question, selected, revealed = false, locked = false, number, showTopic = false, onselect }: Props =
    $props();

  const LETTERS = ['A', 'B', 'C', 'D'];

  function stateOf(i: number): string {
    if (!revealed) return selected === i ? 'selected' : '';
    if (i === question.answer) return 'correct';
    if (i === selected) return 'wrong';
    return 'dim';
  }
</script>

<div class="qcard">
  <div class="meta">
    {#if number !== undefined}<span class="num">Câu {number}</span>{/if}
    <span class="badge primary">{TYPE_LABELS[question.type]}</span>
    <span class="badge">{LEVEL_LABELS[question.level]}</span>
    {#if showTopic}<span class="badge">{topicById.get(question.topic)?.name ?? question.topic}</span>{/if}
  </div>

  <div class="question">{@html renderInline(question.question)}</div>

  <div class="options" role="radiogroup" aria-label="Các lựa chọn">
    {#each question.options as opt, i (i)}
      {@const st = stateOf(i)}
      <button
        type="button"
        class="option {st}"
        role="radio"
        aria-checked={selected === i}
        disabled={revealed || locked}
        onclick={() => onselect?.(i)}
      >
        <span class="letter">{LETTERS[i]}</span>
        <span class="text">{@html renderInline(opt)}</span>
        {#if revealed && st === 'correct'}<span class="mark" aria-label="Đáp án đúng">✓</span>{/if}
        {#if revealed && st === 'wrong'}<span class="mark" aria-label="Bạn chọn sai">✗</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .meta {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .num {
    font-weight: 700;
    margin-right: 4px;
  }
  .question {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 18px;
    line-height: 1.55;
  }
  .question :global(u),
  .question :global(strong) {
    text-underline-offset: 3px;
  }
  .options {
    display: grid;
    gap: 10px;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    font: inherit;
    color: var(--text);
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    cursor: pointer;
    transition:
      border-color 0.1s,
      background 0.1s;
  }
  .option:hover:not(:disabled) {
    border-color: var(--primary);
  }
  .option:disabled {
    cursor: default;
  }
  .letter {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--surface-2);
    font-weight: 700;
    font-size: 0.85rem;
  }
  .text {
    flex: 1;
  }
  .mark {
    font-weight: 700;
    font-size: 1.1rem;
  }
  .option.selected {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
  .option.selected .letter {
    background: var(--primary);
    color: var(--on-primary);
  }
  .option.correct {
    border-color: var(--success);
    background: var(--success-soft);
  }
  .option.correct .letter,
  .option.correct .mark {
    color: var(--success);
  }
  .option.correct .letter {
    background: var(--success);
    color: var(--surface);
  }
  .option.wrong {
    border-color: var(--danger);
    background: var(--danger-soft);
  }
  .option.wrong .mark {
    color: var(--danger);
  }
  .option.wrong .letter {
    background: var(--danger);
    color: var(--surface);
  }
  .option.dim {
    opacity: 0.7;
  }
</style>
