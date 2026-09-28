<script lang="ts">
  import { Bot, Trophy, Layers, Radio } from '@lucide/svelte';
  import { auction } from '../../stores/auction.svelte.js';

  const lots         = $derived(auction.state ? Object.values(auction.state.lots) : []);
  const openLots     = $derived(lots.filter(l => l.status === 'open'));
  const upcomingLots = $derived(lots.filter(l => l.status === 'upcoming').sort((a, b) => a.queueOrder - b.queueOrder));
  const closedLots   = $derived(lots.filter(l => l.status === 'closed'));
  const topTeams     = $derived(auction.state?.leaderboard.slice(0, 8) ?? []);
  const displayLots  = $derived(openLots.length > 0 ? openLots : closedLots.slice(-4));
</script>

{#if auction.state}
  <div style="padding: 1.5rem 2rem; max-width: 1800px; margin: 0 auto;">
    <!-- Big Stage Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="brand-logo-icon" style="width: 48px; height: 48px;">
          <Bot size={28} />
        </div>
        <div>
          <h1 style="font-family: var(--font-display); font-size: 2rem; letter-spacing: 2px; text-transform: uppercase;">
            ROBO AUCTION ARENA
          </h1>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            TACTICAL MULTI-LOT TRADING FLOOR • ROUND {auction.state.currentRound || 1} • {70 - (auction.state.eliminatedCount || 0)} UNITS ACTIVE
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1.5rem;">
        <div class="status-chip {auction.state.status}" style="font-size: 1rem; padding: 0.5rem 1.25rem;">
          <span class="pulse-dot" style="width: 10px; height: 10px;"></span>
          <span>{auction.state.status.toUpperCase()}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-display);">Active Floor Lots</div>
          <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan);">
            {openLots.length} Live / {upcomingLots.length} Queued
          </div>
        </div>
      </div>
    </div>

    <!-- Main Arena Showcase -->
    <div style="display: grid; grid-template-columns: minmax(0, 2.3fr) minmax(0, 1fr); gap: 2rem;">
      <!-- Lots Display -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-family: var(--font-display); font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
            <Radio size={20} color="var(--accent-cyan)" />
            <span>Concurrently Live Trading Lots</span>
          </h2>
          <span style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono);">Auto-replenishing 36-Module Pool</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem;">
          {#each displayLots as lot (lot.id)}
            {@const lotMins     = Math.floor(lot.timeLeftSeconds / 60)}
            {@const lotSecs     = lot.timeLeftSeconds % 60}
            {@const fmtTime     = `${lotMins}:${lotSecs.toString().padStart(2, '0')}`}
            {@const isUrgent    = lot.status === 'open' && lot.timeLeftSeconds <= 10}
            <div
              class="glass-panel {isUrgent ? 'urgent' : ''}"
              style="padding: 1.25rem; border-left: 4px solid {lot.status === 'closed' ? 'var(--accent-emerald)' : isUrgent ? 'var(--accent-crimson)' : 'var(--accent-cyan)'};"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <span class="lot-category-tag" style="font-size: 0.7rem;">{lot.category.toUpperCase()}</span>
                  <h3 style="font-family: var(--font-display); font-size: 1.15rem; margin-top: 0.2rem;">{lot.title}</h3>
                </div>
                <div style="text-align: right;">
                  <div class="timer-digits {isUrgent ? 'urgent' : ''}" style="font-size: 1.3rem;">
                    {lot.status === 'closed' ? 'SOLD' : fmtTime}
                  </div>
                  {#if lot.status === 'open'}
                    <div style="font-size: 0.65rem; color: var(--text-dim); font-family: var(--font-mono);">
                      Ext: {lot.extensionsCount || 0}/3
                    </div>
                  {/if}
                </div>
              </div>

              <div style="margin-top: 1rem; background: rgba(0,0,0,0.3); padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase;">Current High Bid</div>
                  <div style="font-family: var(--font-mono); font-size: 1.4rem; font-weight: 700; color: #fff;">
                    ${lot.currentBid.toLocaleString()}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase;">Leading Bidder</div>
                  <div style="font-family: var(--font-display); font-weight: 700; color: {lot.highestBidderTeamName ? 'var(--accent-cyan)' : 'var(--text-dim)'};">
                    {lot.highestBidderTeamName || 'No Bids'}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Upcoming Queue Banner -->
        {#if upcomingLots.length > 0}
          <div style="margin-top: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono); margin-bottom: 0.5rem;">
              <Layers size={14} color="var(--accent-amber)" />
              <span>NEXT QUEUED LOTS IN POOL ({upcomingLots.length} REMAINING):</span>
            </div>
            <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.25rem;">
              {#each upcomingLots.slice(0, 4) as u (u.id)}
                <div style="background: rgba(0,0,0,0.3); padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.72rem; white-space: nowrap;">
                  <span style="color: var(--accent-amber); font-weight: 700;">#{u.queueOrder}</span>{' '}
                  <span style="color: var(--text-main);">{u.title}</span>{' '}
                  <span style="color: var(--text-dim);">(${u.basePrice.toLocaleString()})</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Live Arena Standings -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <Trophy size={20} color="#ffd700" />
            <h2 style="font-family: var(--font-display); font-size: 1.3rem;">Standings (Top 8)</h2>
          </div>
          <span style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);">CompetitionScore</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          {#each topTeams as t (t.teamId)}
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="rank-badge {t.rank <= 3 ? `top-${t.rank}` : ''}">{t.rank}</span>
                <div>
                  <div style="font-weight: 700; font-family: var(--font-display);">{t.teamName}</div>
                  <div style="font-size: 0.72rem; color: var(--text-dim);">
                    Won: {t.componentsCount} items • Perf: {t.normalizedPerformance}
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700; color: var(--accent-emerald);">
                  {t.finalScore.toFixed(1)}
                </div>
                <div style="font-size: 0.68rem; color: var(--text-dim); font-family: var(--font-mono);">
                  Eff: {t.budgetEfficiencyScore}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
