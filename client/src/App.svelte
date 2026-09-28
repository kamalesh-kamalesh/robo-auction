<script lang="ts">
  import { onMount } from 'svelte';
  import { auction } from './stores/auction.svelte.js';
  import Header from './components/common/Header.svelte';
  import NotificationToast from './components/common/NotificationToast.svelte';
  import TeamHUD from './components/team/TeamHUD.svelte';
  import ComponentAuctionView from './components/auction/ComponentAuctionView.svelte';
  import RobotAssemblyCanvas from './components/assembly/RobotAssemblyCanvas.svelte';
  import RobotTestingLab from './components/testing/RobotTestingLab.svelte';
  import MyComponentsView from './components/team/MyComponentsView.svelte';
  import LeaderboardView from './components/leaderboard/LeaderboardView.svelte';
  import HostDashboard from './components/host/HostDashboard.svelte';
  import ProjectorArenaView from './components/projector/ProjectorArenaView.svelte';
  import AuthModal from './components/auth/AuthModal.svelte';
  import LoginPage from './components/auth/LoginPage.svelte';
  import { Shield, Key } from '@lucide/svelte';

  type TeamTab = 'auction' | 'assembly' | 'testing' | 'inventory' | 'leaderboard';

  let currentTab = $state<TeamTab>('auction');
  let isAuthOpen = $state(false);
  let hostPassInput = $state('');
  let hostError = $state('');
  let isVerifyingHost = $state(false);

  // Read route from hash e.g. #host, #stage, #team, #login
  let currentRoute = $state<'floor' | 'host' | 'stage' | 'login'>('floor');

  const currentPhase = $derived(auction.state?.phase || 'LOBBY');

  onMount(() => {
    function parseRoute() {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('login') || hash.includes('auth')) {
        currentRoute = 'login';
      } else if (hash.includes('host')) {
        currentRoute = 'host';
        if (auction.role !== 'host') {
          const savedPass = localStorage.getItem('robo_host_pass');
          if (savedPass) auction.loginAsHost(savedPass);
        }
      } else if (hash.includes('stage') || hash.includes('projector')) {
        currentRoute = 'stage';
        if (auction.role !== 'spectator') auction.loginAsSpectator();
      } else {
        currentRoute = 'floor';
      }
    }

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    return () => window.removeEventListener('hashchange', parseRoute);
  });

  async function handleUnlockHost(e: Event) {
    e.preventDefault();
    if (!hostPassInput.trim()) return;
    hostError = '';
    isVerifyingHost = true;
    try {
      const res = await auction.loginAsHost(hostPassInput.trim());
      if (!res.success) {
        hostError = res.message || 'Incorrect host passcode.';
      }
    } finally {
      isVerifyingHost = false;
    }
  }
</script>

