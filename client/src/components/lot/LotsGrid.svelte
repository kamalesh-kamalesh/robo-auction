<script lang="ts">
  import { Layers, Flame, Radio, Check } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';
  import LotCard from './LotCard.svelte';
  import type { ComponentCategory } from '../../types/index.js';

  let filterTab = $state<'open' | 'upcoming' | 'my' | 'closed' | 'all'>('open');
  let categoryFilter = $state('all');
  let selectedOpenLotId = $state<string | 'all'>('all');

  const lotsList = $derived(auction.state ? Object.values(auction.state.lots) : []);

  const openLotsList    = $derived(lotsList.filter(l => l.status === 'open'));
  const openLotsCount   = $derived(openLotsList.length);
  const upcomingCount   = $derived(lotsList.filter(l => l.status === 'upcoming').length);
  const closedCount     = $derived(lotsList.filter(l => l.status === 'closed').length);
  const myLeadingCount  = $derived(
    auction.currentTeam
      ? lotsList.filter(l => l.highestBidderTeamId === auction.currentTeam!.id).length
      : 0
  );

  const filteredLots = $derived(
    lotsList.filter(lot => {
      if (filterTab === 'open') {
        if (lot.status !== 'open') return false;
        if (selectedOpenLotId !== 'all' && lot.id !== selectedOpenLotId) return false;
      }
      if (filterTab === 'upcoming' && lot.status !== 'upcoming') return false;
      if (filterTab === 'closed'   && lot.status !== 'closed')   return false;
      if (filterTab === 'my') {
        const isLeading = auction.currentTeam && lot.highestBidderTeamId === auction.currentTeam.id;
        const isWon     = auction.currentTeam && lot.winnerTeamId === auction.currentTeam.id;
        if (!isLeading && !isWon) return false;
      }
      if (categoryFilter !== 'all' && lot.category !== categoryFilter) return false;
      return true;
    })
  );

  const categories: { key: ComponentCategory; label: string }[] = [
    { key: 'controller', label: 'Controllers' },
    { key: 'sensor',     label: 'Sensors'     },
    { key: 'motor',      label: 'Motors'      },
    { key: 'power',      label: 'Power Units' }
  ];
</script>

