<script lang="ts">
  import { Trophy, Wrench, Zap, CheckCircle, AlertTriangle } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  const team = $derived(auction.currentTeam);
  const teamScore = $derived(
    auction.state?.leaderboard.find(s => s.teamId === team?.id)
  );

  const componentsCount = $derived(team?.components?.length ?? 0);
  const assembly = $derived(team?.assembly);
  const testing = $derived(team?.testing);
</script>

{#if team}
  <div class="team-hud-bar">
    <div class="team-identity">
      <div
        class="team-avatar-dot"
        style:background={team.avatarColor || '#00e5ff'}
        style:box-shadow="0 0 10px {team.avatarColor || '#00e5ff'}"
      ></div>
      <div class="team-names">
        <span class="team-badge">{team.code}</span>
        <span class="team-name">{team.name}</span>
      </div>

      {#if teamScore}
        <div class="rank-chip">
          <Trophy size={14} color="#ffd700" />
          <span class="rank-text">Rank #{teamScore.rank}</span>
          <span class="rank-score">({teamScore.finalScore.toFixed(1)} pts)</span>
        </div>
      {/if}
    </div>

    <!-- Finances Display with ₹ currency -->
    <div class="team-finances">
      <div class="finance-metric">
        <span class="metric-label">AVAILABLE BUDGET</span>
        <span class="metric-val available">₹{team.availableBudget.toLocaleString()}</span>
      </div>

      <div class="finance-metric">
        <span class="metric-label">COMMITTED BIDS</span>
        <span class="metric-val committed">₹{team.committedAmount.toLocaleString()}</span>
      </div>

      <div class="finance-metric">
        <span class="metric-label">TOTAL SPENT</span>
        <span class="metric-val spent">₹{team.spentAmount.toLocaleString()}</span>
      </div>

      <div class="finance-metric">
        <span class="metric-label">STARTING</span>
        <span class="metric-val starting">₹{(team.totalBudget || 100000).toLocaleString()}</span>
      </div>
    </div>

    <!-- Robot Build Progress -->
    <div class="robot-hud-status">
      <div class="status-col">
        <span class="r-label">COMPONENTS</span>
        <span class="r-val">{componentsCount} / 20 Acquired</span>
      </div>

      <div class="status-col">
        <span class="r-label">INTEGRATION</span>
        {#if assembly?.isValidated}
          <span class="r-val ok"><CheckCircle size={12} /> Validated ({assembly.compatibilityScore}%)</span>
        {:else if (assembly?.errors?.length ?? 0) > 0}
          <span class="r-val err"><AlertTriangle size={12} /> {assembly?.errors.length} Issue{assembly?.errors.length! > 1 ? 's' : ''}</span>
        {:else}
          <span class="r-val warn"><Wrench size={12} /> In Progress</span>
        {/if}
      </div>

      <div class="status-col">
        <span class="r-label">PERFORMANCE</span>
        <span class="r-val perf">
          <Zap size={12} />
          {testing?.testingCompleted ? `${testing.totalPerformanceScore}/800` : 'Not Tested'}
        </span>
      </div>
    </div>
  </div>
{/if}

<style>
  .team-hud-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(13, 22, 38, 0.85);
    border-bottom: 1px solid rgba(0, 229, 255, 0.2);
    padding: 0.6rem 1.5rem;
    gap: 1.5rem;
    flex-wrap: wrap;
    backdrop-filter: blur(10px);
  }

  .team-identity {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .team-avatar-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .team-names {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .team-badge {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(0, 229, 255, 0.35);
    font-family: 'Courier New', monospace;
  }

  .team-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: #f8fafc;
  }

  .rank-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  .rank-text {
    font-size: 0.75rem;
    font-weight: 800;
    color: #f59e0b;
    font-family: 'Courier New', monospace;
  }

  .rank-score {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .team-finances {
    display: flex;
    gap: 1.25rem;
  }

  .finance-metric {
    display: flex;
    flex-direction: column;
  }

  .metric-label {
    font-size: 0.62rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .metric-val {
    font-family: 'Courier New', monospace;
    font-weight: 800;
    font-size: 1rem;
  }

  .metric-val.available {
    color: #10b981;
  }

  .metric-val.committed {
    color: #f59e0b;
  }

  .metric-val.spent {
    color: #ef4444;
  }

  .metric-val.starting {
    color: #cbd5e1;
  }

  .robot-hud-status {
    display: flex;
    gap: 1.25rem;
  }

  .status-col {
    display: flex;
    flex-direction: column;
  }

  .r-label {
    font-size: 0.62rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .r-val {
    font-size: 0.82rem;
    font-weight: 700;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .r-val.ok {
    color: #10b981;
  }

  .r-val.err {
    color: #ef4444;
  }

  .r-val.warn {
    color: #f59e0b;
  }

  .r-val.perf {
    color: #00e5ff;
    font-family: 'Courier New', monospace;
  }
</style>
