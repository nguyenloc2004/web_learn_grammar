<script lang="ts">
  // Một câu hỏi dạng thu gọn, bấm để mở xem đáp án và giải thích.
  import type { Snippet } from 'svelte';
  import type { Question } from '../lib/types.ts';
  import QuestionCard from './QuestionCard.svelte';
  import ExplanationBlock from './ExplanationBlock.svelte';
  import { renderInline } from '../lib/markdown.ts';

  interface Props {
    question: Question;
    chosen?: number | null;
    number?: number;
    open?: boolean;
    showTopic?: boolean;
    actions?: Snippet;
    extra?: Snippet;
  }
  let { question, chosen, number, open = $bindable(false), showTopic = true, actions, extra }: Props = $props();
</script>

<article class="review card">
  <div class="head">
    <button type="button" class="toggle" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="caret" class:rot={open}>▸</span>
      <span class="q">
        {#if number !== undefined}<strong>{number}.</strong>{/if}
        {@html renderInline(question.question)}
      </span>
    </button>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
  {#if extra}<div class="extra">{@render extra()}</div>{/if}
  {#if open}
    <div class="detail">
      <QuestionCard {question} selected={chosen ?? null} revealed {showTopic} />
      <ExplanationBlock {question} {chosen} />
    </div>
  {/if}
</article>

<style>
  .review {
    padding: 12px 16px;
  }
  .head {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .toggle {
    flex: 1;
    display: flex;
    gap: 8px;
    text-align: left;
    font: inherit;
    color: var(--text);
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
  }
  .caret {
    color: var(--muted);
    transition: transform 0.15s;
    display: inline-block;
  }
  .caret.rot {
    transform: rotate(90deg);
  }
  .actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .extra {
    margin: 4px 0 0 22px;
  }
  .detail {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }
</style>
