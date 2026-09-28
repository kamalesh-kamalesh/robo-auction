<script lang="ts">
  import { auction } from '../../stores/auction.svelte.js';
  import type { MajorComponentCategory } from '../../types/index.js';

  const team = $derived(auction.currentTeam);
  const assembly = $derived(team?.assembly);

  const SCHEMATIC_TILES: { cat: MajorComponentCategory; label: string; icon: string; gridArea: string }[] = [
    { cat: 'camera', label: 'Vision Camera', icon: '👁️', gridArea: 'cam' },
    { cat: 'distance_sensor', label: 'LiDAR / Distance', icon: '📡', gridArea: 'dist' },
    { cat: 'controller', label: 'Main Controller (Brain)', icon: '🧠', gridArea: 'ctl' },
    { cat: 'ultrasonic_sensor', label: 'Ultrasonic Array', icon: '🦇', gridArea: 'ultra' },
    { cat: 'ir_sensor', label: 'Infrared Proximity', icon: '🔴', gridArea: 'ir' },
    { cat: 'line_sensor', label: 'Line Tracker', icon: '〰️', gridArea: 'line' },
    { cat: 'imu', label: 'IMU / Gyroscope', icon: '🧭', gridArea: 'imu' },
    { cat: 'robotic_arm', label: 'Articulated Arm', icon: '🦾', gridArea: 'arm' },
    { cat: 'gripper', label: 'Robotic Gripper', icon: '🤏', gridArea: 'grip' },
    { cat: 'servo_motor', label: 'Precision Servos', icon: '⚙️', gridArea: 'servo' },
    { cat: 'chassis', label: 'Chassis Frame', icon: '🚜', gridArea: 'chassis' },
    { cat: 'battery', label: 'Power Battery', icon: '🔋', gridArea: 'bat' },
    { cat: 'power_regulator', label: 'Power DC-DC Regulator', icon: '⚡', gridArea: 'reg' },
    { cat: 'motor_driver', label: 'Motor Driver', icon: '🎛️', gridArea: 'driver' },
    { cat: 'motor', label: 'Drive Motors', icon: '🏎️', gridArea: 'motor' },
    { cat: 'gearbox', label: 'Transmission Gearbox', icon: '🔄', gridArea: 'gear' },
    { cat: 'encoder', label: 'Wheel Encoders', icon: '📏', gridArea: 'enc' },
    { cat: 'wheel_set', label: 'Traction Wheels', icon: '🛞', gridArea: 'wheel' },
    { cat: 'comm_module', label: 'Telemetry Comm Module', icon: '📶', gridArea: 'comm' },
    { cat: 'control_interface', label: 'Host Interface Screen', icon: '📱', gridArea: 'ui' }
  ];

  let isValidating = $state(false);

  async function handleValidate() {
    isValidating = true;
    try {
      await auction.validateAssembly();
    } finally {
      isValidating = false;
    }
  }
</script>