<div class="app-root">
  {#if currentRoute !== 'stage' && currentRoute !== 'login'}
    <Header
      onOpenLeaderboard={() => (currentTab = 'leaderboard')}
      onOpenAuth={() => (isAuthOpen = true)}
    />
  {/if}

  {#if currentRoute === 'login'}
    <!-- Dedicated Login Page for Participant, Host, and Spectator -->
    <LoginPage />
  {:else if currentRoute === 'host' || auction.role === 'host'}
    {#if auction.role === 'host'}
      <!-- Authenticated Host Master Command Room -->
      <HostDashboard />
    {:else}
      <!-- Password-Gated Route for Host Dashboard -->
      <div class="host-login-modal">
        <div class="host-shield-icon">
          <Shield size={32} color="#00e5ff" />
        </div>
        <h2>Host Command Matrix Gateway</h2>
        <p>Password-gated control center. Enter host passcode to manage auction rounds, assembly, and testing.</p>

        {#if hostError}
          <div class="host-error-box">{hostError}</div>
        {/if}

        <form onsubmit={handleUnlockHost} class="host-login-form">
          <div class="input-wrap">
            <Key size={16} class="input-icon" />
            <input
              type="password"
              placeholder="Host Passcode (Default: host2026)"
              bind:value={hostPassInput}
              class="passcode-input"
            />
          </div>
          <button type="submit" class="btn-unlock" disabled={isVerifyingHost}>
            {isVerifyingHost ? 'Verifying...' : 'Unlock Host Command'}
          </button>
        </form>
      </div>
    {/if}
  {:else if currentRoute === 'stage' || auction.role === 'spectator'}
    <!-- Arena Projector Screen (16:9 View) -->
    <ProjectorArenaView />
  {:else}
    <!-- Participant Team Interface -->
    {#if auction.role === 'team'}
      <TeamHUD />
    {/if}

    <main class="main-content">
      <!-- Participant Navigation Tabs (Section 31) -->
      <nav class="participant-nav" aria-label="Robot Auction Workspace Navigation">
        <div class="nav-tablist" role="tablist" aria-label="Robot Auction Views">
          <button
            class="nav-tab"
            class:active={currentTab === 'auction'}
            onclick={() => (currentTab = 'auction')}
            role="tab"
            aria-selected={currentTab === 'auction'}
            aria-label="Live Auction Floor - Bid on Robot Components"
          >
            🏷️ LIVE AUCTION
          </button>

          <button
            class="nav-tab"
            class:active={currentTab === 'assembly'}
            onclick={() => (currentTab = 'assembly')}
            role="tab"
            aria-selected={currentTab === 'assembly'}
            aria-label="Robot Assembly Deck - Integrate 20 Robot Subsystems"
          >
            🧩 ROBOT ASSEMBLY
          </button>

          <button
            class="nav-tab"
            class:active={currentTab === 'testing'}
            onclick={() => (currentTab = 'testing')}
            role="tab"
            aria-selected={currentTab === 'testing'}
            aria-label="Performance Testing Arena - Run 6 Benchmark Tasks"
          >
            ⚡ PERFORMANCE TESTING
          </button>

          <button
            class="nav-tab"
            class:active={currentTab === 'inventory'}
            onclick={() => (currentTab = 'inventory')}
            role="tab"
            aria-selected={currentTab === 'inventory'}
            aria-label="My Components Inventory - View Purchased Items"
          >
            📦 MY COMPONENTS
          </button>

          <button
            class="nav-tab"
            class:active={currentTab === 'leaderboard'}
            onclick={() => (currentTab = 'leaderboard')}
            role="tab"
            aria-selected={currentTab === 'leaderboard'}
            aria-label="Tournament Standings & Live Leaderboard"
          >
            🏆 LEADERBOARD
          </button>
        </div>
      </nav>

      <!-- Active View Display -->
      <div class="view-viewport">
        {#if currentTab === 'auction'}
          <ComponentAuctionView />
        {:else if currentTab === 'assembly'}
          <RobotAssemblyCanvas />
        {:else if currentTab === 'testing'}
          <RobotTestingLab />
        {:else if currentTab === 'inventory'}
          <MyComponentsView />
        {:else if currentTab === 'leaderboard'}
          <LeaderboardView />
        {/if}
      </div>
    </main>
  {/if}

  <!-- Screen reader live region -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {auction.screenReaderAnnouncement}
  </div>

  <NotificationToast />

  <AuthModal isOpen={isAuthOpen} onClose={() => (isAuthOpen = false)} />
</div>

<style>
  .app-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: radial-gradient(circle at 50% 10%, #0d1626 0%, #070b14 100%);
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .participant-nav {
    background: rgba(13, 22, 38, 0.7);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 12px;
    padding: 0.4rem;
    overflow-x: auto;
  }

  .nav-tablist {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  .nav-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    text-align: center;
  }

  .nav-tab:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.04);
  }

  .nav-tab.active {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    border: 1px solid rgba(0, 229, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
  }

  .view-viewport {
    width: 100%;
  }

  /* Host Login Modal */
  .host-login-modal {
    max-width: 480px;
    margin: 4rem auto;
    padding: 2.5rem;
    border-radius: 16px;
    border: 1px solid rgba(0, 229, 255, 0.3);
    background: rgba(13, 22, 38, 0.95);
    text-align: center;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  }

  .host-shield-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid #00e5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .host-error-box {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #fca5a5;
    padding: 0.6rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .host-login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-wrap {
    position: relative;
  }

  :global(.input-icon) {
    position: absolute;
    left: 14px;
    top: 14px;
    color: #94a3b8;
  }

  .passcode-input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 2.75rem;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.95rem;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
  }

  .passcode-input:focus {
    border-color: #00e5ff;
  }

  .btn-unlock {
    background: linear-gradient(135deg, #00e5ff, #0072ff);
    color: #090e18;
    font-weight: 800;
    font-size: 0.95rem;
    padding: 0.85rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .btn-unlock:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .btn-unlock:disabled {
    opacity: 0.5;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
