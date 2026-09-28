<script lang="ts">
  import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';
</script>

{#if auction.toasts.length > 0}
  <div class="toasts-container">
    {#each auction.toasts as toast (toast.id)}
      <div class="toast-item {toast.type}">
        <div style="display: flex; gap: 0.65rem;">
          {#if toast.type === 'success'}
            <CheckCircle size={18} style="flex-shrink: 0; margin-top: 2px;" />
          {:else if toast.type === 'warning'}
            <AlertTriangle size={18} style="flex-shrink: 0; margin-top: 2px;" />
          {:else if toast.type === 'error'}
            <AlertCircle size={18} style="flex-shrink: 0; margin-top: 2px;" />
          {:else}
            <Info size={18} style="flex-shrink: 0; margin-top: 2px;" />
          {/if}
          <div>
            <div class="toast-title">{toast.title}</div>
            <div class="toast-msg">{toast.message}</div>
          </div>
        </div>
        <button
          onclick={() => auction.dismissToast(toast.id)}
          style="color: var(--text-dim); padding: 2px;"
        >
          <X size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}
