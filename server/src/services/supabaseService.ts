import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Bid,
  ComponentVariant,
  EventState,
  FinalScoreResult,
  PurchasedComponent,
  RobotComponent,
  Team,
  AssemblyState
} from '../types/index.js';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isEnabled: boolean = false;
  private sessionId: string = 'default-session';

  constructor() {
    this.init();
  }

  private init() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        this.isEnabled = true;
        this.sessionId = process.env.TOURNAMENT_SESSION_ID || 'default-session';
        console.log(`⚡ [Supabase] Connected successfully to: ${supabaseUrl}`);
      } catch (err) {
        console.error('⚠️ [Supabase] Initialization failed:', err);
        this.isEnabled = false;
      }
    } else {
      console.log('ℹ️ [Supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not set. Operating in local storage mode.');
      this.isEnabled = false;
    }
  }

  public isConnected(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Loads the latest tournament snapshot from Supabase Postgres
   */
  public async loadLatestSnapshot(): Promise<EventState | null> {
    if (!this.client || !this.isEnabled) return null;

    try {
      const { data, error } = await this.client
        .from('auction_snapshots')
        .select('snapshot_data, phase, created_at')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is no rows found
          console.warn('⚠️ [Supabase] Error loading snapshot:', error.message);
        }
        return null;
      }

      if (data && data.snapshot_data) {
        console.log(`🔄 [Supabase] Restored tournament state from snapshot saved at ${data.created_at}`);
        return data.snapshot_data as EventState;
      }
    } catch (err) {
      console.error('⚠️ [Supabase] Exception loading snapshot:', err);
    }
    return null;
  }

  /**
   * Persists the complete tournament state and creates a snapshot in Supabase
   */
  public async persistState(state: EventState): Promise<boolean> {
    if (!this.client || !this.isEnabled) return false;

    try {
      // 1. Update session status
      await this.client.from('tournament_sessions').upsert({
        id: this.sessionId,
        phase: state.phase,
        active_component_id: state.activeComponentId,
        active_component_index: state.activeComponentIndex,
        total_components: state.totalComponents,
        current_round: state.currentRound,
        starting_budget: state.startingBudget,
        time_left_seconds: 0,
        is_results_published: state.isResultsPublished,
        is_demo_mode: state.isDemoMode,
        started_at: state.startedAt ? new Date(state.startedAt).toISOString() : null,
        ended_at: state.endedAt ? new Date(state.endedAt).toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // 2. Sync Teams
      const teamRecords = Object.values(state.teams).map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        total_budget: t.totalBudget,
        balance: t.balance,
        spent_amount: t.spentAmount,
        is_eliminated: t.isEliminated || false,
        is_connected: t.isOnline || false,
        updated_at: new Date().toISOString()
      }));

      if (teamRecords.length > 0) {
        await this.client.from('teams').upsert(teamRecords, { onConflict: 'id' });
      }

      // 3. Save atomic full-state disaster recovery snapshot
      await this.client.from('auction_snapshots').insert({
        session_id: this.sessionId,
        phase: state.phase,
        snapshot_data: state,
        created_at: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.error('⚠️ [Supabase] Error persisting state to Supabase:', err);
      return false;
    }
  }

  /**
   * Records a single bid into the immutable bids audit log and updates variant
   */
  public async recordBid(
    bid: Bid,
    variant: ComponentVariant,
    team: Team,
    antiSnipeTriggered: boolean = false
  ): Promise<void> {
    if (!this.client || !this.isEnabled) return;

    try {
      // Insert immutable bid record
      await this.client.from('bids').insert({
        variant_id: variant.id,
        component_id: variant.componentId,
        team_id: team.id,
        team_name: team.name,
        amount: bid.amount,
        anti_snipe_triggered: antiSnipeTriggered,
        created_at: new Date(bid.timestamp).toISOString()
      });

      // Update variant current bid & highest bidder
      await this.client.from('component_variants').upsert({
        id: variant.id,
        component_id: variant.componentId,
        component_name: variant.componentName,
        name: variant.name,
        category: variant.category,
        tier: variant.tier,
        starting_price: variant.startingPrice,
        current_bid: variant.currentBid,
        min_increment: variant.minIncrement,
        highest_bidder_team_id: team.id,
        highest_bidder_team_name: team.name,
        status: variant.status,
        capabilities: variant.capabilities || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // Update team balance
      await this.client.from('teams').update({
        balance: team.balance,
        spent_amount: team.spentAmount,
        updated_at: new Date().toISOString()
      }).eq('id', team.id);
    } catch (err) {
      console.error('⚠️ [Supabase] Error recording bid:', err);
    }
  }

  /**
   * Records a sold variant and the team purchase
   */
  public async recordVariantSold(
    variant: ComponentVariant,
    winnerTeam: Team,
    component: RobotComponent,
    purchasedComponent: PurchasedComponent
  ): Promise<void> {
    if (!this.client || !this.isEnabled) return;

    try {
      // 1. Update variant to SOLD
      await this.client.from('component_variants').update({
        status: 'SOLD',
        winner_team_id: winnerTeam.id,
        winning_bid_amount: variant.currentBid,
        updated_at: new Date().toISOString()
      }).eq('id', variant.id);

      // 2. Insert into team purchases
      const purchaseId = `${winnerTeam.id}-${variant.id}`;
      await this.client.from('team_purchases').upsert({
        id: purchaseId,
        team_id: winnerTeam.id,
        variant_id: variant.id,
        component_id: component.id,
        component_name: component.name,
        name: variant.name,
        category: variant.category,
        tier: variant.tier,
        price_paid: purchasedComponent.purchasePrice,
        fair_value: variant.startingPrice,
        surplus_value: Math.max(0, variant.startingPrice - purchasedComponent.purchasePrice),
        capabilities: purchasedComponent.capabilities || {},
        acquired_at: new Date(purchasedComponent.acquiredAt).toISOString()
      }, { onConflict: 'id' });

      // 3. Update team budget
      await this.client.from('teams').update({
        balance: winnerTeam.balance,
        spent_amount: winnerTeam.spentAmount,
        updated_at: new Date().toISOString()
      }).eq('id', winnerTeam.id);
    } catch (err) {
      console.error('⚠️ [Supabase] Error recording variant sold:', err);
    }
  }

  /**
   * Records robot assembly status for a team
   */
  public async recordAssembly(teamId: string, assembly: AssemblyState): Promise<void> {
    if (!this.client || !this.isEnabled) return;

    try {
      await this.client.from('robot_assemblies').upsert({
        team_id: teamId,
        robot_name: 'Robo Combatant',
        slots: assembly.slots || {},
        validation_status: {
          isValidated: assembly.isValidated,
          compatibilityScore: assembly.compatibilityScore,
          errors: assembly.errors,
          warnings: assembly.warnings
        },
        is_valid: assembly.isValidated,
        total_capability_rating: assembly.compatibilityScore || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });
    } catch (err) {
      console.error('⚠️ [Supabase] Error recording robot assembly:', err);
    }
  }

  /**
   * Records test scores & final leaderboard rankings
   */
  public async recordTestingScores(leaderboard: FinalScoreResult[]): Promise<void> {
    if (!this.client || !this.isEnabled || !leaderboard.length) return;

    try {
      const rows = leaderboard.map(entry => ({
        team_id: entry.teamId,
        team_name: entry.teamName,
        rank: entry.rank,
        final_score: entry.finalScore,
        competition_score: entry.rawPerformanceScore,
        remaining_balance: entry.remainingBudget,
        surplus_value: 0,
        capital_efficiency_bonus: entry.budgetEfficiencyScore,
        synergy_score: entry.normalizedPerformance,
        hoarding_penalty: 0,
        is_complete_robot_built: entry.componentsCount >= 10,
        is_eliminated: false,
        task_results: {
          assemblyQuality: entry.assemblyQuality,
          status: entry.status,
          totalSpent: entry.totalSpent
        },
        updated_at: new Date().toISOString()
      }));

      await this.client.from('testing_scores').upsert(rows, { onConflict: 'team_id' });
    } catch (err) {
      console.error('⚠️ [Supabase] Error recording testing scores:', err);
    }
  }
}

export const supabaseService = new SupabaseService();
