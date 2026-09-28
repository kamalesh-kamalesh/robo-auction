<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';
  import type { EventPhase } from '../../types/index.js';

  const evState = $derived(auction.state);
  const currentPhase = $derived<EventPhase>(evState?.phase || 'LOBBY');
  const components = $derived(Object.values(evState?.components || {}).sort((a, b) => a.order - b.order));
  const activeComp = $derived(evState?.activeComponentId && evState.components ? evState.components[evState.activeComponentId] : null);
  const teams = $derived(Object.values(evState?.teams || {}));
  const onlineTeamsCount = $derived(teams.filter((t) => t.isOnline).length);
  const logs = $derived(evState?.recentLogs || []);

  const PHASES: EventPhase[] = [
    'LOBBY',
    'AUCTION',
    'AUCTION_COMPLETE',
    'ASSEMBLY',
    'TESTING',
    'LEADERBOARD',
    'EVENT_COMPLETE'
  ];

  let selectedComponentId = $state('comp-01');
  let customTimerSeconds = $state(60);
  let isCompDropdownOpen = $state(false);
  const selectedComp = $derived(components.find((c) => c.id === selectedComponentId) || components[0]);

  function selectComponent(id: string) {
    selectedComponentId = id;
    isCompDropdownOpen = false;
  }

  function handleOpenSelected() {
    if (selectedComponentId) {
      auction.hostOpenComponent(selectedComponentId, customTimerSeconds);
    }
  }

  function handleExport() {
    window.open('/api/export', '_blank');
  }
</script>

