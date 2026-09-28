import fs from 'fs';
import path from 'path';
import {
  Bid,
  ComponentVariant,
  EventLog,
  EventPhase,
  EventState,
  FinalScoreResult,
  MajorComponentCategory,
  PurchasedComponent,
  RobotComponent,
  Team,
  VariantTier
} from '../types/index.js';
import { generateRobotComponents } from './robotComponentsData.js';
import { generateSeedLots } from './seedData.js';
import { AssemblyEngine } from './AssemblyEngine.js';
import { TestingEngine } from './TestingEngine.js';
import { ScoringEngine } from './ScoringEngine.js';
import { DemoSimulation } from './DemoSimulation.js';
import { supabaseService } from '../services/supabaseService.js';

export interface VariantBidResult {
  success: boolean;
  message: string;
  bid?: Bid;
  variant?: ComponentVariant;
  component?: RobotComponent;
  team?: Team;
  antiSnipeTriggered?: boolean;
}

class Mutex {
  private queue: Promise<void> = Promise.resolve();

  dispatch<T>(fn: () => T | Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

export class AuctionEngine {
  private state: EventState;
  private timerInterval: NodeJS.Timeout | null = null;
  private variantMutexes: Map<string, Mutex> = new Map();
  private snapshotFilePath: string;

  // Callbacks for broadcasting real-time changes
  private onStateTick?: (data: {
    activeComponentId: string | null;
    timeLeftSeconds: number;
    phase: EventPhase;
  }) => void;
  private onComponentUpdated?: (component: RobotComponent) => void;
  private onVariantUpdated?: (
    variant: ComponentVariant,
    bid: Bid | null,
    outbidTeamId: string | null
  ) => void;
  private onVariantSold?: (
    variant: ComponentVariant,
    winnerTeam: Team,
    component: RobotComponent
  ) => void;
  private onTeamUpdated?: (team: Team) => void;
  private onEventStateChange?: (state: EventState) => void;
  private onLog?: (log: EventLog) => void;

  constructor(customSnapshotPath?: string) {
    this.snapshotFilePath = customSnapshotPath ||
      process.env.STORAGE_FILE_PATH ||
      path.resolve(process.env.DATA_DIR || path.resolve(process.cwd(), 'data'), 'auction-snapshot.json');

    const components = generateRobotComponents();
    const teams: Record<string, Team> = {};

    this.state = {
      phase: 'LOBBY',
      status: 'lobby',
      startingBudget: 100000,
      currentRound: 1,
      activeComponentId: null,
      activeComponentIndex: 0,
      totalComponents: 20,
      components,
      teams,
      leaderboard: [],
      recentLogs: [],
      startedAt: null,
      endedAt: null,
      isResultsPublished: false,
      isDemoMode: false,
      lots: generateSeedLots(4),
      eliminatedCount: 0
    };

    this.refreshCommittedBalances();
    this.recalculateLeaderboard();
  }

  public setEventCallbacks(callbacks: {
    onStateTick?: (data: {
      activeComponentId: string | null;
      timeLeftSeconds: number;
      phase: EventPhase;
    }) => void;
    onComponentUpdated?: (component: RobotComponent) => void;
    onVariantUpdated?: (
      variant: ComponentVariant,
      bid: Bid | null,
      outbidTeamId: string | null
    ) => void;
    onVariantSold?: (
      variant: ComponentVariant,
      winnerTeam: Team,
      component: RobotComponent
    ) => void;
    onTeamUpdated?: (team: Team) => void;
    onEventStateChange?: (state: EventState) => void;
    onLog?: (log: EventLog) => void;
  }) {
    this.onStateTick = callbacks.onStateTick;
    this.onComponentUpdated = callbacks.onComponentUpdated;
    this.onVariantUpdated = callbacks.onVariantUpdated;
    this.onVariantSold = callbacks.onVariantSold;
    this.onTeamUpdated = callbacks.onTeamUpdated;
    this.onEventStateChange = callbacks.onEventStateChange;
    this.onLog = callbacks.onLog;
  }

  public getState(): EventState {
    return this.state;
  }

  /**
   * Sanitizes state for public / team clients:
   * Redacts other teams' budgets and PINs. Only self sees balance.
   */
  public getSanitizedState(viewingTeamId?: string): EventState {
    const sanitizedTeams: Record<string, Team> = {};
    for (const [id, team] of Object.entries(this.state.teams)) {
      const isSelf =
        viewingTeamId &&
        (team.id === viewingTeamId ||
          team.teamId === viewingTeamId ||
          team.code === viewingTeamId);
      sanitizedTeams[id] = {
        ...team,
        pin: undefined as any,
        balance: isSelf ? team.balance : 0,
        totalBudget: isSelf ? team.totalBudget : 0,
        committedAmount: isSelf ? team.committedAmount : 0,
        spentAmount: isSelf ? team.spentAmount : 0,
        availableBudget: isSelf ? team.availableBudget : 0
      };
    }

    return {
      ...this.state,
      teams: sanitizedTeams
    };
  }

  public getLeaderboard(): FinalScoreResult[] {
    return this.state.leaderboard;
  }

  public getTeam(teamIdOrCode: string): Team | undefined {
    const upper = teamIdOrCode.trim().toUpperCase();
    const lower = teamIdOrCode.trim().toLowerCase();
    return (
      this.state.teams[lower] ||
      Object.values(this.state.teams).find(
        (t) => t.id === lower || t.code === upper || t.teamId === lower
      )
    );
  }

  public static readonly ALLOWED_TRANSITIONS: Record<EventPhase, EventPhase[]> = {
    LOBBY: ['AUCTION'],
    AUCTION: ['AUCTION_COMPLETE', 'ASSEMBLY'],
    AUCTION_COMPLETE: ['ASSEMBLY'],
    ASSEMBLY: ['ASSEMBLY_VALIDATION', 'TESTING'],
    ASSEMBLY_VALIDATION: ['ASSEMBLY', 'TESTING'],
    TESTING: ['RESULT_CALCULATION', 'LEADERBOARD'],
    RESULT_CALCULATION: ['LEADERBOARD'],
    LEADERBOARD: ['EVENT_COMPLETE'],
    EVENT_COMPLETE: []
  };

  public validateTeamAuth(
    codeOrId: string,
    pin?: string,
    teamName?: string
  ): { success: boolean; team?: Team; message?: string } {
    if (!codeOrId || typeof codeOrId !== 'string' || !codeOrId.trim()) {
      return { success: false, message: 'Team code or ID is required.' };
    }
    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return { success: false, message: 'Team PIN is required.' };
    }

    const trimmedPin = pin.trim();
    let team = this.getTeam(codeOrId);
    if (!team) {
      if (Object.keys(this.state.teams).length >= 70) {
        return { success: false, message: 'Registration closed: Maximum limit of 70 teams reached.' };
      }

      // Dynamic registration: Real participants register their squad on the fly
      const cleanCode = codeOrId.trim().toUpperCase();
      const cleanId = cleanCode.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

      if (this.getTeam(cleanCode) || this.getTeam(cleanId)) {
        return { success: false, message: `Team code "${cleanCode}" is already registered.` };
      }

      const cleanName = teamName?.trim() || cleanCode;
      const palette = [
        "#00f2fe", "#4facfe", "#ff0844", "#10b981", "#f5af19", "#a855f7", "#3b82f6", "#14b8a6"
      ];
      const avatarColor = palette[Object.keys(this.state.teams).length % palette.length];

      team = {
        teamId: cleanId,
        id: cleanId,
        code: cleanCode,
        teamName: cleanName,
        name: cleanName,
        pin: trimmedPin,
        avatarColor,
        balance: 100000,
        totalBudget: 100000,
        committedAmount: 0,
        spentAmount: 0,
        availableBudget: 100000,
        components: [],
        wonLotIds: [],
        assembly: AssemblyEngine.createInitialState(),
        testing: TestingEngine.createInitialState(),
        totalBidsPlaced: 0,
        isOnline: true,
        lastActive: Date.now(),
        active: true,
        isEliminated: false
      };

      this.state.teams[cleanId] = team;
      this.recalculateLeaderboard();
      if (this.onTeamUpdated) this.onTeamUpdated(team);
      if (this.onEventStateChange) this.onEventStateChange(this.getSanitizedState());

      this.addLog({
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        type: 'SYSTEM_ALERT',
        message: `Real participant unit registered: ${team.name} (${team.code})`
      });

      return { success: true, team };
    }

    if (team.pin !== trimmedPin) {
      return { success: false, message: 'Invalid Team PIN code.' };
    }

    return { success: true, team };
  }

  public registerTeam(
    code: string,
    pin: string,
    teamName?: string
  ): { success: boolean; team?: Team; message?: string } {
    if (!code || typeof code !== 'string' || !code.trim()) {
      return { success: false, message: 'Team code is required.' };
    }
    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return { success: false, message: 'Team PIN is required.' };
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanId = cleanCode.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (this.getTeam(cleanCode) || this.getTeam(cleanId)) {
      return { success: false, message: `Team code "${cleanCode}" is already registered.` };
    }

    if (Object.keys(this.state.teams).length >= 70) {
      return { success: false, message: 'Registration closed: Maximum limit of 70 teams reached.' };
    }

    return this.validateTeamAuth(cleanCode, pin, teamName);
  }

  public loginTeam(
    codeOrId: string,
    pin: string
  ): { success: boolean; team?: Team; message?: string } {
    if (!codeOrId || typeof codeOrId !== 'string' || !codeOrId.trim()) {
      return { success: false, message: 'Team code or ID is required.' };
    }
    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return { success: false, message: 'Team PIN is required.' };
    }

    const team = this.getTeam(codeOrId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    if (team.pin !== pin.trim()) {
      return { success: false, message: 'Invalid Team PIN code.' };
    }

    return { success: true, team };
  }

  public setTeamOnline(teamId: string, isOnline: boolean) {
    const team = this.getTeam(teamId);
    if (team) {
      team.isOnline = isOnline;
      team.lastActive = Date.now();
      if (this.onTeamUpdated) this.onTeamUpdated(team);
    }
  }

  /**
   * Phase Transition State Machine
   */
  public setPhase(newPhase: EventPhase): { success: boolean; phase: EventPhase; message?: string } {
    if (this.state.phase === newPhase) {
      return { success: true, phase: this.state.phase };
    }

    if (this.state.isResultsPublished && newPhase !== 'EVENT_COMPLETE') {
      return {
        success: false,
        phase: this.state.phase,
        message: 'Tournament results have been published and locked. Phase cannot be altered.'
      };
    }

    const allowed = AuctionEngine.ALLOWED_TRANSITIONS[this.state.phase] || [];
    if (!allowed.includes(newPhase)) {
      return {
        success: false,
        phase: this.state.phase,
        message: `Invalid phase transition from ${this.state.phase} to ${newPhase}.`
      };
    }

    this.state.phase = newPhase;

    if (newPhase === 'AUCTION') {
      this.state.status = 'running';
      if (!this.state.startedAt) this.state.startedAt = Date.now();
      if (!this.state.activeComponentId) {
        this.openNextComponent();
      }
      this.startTicker();
    } else if (newPhase === 'AUCTION_COMPLETE') {
      this.stopTicker();
      if (this.state.activeComponentId) {
        this.closeComponent(this.state.activeComponentId);
      }
    } else if (newPhase === 'ASSEMBLY') {
      this.stopTicker();
      // Auto sync purchased components to assembly for all teams
      for (const team of Object.values(this.state.teams)) {
        team.assembly = AssemblyEngine.syncPurchasedComponents(team);
      }
    } else if (newPhase === 'TESTING') {
      this.runAllRobotTests();
    } else if (newPhase === 'RESULT_CALCULATION' || newPhase === 'LEADERBOARD') {
      this.recalculateLeaderboard();
    } else if (newPhase === 'EVENT_COMPLETE') {
      this.publishResults();
      this.state.status = 'ended';
      this.state.endedAt = Date.now();
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'PHASE_CHANGE',
      message: `Event transitioned to phase: ${newPhase}`
    });

    if (this.onEventStateChange) this.onEventStateChange(this.state);
    return { success: true, phase: newPhase };
  }