<div class="assembly-layout">
  <!-- Top HUD Bar -->
  <header class="assembly-hud">
    <div class="hud-info">
      <div class="hud-phase-tag">PHASE: ROBOT ASSEMBLY & COMPATIBILITY CHECK</div>
      <h1 class="hud-title">Robotic System Integration Canvas</h1>
      <p class="hud-subtitle">
        Slot and verify the electrical, physical, and computational compatibility of all purchased modules.
      </p>
    </div>

    {#if assembly}
      <div class="score-card" class:validated={assembly.isValidated} class:has-errors={assembly.errors.length > 0}>
        <div class="score-label">COMPATIBILITY SCORE</div>
        <div class="score-number">{assembly.compatibilityScore}%</div>
        <div class="status-pill">
          {#if assembly.isValidated}
            🟢 READY FOR TESTING
          {:else if assembly.errors.length > 0}
            🔴 {assembly.errors.length} CRITICAL ERROR{assembly.errors.length > 1 ? 'S' : ''}
          {:else}
            🟡 PENDING VALIDATION
          {/if}
        </div>
      </div>
    {/if}
  </header>

  <!-- Interactive Schematic Canvas -->
  <div class="canvas-main-grid">
    <div class="schematic-container">
      <div class="schematic-grid">
        {#each SCHEMATIC_TILES as tile}
          {@const slot = assembly?.slots?.[tile.cat]}
          {@const comp = slot?.assignedComponent}
          <div
            class="schematic-slot"
            class:installed={comp !== null && comp !== undefined}
            class:tier-pro={comp?.variantTier === 'pro'}
            class:tier-adv={comp?.variantTier === 'advanced'}
            class:tier-basic={comp?.variantTier === 'basic'}
            style:grid-area={tile.gridArea}
          >
            <div class="slot-header">
              <span class="slot-icon">{tile.icon}</span>
              <span class="slot-label">{tile.label}</span>
            </div>

            {#if comp}
              <div class="installed-info">
                <span class="comp-badge {comp.variantTier}">
                  {comp.variantTier.toUpperCase()}
                </span>
                <span class="comp-name">{comp.variantName}</span>
                <span class="comp-cost">Paid: ₹{comp.purchasePrice.toLocaleString()}</span>
              </div>
            {:else}
              <div class="empty-slot-msg">
                <span>[ Not Installed ]</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="schematic-footer">
        <button 
          class="btn-validate" 
          disabled={isValidating} 
          onclick={handleValidate}
          aria-label="Validate robot integration and check electrical and mechanical compatibility across all 20 component slots"
        >
          {isValidating ? 'RUNNING INTEGRATION DIAGNOSTICS...' : '⚡ VALIDATE ROBOT INTEGRATION & COMPATIBILITY'}
        </button>
      </div>
    </div>

    <!-- Diagnostic Log & Engineering Rules Panel -->
    <div class="diagnostics-panel">
      <h3 class="diag-header">SYSTEM DIAGNOSTIC REPORT</h3>

      {#if !assembly}
        <div class="waiting-diag">Connect your team unit to inspect assembly state.</div>
      {:else}
        <!-- Critical Errors -->
        <div class="diag-section">
          <div class="section-title critical">CRITICAL ISSUES ({assembly.errors.length})</div>
          {#if assembly.errors.length === 0}
            <div class="diag-item ok">✓ No critical electrical or structural blocks detected.</div>
          {:else}
            {#each assembly.errors as err}
              <div class="diag-item error">⚠️ {err}</div>
            {/each}
          {/if}
        </div>

        <!-- Suboptimal Warnings -->
        <div class="diag-section">
          <div class="section-title warning">ENGINEERING WARNINGS ({assembly.warnings.length})</div>
          {#if assembly.warnings.length === 0}
            <div class="diag-item ok">✓ All power, bus, and payload ratings optimal.</div>
          {:else}
            {#each assembly.warnings as warn}
              <div class="diag-item warn">⚡ {warn}</div>
            {/each}
          {/if}
        </div>

        <!-- System Architecture Compatibility Rules -->
        <div class="rules-summary">
          <div class="rules-title">RULES OF COMPATIBILITY</div>
          <ul>
            <li><strong>Motor + Driver:</strong> Pro Motor (220W) requires Advanced or Pro Driver. Basic driver limits current.</li>
            <li><strong>Battery + Power:</strong> High wattage motors require sufficient battery discharge capacity (≥3000mAh).</li>
            <li><strong>Camera + Controller:</strong> Vision processing requires High MIPS Controller for real-time detection.</li>
            <li><strong>Arm + Gripper:</strong> Gripper requires Arm articulation to manipulate elevated targets.</li>
            <li><strong>Payload Limit:</strong> Total component mass must not exceed Chassis rating.</li>
          </ul>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .assembly-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .assembly-hud {
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

  .score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 1.75rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    min-width: 170px;
  }

  .score-card.validated {
    border-color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
  }

  .score-card.has-errors {
    border-color: #ef4444;
  }

  .score-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .score-number {
    font-family: 'Courier New', monospace;
    font-size: 2.2rem;
    font-weight: 900;
    color: #00e5ff;
  }

  .score-card.validated .score-number {
    color: #10b981;
  }

  .score-card.has-errors .score-number {
    color: #ef4444;
  }

  .status-pill {
    font-size: 0.7rem;
    font-weight: 700;
    margin-top: 0.2rem;
  }

  .canvas-main-grid {
    display: grid;
    grid-template-columns: 2fr 1.1fr;
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .canvas-main-grid {
      grid-template-columns: 1fr;
    }
  }

  .schematic-container {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    backdrop-filter: blur(12px);
  }

  .schematic-grid {
    display: grid;
    grid-template-areas:
      "cam ctl dist"
      "arm ctl grip"
      "servo ctl ultra"
      "ir imu line"
      "chassis chassis chassis"
      "bat reg driver"
      "motor motor motor"
      "gear enc wheel"
      "comm ui ui";
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
  }

  .schematic-slot {
    background: rgba(0, 0, 0, 0.35);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: all 0.2s;
  }

  .schematic-slot.installed {
    border-style: solid;
    border-color: rgba(0, 229, 255, 0.4);
    background: rgba(0, 229, 255, 0.05);
  }

  .schematic-slot.tier-pro {
    border-color: #a855f7;
    background: rgba(168, 85, 247, 0.1);
  }

  .schematic-slot.tier-adv {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
  }

  .slot-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .installed-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .comp-badge {
    align-self: flex-start;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  .comp-badge.pro {
    background: rgba(168, 85, 247, 0.25);
    color: #c084fc;
  }

  .comp-badge.advanced {
    background: rgba(59, 130, 246, 0.25);
    color: #60a5fa;
  }

  .comp-badge.basic {
    background: rgba(148, 163, 184, 0.25);
    color: #cbd5e1;
  }

  .comp-name {
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .comp-cost {
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .empty-slot-msg {
    color: #94a3b8;
    font-size: 0.72rem;
    font-style: italic;
  }

  .btn-validate {
    width: 100%;
    background: linear-gradient(135deg, #00e5ff, #0072ff);
    color: #090e18;
    font-weight: 900;
    font-size: 1rem;
    padding: 1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }

  .btn-validate:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 229, 255, 0.5);
  }

  .btn-validate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .diagnostics-panel {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .diag-header {
    font-size: 1.1rem;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .diag-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .section-title.critical {
    color: #ef4444;
  }

  .section-title.warning {
    color: #f59e0b;
  }

  .diag-item {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    line-height: 1.4;
  }

  .diag-item.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
  }

  .diag-item.warn {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #fde68a;
  }

  .diag-item.ok {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }

  .rules-summary {
    margin-top: auto;
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.75rem;
  }

  .rules-title {
    color: #00e5ff;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }

  .rules-summary ul {
    margin: 0;
    padding-left: 1.2rem;
    color: #94a3b8;
    line-height: 1.5;
  }
</style>
