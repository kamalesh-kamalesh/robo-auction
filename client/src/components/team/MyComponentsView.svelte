<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';

  const team = $derived(auction.currentTeam);
  const components = $derived(team?.components || []);

  const totalSpent = $derived(team?.spentAmount ?? 0);
  const remainingBudget = $derived(team?.availableBudget ?? 100000);
</script>

<div class="inventory-layout">
  <!-- Header -->
  <header class="inv-header">
    <div class="inv-title-group">
      <div class="inv-tag">ROBOT INVENTORY & BUDGET ACCOUNTING</div>
      <h1 class="inv-title">Acquired Modules & Technical Manifest</h1>
      <p class="inv-sub">All components secured through the live auction, verified with serial specs and performance metrics.</p>
    </div>

    <div class="budget-summary-card">
      <div class="budget-col">
        <span class="b-lbl">TOTAL STARTING BUDGET</span>
        <span class="b-val">₹{(team?.totalBudget || 100000).toLocaleString()}</span>
      </div>
      <div class="budget-col highlight-spent">
        <span class="b-lbl">AMOUNT COMMITTED & SPENT</span>
        <span class="b-val">₹{totalSpent.toLocaleString()}</span>
      </div>
      <div class="budget-col highlight-rem">
        <span class="b-lbl">REMAINING AVAILABLE</span>
        <span class="b-val">₹{remainingBudget.toLocaleString()}</span>
      </div>
    </div>
  </header>

  <!-- Inventory List -->
  {#if components.length === 0}
    <div class="empty-inv">
      <div class="empty-icon">📦</div>
      <h3>NO COMPONENTS ACQUIRED YET</h3>
      <p>Your team has not won any auction lots. Bid on components on the Live Auction Floor to build your inventory.</p>
    </div>
  {:else}
    <div class="components-grid">
      {#each components as comp}
        <div class="comp-card tier-{comp.variantTier}">
          <div class="comp-card-top">
            <div class="tier-badge {comp.variantTier}">
              {comp.variantTier.toUpperCase()}
            </div>
            <div class="rating-badge">
              Rating: {comp.capabilities.rating}/100
            </div>
          </div>

          <h3 class="comp-name">{comp.variantName}</h3>
          <div class="comp-category">{comp.category.toUpperCase().replace('_', ' ')}</div>

          <div class="price-paid-box">
            <span class="p-lbl">PURCHASE PRICE</span>
            <span class="p-val">₹{comp.purchasePrice.toLocaleString()}</span>
          </div>

          <!-- Specs Table -->
          <div class="specs-box">
            <div class="specs-title">TECHNICAL SPECIFICATIONS</div>
            <table class="specs-table">
              <tbody>
                {#each Object.entries(comp.specifications) as [k, v]}
                  <tr>
                    <td class="sk">{k}</td>
                    <td class="sv">{v}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inventory-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .inv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(13, 22, 38, 0.9), rgba(9, 14, 24, 0.95));
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 14px;
    padding: 1.5rem 2rem;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .inv-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .inv-tag {
    color: #00e5ff;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .inv-title {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0.25rem 0;
  }

  .inv-sub {
    color: #94a3b8;
    font-size: 0.85rem;
    margin: 0;
  }

  .budget-summary-card {
    display: flex;
    gap: 1.5rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 1.5rem;
  }

  .budget-col {
    display: flex;
    flex-direction: column;
  }

  .b-lbl {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .b-val {
    font-size: 1.3rem;
    font-weight: 800;
    color: #f1f5f9;
    font-family: 'Courier New', monospace;
  }

  .highlight-spent .b-val {
    color: #f59e0b;
  }

  .highlight-rem .b-val {
    color: #10b981;
  }

  .empty-inv {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
    background: rgba(15, 23, 42, 0.6);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    color: #94a3b8;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .components-grid {
      grid-template-columns: 1fr;
    }
  }

  .comp-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    backdrop-filter: blur(12px);
  }

  .comp-card.tier-pro {
    border-top: 4px solid #a855f7;
  }

  .comp-card.tier-advanced {
    border-top: 4px solid #3b82f6;
  }

  .comp-card.tier-basic {
    border-top: 4px solid #94a3b8;
  }

  .comp-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tier-badge {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
  }

  .tier-badge.pro {
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
    border: 1px solid #a855f7;
  }

  .tier-badge.advanced {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid #3b82f6;
  }

  .tier-badge.basic {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
    border: 1px solid #94a3b8;
  }

  .rating-badge {
    font-size: 0.72rem;
    font-weight: 800;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.15);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .comp-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .comp-category {
    font-size: 0.72rem;
    color: #cbd5e1;
    font-weight: 600;
  }

  .price-paid-box {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    background: rgba(0, 0, 0, 0.35);
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }

  .p-lbl {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .p-val {
    font-size: 1.3rem;
    font-weight: 900;
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }

  .specs-box {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .specs-title {
    font-size: 0.68rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .specs-table {
    width: 100%;
    font-size: 0.75rem;
    border-collapse: collapse;
  }

  .specs-table tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .sk {
    color: #94a3b8;
    padding: 0.25rem 0;
  }

  .sv {
    color: #f1f5f9;
    font-weight: 600;
    text-align: right;
    padding: 0.25rem 0;
  }
</style>
