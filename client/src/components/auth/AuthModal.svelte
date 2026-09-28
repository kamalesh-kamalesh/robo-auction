<script lang="ts">
  import { X, Users, Shield, Tv, Key, Check, ShieldCheck, Lock } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  let { isOpen, onClose }: {
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let tab = $state<'team' | 'host' | 'spectator'>('team');
  let teamCodeInput = $state('');
  let teamNameInput = $state('');
  let teamPinInput = $state('');
  let hostPassInput = $state('');
  let errorMsg = $state('');
  let isSubmitting = $state(false);

  const teams = $derived(auction.state ? Object.values(auction.state.teams) : []);

  async function handleTeamSubmit(e: Event) {
    e.preventDefault();
    if (!teamCodeInput.trim()) {
      errorMsg = 'Please enter your Team / Squad Code.';
      return;
    }
    if (!teamPinInput.trim()) {
      errorMsg = 'Please enter your Team Security PIN.';
      return;
    }
    errorMsg = '';
    isSubmitting = true;
    try {
      const res = await auction.loginAsTeam(
        teamCodeInput.trim().toUpperCase(),
        teamPinInput.trim(),
        teamNameInput.trim() || undefined
      );
      if (res.success) {
        onClose();
      } else {
        errorMsg = res.message || 'Team credentials not recognized.';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function handleSelectTeamFromList(team: { code: string; name?: string }) {
    teamCodeInput = team.code;
    if (team.name) teamNameInput = team.name;
    errorMsg = '';
  }

  async function handleHostSubmit(e: Event) {
    e.preventDefault();
    if (!hostPassInput) return;
    errorMsg = '';
    isSubmitting = true;
    try {
      const res = await auction.loginAsHost(hostPassInput.trim());
      if (res.success) {
        onClose();
      } else {
        errorMsg = res.message || 'Incorrect host passcode.';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function handleSpectatorSelect() {
    auction.loginAsSpectator();
    onClose();
  }

  function switchTab(newTab: 'team' | 'host' | 'spectator') {
    tab = newTab;
    errorMsg = '';
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
    <div class="modal-card" style="max-width: 580px;" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.25rem;">Access Terminal</h2>
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            Choose your role or switch between competing units.
          </p>
        </div>
        <button onclick={onClose} class="btn-icon" aria-label="Close Access Terminal"><X size={18} /></button>
      </div>

      <!-- Role Tabs -->
      <div class="tabs-header">
        <button class="tab-btn {tab === 'team' ? 'active' : ''}" onclick={() => switchTab('team')}>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <Users size={14} /><span>Team Login</span>
          </div>
        </button>
        <button class="tab-btn {tab === 'host' ? 'active' : ''}" onclick={() => switchTab('host')}>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <Shield size={14} /><span>Host Console</span>
          </div>
        </button>
        <button class="tab-btn {tab === 'spectator' ? 'active' : ''}" onclick={() => switchTab('spectator')}>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <Tv size={14} /><span>Spectator Mode</span>
          </div>
        </button>
      </div>

      {#if errorMsg}
        <div style="background: rgba(255, 8, 68, 0.15); border: 1px solid rgba(255, 8, 68, 0.3); color: var(--accent-crimson); padding: 0.5rem 0.85rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 1rem;">
          {errorMsg}
        </div>
      {/if}

      <!-- Team Tab -->
      {#if tab === 'team'}
        <div>
          <form onsubmit={handleTeamSubmit} style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <input
                type="text"
                placeholder="Squad Code (e.g. TEAM-01 or ALPHA)"
                aria-label="Team Code"
                bind:value={teamCodeInput}
                class="bid-input"
                style="text-transform: uppercase;"
              />
              <input
                type="text"
                placeholder="Squad Name (Optional)"
                aria-label="Squad Name"
                bind:value={teamNameInput}
                class="bid-input"
              />
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <input
                type="password"
                placeholder="Security PIN (e.g. 1001)"
                aria-label="Team PIN"
                bind:value={teamPinInput}
                class="bid-input"
                style="flex: 1;"
              />
              <button type="submit" class="btn-primary" aria-label="Connect or register team unit" disabled={isSubmitting}>
                {isSubmitting ? 'Connecting...' : 'Connect / Register Unit'}
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); display: flex; align-items: center; gap: 0.3rem;">
              <Lock size={12} color="var(--accent-cyan)" />
              <span>New team codes auto-register dynamically with a starting ₹100,000 budget!</span>
            </div>

            <!-- LEGAL & PRIVACY: DPDP Act 2023 Minimal Data Notice -->
            <div style="display: flex; align-items: flex-start; gap: 0.45rem; padding: 0.6rem 0.85rem; background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 6px; font-size: 0.73rem; color: var(--text-muted); line-height: 1.45;">
              <ShieldCheck size={16} color="var(--accent-cyan)" style="flex-shrink: 0; margin-top: 2px;" />
              <div>
                <strong style="color: var(--accent-cyan);">Data Minimization Notice (DPDP Act, 2023):</strong>
                Only essential competition credentials (Team Code & Security PIN) are collected. No personal identifiers, emails, telephone numbers, or behavioral trackers are collected or retained.
              </div>
            </div>
          </form>

          {#if teams.length > 0}
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; font-family: var(--font-display);">
              Connected Tournament Squads ({teams.length}):
            </div>

            <div style="max-height: 180px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.45rem;">
              {#each teams as t (t.id)}
                {@const isCurrent = auction.currentTeam?.id === t.id}
                <button
                  onclick={() => handleSelectTeamFromList(t)}
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.6rem; background: {isCurrent ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid {isCurrent ? 'var(--accent-cyan)' : 'var(--border-subtle)'}; border-radius: 6px; text-align: left;"
                >
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: {t.avatarColor}; flex-shrink: 0;"></span>
                  <div style="overflow: hidden;">
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: {isCurrent ? 'var(--accent-cyan)' : '#fff'}; font-weight: 700;">
                      {t.code}
                    </div>
                    <div style="font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                      {t.name}
                    </div>
                  </div>
                  {#if isCurrent}<Check size={12} color="var(--accent-cyan)" style="margin-left: auto;" />{/if}
                </button>
              {/each}
            </div>
          {:else}
            <div style="padding: 0.75rem; text-align: center; background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-subtle); border-radius: 6px; font-size: 0.75rem; color: var(--text-muted);">
              ✨ No participant squads registered yet. Enter your Squad Code above to register and enter the floor.
            </div>
          {/if}
        </div>

      <!-- Host Tab -->
      {:else if tab === 'host'}
        <form onsubmit={handleHostSubmit}>
          <div style="margin-bottom: 1rem;">
            <label for="host-passcode-input" style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.4rem; text-transform: uppercase; font-family: var(--font-display);">
              Host Admin Passcode
            </label>
            <div style="display: flex; gap: 0.5rem;">
              <div style="position: relative; flex: 1;">
                <Key size={14} style="position: absolute; left: 10px; top: 12px; color: var(--text-dim);" />
                <input
                  id="host-passcode-input"
                  type="password"
                  placeholder="Default: host2026"
                  bind:value={hostPassInput}
                  class="bid-input"
                  style="padding-left: 2rem; width: 100%;"
                />
              </div>
              <button type="submit" class="btn-primary" disabled={isSubmitting}>Unlock Console</button>
            </div>
          </div>
          <p style="font-size: 0.72rem; color: var(--text-dim);">
            Host console grants full control: start/pause floor, reopen lots, force close, adjust lot timers, and export live logs.
          </p>
        </form>

      <!-- Spectator Tab -->
      {:else if tab === 'spectator'}
        <div style="text-align: center; padding: 1rem 0;">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Launch high-resolution arena projector view designed for big screens and auditorium displays.
          </p>
          <button class="btn-primary" onclick={handleSpectatorSelect} style="margin: 0 auto;">
            <Tv size={16} />
            <span>Launch Arena Projector</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
