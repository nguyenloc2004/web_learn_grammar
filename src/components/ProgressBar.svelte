<script lang="ts">
  interface Props {
    value: number;
    max: number;
    tone?: 'primary' | 'success' | 'danger' | 'warning';
    label?: string;
  }
  let { value, max, tone = 'primary', label }: Props = $props();
  const pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div
  class="bar {tone === 'primary' ? '' : tone}"
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-label={label}
>
  <span style:width="{pct}%"></span>
</div>