  /**
   * Opens a specific component for auction (with its 3 variants available)
   */
  public openComponent(componentId: string, durationSeconds: number = 60): boolean {
    const comp = this.state.components[componentId];
    if (!comp) return false;

    // Close any previous open component
    if (this.state.activeComponentId && this.state.activeComponentId !== componentId) {
      this.closeComponent(this.state.activeComponentId);
    }

    comp.status = 'open';
    comp.timeLeftSeconds = durationSeconds;
    comp.timeRemainingMs = durationSeconds * 1000;
    comp.extensionsCount = 0;

    // Ensure all unsold variants are AVAILABLE
    for (const v of comp.variants) {
      if (v.status !== 'SOLD') {
        v.status = 'AVAILABLE';
      }
    }

    this.state.activeComponentId = comp.id;
    this.state.activeComponentIndex = comp.order - 1;
    this.state.phase = 'AUCTION';
    this.state.status = 'running';

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'AUCTION_START',
      componentId: comp.id,
      message: `AUCTION OPENED: Component #${comp.order} — ${comp.name.toUpperCase()} (3 Variants Available)`
    });

    this.startTicker();

    if (this.onComponentUpdated) this.onComponentUpdated(comp);
    if (this.onEventStateChange) this.onEventStateChange(this.state);
    return true;
  }

  /**
   * Advances sequentially to the next component in the 20-category list
   */
  public openNextComponent(): RobotComponent | null {
    const sorted = Object.values(this.state.components).sort(
      (a, b) => a.order - b.order
    );
    const nextComp = sorted.find((c) => c.status === 'upcoming');

    if (nextComp) {
      this.openComponent(nextComp.id);
      return nextComp;
    }

    // All 20 components completed!
    this.setPhase('AUCTION_COMPLETE');
    return null;
  }

  /**
   * Closes an active component and finalizes all 3 variants
   */
  public closeComponent(componentId: string) {
    const comp = this.state.components[componentId];
    if (!comp) return;

    comp.status = 'closed';
    comp.timeLeftSeconds = 0;
    comp.timeRemainingMs = 0;

    // Finalize each variant
    for (const variant of comp.variants) {
      if (variant.status !== 'SOLD' && variant.highestBidderTeamId) {
        this.finalizeVariantSale(comp, variant);
      }
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'AUCTION_CLOSE',
      componentId: comp.id,
      message: `AUCTION CLOSED: Component #${comp.order} — ${comp.name}.`
    });

    if (this.state.activeComponentId === componentId) {
      this.state.activeComponentId = null;
    }

    this.refreshCommittedBalances();
    this.recalculateLeaderboard();

    if (this.onComponentUpdated) this.onComponentUpdated(comp);
    if (this.onEventStateChange) this.onEventStateChange(this.state);
  }

  /**
   * Places a bid on a specific variant of a component (atomic per-variant mutex)
   */
  public async placeVariantBid(
    variantId: string,
    teamId: string,
    amount: number
  ): Promise<VariantBidResult> {
    let mutex = this.variantMutexes.get(variantId);
    if (!mutex) {
      mutex = new Mutex();
      this.variantMutexes.set(variantId, mutex);
    }

    return mutex.dispatch(() => {
      return this.placeVariantBidInternal(variantId, teamId, amount);
    });
  }

  private placeVariantBidInternal(
    variantId: string,
    teamId: string,
    amount: number
  ): VariantBidResult {
    // 1. Strict amount validation: NaN, Infinity, negative, non-number, non-integer
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      Number.isNaN(amount) ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return { success: false, message: 'Invalid bid amount: Must be a positive integer.' };
    }

    // 2. Immutability and Phase validation
    if (this.state.isResultsPublished) {
      return { success: false, message: 'Bidding is locked: Tournament results have been published.' };
    }

    if (this.state.phase !== 'AUCTION') {
      return { success: false, message: `Bidding is closed: Auction is in ${this.state.phase} phase.` };
    }

    const team = this.getTeam(teamId);
    if (!team) {
      return { success: false, message: `Team ${teamId} not found.` };
    }

    // Find component and variant
    let targetComp: RobotComponent | undefined;
    let targetVariant: ComponentVariant | undefined;

    for (const comp of Object.values(this.state.components)) {
      const found = comp.variants.find((v) => v.id === variantId);
      if (found) {
        targetComp = comp;
        targetVariant = found;
        break;
      }
    }

    if (!targetComp || !targetVariant) {
      return { success: false, message: 'Component variant not found.' };
    }

    if (targetComp.status !== 'open') {
      return { success: false, message: 'Component auction is currently closed.' };
    }

    if (targetVariant.status === 'SOLD') {
      return { success: false, message: 'This variant has already been sold.' };
    }

    // Check if team already bought a variant in this category
    const alreadyPurchased = team.components.find(
      (c) => c.category === targetComp!.category
    );
    if (alreadyPurchased) {
      return {
        success: false,
        message: `Your team already purchased a ${targetComp.name} (${alreadyPurchased.variantName}). Only 1 per team allowed.`
      };
    }

    // Minimum required bid validation & increment validation
    const isFirstBid = targetVariant.highestBidderTeamId === null;
    const minRequiredBid = isFirstBid
      ? targetVariant.startingPrice
      : targetVariant.currentBid + targetVariant.minIncrement;

    if (amount < minRequiredBid) {
      return {
        success: false,
        message: `Bid too low. Minimum valid bid is ₹${minRequiredBid.toLocaleString()}.`
      };
    }

    // Increment validation: must be starting price or multiple of minIncrement
    if (isFirstBid) {
      const diffFromStart = amount - targetVariant.startingPrice;
      if (diffFromStart > 0 && diffFromStart % targetVariant.minIncrement !== 0) {
        return {
          success: false,
          message: `Invalid bid increment: Bid above starting price must increase in multiples of ₹${targetVariant.minIncrement.toLocaleString()}.`
        };
      }
    } else {
      const diff = amount - targetVariant.currentBid;
      if (diff < targetVariant.minIncrement || diff % targetVariant.minIncrement !== 0) {
        return {
          success: false,
          message: `Invalid bid increment: Bid must increase in increments of at least ₹${targetVariant.minIncrement.toLocaleString()} and be a multiple of ₹${targetVariant.minIncrement.toLocaleString()}.`
        };
      }
    }

    // Budget check: committed funds across all leading bids
    this.refreshCommittedBalances();
    const currentLeadingCommitment =
      targetVariant.highestBidderTeamId === team.id ? targetVariant.currentBid : 0;
    const effectiveAvailable = team.availableBudget + currentLeadingCommitment;

    if (effectiveAvailable < amount) {
      return {
        success: false,
        message: `Insufficient budget! Available: ₹${effectiveAvailable.toLocaleString()}, Bid: ₹${amount.toLocaleString()}.`
      };
    }

    const previousHighestBidderId = targetVariant.highestBidderTeamId;

    // Apply bid
    targetVariant.currentBid = amount;
    targetVariant.highestBidderTeamId = team.id;
    targetVariant.highestBidderTeamName = team.name;
    team.totalBidsPlaced += 1;

    const newBid: Bid = {
      id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      componentId: targetComp.id,
      variantId: targetVariant.id,
      variantTier: targetVariant.tier,
      teamId: team.id,
      teamName: team.name,
      amount,
      timestamp: Date.now()
    };

    // Anti-snipe check: if <= 5 seconds left and extensions < 3, add +10s
    let antiSnipeTriggered = false;
    if (targetComp.timeLeftSeconds <= 5 && targetComp.extensionsCount < 3) {
      targetComp.timeLeftSeconds += 10;
      targetComp.timeRemainingMs = targetComp.timeLeftSeconds * 1000;
      targetComp.extensionsCount += 1;
      antiSnipeTriggered = true;

      this.addLog({
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        type: 'ANTI_SNIPE',
        componentId: targetComp.id,
        variantId: targetVariant.id,
        teamId: team.id,
        teamName: team.name,
        message: `ANTI-SNIPE: Timer extended +10s on ${targetComp.name} (${targetVariant.name})! Bid: ₹${amount.toLocaleString()}.`
      });
    }

    this.refreshCommittedBalances();

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'BID_PLACED',
      componentId: targetComp.id,
      variantId: targetVariant.id,
      teamId: team.id,
      teamName: team.name,
      message: `${team.name} placed bid of ₹${amount.toLocaleString()} on ${targetVariant.name}.`
    });

    if (previousHighestBidderId && previousHighestBidderId !== team.id) {
      const outbidTeam = this.state.teams[previousHighestBidderId];
      if (outbidTeam) {
        this.addLog({
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: 'OUTBID',
          componentId: targetComp.id,
          variantId: targetVariant.id,
          teamId: outbidTeam.id,
          teamName: outbidTeam.name,
          message: `${outbidTeam.name} was outbid on ${targetVariant.name} by ${team.name}.`
        });
        if (this.onTeamUpdated) this.onTeamUpdated(outbidTeam);
      }
    }

    if (this.onVariantUpdated) {
      this.onVariantUpdated(targetVariant, newBid, previousHighestBidderId);
    }
    if (this.onTeamUpdated) this.onTeamUpdated(team);
    if (this.onComponentUpdated) this.onComponentUpdated(targetComp);

    // Asynchronously record bid into Supabase Postgres
    supabaseService.recordBid(newBid, targetVariant, team, antiSnipeTriggered).catch((err) => {
      console.error('Async Supabase bid persistence error:', err);
    });

    return {
      success: true,
      message: 'Bid accepted!',
      bid: newBid,
      variant: targetVariant,
      component: targetComp,
      team,
      antiSnipeTriggered
    };
  }

  /**
   * Finalizes the sale of a variant to its highest bidder
   */
  private finalizeVariantSale(comp: RobotComponent, variant: ComponentVariant) {
    if (!variant.highestBidderTeamId) return;

    const winnerTeam = this.state.teams[variant.highestBidderTeamId];
    if (!winnerTeam) return;

    variant.status = 'SOLD';
    variant.winnerTeamId = winnerTeam.id;
    variant.winningPrice = variant.currentBid;

    const purchased: PurchasedComponent = {
      componentId: comp.id,
      componentName: comp.name,
      category: comp.category,
      variantId: variant.id,
      variantTier: variant.tier,
      variantName: variant.name,
      purchasePrice: variant.currentBid,
      capabilities: variant.capabilities,
      specifications: variant.specifications,
      acquiredAt: Date.now()
    };

    winnerTeam.components.push(purchased);
    winnerTeam.wonLotIds.push(variant.id);
    winnerTeam.spentAmount += variant.currentBid;
    winnerTeam.balance = Math.max(0, winnerTeam.totalBudget - winnerTeam.spentAmount);

    // Auto update assembly with this component
    winnerTeam.assembly = AssemblyEngine.syncPurchasedComponents(winnerTeam);

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'COMPONENT_SOLD',
      componentId: comp.id,
      variantId: variant.id,
      teamId: winnerTeam.id,
      teamName: winnerTeam.name,
      message: `SOLD: ${variant.name} won by ${winnerTeam.name} for ₹${variant.currentBid.toLocaleString()}!`
    });

    if (this.onVariantSold) this.onVariantSold(variant, winnerTeam, comp);
    if (this.onTeamUpdated) this.onTeamUpdated(winnerTeam);

    // Asynchronously record variant sale & robot assembly to Supabase
    supabaseService.recordVariantSold(variant, winnerTeam, comp, purchased).catch((err) => {
      console.error('Async Supabase sale persistence error:', err);
    });
    if (winnerTeam.assembly) {
      supabaseService.recordAssembly(winnerTeam.id, winnerTeam.assembly).catch((err) => {
        console.error('Async Supabase assembly persistence error:', err);
      });
    }
  }

  /**
   * Recalculates teams' committed amounts and available balance
   */
  public refreshCommittedBalances() {
    const commitments: Record<string, number> = {};

    for (const comp of Object.values(this.state.components)) {
      if (comp.status === 'open') {
        for (const v of comp.variants) {
          if (v.status !== 'SOLD' && v.highestBidderTeamId) {
            commitments[v.highestBidderTeamId] =
              (commitments[v.highestBidderTeamId] || 0) + v.currentBid;
          }
        }
      }
    }

    for (const team of Object.values(this.state.teams)) {
      team.committedAmount = commitments[team.id] || 0;
      team.balance = Math.max(0, team.totalBudget - team.spentAmount);
      team.availableBudget = Math.max(0, team.balance - team.committedAmount);
    }
  }

  /**
   * Assembly validation for a single team
   */
  /**
   * Assembly validation for a single team
   */
  public validateTeamAssembly(teamId: string) {
    const team = this.getTeam(teamId);
    if (!team) return null;

    if (this.state.isResultsPublished) {
      return team.assembly;
    }

    team.assembly = AssemblyEngine.syncPurchasedComponents(team);
    if (this.onTeamUpdated) this.onTeamUpdated(team);
    return team.assembly;
  }

  /**
   * Runs tests for a specific team robot
   */
  public runTeamTest(teamId: string) {
    const team = this.getTeam(teamId);
    if (!team) return null;

    if (this.state.isResultsPublished) {
      return team.testing;
    }

    team.assembly = AssemblyEngine.syncPurchasedComponents(team);
    team.testing = TestingEngine.evaluateRobot(team);

    this.recalculateLeaderboard();
    if (this.onTeamUpdated) this.onTeamUpdated(team);
    return team.testing;
  }

  /**
   * Runs robot tests for all teams
   */
  public runAllRobotTests() {
    if (this.state.isResultsPublished) return;

    for (const team of Object.values(this.state.teams)) {
      team.assembly = AssemblyEngine.syncPurchasedComponents(team);
      team.testing = TestingEngine.evaluateRobot(team);
    }

    this.recalculateLeaderboard();
    if (this.onEventStateChange) this.onEventStateChange(this.state);
  }

  /**
   * Recalculates leaderboard using the authoritative formula:
   * (Normalized Performance * 0.70) + (Budget Efficiency * 0.30)
   */
  public recalculateLeaderboard() {
    // If results are published and leaderboard is populated, lock scores
    if (this.state.isResultsPublished && this.state.leaderboard.length > 0) {
      return;
    }

    this.state.leaderboard = ScoringEngine.calculateFinalScores(this.state.teams);
    for (const entry of this.state.leaderboard) {
      const team = this.state.teams[entry.teamId];
      if (team) {
        team.finalScoreResult = entry;
      }
    }
  }

  /**
   * Publishes final results, making them immutable
   */
  public publishResults() {
    if (this.state.isResultsPublished) return;

    this.stopTicker();
    if (this.state.activeComponentId) {
      this.closeComponent(this.state.activeComponentId);
    }

    this.recalculateLeaderboard();
    this.state.isResultsPublished = true;
    if (this.state.phase !== 'EVENT_COMPLETE') {
      this.state.phase = 'LEADERBOARD';
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'SCORES_PUBLISHED',
      message: 'FINAL SCORES & LEADERBOARD PUBLISHED BY HOST! Results are now immutable.'
    });

    if (this.onEventStateChange) this.onEventStateChange(this.state);

    // Asynchronously persist final leaderboard and complete state to Supabase
    supabaseService.recordTestingScores(this.state.leaderboard).catch((err) => {
      console.error('Async Supabase testing scores persistence error:', err);
    });
    supabaseService.persistState(this.state).catch((err) => {
      console.error('Async Supabase final state persistence error:', err);
    });
  }

  /**
   * Runs Demo Mode instant simulation of 20-70 bots
   */
  public runDemoSimulation() {
    const result = DemoSimulation.runFullSimulation(
      this.state.teams,
      this.state.components
    );

    this.state.teams = result.updatedTeams;
    this.state.components = result.updatedComponents;
    this.state.isDemoMode = true;
    this.state.phase = 'LEADERBOARD';
    this.state.isResultsPublished = true;
    this.state.status = 'ended';

    this.recalculateLeaderboard();

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'SYSTEM_ALERT',
      message: 'DEMO SIMULATION EXECUTED: 70 Teams simulated through Auction, Assembly & Testing.'
    });

    if (this.onEventStateChange) this.onEventStateChange(this.state);
  }

  /**
   * Resets the entire event to initial Lobby state
   */
  public resetEvent() {
    this.stopTicker();

    const components = generateRobotComponents();
    const teams: Record<string, Team> = {};

    this.state = {
      phase: 'LOBBY',
      status: 'lobby',
      startingBudget: 100000,
      currentRound: 1,
      activeComponentId: null,
      activeComponentIndex: 0,
      totalComponents: 20,
      components,
      teams,
      leaderboard: [],
      recentLogs: [],
      startedAt: null,
      endedAt: null,
      isResultsPublished: false,
      isDemoMode: false,
      lots: generateSeedLots(4),
      eliminatedCount: 0
    };

    this.refreshCommittedBalances();
    this.recalculateLeaderboard();

    this.addLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'SYSTEM_ALERT',
      message: 'Robo Auction has been completely RESET to initial state by Host.'
    });

    if (this.onEventStateChange) this.onEventStateChange(this.state);
  }

  // Ticker for live auction timer
  private startTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private stopTicker() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private tick() {
    if (this.state.status !== 'running' || this.state.phase !== 'AUCTION') return;

    if (this.state.activeComponentId) {
      const comp = this.state.components[this.state.activeComponentId];
      if (comp && comp.status === 'open') {
        comp.timeLeftSeconds -= 1;
        comp.timeRemainingMs = Math.max(0, comp.timeLeftSeconds * 1000);

        if (this.onStateTick) {
          this.onStateTick({
            activeComponentId: comp.id,
            timeLeftSeconds: comp.timeLeftSeconds,
            phase: this.state.phase
          });
        }

        if (comp.timeLeftSeconds <= 0) {
          this.closeComponent(comp.id);
          // Check if more components remain
          this.openNextComponent();
        }
      }
    }
  }

  public addLog(log: EventLog) {
    this.state.recentLogs.unshift(log);
    if (this.state.recentLogs.length > 100) {
      this.state.recentLogs.pop();
    }
    if (this.onLog) this.onLog(log);
  }

  // --- Backward Compatibility & Helper Methods ---
  public startEvent() {
    if (this.state.phase === 'LOBBY') {
      return this.setPhase('AUCTION');
    }
    return { success: false, phase: this.state.phase, message: `Cannot start event from phase ${this.state.phase}. Must be in LOBBY.` };
  }

  public pauseEvent() {
    this.state.status = 'paused';
    this.stopTicker();
    if (this.onEventStateChange) this.onEventStateChange(this.state);
    return { success: true, status: this.state.status };
  }

  public resumeEvent() {
    if (this.state.phase === 'AUCTION') {
      this.state.status = 'running';
      this.startTicker();
      if (this.onEventStateChange) this.onEventStateChange(this.state);
      return { success: true, status: this.state.status };
    }
    return { success: false, status: this.state.status, message: 'Can only resume during AUCTION phase.' };
  }

  public extendLotTime(targetId: string, seconds: number = 15) {
    if (this.state.activeComponentId) {
      const comp = this.state.components[this.state.activeComponentId];
      if (comp) {
        comp.timeLeftSeconds += seconds;
        comp.timeRemainingMs = comp.timeLeftSeconds * 1000;
        if (this.onComponentUpdated) this.onComponentUpdated(comp);
      }
    }
  }

  public forceCloseLot(targetId: string) {
    if (this.state.activeComponentId) {
      this.closeComponent(this.state.activeComponentId);
    }
  }

  public reopenLot(targetId: string, seconds: number = 60) {
    const comp = this.state.components[targetId];
    if (comp) {
      this.openComponent(comp.id, seconds);
    }
  }

  public getTeamInventory(teamIdOrCode: string) {
    const team = this.getTeam(teamIdOrCode);
    if (!team) return null;
    return {
      teamId: team.id,
      code: team.code,
      teamName: team.name,
      totalBudget: team.totalBudget,
      spentAmount: team.spentAmount,
      remainingBudget: team.balance,
      componentsCount: team.components.length,
      components: team.components,
      assembly: team.assembly,
      testResults: team.testing?.taskResults,
      finalScore: team.finalScoreResult?.finalScore
    };
  }

  public async placeBid(lotId: string, teamId: string, amount: number) {
    // If lotId corresponds to a variant, delegate to placeVariantBid
    return this.placeVariantBid(lotId, teamId, amount);
  }

  public runEliminationCut(cutToCount: number) {
    this.recalculateLeaderboard();
    return { cutToCount, remainingTeamsCount: Object.keys(this.state.teams).length };
  }

  public eliminateBottomTeams(count: number) {
    this.recalculateLeaderboard();
  }

  public getSnapshotPath(): string {
    return this.snapshotFilePath;
  }

  public saveSnapshot(): void {
    try {
      const dataDir = path.dirname(this.snapshotFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Atomic write via temporary file to prevent corruption on crash/interruption
      const tempPath = `${this.snapshotFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.snapshotFilePath);

      // Also persist state and snapshot to Supabase Postgres
      supabaseService.persistState(this.state).catch((err) => {
        console.error('Async Supabase snapshot persistence error:', err);
      });
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  }

  public async loadSnapshotAsync(): Promise<boolean> {
    // 1. Try loading from Supabase first
    try {
      const supabaseState = await supabaseService.loadLatestSnapshot();
      if (supabaseState && supabaseState.components && supabaseState.teams) {
        this.state = supabaseState;
        console.log('✅ Loaded tournament state from Supabase Postgres database.');
        return true;
      }
    } catch (err) {
      console.warn('⚠️ Could not load snapshot from Supabase, falling back to local file...', err);
    }

    // 2. Fall back to local snapshot file
    return this.loadSnapshot();
  }

  public loadSnapshot(): boolean {
    try {
      if (fs.existsSync(this.snapshotFilePath)) {
        const raw = fs.readFileSync(this.snapshotFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.components && parsed.teams) {
          this.state = parsed;
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to load snapshot:', err);
    }
    return false;
  }

  public startAutoSnapshot(intervalMs: number = 20000): void {
    setInterval(() => {
      this.saveSnapshot();
    }, intervalMs);
  }
}
