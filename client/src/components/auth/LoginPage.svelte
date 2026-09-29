<script lang="ts">
  import { Shield, Users, Tv, Key, Lock, ArrowRight, ShieldCheck, Check, Sparkles, Bot, AlertTriangle, UserPlus } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  let activeTab = $state<'participant' | 'host' | 'spectator'>('participant');

  // Participant Form
  let teamCodeInput = $state('');
  let teamNameInput = $state('');
  let teamPinInput = $state('');
  let participantError = $state('');
  let isParticipantSubmitting = $state(false);
  let rosterSearch = $state('');

  // Host Form
  let hostPassInput = $state('');
  let hostError = $state('');
  let isHostSubmitting = $state(false);

  // Available genuinely registered teams (0 mock teams)
  const teams = $derived(auction.state ? Object.values(auction.state.teams) : []);
  const filteredTeams = $derived(
    teams.filter(t => 
      t.code.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(rosterSearch.toLowerCase())
    )
  );

  async function handleParticipantSubmit(e: Event) {
    e.preventDefault();
    if (!teamCodeInput.trim()) {
      participantError = 'Please enter your Team / Squad Code (e.g. TEAM-01 or ALPHA).';
      return;
    }
    if (!teamPinInput.trim()) {
      participantError = 'Please enter your Team Security PIN.';
      return;
    }
    if (!auction.isConnected) {
      participantError = 'Backend server is offline. Please start the server with "npm run dev" to connect.';
      return;
    }
    participantError = '';
    isParticipantSubmitting = true;
    try {
      const res = await auction.loginAsTeam(
        teamCodeInput.trim().toUpperCase(),
        teamPinInput.trim(),
        teamNameInput.trim() || undefined
      );
      if (res.success) {
        window.location.hash = '#team';
      } else {
        participantError = res.message || 'Team credentials not recognized.';
      }
    } finally {
      isParticipantSubmitting = false;
    }
  }

  function handleSelectTeam(team: { code: string; name: string }) {
    teamCodeInput = team.code;
    teamNameInput = team.name;
    participantError = '';
  }

  async function handleHostSubmit(e: Event) {
    e.preventDefault();
    if (!hostPassInput.trim()) {
      hostError = 'Please enter the Host Admin Passcode.';
      return;
    }
    if (!auction.isConnected) {
      hostError = 'Backend server is offline. Please start the server with "npm run dev" to connect.';
      return;
    }
    hostError = '';
    isHostSubmitting = true;
    try {
      const res = await auction.loginAsHost(hostPassInput.trim());
      if (res.success) {
        window.location.hash = '#host';
      } else {
        hostError = res.message || 'Incorrect host administrative passcode.';
      }
    } finally {
      isHostSubmitting = false;
    }
  }

  function handleLaunchSpectator() {
    auction.loginAsSpectator();
    window.location.hash = '#stage';
  }
</script>