{#if auction.state}
  <div>
    <!-- Trading Floor Telemetry Banner -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 0.65rem 1rem; background: rgba(0, 242, 254, 0.04); border: 1px solid rgba(0, 242, 254, 0.15); border-radius: 8px; margin-bottom: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <Radio size={16} color="var(--accent-cyan)" class="pulse-icon" />
        <span style="font-size: 0.8rem; font-family: var(--font-display); font-weight: 600; color: var(--text-main);">
          MULTI-LOT TRADING FLOOR:
        </span>
        <span style="font-size: 0.8rem; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700;">
          {openLotsCount} LOTS LIVE SIMULTANEOUSLY
        </span>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono);">
        {upcomingCount} queued in pool • Auto-replenishes when lots conclude
      </div>
    </div>

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
      <!-- Filter Tabs -->
      <div class="tabs-header" style="margin-bottom: 0; padding-bottom: 0; border-bottom: none;">
        <button class="tab-btn {filterTab === 'open'     ? 'active' : ''}" onclick={() => (filterTab = 'open')}>
          Live Floor ({openLotsCount})
        </button>
        <button class="tab-btn {filterTab === 'upcoming' ? 'active' : ''}" onclick={() => (filterTab = 'upcoming')}>
          Upcoming Queue ({upcomingCount})
        </button>
        {#if auction.currentTeam}
          <button class="tab-btn {filterTab === 'my'   ? 'active' : ''}" onclick={() => (filterTab = 'my')}>
            My Targets ({myLeadingCount})
          </button>
        {/if}
        <button class="tab-btn {filterTab === 'closed'   ? 'active' : ''}" onclick={() => (filterTab = 'closed')}>
          Closed ({closedCount})
        </button>
        <button class="tab-btn {filterTab === 'all'      ? 'active' : ''}" onclick={() => (filterTab = 'all')}>
          All Lots ({lotsList.length})
        </button>
      </div>

      <!-- Category Filter -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <Layers size={14} color="var(--text-dim)" />
        <select
          bind:value={categoryFilter}
          class="cat-select"
        >
          <option value="all">All 4 Component Types</option>
          {#each categories as c (c.key)}
            <option value={c.key}>{c.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- 7. TEAM CLIENT: List of currently open lots they can bid on (scrollable/tabbed if more than one) -->
    {#if filterTab === 'open' && openLotsList.length > 1}
      <div class="open-lots-scroll-container">
        <div class="open-lots-scroll-track">
          <button
            class="open-lot-pill {selectedOpenLotId === 'all' ? 'active' : ''}"
            onclick={() => (selectedOpenLotId = 'all')}
          >
            <span>All Live Lots</span>
            <span class="pill-badge">{openLotsList.length}</span>
          </button>
          {#each openLotsList as l, idx (l.id)}
            {@const mins = Math.floor(l.timeLeftSeconds / 60)}
            {@const secs = l.timeLeftSeconds % 60}
            {@const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`}
            {@const isMine = auction.currentTeam ? l.highestBidderTeamId === auction.currentTeam.id : false}
            <button
              class="open-lot-pill {selectedOpenLotId === l.id ? 'active' : ''} {l.timeLeftSeconds <= 10 ? 'urgent' : ''}"
              onclick={() => (selectedOpenLotId = l.id)}
              aria-label={`Select Lot ${idx + 1}: ${l.title}, ${timeStr} remaining`}
            >
              <span class="pill-title">#{idx + 1} {l.title}</span>
              <span class="pill-timer {l.timeLeftSeconds <= 10 ? 'urgent' : ''}">{timeStr}</span>
              {#if isMine}
                <span class="pill-mine"><Check size={10} /> LEADING</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if filteredLots.length === 0}
      <div class="glass-panel" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-dim);">
        <Flame size={32} style="margin: 0 auto 0.75rem; opacity: 0.4;" />
        <h4 style="font-family: var(--font-display); color: var(--text-muted);">No Lots Match Selection</h4>
        <p style="font-size: 0.8rem; margin-top: 0.3rem;">Try switching tabs or selecting a different component category.</p>
      </div>
    {:else}
      <div class="lots-grid">
        {#each filteredLots as lot (lot.id)}
          <LotCard {lot} />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .open-lots-scroll-container {
    margin-bottom: 1.25rem;
    padding: 0.4rem 0.25rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .open-lots-scroll-track {
    display: flex;
    gap: 0.5rem;
    min-width: max-content;
    padding-bottom: 0.25rem;
  }

  .open-lot-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: 9999px;
    color: var(--text-muted);
    font-size: 0.78rem;
    font-family: var(--font-sans);
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    white-space: nowrap;
  }

  .open-lot-pill:hover {
    background: rgba(0, 242, 254, 0.08);
    border-color: rgba(0, 242, 254, 0.3);
    color: var(--text-main);
  }

  .open-lot-pill.active {
    background: rgba(0, 242, 254, 0.15);
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.2);
  }

  .open-lot-pill.urgent {
    border-color: rgba(255, 8, 68, 0.5);
  }

  .pill-title {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  .pill-timer {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-cyan);
    background: rgba(0, 0, 0, 0.35);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  .pill-timer.urgent {
    color: var(--accent-crimson);
    animation: blinkFast 0.8s infinite;
  }

  .pill-badge {
    background: rgba(255, 255, 255, 0.1);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 9999px;
    font-weight: 700;
  }

  .pill-mine {
    background: rgba(16, 185, 129, 0.25);
    color: var(--accent-emerald);
    border: 1px solid rgba(16, 185, 129, 0.5);
    font-size: 0.62rem;
    font-family: var(--font-mono);
    font-weight: 700;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  .cat-select {
    background-color: #0e121b;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
    color: var(--text-main);
    outline: none;
    color-scheme: dark;
  }

  .cat-select option {
    background-color: #0e121b;
    color: #f8fafc;
  }
</style>

