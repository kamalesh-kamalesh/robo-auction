<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';

  const team = $derived(auction.currentTeam);
  const testing = $derived(team?.testing);
  const assembly = $derived(team?.assembly);

  let isRunningTests = $state(false);

  const TASKS_METADATA = [
    {
      id: 'test-speed',
      name: 'Speed & Acceleration Sprint',
      icon: '⚡',
      maxScore: 100,
      metricKey: 'Speed Ratio'
    },
    {
      id: 'test-accuracy',
      name: 'Precision Trajectory & Line Tracking',
      icon: '🎯',
      maxScore: 100,
      metricKey: 'Tracking Accuracy'
    },
    {
      id: 'test-obstacle',
      name: 'Dynamic Obstacle Avoidance',
      icon: '🛡️',
      maxScore: 150,
      metricKey: 'Evasion Rating'
    },
    {
      id: 'test-detection',
      name: 'Autonomous Object Recognition',
      icon: '👁️',
      maxScore: 150,
      metricKey: 'Vision Detection'
    },
    {
      id: 'test-pick-place',
      name: 'Object Pick & Place Challenge',
      icon: '🦾',
      maxScore: 200,
      metricKey: 'Articulation Precision'
    },
    {
      id: 'test-efficiency',
      name: 'Energy & Power Efficiency',
      icon: '🔋',
      maxScore: 100,
      metricKey: 'Power Endurance'
    }
  ];

  async function handleRunTests() {
    isRunningTests = true;
    try {
      await auction.runTesting();
    } finally {
      isRunningTests = false;
    }
  }
</script>

<div class="testing-lab-layout">
  <!-- Top HUD Bar -->
  <header class="lab-hud">
    <div class="hud-info">
      <div class="hud-phase-tag">PHASE: ROBOT DIGITAL PERFORMANCE TESTING</div>
      <h1 class="hud-title">Robo Evaluation Simulation Lab</h1>
      <p class="hud-subtitle">
        Evaluate your assembled robot against 6 standardized competition benchmarks (800 Points Maximum).
      </p>
    </div>

    <div class="performance-summary-box">
      <div class="summary-label">TOTAL PERFORMANCE</div>
      <div class="summary-number">
        {testing?.totalPerformanceScore ?? 0} <span class="max-denom">/ 800</span>
      </div>
      <div class="normalized-tag">
        Normalized: {Math.round(((testing?.totalPerformanceScore ?? 0) / 800) * 1000)} / 1000
      </div>
    </div>
  </header>

  <!-- Notice if not validated -->
  {#if assembly && !assembly.isValidated}
    <div class="warning-banner">
      ⚠️ <strong>Robot Assembly has pending errors!</strong> Test performance will suffer heavy penalties unless critical errors are resolved.
    </div>
  {/if}

  <!-- 6 Task Evaluation Cards Grid -->
  <div class="tasks-grid">
    {#each TASKS_METADATA as task}
      {@const result = testing?.taskResults?.[task.id]}
      {@const pct = result ? (result.score / task.maxScore) * 100 : 0}

      <div class="task-card" class:completed={result?.status === 'completed'}>
        <div class="task-card-header">
          <div class="task-icon-box">{task.icon}</div>
          <div class="task-title-group">
            <h3 class="task-name">{task.name}</h3>
            <span class="max-pts-tag">Max: {task.maxScore} Pts</span>
          </div>
          <div class="task-score-pill">
            <span class="score-earned">{result?.score ?? 0}</span>
            <span class="score-max">/{task.maxScore}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-track">
          <div class="progress-bar" style:width="{pct}%"></div>
        </div>

        <!-- Metric Details -->
        <div class="task-details-box">
          {#if result}
            <div class="metric-row">
              <span class="metric-label">Benchmark Result:</span>
              <span class="metric-val">{result.details}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Run Time:</span>
              <span class="metric-val">{result.completionTimeSec}s</span>
            </div>
          {:else}
            <div class="metric-empty">Ready for simulation run...</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Run All Tests Action Button -->
  <div class="test-action-bar">
    <button 
      class="btn-run-tests" 
      disabled={isRunningTests} 
      onclick={handleRunTests}
      aria-label="Run complete performance diagnostic benchmark across all 6 tasks (800 Total Points)"
    >
      {isRunningTests ? '⚙️ SIMULATING TASK BENCHMARKS IN PROGRESS...' : '⚡ RUN COMPLETE 6-TASK PERFORMANCE TEST (800 PTS)'}
    </button>
  </div>
</div>

<style>
  .testing-lab-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .lab-hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(13, 22, 38, 0.9), rgba(9, 14, 24, 0.95));
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 14px;
    padding: 1.5rem 2rem;
  }

  .hud-phase-tag {
    color: #00e5ff;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  .hud-title {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
  }

  .hud-subtitle {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0.25rem 0 0 0;
  }

  .performance-summary-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 1.75rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 229, 255, 0.4);
    border-radius: 12px;
    min-width: 190px;
  }

  .summary-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .summary-number {
    font-family: 'Courier New', monospace;
    font-size: 2.2rem;
    font-weight: 900;
    color: #00e5ff;
  }

  .max-denom {
    font-size: 1.2rem;
    color: #94a3b8;
  }

  .normalized-tag {
    font-size: 0.7rem;
    color: #10b981;
    font-weight: 700;
    margin-top: 0.2rem;
  }

  .warning-banner {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fde68a;
    padding: 0.8rem 1.2rem;
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .tasks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 900px) {
    .tasks-grid {
      grid-template-columns: 1fr;
    }
  }

  .task-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    backdrop-filter: blur(12px);
    transition: transform 0.2s, border-color 0.2s;
  }

  .task-card.completed {
    border-color: rgba(0, 229, 255, 0.3);
  }

  .task-card-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .task-icon-box {
    font-size: 1.8rem;
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 8px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-title-group {
    flex: 1;
  }

  .task-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .max-pts-tag {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .task-score-pill {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 229, 255, 0.3);
    padding: 0.3rem 0.75rem;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
  }

  .score-earned {
    color: #00e5ff;
    font-size: 1.3rem;
    font-weight: 900;
  }

  .score-max {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .progress-track {
    width: 100%;
    height: 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #00e5ff, #38ef7d);
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .task-details-box {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .metric-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .metric-label {
    color: #94a3b8;
    font-weight: 600;
  }

  .metric-val {
    color: #cbd5e1;
    font-weight: 700;
    text-align: right;
  }

  .metric-empty {
    color: #94a3b8;
    font-style: italic;
  }

  .test-action-bar {
    display: flex;
    justify-content: center;
  }

  .btn-run-tests {
    width: 100%;
    max-width: 500px;
    background: linear-gradient(135deg, #10b981, #00e5ff);
    color: #090e18;
    font-size: 1.1rem;
    font-weight: 900;
    padding: 1.1rem 2rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }

  .btn-run-tests:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5);
  }

  .btn-run-tests:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