<div class="host-command-matrix">
  <!-- Top Command Center Header -->
  <header class="matrix-header">
    <div class="header-left">
      <div class="admin-badge">HOST COMMAND CENTER — MASTER CONTROL MATRIX</div>
      <h1 class="matrix-title">Event Operations & Orchestration</h1>
    </div>

    <!-- Quick Global Controls -->
    <div class="global-actions">
      <button 
        class="btn-demo" 
        onclick={() => auction.hostRunDemo()}
        title="Simulate all 70 teams with random bidding, assembly, and testing"
        aria-label="Run full tournament demo simulation with 70 realistic teams"
      >
        ⚡ SIMULATE 70 TEAMS (FULL DEMO)
      </button>

      {#if evState?.status === 'running'}
        <button 
          class="btn-warn" 
          onclick={() => auction.hostPause()}
          aria-label="Pause current auction timers and bidding floor"
        >
          ⏸ PAUSE AUCTION FLOOR
        </button>
      {:else}
        <button 
          class="btn-primary" 
          onclick={() => auction.hostResume()}
          aria-label="Resume auction timers and floor activities"
        >
          ▶ RESUME AUCTION FLOOR
        </button>
      {/if}

      <button 
        class="btn-export" 
        onclick={handleExport}
        title="Export complete event state as JSON audit file"
        aria-label="Download and export complete tournament state and audit logs as JSON"
      >
        📥 EXPORT AUDIT LOG
      </button>
      <button 
        class="btn-danger" 
        onclick={() => { if (confirm('Are you sure you want to RESET the entire event? All teams, inventory, bids, and scores will be reset.')) auction.hostReset(); }}
        aria-label="Reset tournament state to lobby default"
      >
        🔄 RESET EVENT
      </button>
    </div>
  </header>

  <!-- Telemetry Stat Bar -->
  <div class="telemetry-bar">
    <div class="telem-item">
      <span class="t-k">CURRENT PHASE</span>
      <span class="t-v phase-highlight">{currentPhase}</span>
    </div>
    <div class="telem-item">
      <span class="t-k">REGISTERED TEAMS</span>
      <span class="t-v">{teams.length} Teams</span>
    </div>
    <div class="telem-item">
      <span class="t-k">ONLINE UNITS</span>
      <span class="t-v online">{onlineTeamsCount} Connected</span>
    </div>
    <div class="telem-item">
      <span class="t-k">COMPONENTS PROCESSED</span>
      <span class="t-v">
        {components.filter((c) => c.status === 'closed').length} / 20 Closed
      </span>
    </div>
  </div>

  <!-- Phase Transition Ribbon -->
  <div class="phase-ribbon">
    <span class="ribbon-label">STATE MACHINE TRANSITION:</span>
    <div class="phase-buttons">
      {#each PHASES as ph}
        <button
          class="phase-btn"
          class:current={currentPhase === ph}
          onclick={() => auction.hostSetPhase(ph)}
        >
          {ph.replace('_', ' ')}
        </button>
      {/each}
    </div>
  </div>

  <div class="host-main-split">
    <!-- Component Auction Controller (Left Column) -->
    <div class="controller-panel">
      <div class="panel-header">
        <h2 class="panel-title">20 Major Components Controller</h2>
        <button class="btn-next-comp" onclick={() => auction.hostOpenNextComponent()}>
          ⏩ Open Next Component
        </button>
      </div>

      <!-- Quick Selector Bar -->
      <div class="comp-selector-row">
        <div class="custom-select-container">
          <button
            type="button"
            class="custom-select-trigger"
            class:open={isCompDropdownOpen}
            onclick={() => (isCompDropdownOpen = !isCompDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={isCompDropdownOpen}
          >
            <div class="trigger-content">
              {#if selectedComp}
                <span class="trigger-num">#{selectedComp.order.toString().padStart(2, '0')}</span>
                <span class="trigger-name">{selectedComp.name}</span>
                <span class="status-chip status-{selectedComp.status.toLowerCase()}">
                  {selectedComp.status.toUpperCase()}
                </span>
              {:else}
                <span class="trigger-name">Select Component...</span>
              {/if}
            </div>
            <span class="trigger-chevron" class:flipped={isCompDropdownOpen}>▼</span>
          </button>

          {#if isCompDropdownOpen}
            <div
              class="custom-dropdown-backdrop"
              onclick={() => (isCompDropdownOpen = false)}
              role="presentation"
            ></div>
            <div class="custom-dropdown-list" role="listbox">
              {#each components as c (c.id)}
                <button
                  type="button"
                  class="custom-dropdown-item"
                  class:selected={c.id === selectedComponentId}
                  onclick={() => selectComponent(c.id)}
                  role="option"
                  aria-selected={c.id === selectedComponentId}
                >
                  <span class="item-num">#{c.order.toString().padStart(2, '0')}</span>
                  <span class="item-name">{c.name}</span>
                  <span class="status-chip status-{c.status.toLowerCase()}">
                    {c.status.toUpperCase()}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="timer-input-group">
          <label for="timer-secs">Duration:</label>
          <input
            id="timer-secs"
            type="number"
            class="input-timer"
            bind:value={customTimerSeconds}
            min="10"
            max="300"
          />
          <span>sec</span>
        </div>

        <button class="btn-open-comp" onclick={handleOpenSelected}>
          🚀 OPEN COMPONENT
        </button>
      </div>

      <!-- Active Component Live Inspection Box (Section 13) -->
      {#if activeComp}
        <div class="active-inspection-box">
          <div class="active-comp-meta">
            <div>
              <span class="active-tag">CURRENTLY LIVE ON AUCTION FLOOR</span>
              <h3 class="active-name">Component #{activeComp.order} — {activeComp.name}</h3>
            </div>
            <div class="active-timer-control">
              <span class="active-time-val">{activeComp.timeLeftSeconds}s left</span>
              <div class="timer-btn-row">
                <button class="btn-extend" onclick={() => auction.hostExtendTime(15)}>+15s</button>
                <button class="btn-close-comp" onclick={() => auction.hostCloseComponent(activeComp.id)}>
                  🔨 Close Now
                </button>
              </div>
            </div>
          </div>

          <!-- Section 13: 3 Variants Live Status -->
          <div class="variants-status-table">
            {#each activeComp.variants as variant}
              <div class="variant-status-row tier-{variant.tier}">
                <div class="v-tier-col">
                  <span class="v-tier-name">{variant.tier.toUpperCase()}</span>
                  <span class="v-full-name">{variant.name}</span>
                </div>

                <div class="v-bid-col">
                  <span class="v-price-label">Current:</span>
                  <span class="v-price-val">₹{variant.currentBid.toLocaleString()}</span>
                </div>

                <div class="v-state-col">
                  {#if variant.status === 'SOLD'}
                    <span class="v-sold-pill">SOLD to {variant.highestBidderTeamName || 'Team'}</span>
                  {:else if variant.highestBidderTeamName}
                    <span class="v-lead-pill">Lead: {variant.highestBidderTeamName}</span>
                  {:else}
                    <span class="v-avail-pill">AVAILABLE (No bids)</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="no-active-comp">
          No component is currently open. Select a component above or click "Open Next Component".
        </div>
      {/if}

      <!-- All 20 Components Catalogue Grid -->
      <div class="catalogue-overview">
        <h3 class="cat-title">FULL 20-COMPONENT FLEET STATUS</h3>
        <div class="comp-list-grid">
          {#each components as c}
            <div class="comp-chip-card status-{c.status}">
              <div class="c-order">#{c.order}</div>
              <div class="c-details">
                <span class="c-name">{c.name}</span>
                <span class="c-sold-count">
                  {c.variants.filter((v) => v.status === 'SOLD').length}/3 Sold
                </span>
              </div>
              <button class="c-quick-open" onclick={() => auction.hostOpenComponent(c.id, 60)}>
                Open
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Live Telemetry & Event Terminal (Right Column) -->
    <div class="telemetry-panel">
      <h2 class="panel-title">SYSTEM EVENT LOG & AUDIT STREAM</h2>
      <div class="terminal-box">
        {#each logs as log}
          <div class="terminal-line type-{log.type.toLowerCase()}">
            <span class="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span class="log-type">[{log.type}]</span>
            <span class="log-msg">{log.message}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .host-command-matrix {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .matrix-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(13, 22, 38, 0.95), rgba(9, 14, 24, 0.98));
    border: 1px solid rgba(0, 229, 255, 0.35);
    border-radius: 14px;
    padding: 1.5rem 2rem;
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .matrix-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .admin-badge {
    color: #00e5ff;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .matrix-title {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0.25rem 0 0 0;
  }

  .global-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn-demo {
    background: linear-gradient(135deg, #a855f7, #ec4899);
    color: #fff;
    font-weight: 900;
    font-size: 0.85rem;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
    transition: transform 0.15s;
  }

  .btn-demo:hover {
    transform: translateY(-2px);
  }

  .btn-primary {
    background: #00e5ff;
    color: #090e18;
    font-weight: 800;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
  }

  .btn-warn {
    background: #f59e0b;
    color: #090e18;
    font-weight: 800;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
  }

  .btn-export {
    background: rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    font-weight: 700;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid #ef4444;
    font-weight: 800;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }

  /* Telemetry Bar */
  .telemetry-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  @media (max-width: 900px) {
    .telemetry-bar {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .telem-item {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .t-k {
    font-size: 0.68rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .t-v {
    font-size: 1.4rem;
    font-weight: 800;
    color: #f8fafc;
  }

  .t-v.phase-highlight {
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }

  .t-v.online {
    color: #10b981;
  }

  /* Phase Ribbon */
  .phase-ribbon {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 0.75rem 1.25rem;
    overflow-x: auto;
  }

  .ribbon-label {
    font-size: 0.72rem;
    font-weight: 800;
    color: #94a3b8;
    white-space: nowrap;
  }

  .phase-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .phase-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }

  .phase-btn.current {
    background: rgba(0, 229, 255, 0.25);
    border-color: #00e5ff;
    color: #00e5ff;
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.25);
  }

  .host-main-split {
    display: grid;
    grid-template-columns: 1.8fr 1.2fr;
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .host-main-split {
      grid-template-columns: 1fr;
    }
  }

  .controller-panel, .telemetry-panel {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    backdrop-filter: blur(12px);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
  }

  .btn-next-comp {
    background: rgba(0, 229, 255, 0.15);
    border: 1px solid rgba(0, 229, 255, 0.35);
    color: #00e5ff;
    font-weight: 800;
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .comp-selector-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    background: rgba(0, 0, 0, 0.35);
    padding: 0.75rem;
    border-radius: 8px;
    position: relative;
    z-index: 10;
  }

  .custom-select-container {
    flex: 1;
    position: relative;
    min-width: 280px;
  }

  .custom-select-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0e121b;
    border: 1px solid rgba(0, 242, 254, 0.3);
    color: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
    gap: 0.5rem;
  }

  .custom-select-trigger:hover,
  .custom-select-trigger.open {
    border-color: #00f2fe;
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.25);
    background: #141a27;
  }

  .trigger-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
  }

  .trigger-num, .item-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #00f2fe;
    background: rgba(0, 242, 254, 0.1);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .trigger-name, .item-name {
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-chevron {
    font-size: 0.65rem;
    color: #00f2fe;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .trigger-chevron.flipped {
    transform: rotate(180deg);
  }

  .custom-dropdown-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 998;
  }

  .custom-dropdown-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 280px;
    overflow-y: auto;
    background: #0e121b;
    border: 1px solid rgba(0, 242, 254, 0.4);
    border-radius: 8px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 242, 254, 0.2);
    z-index: 999;
    padding: 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .custom-dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    border-radius: 4px;
    background: transparent;
    border: 1px solid transparent;
    color: #f8fafc;
    cursor: pointer;
    text-align: left;
    font-size: 0.82rem;
    transition: all 0.15s ease;
  }

  .custom-dropdown-item:hover {
    background: rgba(0, 242, 254, 0.12);
    border-color: rgba(0, 242, 254, 0.3);
  }

  .custom-dropdown-item.selected {
    background: rgba(0, 242, 254, 0.18);
    border-color: #00f2fe;
  }

  .status-chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .status-chip.status-open {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .status-chip.status-upcoming {
    background: rgba(245, 175, 25, 0.15);
    color: #f5af19;
    border: 1px solid rgba(245, 175, 25, 0.3);
  }

  .status-chip.status-closed {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .timer-input-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .input-timer {
    width: 60px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #00e5ff;
    font-weight: 800;
    padding: 0.4rem;
    border-radius: 4px;
    text-align: center;
  }

  .btn-open-comp {
    background: linear-gradient(135deg, #00e5ff, #0072ff);
    color: #090e18;
    font-weight: 900;
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }

  /* Active Inspection Box */
  .active-inspection-box {
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 229, 255, 0.4);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .active-comp-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .active-tag {
    font-size: 0.65rem;
    font-weight: 800;
    color: #10b981;
    letter-spacing: 0.08em;
  }

  .active-name {
    font-size: 1.35rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0.2rem 0 0 0;
  }

  .active-timer-control {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
  }

  .active-time-val {
    font-family: 'Courier New', monospace;
    font-size: 1.3rem;
    font-weight: 900;
    color: #00e5ff;
  }

  .timer-btn-row {
    display: flex;
    gap: 0.4rem;
  }

  .btn-extend {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid #f59e0b;
    color: #f59e0b;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-close-comp {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    color: #ef4444;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Variants Status Table */
  .variants-status-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .variant-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.04);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border-left: 4px solid #94a3b8;
  }

  .variant-status-row.tier-pro {
    border-left-color: #a855f7;
  }

  .variant-status-row.tier-advanced {
    border-left-color: #3b82f6;
  }

  .v-tier-name {
    font-size: 0.75rem;
    font-weight: 800;
    color: #cbd5e1;
    margin-right: 0.5rem;
  }

  .v-full-name {
    font-size: 0.82rem;
    color: #94a3b8;
  }

  .v-price-val {
    font-size: 1.1rem;
    font-weight: 800;
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }

  .v-sold-pill {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
  }

  .v-lead-pill {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
  }

  .v-avail-pill {
    background: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
  }

  .no-active-comp {
    background: rgba(0, 0, 0, 0.3);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  /* Catalogue Grid */
  .catalogue-overview {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .cat-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.08em;
    margin: 0;
  }

  .comp-list-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .comp-chip-card {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(0, 0, 0, 0.35);
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.72rem;
  }

  .comp-chip-card.status-open {
    border-color: #00e5ff;
    background: rgba(0, 229, 255, 0.08);
  }

  .c-order {
    font-weight: 800;
    color: #94a3b8;
  }

  .c-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .c-name {
    font-weight: 700;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .c-sold-count {
    font-size: 0.65rem;
    color: #94a3b8;
  }

  .c-quick-open {
    background: rgba(0, 229, 255, 0.15);
    border: 1px solid rgba(0, 229, 255, 0.3);
    color: #00e5ff;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Terminal */
  .terminal-box {
    background: #050914;
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 10px;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    height: 480px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .terminal-line {
    display: flex;
    gap: 0.5rem;
    line-height: 1.4;
  }

  .log-time {
    color: #94a3b8;
  }

  .log-type {
    color: #00e5ff;
    font-weight: 700;
  }

  .log-msg {
    color: #cbd5e1;
  }

  .terminal-line.type-bid_placed .log-type {
    color: #10b981;
  }

  .terminal-line.type-outbid .log-type {
    color: #f59e0b;
  }

  .terminal-line.type-anti_snipe .log-type {
    color: #ec4899;
  }

  .terminal-line.type-component_sold .log-type {
    color: #a855f7;
  }
</style>
