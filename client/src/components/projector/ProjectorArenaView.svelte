<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';

  const state = $derived(auction.state);
  const activeComp = $derived(state?.activeComponentId ? state.components[state.activeComponentId] : null);
  const leaderboard = $derived((state?.leaderboard || []).slice(0, 5));
  const recentLogs = $derived((state?.recentLogs || []).slice(0, 6));

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div class="arena-view">
  <!-- Arena Top Bar -->
  <header class="arena-top">
    <div class="arena-logo">
      <span class="arena-icon">🤖</span>
      <span class="arena-title">ROBO AUCTION ARENA</span>
      <span class="phase-pill">PHASE: {state?.phase || 'LOBBY'}</span>
    </div>
    <div class="arena-stats">
      <span class="stat-pill">70 REGISTERED TEAMS</span>
      <span class="stat-pill live">20 MAJOR COMPONENT AUCTION</span>
    </div>
  </header>

  <!-- Arena Central Stage Grid -->
  <div class="arena-grid">
    <!-- Active Component & 3 Variants Floor (Left 65%) -->
    <div class="arena-main-stage">
      {#if activeComp}
        <div class="arena-comp-header">
          <div class="comp-identity">
            <span class="order-badge">COMPONENT #{activeComp.order.toString().padStart(2, '0')}</span>
            <h1 class="comp-name">{activeComp.name}</h1>
            <span class="comp-cat">{activeComp.category.toUpperCase().replace('_', ' ')}</span>
          </div>

          <div class="arena-timer-box" class:danger={activeComp.timeLeftSeconds <= 10}>
            <div class="timer-lbl">COUNTDOWN</div>
            <div class="timer-num">{formatTime(activeComp.timeLeftSeconds)}</div>
          </div>
        </div>

        <!-- 3 Variants Display -->
        <div class="arena-variants-row">
          {#each activeComp.variants as variant}
            <div class="arena-variant-card tier-{variant.tier}" class:is-sold={variant.status === 'SOLD'}>
              <div class="av-top">
                <span class="av-tier-badge">{variant.tier.toUpperCase()}</span>
                {#if variant.status === 'SOLD'}
                  <span class="av-sold">SOLD</span>
                {:else}
                  <span class="av-avail">ACTIVE</span>
                {/if}
              </div>

              <h2 class="av-title">{variant.name}</h2>

              <div class="av-price-box">
                <span class="av-price-label">HIGH BID</span>
                <span class="av-price-num">₹{variant.currentBid.toLocaleString()}</span>
              </div>

              <div class="av-bidder-box">
                {#if variant.highestBidderTeamName}
                  <span class="av-bidder-lead">👑 {variant.highestBidderTeamName}</span>
                {:else}
                  <span class="av-no-bids">Base: ₹{variant.startingPrice.toLocaleString()}</span>
                {/if}
              </div>

              <div class="av-caps">
                <span>Rating: {variant.capabilities.rating}/100</span>
                <span>{variant.bestFor}</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="arena-standby">
          <div class="standby-logo">📡</div>
          <h2>TRADING FLOOR STANDBY</h2>
          <p>Waiting for the Host to open the next major robot component.</p>
        </div>
      {/if}

      <!-- Recent Announcements Ticker -->
      <div class="arena-ticker">
        <span class="ticker-tag">LIVE FEED</span>
        <div class="ticker-scroll">
          {#each recentLogs as log}
            <span class="ticker-item">⚡ {log.message}</span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Arena Right Sidebar: Top Standings (Right 35%) -->
    <div class="arena-sidebar">
      <div class="sidebar-header">
        <h2>TOP LEADERBOARD STANDINGS</h2>
        <span class="sub">70% Performance + 30% Efficiency</span>
      </div>

      <div class="leaderboard-podium">
        {#each leaderboard as entry, idx}
          <div class="podium-card rank-{entry.rank}">
            <div class="podium-rank">
              {#if idx === 0}🥇{:else if idx === 1}🥈{:else if idx === 2}🥉{:else}#{entry.rank}{/if}
            </div>
            <div class="podium-info">
              <span class="podium-name">{entry.teamName}</span>
              <span class="podium-code">{entry.code}</span>
            </div>
            <div class="podium-scores">
              <span class="podium-final">{entry.finalScore.toFixed(1)}</span>
              <span class="podium-sub">Perf: {entry.normalizedPerformance} | Eff: {entry.budgetEfficiencyScore}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .arena-view {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: radial-gradient(circle at 50% 20%, #0d1a30 0%, #050914 80%);
    color: #f8fafc;
    padding: 1.5rem;
    box-sizing: border-box;
    gap: 1.25rem;
    overflow: hidden;
  }

  .arena-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(13, 22, 38, 0.8);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    padding: 1rem 1.5rem;
  }

  .arena-logo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .arena-icon {
    font-size: 2rem;
  }

  .arena-title {
    font-size: 1.8rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #f8fafc;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }

  .phase-pill {
    background: rgba(0, 229, 255, 0.2);
    color: #00e5ff;
    font-size: 0.85rem;
    font-weight: 800;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 229, 255, 0.4);
  }

  .arena-stats {
    display: flex;
    gap: 0.75rem;
  }

  .stat-pill {
    background: rgba(255, 255, 255, 0.08);
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .stat-pill.live {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid #10b981;
  }

  .arena-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
  }

  .arena-main-stage {
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 16px;
    padding: 2rem;
    gap: 1.5rem;
    backdrop-filter: blur(16px);
  }

  .arena-comp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-badge {
    color: #00e5ff;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .comp-name {
    font-size: 3rem;
    font-weight: 900;
    margin: 0.2rem 0;
    text-shadow: 0 0 25px rgba(0, 229, 255, 0.4);
  }

  .comp-cat {
    color: #94a3b8;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .arena-timer-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(0, 0, 0, 0.6);
    border: 3px solid #00e5ff;
    border-radius: 16px;
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
  }

  .arena-timer-box.danger {
    border-color: #ef4444;
    box-shadow: 0 0 35px rgba(239, 68, 68, 0.5);
  }

  .timer-lbl {
    font-size: 0.8rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .timer-num {
    font-family: 'Courier New', monospace;
    font-size: 3.5rem;
    font-weight: 900;
    color: #00e5ff;
    line-height: 1;
  }

  .arena-timer-box.danger .timer-num {
    color: #ef4444;
  }

  .arena-variants-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    flex: 1;
  }

  .arena-variant-card {
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .arena-variant-card.tier-pro {
    border-color: #a855f7;
  }

  .arena-variant-card.tier-advanced {
    border-color: #3b82f6;
  }

  .arena-variant-card.tier-basic {
    border-color: #94a3b8;
  }

  .av-top {
    display: flex;
    justify-content: space-between;
  }

  .av-tier-badge {
    font-weight: 900;
    font-size: 0.85rem;
    color: #00e5ff;
  }

  .av-sold {
    color: #ef4444;
    font-weight: 800;
    font-size: 0.8rem;
  }

  .av-avail {
    color: #10b981;
    font-weight: 800;
    font-size: 0.8rem;
  }

  .av-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
  }

  .av-price-box {
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.75rem;
    border-radius: 8px;
  }

  .av-price-label {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 700;
  }

  .av-price-num {
    font-family: 'Courier New', monospace;
    font-size: 2.2rem;
    font-weight: 900;
    color: #00e5ff;
  }

  .av-bidder-box {
    font-size: 1.1rem;
    font-weight: 800;
    color: #10b981;
  }

  .av-caps {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: auto;
  }

  .arena-standby {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #94a3b8;
  }

  .standby-logo {
    font-size: 4rem;
  }

  .arena-ticker {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    overflow: hidden;
  }

  .ticker-tag {
    background: #ef4444;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 900;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .ticker-scroll {
    display: flex;
    gap: 2rem;
    white-space: nowrap;
    overflow: hidden;
  }

  .ticker-item {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-family: 'Courier New', monospace;
  }

  .arena-sidebar {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sidebar-header h2 {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
  }

  .sidebar-header .sub {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .leaderboard-podium {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .podium-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1rem;
  }

  .podium-card.rank-1 {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
  }

  .podium-rank {
    font-size: 1.6rem;
    font-weight: 900;
    width: 40px;
    text-align: center;
  }

  .podium-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .podium-name {
    font-weight: 800;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .podium-code {
    font-size: 0.75rem;
    color: #94a3b8;
    font-family: 'Courier New', monospace;
  }

  .podium-scores {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .podium-final {
    font-family: 'Courier New', monospace;
    font-size: 1.5rem;
    font-weight: 900;
    color: #00e5ff;
  }

  .podium-sub {
    font-size: 0.7rem;
    color: #94a3b8;
  }
</style>
