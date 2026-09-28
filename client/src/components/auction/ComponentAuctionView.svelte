<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';
  import type { ComponentVariant, RobotComponent } from '../../types/index.js';

  const ALLOWED_INCREMENTS = [500, 1000, 2500, 5000, 10000];

  // Helper getters
  const activeComponent = $derived.by<RobotComponent | null>(() => {
    if (!auction.state?.activeComponentId || !auction.state.components) return null;
    return auction.state.components[auction.state.activeComponentId] || null;
  });

  const team = $derived(auction.currentTeam);
  const remainingBudget = $derived(team ? team.availableBudget : 0);

  let selectedVariantId = $state<string | null>(null);
  let isBidding = $state(false);

  // Time formatter
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleBid(variant: ComponentVariant, increment: number) {
    if (!team) {
      auction.addToast('warning', 'Auth Required', 'Please connect with your Team credentials first.');
      return;
    }
    const currentPrice = variant.highestBidderTeamId ? variant.currentBid : variant.startingPrice;
    const bidAmount = variant.highestBidderTeamId ? variant.currentBid + increment : variant.startingPrice;

    if (bidAmount > remainingBudget) {
      auction.addToast('error', 'Budget Exceeded', `Cannot afford ₹${bidAmount.toLocaleString()}. Available: ₹${remainingBudget.toLocaleString()}.`);
      return;
    }

    isBidding = true;
    try {
      const res = await auction.placeVariantBid(variant.id, bidAmount);
      if (res.success) {
        selectedVariantId = variant.id;
      }
    } finally {
      isBidding = false;
    }
  }

  function getTierBadgeClass(tier: string): string {
    if (tier === 'pro') return 'badge-pro';
    if (tier === 'advanced') return 'badge-advanced';
    return 'badge-basic';
  }
</script>

