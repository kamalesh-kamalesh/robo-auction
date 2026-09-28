<script lang="ts">
  import { onMount } from 'svelte';
  import { Cpu, Crosshair, Zap, Wrench, ChevronDown, ChevronUp, History, Check, AlertCircle, AlertTriangle, ArrowUpRight, Clock, Skull } from '@lucide/svelte';
  import type { Lot, ComponentCategory } from '../../types/index.js';
  import { auction } from '../../stores/auction.svelte.js';

  let { lot }: { lot: Lot } = $props();

  onMount(() => {
    auction.watchLot(lot.id);
    return () => {
      auction.unwatchLot(lot.id);
    };
  });

  let showSpecs = $state(false);
  let showHistory = $state(false);
  let isSubmitting = $state(false);

  const isEventRunning = $derived(auction.state?.status === 'running');
  const isLotOpen = $derived(lot.status === 'open' && lot.timeLeftSeconds > 0);
  const isMyTeamHighest = $derived(auction.currentTeam ? lot.highestBidderTeamId === auction.currentTeam.id : false);
  const isTimeUrgent = $derived(isLotOpen && lot.timeLeftSeconds <= 10);
  const isTimeWarning = $derived(isLotOpen && lot.timeLeftSeconds <= 20 && !isTimeUrgent);
  const isTeamEliminated = $derived(Boolean(auction.currentTeam?.isEliminated));

  // 7. TEAM CLIENT: their own last bid per lot
  const myLastBid = $derived(
    auction.currentTeam
      ? lot.bidHistory.find(b => b.teamId === auction.currentTeam!.id)
      : null
  );

  // 7. TEAM CLIENT: Fixed increments relative to current bid (allowed by server: 1, 5, 10, 20, 25, 50, 100, 250, 500)
  const FIXED_INCREMENTS = [1, 5, 10, 25, 50, 100] as const;

  const mins = $derived(Math.floor(lot.timeLeftSeconds / 60));
  const secs = $derived(lot.timeLeftSeconds % 60);
  const formattedTime = $derived(`${mins}:${secs.toString().padStart(2, '0')}`);

  function getCategoryIcon(cat: ComponentCategory) {
    switch (cat) {
      case 'controller': return Cpu;
      case 'sensor': return Crosshair;
      case 'motor': return Wrench;
      case 'power': return Zap;
      default: return Cpu;
    }
  }

  const CategoryIcon = $derived(getCategoryIcon(lot.category));

  async function handlePlaceBid(amount: number) {
    if (!auction.currentTeam || isSubmitting || isTeamEliminated) return;
    isSubmitting = true;
    try {
      await auction.placeBid(lot.id, amount);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="glass-panel lot-card"
  class:active-highest={isMyTeamHighest}
  class:urgent={isTimeUrgent}
  class:lot-upcoming={lot.status === 'upcoming'}
>
  <!-- Header -->
  <div class="lot-header">
    <div style="flex: 1;">
      <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
        <div class="lot-category-tag">
          <CategoryIcon size={12} />
          <span>{lot.category.toUpperCase()}</span>
        </div>
        {#if lot.status === 'upcoming'}
          <span style="font-size: 0.65rem; background: rgba(255,255,255,0.06); color: var(--text-dim); padding: 0.15rem 0.4rem; border-radius: 4px; font-family: var(--font-mono);">
            QUEUED #{lot.queueOrder}
          </span>
        {/if}
        {#if lot.status === 'open'}
          <span
            style="font-size: 0.65rem; font-family: var(--font-mono); color: {lot.extensionsCount >= (lot.maxExtensions || 3) ? 'var(--accent-crimson)' : 'var(--text-dim)'}; display: flex; align-items: center; gap: 0.2rem;"
            title="Extensions: {lot.extensionsCount}/{lot.maxExtensions || 3} (90s hard ceiling)"
          >
            <Clock size={10} />
            Ext: {lot.extensionsCount || 0}/{lot.maxExtensions || 3}
          </span>
        {/if}
      </div>
      <h3 class="lot-title" style="margin-top: 0.3rem;">{lot.title}</h3>
    </div>

    <div class="lot-timer">
      <span class="timer-label">
        {lot.status === 'upcoming' ? 'Status' : lot.status === 'closed' ? 'Result' : 'Time Remaining'}
      </span>
      <div class="timer-digits" class:urgent={isTimeUrgent} class:warning={isTimeWarning}>
        {lot.status === 'closed' ? 'CLOSED' : lot.status === 'upcoming' ? 'IN QUEUE' : formattedTime}
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="lot-body">
    <p class="lot-desc">{lot.description}</p>

    <!-- Specs Accordion -->
    <div>
      <button
        onclick={() => (showSpecs = !showSpecs)}
        aria-expanded={showSpecs}
        aria-label="Toggle technical specifications"
        style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: var(--text-muted);"
      >
        <span>Technical Specifications</span>
        {#if showSpecs}<ChevronUp size={13} />{:else}<ChevronDown size={13} />{/if}
      </button>

      {#if showSpecs}
        <div class="lot-specs-list" style="margin-top: 0.5rem;">
          {#each Object.entries(lot.specifications || {}) as [key, val]}
            <div class="spec-item">
              <span class="spec-key">{key}</span>
              <span class="spec-val">{val}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Pricing Box -->
    <div class="lot-pricing-box">
      <div>
        <div class="price-sub">
          {lot.highestBidderTeamId ? 'Current Highest Bid' : 'Starting Bid'}
        </div>
        <div class="price-number">${lot.currentBid.toLocaleString()}</div>
      </div>

      <div>
        {#if lot.status === 'closed'}
          <div class="bidder-tag mine">
            {#if lot.winnerTeamId}
              <Check size={14} />
              <span>WON BY {lot.highestBidderTeamName}</span>
            {:else}
              <AlertCircle size={14} />
              <span>UNSOLD</span>
            {/if}
          </div>
        {:else if lot.status === 'upcoming'}
          <div class="bidder-tag other">
            <Clock size={13} />
            <span>Auto-Opens When Active Lot Closes</span>
          </div>
        {:else if isMyTeamHighest}
          <div class="bidder-tag mine">
            <Check size={14} />
            <span>YOUR BID LEADING</span>
          </div>
        {:else if lot.highestBidderTeamName}
          <div class="bidder-tag other">
            <ArrowUpRight size={13} />
            <span>Leader: {lot.highestBidderTeamName}</span>
          </div>
        {:else}
          <div class="bidder-tag other">
            <AlertCircle size={13} />
            <span>No Bids Yet</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- 7. TEAM CLIENT: their own last bid per lot -->
    {#if auction.role === 'team'}
      <div class="my-last-bid-bar">
        <span class="my-bid-label">Your Last Bid on This Lot:</span>
        {#if myLastBid}
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <span class="my-bid-val">${myLastBid.amount.toLocaleString()}</span>
            {#if isMyTeamHighest}
              <span class="my-bid-tag leading">
                <Check size={11} /> LEADING
              </span>
            {:else}
              <span class="my-bid-tag outbid">
                <AlertTriangle size={11} /> OUTBID
              </span>
            {/if}
          </div>
        {:else}
          <span class="my-bid-none">No bids placed yet</span>
        {/if}
      </div>
    {/if}

    <!-- Host Quick Actions -->
    {#if auction.role === 'host'}
      <div style="display: flex; gap: 0.45rem; padding: 0.5rem 0; border-top: 1px solid var(--border-subtle); flex-wrap: wrap;">
        {#if lot.status === 'open'}
          <button
            class="btn-secondary"
            style="font-size: 0.72rem; padding: 0.3rem 0.6rem;"
            disabled={lot.extensionsCount >= (lot.maxExtensions || 3)}
            onclick={() => auction.hostAction('EXTEND_TIME', lot.id, 15)}
            title={lot.extensionsCount >= (lot.maxExtensions || 3) ? 'Max 3 extensions reached' : '+15s extension'}
          >+15s</button>
          <button
            class="btn-secondary"
            style="font-size: 0.72rem; padding: 0.3rem 0.6rem;"
            disabled={lot.extensionsCount >= (lot.maxExtensions || 3)}
            onclick={() => auction.hostAction('EXTEND_TIME', lot.id, 30)}
            title={lot.extensionsCount >= (lot.maxExtensions || 3) ? 'Max 3 extensions reached' : '+30s extension'}
          >+30s</button>
          <button
            class="btn-secondary"
            style="font-size: 0.72rem; padding: 0.3rem 0.6rem; color: var(--accent-crimson);"
            onclick={() => auction.hostAction('CLOSE_LOT', lot.id)}
          >Close Now</button>
        {/if}
        {#if lot.status === 'closed'}
          <button
            class="btn-secondary"
            style="font-size: 0.72rem; padding: 0.3rem 0.6rem; color: var(--accent-cyan);"
            onclick={() => auction.hostAction('REOPEN_LOT', lot.id, 60)}
          >Reopen 60s</button>
        {/if}
        <div style="margin-left: auto; font-size: 0.7rem; color: var(--text-dim); align-self: center;">
          Fair Value: ${lot.fairValue.toLocaleString()}
        </div>
      </div>
    {/if}

    <!-- Bidding Controls -->
    {#if auction.role === 'team'}
      <div class="bid-controls">
        {#if isTeamEliminated}
          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem; background: rgba(255, 8, 68, 0.1); border: 1px solid rgba(255, 8, 68, 0.25); border-radius: 6px; color: var(--accent-crimson); font-size: 0.75rem; font-family: var(--font-mono);">
            <Skull size={14} />
            <span>UNIT ELIMINATED: Bidding permissions revoked. View only.</span>
          </div>
        {:else if lot.status === 'upcoming'}
          <div style="padding: 0.65rem; background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--border-subtle); border-radius: 6px; text-align: center; font-size: 0.75rem; color: var(--text-dim);">
            Lot is in queue (#{lot.queueOrder}). Bidding will open automatically when an active lot concludes.
          </div>
        {:else}
          <!-- 7. TEAM CLIENT: Bid buttons use fixed increments relative to current bid, NEVER free text entry -->
          <div class="fixed-increments-container">
            <div class="fixed-increments-header">
              <span>Fixed Increment Bids</span>
              <span class="relative-note">Relative to Current Bid (${lot.currentBid.toLocaleString()})</span>
            </div>
            <div class="fixed-bids-grid">
              {#each FIXED_INCREMENTS as inc}
                {@const bidAmount = lot.currentBid + inc}
                {@const currentBalance = auction.currentTeam ? (auction.currentTeam.balance ?? auction.currentTeam.availableBudget) : 0}
                {@const canAfford = bidAmount <= currentBalance}
                <button
                  class="btn-fixed-bid"
                  disabled={!isEventRunning || !isLotOpen || isMyTeamHighest || isSubmitting || !canAfford}
                  onclick={() => handlePlaceBid(bidAmount)}
                  aria-label={`BID ${inc} POINTS, TOTAL $${bidAmount.toLocaleString()}`}
                  title={canAfford ? `Bid +$${inc} (New Bid: $${bidAmount.toLocaleString()})` : `Insufficient balance ($${currentBalance.toLocaleString()} available)`}
                >
                  <span class="inc-badge">BID +{inc} PTS</span>
                  <span class="inc-price">${bidAmount.toLocaleString()}</span>
                </button>
              {/each}
            </div>
          </div>

          {#if isMyTeamHighest}
            <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: var(--accent-emerald); margin-top: 0.2rem;">
              <Check size={12} />
              <span>You hold the highest bid. Sit tight!</span>
            </div>
          {/if}
          {#if !isEventRunning && auction.state?.status !== 'ended'}
            <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: var(--text-dim); margin-top: 0.2rem;">
              <AlertCircle size={12} />
              <span>Waiting for Host to start bidding floor.</span>
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- History Toggle -->
    <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.6rem;">
      <button
        onclick={() => (showHistory = !showHistory)}
        aria-expanded={showHistory}
        aria-label={`Toggle bid history, ${lot.bidsCount} bids`}
        style="display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 0.72rem; color: var(--text-dim);"
      >
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <History size={12} />
          <span>Bid History ({lot.bidsCount})</span>
        </div>
        {#if showHistory}<ChevronUp size={12} />{:else}<ChevronDown size={12} />{/if}
      </button>

      {#if showHistory}
        <div style="margin-top: 0.5rem; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.3rem;">
          {#if lot.bidHistory.length === 0}
            <div style="font-size: 0.7rem; color: var(--text-dim); padding: 0.4rem 0;">No bids recorded yet.</div>
          {:else}
            {#each lot.bidHistory as b (b.id)}
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
                <span style="color: {b.teamId === auction.currentTeam?.id ? 'var(--accent-emerald)' : 'var(--text-main)'}; font-weight: 600;">
                  {b.teamName}
                </span>
                <span style="font-family: var(--font-mono); color: var(--accent-cyan);">
                  ${b.amount.toLocaleString()}
                </span>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .my-last-bid-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .my-bid-label {
    color: var(--text-dim);
    font-size: 0.7rem;
    text-transform: uppercase;
    font-family: var(--font-display);
    letter-spacing: 0.5px;
  }

  .my-bid-val {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--text-main);
  }

  .my-bid-none {
    color: var(--text-dim);
    font-size: 0.72rem;
    font-style: italic;
  }

  .my-bid-tag {
    font-size: 0.62rem;
    font-weight: 700;
    font-family: var(--font-mono);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .my-bid-tag.leading {
    background: rgba(16, 185, 129, 0.2);
    color: var(--accent-emerald);
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .my-bid-tag.outbid {
    background: rgba(255, 8, 68, 0.2);
    color: var(--accent-crimson);
    border: 1px solid rgba(255, 8, 68, 0.4);
  }

  .fixed-increments-container {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .fixed-increments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.68rem;
    text-transform: uppercase;
    color: var(--text-dim);
    font-family: var(--font-display);
  }

  .relative-note {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--accent-cyan);
    opacity: 0.8;
  }

  .fixed-bids-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.45rem;
  }

  @media (max-width: 480px) {
    .fixed-bids-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .btn-fixed-bid {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.3rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .btn-fixed-bid:hover:not(:disabled) {
    background: rgba(0, 242, 254, 0.15);
    border-color: var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.25);
    transform: translateY(-1px);
  }

  .btn-fixed-bid:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn-fixed-bid:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .inc-badge {
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-cyan);
    letter-spacing: 0.5px;
  }

  .inc-price {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-main);
    font-weight: 600;
  }
</style>