<div class="login-page-root">
  <div class="login-container">
    <!-- Brand Header -->
    <header class="login-brand-header">
      <div class="brand-badge-row">
        {#if auction.isConnected}
          <span class="live-pulse-badge online">
            <span class="pulse-dot"></span>
            <span>COMPETITION SERVER ONLINE</span>
          </span>
        {:else}
          <span class="live-pulse-badge offline">
            <span class="pulse-dot pulse-red"></span>
            <span>SERVER CONNECTING / OFFLINE</span>
          </span>
        {/if}
        <span class="budget-pill">STARTING ALLOCATION: ₹100,000</span>
      </div>

      <div class="brand-icon-box">
        <Bot size={44} color="#00e5ff" />
      </div>

      <h1 class="brand-heading">ROBO AUCTION</h1>
      <p class="brand-tagline">
        Real-Time Tactical Bidding Floor • Modular Robot Assembly • 6-Task Benchmark Lab
      </p>
    </header>

    <!-- Role Selection Tabs -->
    <div class="role-selector-tabs" role="tablist" aria-label="Authentication Role Selection">
      <button
        class="role-tab"
        class:active={activeTab === 'participant'}
        onclick={() => (activeTab = 'participant')}
        role="tab"
        aria-selected={activeTab === 'participant'}
        aria-label="Switch to Participant Team Login"
      >
        <Users size={18} />
        <span>Participant Unit</span>
      </button>

      <button
        class="role-tab"
        class:active={activeTab === 'host'}
        onclick={() => (activeTab = 'host')}
        role="tab"
        aria-selected={activeTab === 'host'}
        aria-label="Switch to Host Administrative Console"
      >
        <Shield size={18} />
        <span>Host Console</span>
      </button>

      <button
        class="role-tab"
        class:active={activeTab === 'spectator'}
        onclick={() => (activeTab = 'spectator')}
        role="tab"
        aria-selected={activeTab === 'spectator'}
        aria-label="Switch to Spectator Arena Projector Mode"
      >
        <Tv size={18} />
        <span>Arena Projector</span>
      </button>
    </div>

    <!-- Tab 1: Participant Login & Registration -->
    {#if activeTab === 'participant'}
      <section class="portal-card" aria-label="Participant Unit Login Portal">
        <div class="portal-header">
          <div>
            <h2 class="portal-title">Participant Unit Access & Registration</h2>
            <p class="portal-desc">
              Sign in with your squad credentials or register a new team on the fly.
            </p>
          </div>
          <span class="team-count-badge">
            {teams.length} {teams.length === 1 ? 'Squad Registered' : 'Squads Registered'}
          </span>
        </div>

        {#if participantError}
          <div class="alert-error" role="alert">
            <AlertTriangle size={18} />
            <span>{participantError}</span>
          </div>
        {/if}

        <form onsubmit={handleParticipantSubmit} class="login-form">
          <div class="input-grid">
            <div class="form-group">
              <label for="team-code-input" class="form-label">
                Team Code / Squad ID <span class="req">*</span>
              </label>
              <div class="input-wrap">
                <Users size={16} class="input-icon" />
                <input
                  id="team-code-input"
                  type="text"
                  placeholder="e.g. TEAM-01 or SQUAD-A"
                  bind:value={teamCodeInput}
                  class="field-input uppercase-text"
                  aria-required="true"
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="team-name-input" class="form-label">
                Squad Name <span class="opt">(Optional)</span>
              </label>
              <div class="input-wrap">
                <Bot size={16} class="input-icon" />
                <input
                  id="team-name-input"
                  type="text"
                  placeholder="e.g. Bangalore Robotics"
                  bind:value={teamNameInput}
                  class="field-input"
                  autocomplete="organization"
                />
              </div>
            </div>

            <div class="form-group full-width">
              <label for="team-pin-input" class="form-label">
                Security PIN <span class="req">*</span>
              </label>
              <div class="input-wrap">
                <Lock size={16} class="input-icon" />
                <input
                  id="team-pin-input"
                  type="password"
                  placeholder="Choose or enter 4-digit PIN (e.g. 1001)"
                  bind:value={teamPinInput}
                  class="field-input"
                  aria-required="true"
                  autocomplete="current-password"
                />
              </div>
            </div>
          </div>

          <div class="pin-hint-bar">
            <UserPlus size={14} color="var(--accent-cyan)" />
            <span>New team? Entering a new Team Code and PIN auto-registers your unit with the starting ₹100,000 budget!</span>
          </div>

          <button
            type="submit"
            class="btn-submit-action participant-glow"
            class:btn-disabled-offline={!auction.isConnected}
            disabled={isParticipantSubmitting}
            aria-label="Authenticate credentials and enter competition battle deck"
          >
            {#if isParticipantSubmitting}
              <span>CONNECTING UNIT...</span>
            {:else if !auction.isConnected}
              <AlertTriangle size={18} />
              <span>SERVER OFFLINE (START SERVER WITH "npm run dev")</span>
            {:else}
              <span>⚡ ENTER COMPETITION BATTLE DECK</span>
              <ArrowRight size={18} />
            {/if}
          </button>

          <!-- DPDP Act Minimal Data Collection Compliance Notice -->
          <div class="privacy-notice-box" role="region" aria-label="Privacy and Data Minimization Notice">
            <ShieldCheck size={18} color="#00e5ff" style="flex-shrink: 0; margin-top: 2px;" />
            <div class="notice-text">
              <strong style="color: #00e5ff;">Data Minimization Notice (DPDP Act, 2023):</strong>
              Only essential operational credentials (Team Code & PIN) are gathered to authenticate your competition session. No personal names, email addresses, phone numbers, or third-party behavioral trackers are stored or transmitted.
            </div>
          </div>
        </form>

        <!-- Connected Squads (Real participants only, no mock data) -->
        {#if teams.length > 0}
          <div class="roster-section">
            <div class="roster-header">
              <span class="roster-label">CONNECTED SQUADS IN THIS TOURNAMENT ({teams.length}):</span>
              {#if teams.length > 6}
                <input
                  type="search"
                  placeholder="Filter squads..."
                  bind:value={rosterSearch}
                  class="roster-search-field"
                  aria-label="Filter registered teams"
                />
              {/if}
            </div>

            <div class="roster-grid">
              {#each filteredTeams as t (t.id)}
                {@const isSelected = teamCodeInput.toUpperCase() === t.code.toUpperCase()}
                <button
                  type="button"
                  class="roster-card"
                  class:selected={isSelected}
                  onclick={() => handleSelectTeam(t)}
                  aria-label="Select {t.code} {t.name}"
                >
                  <span class="unit-dot" style="background: {t.avatarColor};"></span>
                  <div class="unit-text">
                    <div class="unit-code">{t.code}</div>
                    <div class="unit-name">{t.name}</div>
                  </div>
                  {#if isSelected}
                    <Check size={14} color="#00e5ff" class="check-icon" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <div class="empty-roster-note">
            <span>✨ No participant squads registered yet. Enter your Squad ID and PIN above to begin!</span>
          </div>
        {/if}
      </section>

    <!-- Tab 2: Host Console Login -->
    {:else if activeTab === 'host'}
      <section class="portal-card" aria-label="Host Administrative Console Gateway">
        <div class="portal-header">
          <div>
            <h2 class="portal-title">Host Administrative Gateway</h2>
            <p class="portal-desc">
              Password-gated control center for competition directors, timekeepers, and event coordinators.
            </p>
          </div>
          <span class="host-pill">Admin Authority</span>
        </div>

        {#if hostError}
          <div class="alert-error" role="alert">
            <AlertTriangle size={18} />
            <span>{hostError}</span>
          </div>
        {/if}

        <form onsubmit={handleHostSubmit} class="login-form">
          <div class="form-group">
            <label for="host-pass-field" class="form-label">
              Host Master Passcode <span class="req">*</span>
            </label>
            <div class="input-wrap">
              <Key size={16} class="input-icon" />
              <input
                id="host-pass-field"
                type="password"
                placeholder="Default: host2026"
                bind:value={hostPassInput}
                class="field-input"
                aria-required="true"
                autocomplete="current-password"
              />
            </div>
          </div>

          <div class="host-capabilities-box">
            <div class="cap-title">MASTER CONSOLE PRIVILEGES:</div>
            <ul class="cap-list">
              <li>Manage 20 major robot components across Basic, Advanced, and Pro variants</li>
              <li>Live timer manipulation with +15s anti-snipe buffer extensions</li>
              <li>State machine transitions: Lobby ➔ Auction ➔ Assembly ➔ Testing ➔ Standings</li>
              <li>Real-time event logs, team management, and JSON audit log export</li>
            </ul>
          </div>

          <button
            type="submit"
            class="btn-submit-action host-glow"
            class:btn-disabled-offline={!auction.isConnected}
            disabled={isHostSubmitting}
            aria-label="Unlock host administrative master console"
          >
            {#if isHostSubmitting}
              <span>VALIDATING CREDENTIALS...</span>
            {:else if !auction.isConnected}
              <AlertTriangle size={18} />
              <span>SERVER OFFLINE (START SERVER WITH "npm run dev")</span>
            {:else}
              <Shield size={18} />
              <span>UNLOCK HOST COMMAND MATRIX</span>
            {/if}
          </button>
        </form>
      </section>

    <!-- Tab 3: Spectator Mode -->
    {:else if activeTab === 'spectator'}
      <section class="portal-card spectator-card" aria-label="Arena Spectator Projector Gateway">
        <div class="spectator-hero">
          <div class="arena-icon-ring">
            <Tv size={48} color="#3b82f6" />
          </div>
          <h2 class="spectator-title">Arena Auditorium Display</h2>
          <p class="spectator-desc">
            Optimized for 16:9 widescreen auditorium displays, public projectors, and spectator streaming feeds. Zero authentication required.
          </p>

          <div class="spectator-feature-chips">
            <span class="f-chip">Live Auction Clock</span>
            <span class="f-chip">Real-Time Bidding Ticker</span>
            <span class="f-chip">Standings Podium</span>
            <span class="f-chip">Autonomous Screen Updates</span>
          </div>

          <button
            type="button"
            class="btn-submit-action spectator-glow"
            onclick={handleLaunchSpectator}
            aria-label="Launch 16:9 Arena Projector view"
          >
            <Tv size={18} />
            <span>LAUNCH 16:9 ARENA PROJECTOR</span>
          </button>
        </div>
      </section>
    {/if}

    <!-- Footer Meta -->
    <footer class="login-footer">
      <div>ROBO AUCTION COMPLIANCE ARCHITECTURE • V2.4</div>
      <div class="footer-links">
        <button class="text-link" onclick={() => (window.location.hash = '#team')}>Battle Floor</button>
        <span>•</span>
        <button class="text-link" onclick={() => (window.location.hash = '#stage')}>Auditorium View</button>
        <span>•</span>
        <button class="text-link" onclick={() => (window.location.hash = '#host')}>Host Login</button>
      </div>
    </footer>
  </div>
</div>

<style>
  .login-page-root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2.5rem 1.5rem;
    background: radial-gradient(circle at 50% 15%, #0f1c34 0%, #07090e 85%);
    position: relative;
    box-sizing: border-box;
  }

  .login-page-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .login-container {
    width: 100%;
    max-width: 820px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
  }

  /* Header */
  .login-brand-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }

  .brand-badge-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .live-pulse-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #10b981;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
    animation: pulse 1.6s infinite ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .live-pulse-badge.offline {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  .pulse-dot.pulse-red {
    background: #ef4444;
    box-shadow: 0 0 8px #ef4444;
  }

  .budget-pill {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background: rgba(245, 175, 25, 0.12);
    border: 1px solid rgba(245, 175, 25, 0.3);
    color: #f5af19;
    font-size: 0.72rem;
    font-weight: 800;
    font-family: 'Courier New', monospace;
  }

  .brand-icon-box {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(79, 172, 254, 0.25));
    border: 1px solid rgba(0, 229, 255, 0.4);
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.25rem;
  }

  .brand-heading {
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    color: #f8fafc;
    margin: 0;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.35);
  }

  .brand-tagline {
    font-size: 0.9rem;
    color: #94a3b8;
    max-width: 580px;
    line-height: 1.4;
    margin: 0;
  }

  /* Role Selection Tabs */
  .role-selector-tabs {
    display: flex;
    gap: 0.5rem;
    background: rgba(13, 20, 34, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.35rem;
  }

  .role-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .role-tab:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.04);
  }

  .role-tab.active {
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 114, 255, 0.25));
    color: #00e5ff;
    border: 1px solid rgba(0, 229, 255, 0.4);
    box-shadow: 0 0 16px rgba(0, 229, 255, 0.2);
  }

  /* Portal Card */
  .portal-card {
    background: rgba(14, 21, 37, 0.85);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(0, 229, 255, 0.15);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .portal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding-bottom: 1rem;
  }

  .portal-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0 0 0.35rem 0;
  }

  .portal-desc {
    font-size: 0.82rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
  }

  .team-count-badge {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    border: 1px solid rgba(0, 229, 255, 0.3);
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .host-pill {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .alert-error {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  @media (max-width: 600px) {
    .input-grid {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #cbd5e1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .form-label .req {
    color: #ef4444;
  }

  .form-label .opt {
    color: #94a3b8;
    font-size: 0.7rem;
    text-transform: none;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-wrap .input-icon) {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    pointer-events: none;
  }

  .field-input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 2.75rem;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .field-input:focus {
    border-color: #00e5ff;
    box-shadow: 0 0 14px rgba(0, 229, 255, 0.25);
  }

  .uppercase-text {
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .pin-hint-bar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.74rem;
    color: #cbd5e1;
    background: rgba(0, 229, 255, 0.05);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 229, 255, 0.15);
  }

  .btn-submit-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    width: 100%;
    padding: 1rem;
    border-radius: 10px;
    font-weight: 900;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .participant-glow {
    background: linear-gradient(135deg, #00e5ff, #0072ff);
    color: #07090e;
    box-shadow: 0 0 24px rgba(0, 229, 255, 0.35);
  }

  .participant-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 32px rgba(0, 229, 255, 0.5);
  }

  .host-glow {
    background: linear-gradient(135deg, #ef4444, #b91c1c);
    color: #f8fafc;
    box-shadow: 0 0 24px rgba(239, 68, 68, 0.35);
  }

  .host-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 32px rgba(239, 68, 68, 0.5);
  }

  .spectator-glow {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: #f8fafc;
    box-shadow: 0 0 24px rgba(59, 130, 246, 0.35);
  }

  .spectator-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 32px rgba(59, 130, 246, 0.5);
  }

  .btn-submit-action.btn-disabled-offline {
    background: rgba(239, 68, 68, 0.18) !important;
    border: 1px solid rgba(239, 68, 68, 0.45) !important;
    color: #fca5a5 !important;
    box-shadow: none !important;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn-submit-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .privacy-notice-box {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
    background: rgba(0, 229, 255, 0.04);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 8px;
    font-size: 0.74rem;
    color: #cbd5e1;
    line-height: 1.45;
  }

  /* Connected Squads */
  .roster-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1.25rem;
  }

  .roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .roster-label {
    font-size: 0.72rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .roster-search-field {
    padding: 0.35rem 0.75rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #f8fafc;
    font-size: 0.75rem;
    outline: none;
    width: 180px;
  }

  .roster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 0.5rem;
    max-height: 180px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .roster-card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }

  .roster-card:hover {
    background: rgba(0, 229, 255, 0.08);
    border-color: rgba(0, 229, 255, 0.3);
  }

  .roster-card.selected {
    background: rgba(0, 229, 255, 0.15);
    border-color: #00e5ff;
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
  }

  .unit-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .unit-text {
    flex: 1;
    overflow: hidden;
  }

  .unit-code {
    font-size: 0.75rem;
    font-weight: 800;
    font-family: 'Courier New', monospace;
    color: #f8fafc;
  }

  .roster-card.selected .unit-code {
    color: #00e5ff;
  }

  .unit-name {
    font-size: 0.68rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-roster-note {
    padding: 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.08);
  }

  /* Host Capabilities Box */
  .host-capabilities-box {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cap-title {
    font-size: 0.72rem;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 0.05em;
  }

  .cap-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.78rem;
    color: #cbd5e1;
    line-height: 1.5;
  }

  /* Spectator Hero */
  .spectator-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    padding: 1.5rem 0;
  }

  .arena-icon-ring {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.15);
    border: 2px solid rgba(59, 130, 246, 0.35);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spectator-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
  }

  .spectator-desc {
    font-size: 0.88rem;
    color: #94a3b8;
    max-width: 520px;
    margin: 0;
    line-height: 1.45;
  }

  .spectator-feature-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .f-chip {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Footer */
  .login-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    color: #94a3b8;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .text-link {
    background: none;
    border: none;
    color: #00e5ff;
    font-size: inherit;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .text-link:hover {
    color: #fff;
  }
</style>