<div class="auction-container">
  {#if !activeComponent}
    <div class="empty-state-panel">
      <div class="radar-scan"></div>
      <div class="empty-icon">📡</div>
      <h2>AUCTION TRADING FLOOR STANDBY</h2>
      <p>The Host has not opened a robot component yet. Please wait for the next lot to be called to the floor.</p>
      {#if auction.role === 'host'}
        <button class="btn-primary" onclick={() => auction.hostOpenNextComponent()}>
          🚀 OPEN COMPONENT #01 NOW
        </button>
      {/if}
    </div>
  {:else}
    <!-- Component Header & Live HUD Bar -->
    <header class="component-header">
      <div class="header-left">
        <div class="tag-row">
          <span class="hud-tag">COMPONENT {activeComponent.order.toString().padStart(2, '0')} / 20</span>
          <span class="hud-category">{activeComponent.category.toUpperCase().replace('_', ' ')}</span>
          <span class="status-indicator live-pulse">🟢 LIVE ON FLOOR</span>
        </div>
        <h1 class="comp-title">{activeComponent.name}</h1>
        <p class="comp-desc">{activeComponent.description}</p>
      </div>

      <div class="header-right">
        <!-- Live Timer Box -->
        <div class="timer-box" class:danger={activeComponent.timeLeftSeconds <= 10}>
          <div class="timer-label">TIME REMAINING</div>
          <div class="timer-value">{formatTime(activeComponent.timeLeftSeconds)}</div>
          {#if activeComponent.extensionsCount > 0}
            <div class="snipe-tag">⚡ EXTENDED ({activeComponent.extensionsCount}/3)</div>
          {/if}
        </div>

        {#if team}
          <div class="team-budget-chip">
            <span class="chip-label">YOUR REMAINING BUDGET</span>
            <span class="chip-value">₹{team.availableBudget.toLocaleString()}</span>
            <span class="chip-sub">Total Spent: ₹{team.spentAmount.toLocaleString()}</span>
          </div>
        {/if}
      </div>
    </header>

    <!-- 3 Variants Side-by-Side Grid (Section 5, 6, 8) -->
    <div class="variants-grid">
      {#each activeComponent.variants as variant (variant.id)}
        {@const isWinning = team && variant.highestBidderTeamId === team.id}
        {@const isSold = variant.status === 'SOLD'}
        {@const canAfford = team ? remainingBudget >= (variant.highestBidderTeamId ? variant.currentBid + variant.minIncrement : variant.startingPrice) : false}

        <div
          class="variant-card"
          class:is-winning={isWinning}
          class:is-sold={isSold}
          class:tier-pro={variant.tier === 'pro'}
          class:tier-adv={variant.tier === 'advanced'}
          class:tier-basic={variant.tier === 'basic'}
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="tier-pill {getTierBadgeClass(variant.tier)}">
              {variant.tier.toUpperCase()}
            </div>
            {#if isSold}
              <div class="sold-badge">🔒 SOLD</div>
            {:else if isWinning}
              <div class="winning-badge">👑 YOU'RE HIGHEST BIDDER</div>
            {:else}
              <div class="available-badge">🟢 AVAILABLE</div>
            {/if}
          </div>

          <h3 class="variant-name">{variant.name}</h3>

          <!-- Price & Bidding Display -->
          <div class="price-display">
            <div class="price-row">
              <span class="price-label">
                {isSold ? 'WINNING PRICE' : variant.highestBidderTeamId ? 'CURRENT HIGHEST BID' : 'STARTING PRICE'}
              </span>
              <span class="price-val">₹{variant.currentBid.toLocaleString()}</span>
            </div>

            {#if variant.highestBidderTeamName}
              <div class="highest-bidder-row">
                <span class="bidder-label">Leader:</span>
                <span class="bidder-name" class:self-bidder={isWinning}>
                  {variant.highestBidderTeamName} {isWinning ? '(YOU)' : ''}
                </span>
              </div>
            {:else}
              <div class="highest-bidder-row no-bids">
                <span>No bids yet — Opens at base ₹{variant.startingPrice.toLocaleString()}</span>
              </div>
            {/if}
          </div>

          <!-- Key Capabilities Matrix -->
          <div class="capabilities-box">
            <div class="cap-header">
              <span>CAPABILITIES & RATINGS</span>
              <span class="rating-badge">Rating: {variant.capabilities.rating}/100</span>
            </div>
            <div class="cap-chips">
              {#if variant.capabilities.powerWatts}
                <span class="cap-chip">⚡ {variant.capabilities.powerWatts}W</span>
              {/if}
              {#if variant.capabilities.speedRpm}
                <span class="cap-chip">🏎️ {variant.capabilities.speedRpm} RPM</span>
              {/if}
              {#if variant.capabilities.torqueNm}
                <span class="cap-chip">💪 {variant.capabilities.torqueNm} Nm</span>
              {/if}
              {#if variant.capabilities.efficiencyPercent}
                <span class="cap-chip">🔋 {variant.capabilities.efficiencyPercent}% Eff</span>
              {/if}
              {#if variant.capabilities.detectionRangeMeters}
                <span class="cap-chip">👁️ {variant.capabilities.detectionRangeMeters}m Range</span>
              {/if}
              {#if variant.capabilities.computeRateMips}
                <span class="cap-chip">🧠 {variant.capabilities.computeRateMips} MIPS</span>
              {/if}
              {#if variant.capabilities.capacityMah}
                <span class="cap-chip">🔋 {variant.capabilities.capacityMah} mAh</span>
              {/if}
              {#if variant.capabilities.payloadKg}
                <span class="cap-chip">⚖️ {variant.capabilities.payloadKg} kg payload</span>
              {/if}
            </div>
          </div>

          <!-- Specs Table -->
          <div class="specs-section">
            <div class="specs-title">TECHNICAL SPECIFICATIONS</div>
            <table class="specs-table">
              <tbody>
                {#each Object.entries(variant.specifications) as [key, val]}
                  <tr>
                    <td class="spec-k">{key}</td>
                    <td class="spec-v">{val}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Tactical Guidance (Section 46: Pros, Cons & Best For) -->
          <div class="tactical-guidance">
            <div class="pros-cons-grid">
              <div class="pros-col">
                <div class="pros-title">✓ ADVANTAGES</div>
                <ul>
                  {#each variant.pros as pro}
                    <li>{pro}</li>
                  {/each}
                </ul>
              </div>
              <div class="cons-col">
                <div class="cons-title">✗ LIMITATIONS</div>
                <ul>
                  {#each variant.cons as con}
                    <li>{con}</li>
                  {/each}
                </ul>
              </div>
            </div>
            <div class="best-for-bar">
              <span class="best-for-label">BEST FOR:</span>
              <span class="best-for-val">{variant.bestFor}</span>
            </div>
          </div>

          <!-- Bid Action Matrix -->
          <div class="action-footer">
            {#if isSold}
              <div class="sold-state-box">
                Variant acquired by <strong>{variant.highestBidderTeamName || 'Anonymous Team'}</strong> for ₹{variant.currentBid.toLocaleString()}.
              </div>
            {:else if !team}
              <div class="auth-prompt-box">
                Connect your Team PIN to place live bids.
              </div>
            {:else}
              <div class="bid-buttons-section">
                <div class="bid-instructions">
                  <span>PLACE INSTANT BID:</span>
                  <span class="min-inc-note">Min Increment: ₹{variant.minIncrement}</span>
                </div>
                <div class="btn-grid" role="group" aria-label="Bid increment buttons for {variant.name}">
                  {#each ALLOWED_INCREMENTS as inc}
                    {@const targetPrice = variant.highestBidderTeamId ? variant.currentBid + inc : variant.startingPrice + (inc - 500)}
                    {@const affordable = remainingBudget >= targetPrice}
                    <button
                      class="bid-btn"
                      disabled={!affordable || isBidding}
                      onclick={() => handleBid(variant, inc)}
                      title="Commit ₹{targetPrice.toLocaleString()} (+₹{inc.toLocaleString()})"
                      aria-label="Bid plus ₹{inc.toLocaleString()} to commit ₹{targetPrice.toLocaleString()} on {variant.name}"
                    >
                      <span class="bid-action-text">+₹{inc >= 1000 ? `${inc / 1000}k` : inc}</span>
                      <span class="bid-target-price">₹{targetPrice >= 1000 ? `${(targetPrice / 1000).toFixed(1)}k` : targetPrice}</span>
                    </button>
                  {/each}
                </div>
                {#if !canAfford}
                  <div class="insufficient-alert">
                    ⚠️ Insufficient budget for next minimum bid
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .auction-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .empty-state-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    background: rgba(13, 17, 23, 0.7);
    border: 1px dashed rgba(0, 229, 255, 0.3);
    border-radius: 16px;
    text-align: center;
    gap: 1.25rem;
    backdrop-filter: blur(12px);
  }

  .empty-icon {
    font-size: 3.5rem;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(13, 22, 38, 0.85), rgba(9, 14, 24, 0.95));
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(0, 229, 255, 0.2);
    gap: 2rem;
  }

  .tag-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .hud-tag {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    letter-spacing: 0.08em;
    border: 1px solid rgba(0, 229, 255, 0.4);
  }

  .hud-category {
    background: rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .live-pulse {
    font-size: 0.75rem;
    font-weight: 700;
    color: #10b981;
    animation: pulse 1.8s infinite;
  }

  .comp-title {
    font-size: 2.2rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.02em;
    margin: 0.25rem 0;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.25);
  }

  .comp-desc {
    color: #94a3b8;
    font-size: 0.95rem;
    max-width: 680px;
    line-height: 1.4;
    margin: 0;
  }

  .header-right {
    display: flex;
    gap: 1.25rem;
    align-items: center;
  }

  .timer-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 229, 255, 0.4);
    border-radius: 12px;
    min-width: 140px;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
  }

  .timer-box.danger {
    border-color: #ef4444;
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);
    animation: timerFlash 1s infinite alternate;
  }

  .timer-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
  }

  .timer-value {
    font-family: 'Courier New', monospace;
    font-size: 2.2rem;
    font-weight: 900;
    color: #00e5ff;
    line-height: 1.1;
  }

  .timer-box.danger .timer-value {
    color: #ef4444;
  }

  .snipe-tag {
    font-size: 0.65rem;
    font-weight: 700;
    color: #f59e0b;
    margin-top: 0.25rem;
  }

  .team-budget-chip {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1.25rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
  }

  .chip-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #10b981;
    letter-spacing: 0.05em;
  }

  .chip-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #f8fafc;
  }

  .chip-sub {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  /* 3 Variants Grid */
  .variants-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    width: 100%;
  }

  @media (max-width: 1024px) {
    .variants-grid {
      grid-template-columns: 1fr;
    }
  }

  .variant-card {
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    gap: 1.2rem;
    backdrop-filter: blur(12px);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    position: relative;
    overflow: hidden;
  }

  .variant-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  }

  .variant-card.tier-basic {
    border-top: 4px solid #94a3b8;
  }

  .variant-card.tier-adv {
    border-top: 4px solid #3b82f6;
  }

  .variant-card.tier-pro {
    border-top: 4px solid #a855f7;
    box-shadow: 0 4px 20px rgba(168, 85, 247, 0.1);
  }

  .variant-card.is-winning {
    border-color: #10b981;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.25);
  }

  .variant-card.is-sold {
    opacity: 0.75;
    filter: grayscale(0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tier-pill {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    letter-spacing: 0.08em;
  }

  .badge-basic {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
    border: 1px solid #94a3b8;
  }

  .badge-advanced {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid #3b82f6;
  }

  .badge-pro {
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
    border: 1px solid #a855f7;
  }

  .sold-badge {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid #ef4444;
  }

  .winning-badge {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid #10b981;
    animation: pulse 1.5s infinite;
  }

  .available-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: #10b981;
  }

  .variant-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
  }

  /* Price Display */
  .price-display {
    background: rgba(0, 0, 0, 0.4);
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .price-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .price-val {
    font-size: 1.6rem;
    font-weight: 900;
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }

  .highest-bidder-row {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    margin-top: 0.4rem;
    font-size: 0.8rem;
  }

  .highest-bidder-row.no-bids {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .bidder-label {
    color: #94a3b8;
  }

  .bidder-name {
    color: #cbd5e1;
    font-weight: 600;
  }

  .bidder-name.self-bidder {
    color: #10b981;
    font-weight: 800;
  }

  /* Capabilities */
  .capabilities-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .rating-badge {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 800;
  }

  .cap-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .cap-chip {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 600;
  }

  /* Specs */
  .specs-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .specs-title {
    font-size: 0.68rem;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .specs-table {
    width: 100%;
    font-size: 0.78rem;
    border-collapse: collapse;
  }

  .specs-table tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .spec-k {
    color: #94a3b8;
    padding: 0.3rem 0;
  }

  .spec-v {
    color: #f1f5f9;
    font-weight: 600;
    text-align: right;
    padding: 0.3rem 0;
  }

  /* Tactical Guidance */
  .tactical-guidance {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .pros-cons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .pros-title {
    color: #10b981;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .cons-title {
    color: #ef4444;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .pros-col ul, .cons-col ul {
    margin: 0;
    padding-left: 1rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .best-for-bar {
    display: flex;
    gap: 0.4rem;
    padding-top: 0.4rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .best-for-label {
    color: #00e5ff;
    font-weight: 800;
    font-size: 0.7rem;
  }

  .best-for-val {
    color: #cbd5e1;
    font-weight: 600;
  }

  /* Action Buttons */
  .action-footer {
    margin-top: auto;
  }

  .bid-instructions {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 0.4rem;
  }

  .min-inc-note {
    color: #94a3b8;
  }

  .btn-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
  }

  .bid-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(0, 114, 255, 0.2));
    border: 1px solid rgba(0, 229, 255, 0.4);
    color: #00e5ff;
    padding: 0.5rem 0.25rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
  }

  .bid-btn:focus-visible {
    outline: 2px solid #00e5ff;
    outline-offset: 2px;
  }

  .bid-action-text {
    font-weight: 800;
    font-size: 0.82rem;
    letter-spacing: 0.02em;
  }

  .bid-target-price {
    font-size: 0.65rem;
    color: #94a3b8;
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .bid-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #00e5ff, #0072ff);
    color: #090e18;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 229, 255, 0.4);
  }

  .bid-btn:hover:not(:disabled) .bid-target-price {
    color: #090e18;
    font-weight: 800;
  }

  .bid-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .insufficient-alert {
    color: #ef4444;
    font-size: 0.7rem;
    font-weight: 700;
    text-align: center;
    margin-top: 0.4rem;
  }

  .sold-state-box {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
    font-size: 0.8rem;
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
  }

  .auth-prompt-box {
    background: rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    font-size: 0.8rem;
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes timerFlash {
    0% { transform: scale(1); }
    100% { transform: scale(1.02); }
  }
</style>
