<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';
  import type { FinalScoreResult } from '../../types/index.js';

  type SortKey = 'finalScore' | 'normalizedPerformance' | 'budgetEfficiencyScore' | 'totalSpent';

  let currentSort = $state<SortKey>('finalScore');
  let searchQuery = $state('');

  const leaderboard = $derived.by<FinalScoreResult[]>(() => {
    const list = auction.state?.leaderboard || [];
    let filtered = list;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.teamName.toLowerCase().includes(q) ||
          entry.code.toLowerCase().includes(q) ||
          entry.teamId.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      if (currentSort === 'totalSpent') {
        return a.totalSpent - b.totalSpent; // Lower spent is better
      }
      return b[currentSort] - a[currentSort];
    });
  });

  const myTeamId = $derived(auction.currentTeam?.id);
</script>

<div class="leaderboard-layout">
  <!-- Top Banner with Formula & Scoring Principles -->
  <header class="lb-header">
    <div class="lb-title-group">
      <div class="formula-tag">STANDARDIZED COMPETITION SCORING</div>
      <h1 class="lb-title">Official Tournament Leaderboard</h1>
      <p class="lb-formula">
        Final Score = (Normalized Performance × 0.70) + (Budget Efficiency × 0.30)
      </p>
    </div>

    <!-- Filter & Sort Tabs -->
    <div class="filter-controls">
      <input
        type="search"
        class="search-input"
        placeholder="🔍 Search team by name or ID..."
        aria-label="Search leaderboard by team name or code"
        bind:value={searchQuery}
      />

      <div class="sort-tabs" role="tablist" aria-label="Sort standings criteria">
        <button
          class="sort-tab"
          class:active={currentSort === 'finalScore'}
          onclick={() => (currentSort = 'finalScore')}
          role="tab"
          aria-selected={currentSort === 'finalScore'}
          aria-label="Sort standings by Final Score (70% Performance + 30% Budget Efficiency)"
        >
          🏆 FINAL SCORE
        </button>
        <button
          class="sort-tab"
          class:active={currentSort === 'normalizedPerformance'}
          onclick={() => (currentSort = 'normalizedPerformance')}
          role="tab"
          aria-selected={currentSort === 'normalizedPerformance'}
          aria-label="Sort standings by Robot Test Performance Score (out of 800 points)"
        >
          ⚡ PERFORMANCE
        </button>
        <button
          class="sort-tab"
          class:active={currentSort === 'budgetEfficiencyScore'}
          onclick={() => (currentSort = 'budgetEfficiencyScore')}
          role="tab"
          aria-selected={currentSort === 'budgetEfficiencyScore'}
          aria-label="Sort standings by Budget Efficiency (Performance Points divided by Rupees Spent)"
        >
          💡 EFFICIENCY
        </button>
        <button
          class="sort-tab"
          class:active={currentSort === 'totalSpent'}
          onclick={() => (currentSort = 'totalSpent')}
          role="tab"
          aria-selected={currentSort === 'totalSpent'}
          aria-label="Sort standings by Total Budget Conserved (Least Rupees Spent)"
        >
          💰 LEAST SPENT
        </button>
      </div>
    </div>
  </header>

  <!-- Leaderboard Table Container -->
  <div class="table-container">
    {#if leaderboard.length === 0}
      <div class="empty-lb">
        <div class="empty-icon">📊</div>
        <h3>LEADERBOARD STANDBY</h3>
        <p>No test or final scores registered yet. As teams complete auctions and testing, live scores will materialize here.</p>
      </div>
    {:else}
      <table class="lb-table">
        <thead>
          <tr>
            <th class="col-rank">RANK</th>
            <th class="col-team">TACTICAL TEAM</th>
            <th class="col-spent">SPENT BUDGET</th>
            <th class="col-perf">PERFORMANCE (70%)</th>
            <th class="col-eff">EFFICIENCY (30%)</th>
            <th class="col-final">FINAL SCORE</th>
            <th class="col-status">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {#each leaderboard as entry (entry.teamId)}
            {@const isMe = entry.teamId === myTeamId}
            <tr class="lb-row" class:is-me={isMe} class:podium-1={entry.rank === 1} class:podium-2={entry.rank === 2} class:podium-3={entry.rank === 3}>
              <!-- Rank -->
              <td class="col-rank">
                <span class="rank-badge rank-{entry.rank}">
                  {#if entry.rank === 1}🥇{:else if entry.rank === 2}🥈{:else if entry.rank === 3}🥉{:else}#{entry.rank}{/if}
                </span>
              </td>

              <!-- Team Name & Code -->
              <td class="col-team">
                <div class="team-cell">
                  <div class="team-avatar" style:background={entry.avatarColor}></div>
                  <div class="team-text">
                    <span class="team-name">{entry.teamName}</span>
                    <span class="team-code">{entry.code} {isMe ? '⭐ (YOU)' : ''}</span>
                  </div>
                </div>
              </td>

              <!-- Spent Budget -->
              <td class="col-spent">
                <div class="spent-cell">
                  <span class="spent-val">₹{entry.totalSpent.toLocaleString()}</span>
                  <span class="rem-val">Rem: ₹{entry.remainingBudget.toLocaleString()}</span>
                </div>
              </td>

              <!-- Normalized Performance -->
              <td class="col-perf">
                <div class="score-metric">
                  <span class="metric-num">{entry.normalizedPerformance}</span>
                  <span class="metric-raw">({entry.rawPerformanceScore}/800 pts)</span>
                </div>
              </td>

              <!-- Budget Efficiency -->
              <td class="col-eff">
                <div class="score-metric">
                  <span class="metric-num efficiency">{entry.budgetEfficiencyScore}</span>
                  <span class="metric-raw">pts / ₹ spent</span>
                </div>
              </td>

              <!-- Final Score -->
              <td class="col-final">
                <span class="final-score-val">{entry.finalScore.toFixed(1)}</span>
              </td>

              <!-- Status Badge -->
              <td class="col-status">
                <span class="status-badge {entry.status.toLowerCase()}">
                  {entry.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .leaderboard-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .lb-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(13, 22, 38, 0.9), rgba(9, 14, 24, 0.95));
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 14px;
    padding: 1.5rem 2rem;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .lb-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .formula-tag {
    color: #00e5ff;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .lb-title {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0.25rem 0;
  }

  .lb-formula {
    color: #94a3b8;
    font-size: 0.85rem;
    margin: 0;
    font-family: 'Courier New', monospace;
  }

  .filter-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 380px;
  }

  .search-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f8fafc;
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: #00e5ff;
  }

  .sort-tabs {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .sort-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.5rem 0.2rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .sort-tab.active {
    background: rgba(0, 229, 255, 0.2);
    color: #00e5ff;
  }

  /* Table */
  .table-container {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .empty-lb {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
    color: #94a3b8;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .lb-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .lb-table thead {
    background: rgba(0, 0, 0, 0.5);
    border-bottom: 2px solid rgba(0, 229, 255, 0.25);
  }

  .lb-table th {
    padding: 1rem 1.25rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.08em;
  }

  .lb-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.15s;
  }

  .lb-row:hover {
    background: rgba(0, 229, 255, 0.04);
  }

  .lb-row.is-me {
    background: rgba(0, 229, 255, 0.1);
    border-left: 4px solid #00e5ff;
  }

  .lb-row.podium-1 {
    background: rgba(245, 158, 11, 0.06);
  }

  .lb-table td {
    padding: 1rem 1.25rem;
  }

  .col-rank {
    width: 80px;
    text-align: center;
  }

  .rank-badge {
    font-family: 'Courier New', monospace;
    font-weight: 800;
    font-size: 1rem;
    color: #cbd5e1;
  }

  .team-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .team-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .team-text {
    display: flex;
    flex-direction: column;
  }

  .team-name {
    font-weight: 700;
    color: #f8fafc;
  }

  .team-code {
    font-size: 0.72rem;
    color: #94a3b8;
    font-family: 'Courier New', monospace;
  }

  .spent-cell {
    display: flex;
    flex-direction: column;
  }

  .spent-val {
    color: #f1f5f9;
    font-weight: 700;
  }

  .rem-val {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .score-metric {
    display: flex;
    flex-direction: column;
  }

  .metric-num {
    font-size: 1.1rem;
    font-weight: 800;
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }

  .metric-num.efficiency {
    color: #10b981;
  }

  .metric-raw {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .final-score-val {
    font-size: 1.4rem;
    font-weight: 900;
    color: #f8fafc;
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
  }

  .status-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .status-badge.tested, .status-badge.published {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-badge.assembled {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    border: 1px solid rgba(0, 229, 255, 0.3);
  }

  .status-badge.auctioning, .status-badge.lobby {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
</style>
