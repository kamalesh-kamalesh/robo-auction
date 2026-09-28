<script lang="ts">
  import { Bot, Volume2, VolumeX, Trophy, Shield, Tv, Users, LogOut, Radio, Play, Pause, Clock, CheckCircle, Key } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  let { onOpenLeaderboard, onOpenAuth }: {
    onOpenLeaderboard: () => void;
    onOpenAuth: () => void;
  } = $props();

  const eventPhase = $derived(auction.state?.phase ?? 'LOBBY');
  const eventStatus = $derived(auction.state?.status ?? 'lobby');

  function navTo(hash: string) {
    window.location.hash = hash;
  }
</script>

<header class="app-header">
  <div class="brand-section">
    <button class="brand-btn" onclick={() => navTo('#team')} title="Robo Auction Home">
      <div class="brand-logo-icon">
        <Bot size={22} />
      </div>
      <div class="brand-text">
        <div class="brand-title">ROBO AUCTION</div>
        <div class="brand-sub">20-Component Build Challenge</div>
      </div>
    </button>

    <!-- Phase / Status Pill -->
    <div class="status-chip {eventStatus}" role="status" aria-label={`Event phase: ${eventPhase}`}>
      {#if eventStatus === 'running'}
        <Play size={10} style="fill: currentColor;" />
        <span>PHASE: {eventPhase}</span>
      {:else if eventStatus === 'paused'}
        <Pause size={10} style="fill: currentColor;" />
        <span>PAUSED</span>
      {:else if eventStatus === 'lobby'}
        <Clock size={10} />
        <span>LOBBY PREP</span>
      {:else if eventStatus === 'ended'}
        <CheckCircle size={10} />
        <span>{eventPhase}</span>
      {/if}
    </div>

    <div class="sync-indicator">
      <Radio size={12} color={auction.isConnected ? '#10b981' : '#ef4444'} />
      <span style="color: {auction.isConnected ? '#10b981' : '#ef4444'};">
        {auction.isConnected ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  </div>

  <!-- Navigation View Switchers -->
  <div class="view-switch-tabs">
    <button
      class="view-link"
      class:active={auction.role === 'team' && !window.location.hash.includes('host') && !window.location.hash.includes('stage')}
      onclick={() => navTo('#team')}
    >
      <Users size={14} />
      <span>Participant Floor</span>
    </button>

    <button
      class="view-link"
      class:active={window.location.hash.includes('stage')}
      onclick={() => navTo('#stage')}
    >
      <Tv size={14} />
      <span>Arena Projector</span>
    </button>

    <button
      class="view-link"
      class:active={window.location.hash.includes('host') || auction.role === 'host'}
      onclick={() => navTo('#host')}
    >
      <Shield size={14} />
      <span>Host Matrix</span>
    </button>

    <button
      class="view-link"
      class:active={window.location.hash.includes('login')}
      onclick={() => navTo('#login')}
    >
      <Key size={14} />
      <span>Login Portal</span>
    </button>
  </div>

  <div class="header-actions">
    <button
      class="btn-icon"
      onclick={() => auction.toggleMute()}
      title={auction.isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
      aria-label={auction.isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
    >
      {#if auction.isMuted}
        <VolumeX size={18} />
      {:else}
        <Volume2 size={18} />
      {/if}
    </button>

    <button
      class="btn-secondary"
      onclick={onOpenLeaderboard}
      title="View Live Standings & Robot Scores"
      aria-label="View live standings and leaderboard"
    >
      <Trophy size={16} color="#f59e0b" />
      <span>Leaderboard</span>
    </button>

    <button
      class="btn-secondary"
      onclick={onOpenAuth}
      title="Switch Role or Team"
      aria-label="Open access terminal and role selection"
    >
      {#if auction.role === 'host'}
        <Shield size={16} color="#ef4444" />
        <span>Host Mode</span>
      {:else if auction.role === 'team'}
        <Users size={16} color="#00e5ff" />
        <span>{auction.currentTeam ? auction.currentTeam.code : 'Select Team'}</span>
      {:else}
        <Tv size={16} color="#3b82f6" />
        <span>Arena View</span>
      {/if}
    </button>

    {#if auction.currentTeam}
      <button
        class="btn-icon"
        onclick={() => {
          auction.logout();
          navTo('#login');
        }}
        title="Log Out / Switch Unit"
        aria-label="Log out of current team unit and return to login page"
      >
        <LogOut size={16} />
      </button>
    {/if}
  </div>
</header>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(9, 14, 24, 0.95);
    border-bottom: 1px solid rgba(0, 229, 255, 0.2);
    padding: 0.75rem 1.5rem;
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .brand-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(0, 229, 255, 0.15);
    border: 1px solid rgba(0, 229, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00e5ff;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.25);
  }

  .brand-title {
    font-size: 1.15rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    color: #f8fafc;
  }

  .brand-sub {
    font-size: 0.65rem;
    color: #94a3b8;
    letter-spacing: 0.02em;
  }

  .status-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .status-chip.running {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-chip.paused {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .status-chip.lobby, .status-chip.ended {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    border: 1px solid rgba(0, 229, 255, 0.3);
  }

  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .view-switch-tabs {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.2rem;
    gap: 0.2rem;
  }

  @media (max-width: 900px) {
    .view-switch-tabs {
      display: none;
    }
  }

  .view-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .view-link:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.05);
  }

  .view-link.active {
    background: rgba(0, 229, 255, 0.18);
    color: #00e5ff;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .btn-icon {
    width: 34px;
    height: 34px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-icon:hover {
    color: #f8fafc;
    border-color: rgba(0, 229, 255, 0.4);
  }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary:hover {
    background: rgba(0, 229, 255, 0.12);
    border-color: #00e5ff;
  }
</style>
