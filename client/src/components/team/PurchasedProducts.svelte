<script lang="ts">
  import { Cpu, Crosshair, Wrench, Zap, PackageCheck, Layers } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';
  import type { ComponentCategory, Lot } from '../../types/index.js';

  // Get won lots for current team
  const wonLots = $derived(
    auction.currentTeam
      ? auction.currentTeam.wonLotIds
          .map(id => auction.state?.lots[id])
          .filter((l): l is Lot => l !== undefined && (l.status === 'closed' || (l.status as string) === 'sold'))
      : []
  );

  const totalSpent = $derived(
    wonLots.reduce((sum, l) => sum + (l.winningBidAmount ?? l.currentBid ?? 0), 0)
  );

  function getCategoryIcon(cat: ComponentCategory) {
    switch (cat) {
      case 'controller': return Cpu;
      case 'sensor': return Crosshair;
      case 'motor': return Wrench;
      case 'power': return Zap;
      default: return Layers;
    }
  }
</script>

<div class="glass-panel purchased-products-section" style="margin-top: 2rem; padding: 1.5rem;">
  <div class="purchased-header">
    <div style="display: flex; align-items: center; gap: 0.65rem;">
      <div class="purchased-icon-wrap">
        <PackageCheck size={20} color="var(--accent-emerald)" />
      </div>
      <div>
        <h2 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Purchased Products So Far
        </h2>
        <p style="font-size: 0.75rem; color: var(--text-dim);">
          Components won and added to your tactical robot blueprint.
        </p>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 1rem;">
      <div class="purchased-stat">
        <span class="stat-label">Items Won</span>
        <span class="stat-value" style="color: var(--accent-emerald);">{wonLots.length}</span>
      </div>
      <div class="purchased-stat">
        <span class="stat-label">Total Spent</span>
        <span class="stat-value" style="color: var(--text-main);">${totalSpent.toLocaleString()}</span>
      </div>
    </div>
  </div>

  {#if wonLots.length === 0}
    <div class="purchased-empty">
      <PackageCheck size={36} style="margin: 0 auto 0.75rem; opacity: 0.35; color: var(--text-dim);" />
      <h4 style="font-family: var(--font-display); font-size: 0.95rem; color: var(--text-muted);">
        No Products Won Yet
      </h4>
      <p style="font-size: 0.78rem; color: var(--text-dim); margin-top: 0.25rem;">
        Place tactical bids on active open lots above. When a lot countdown concludes and your bid leads, the module will be secured here.
      </p>
    </div>
  {:else}
    <div class="purchased-grid">
      {#each wonLots as lot (lot.id)}
        {@const CategoryIcon = getCategoryIcon(lot.category)}
        <div class="purchased-card">
          <div class="purchased-card-top">
            <div class="lot-category-tag" style="margin-bottom: 0;">
              <CategoryIcon size={12} />
              <span>{lot.category.toUpperCase()}</span>
            </div>
            <div class="purchased-price">
              Paid: ${(lot.winningBidAmount ?? lot.currentBid).toLocaleString()}
            </div>
          </div>

          <h3 class="purchased-item-title">{lot.title}</h3>
          {#if lot.description}
            <p class="purchased-item-desc">{lot.description}</p>
          {/if}

          {#if lot.specifications && Object.keys(lot.specifications).length > 0}
            <div class="purchased-specs">
              {#each Object.entries(lot.specifications) as [key, val]}
                <div class="purchased-spec-row">
                  <span class="spec-k">{key}:</span>
                  <span class="spec-v">{val}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .purchased-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 1.25rem;
  }

  .purchased-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .purchased-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--text-dim);
    font-family: var(--font-display);
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
  }

  .purchased-empty {
    text-align: center;
    padding: 3rem 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px dashed var(--border-subtle);
  }

  .purchased-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .purchased-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: border-color 0.2s;
  }

  .purchased-card:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .purchased-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .purchased-price {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent-emerald);
    background: rgba(16, 185, 129, 0.1);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .purchased-item-title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .purchased-item-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.35;
  }

  .purchased-specs {
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .purchased-spec-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
  }

  .spec-k {
    color: var(--text-dim);
  }

  .spec-v {
    font-family: var(--font-mono);
    color: var(--text-main);
    font-weight: 600;
  }
</style>
