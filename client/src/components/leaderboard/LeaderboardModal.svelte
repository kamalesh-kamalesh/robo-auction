<script lang="ts">
  import { X, Trophy, Search, Skull } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  let { isOpen, onClose }: {
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let search = $state('');

  const filtered = $derived(
    (auction.state?.leaderboard ?? []).filter(s =>
      s.teamName.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    )
  );
</script>

{#if isOpen && auction.state}
  <div class="modal-overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
    <div class="modal-card" style="max-width: 960px;" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.85rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <Trophy size={24} color="#ffd700" />
          <div>
            <h2 style="font-family: var(--font-display); font-size: 1.3rem;">Tactical Competition Standings</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted);">
              Official tournament leaderboard. Final Score = (Normalized Performance × 0.70) + (Budget Efficiency × 0.30)
            </p>
          </div>
        </div>
        <button onclick={onClose} class="btn-icon" aria-label="Close Standings modal"><X size={18} /></button>
      </div>

      <!-- Formula Explainer -->
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0.65rem 0.85rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 0.72rem; color: var(--text-dim); margin-bottom: 1rem; font-family: var(--font-mono);">
        <span>⚡ Performance (70%): Up to 800 practical task points</span>
        <span>•</span>
        <span>💰 Efficiency (30%): Performance pts per ₹ spent</span>
        <span>•</span>
        <span>Starting Budget: ₹100,000</span>
      </div>

      <!-- Search & Meta -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div style="position: relative; width: 280px;">
          <Search size={14} style="position: absolute; left: 10px; top: 9px; color: var(--text-dim);" />
          <input
            type="search"
            placeholder="Search team standings..."
            aria-label="Search standings"
            bind:value={search}
            style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem 0.65rem 0.4rem 2rem; font-size: 0.8rem; color: #fff; outline: none;"
          />
        </div>
        <div style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono);">
          Phase: {auction.state.phase} • Showing {filtered.length} of {auction.state.leaderboard.length} Teams
        </div>
      </div>

      <!-- Table -->
      <div style="max-height: 55vh; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 48px;">Rank</th>
              <th>Team</th>
              <th>Final Score</th>
              <th>Performance (70%)</th>
              <th>Efficiency (30%)</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as s (s.teamId)}
              {@const isMyTeam = auction.currentTeam && auction.currentTeam.id === s.teamId}
              <tr
                style="background: {isMyTeam ? 'rgba(0, 242, 254, 0.08)' : ''}; border-left: {isMyTeam ? '3px solid var(--accent-cyan)' : ''};"
              >
                <td>
                  <span class="rank-badge {s.rank <= 3 ? `top-${s.rank}` : ''}">
                    {s.rank}
                  </span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 600; color: {isMyTeam ? 'var(--accent-cyan)' : 'inherit'};">
                      {s.teamName} ({s.code})
                    </span>
                    {#if isMyTeam}
                      <span style="font-size: 0.65rem; background: rgba(0, 242, 254, 0.2); padding: 0.1rem 0.35rem; border-radius: 4px; color: var(--accent-cyan);">YOU</span>
                    {/if}
                  </div>
                </td>
                <td>
                  <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);">
                    {s.finalScore.toFixed(1)}
                  </span>
                </td>
                <td>
                  <span style="font-family: var(--font-mono); color: var(--accent-emerald);">
                    {s.normalizedPerformance} ({s.rawPerformanceScore}/800)
                  </span>
                </td>
                <td>
                  <span style="font-family: var(--font-mono); color: var(--accent-amber);">
                    {s.budgetEfficiencyScore}
                  </span>
                </td>
                <td style="font-family: var(--font-mono);">₹{s.totalSpent.toLocaleString()}</td>
                <td style="font-family: var(--font-mono);">₹{s.remainingBudget.toLocaleString()}</td>
                <td>
                  <span style="color: {s.status === 'PUBLISHED' || s.status === 'TESTED' ? 'var(--accent-emerald)' : 'var(--text-dim)'}; font-size: 0.72rem; font-weight: 600;">
                    {s.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}
