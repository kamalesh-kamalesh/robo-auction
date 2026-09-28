// =========================================================================
// 🤖 ROBO AUCTION — COMPLETE CLIENT DATA MODELS & TYPE DEFINITIONS
// =========================================================================

export type MajorComponentCategory =
  | 'chassis'
  | 'motor'
  | 'motor_driver'
  | 'battery'
  | 'controller'
  | 'ultrasonic_sensor'
  | 'ir_sensor'
  | 'line_sensor'
  | 'servo_motor'
  | 'wheel_set'
  | 'gearbox'
  | 'encoder'
  | 'camera'
  | 'comm_module'
  | 'gripper'
  | 'robotic_arm'
  | 'power_regulator'
  | 'imu'
  | 'distance_sensor'
  | 'control_interface';

export type ProductCategory = MajorComponentCategory | 'sensor' | 'power' | 'structural';
export type ComponentCategory = ProductCategory;
export type RobotCategory = ComponentCategory;

export type VariantTier = 'basic' | 'advanced' | 'pro';

export type EventPhase =
  | 'LOBBY'
  | 'AUCTION'
  | 'AUCTION_COMPLETE'
  | 'ASSEMBLY'
  | 'ASSEMBLY_VALIDATION'
  | 'TESTING'
  | 'RESULT_CALCULATION'
  | 'LEADERBOARD'
  | 'EVENT_COMPLETE';

export const ALLOWED_INCREMENT_BUTTONS = [500, 1000, 2500, 5000, 10000] as const;
export type AllowedIncrement = typeof ALLOWED_INCREMENT_BUTTONS[number];

export interface ComponentCapabilities {
  powerWatts?: number;
  torqueNm?: number;
  speedRpm?: number;
  efficiencyPercent?: number;
  accuracyPercent?: number;
  detectionRangeMeters?: number;
  computeRateMips?: number;
  capacityMah?: number;
  voltageVolts?: number;
  dof?: number;
  payloadKg?: number;
  rating: number; // 1-100 overall tier capability score
}

export interface ComponentVariant {
  id: string; // e.g. "comp-02-basic"
  componentId: string; // e.g. "comp-02"
  componentName: string; // e.g. "Motor"
  category: MajorComponentCategory;
  name: string; // e.g. "Motor — Basic (100W)"
  tier: VariantTier;
  startingPrice: number; // in ₹ e.g. 5000
  currentBid: number;
  minIncrement: number; // default ₹500
  highestBidderTeamId: string | null;
  highestBidderTeamName: string | null;
  status: 'AVAILABLE' | 'SOLD';
  winnerTeamId?: string | null;
  winningPrice?: number | null;
  capabilities: ComponentCapabilities;
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface RobotComponent {
  id: string; // "comp-01" to "comp-20"
  order: number; // 1 to 20
  name: string; // e.g. "Motor"
  category: MajorComponentCategory;
  description: string;
  status: 'upcoming' | 'open' | 'closed';
  variants: [ComponentVariant, ComponentVariant, ComponentVariant]; // Basic, Advanced, Pro
  timeRemainingMs: number;
  timeLeftSeconds: number;
  extensionsCount: number;
  maxExtensions: number;
}

export interface Bid {
  id?: string;
  componentId?: string;
  variantId?: string;
  variantTier?: VariantTier;
  teamId: string;
  teamName?: string;
  amount: number;
  timestamp: number;
  lotId?: string;
}

export interface PurchasedComponent {
  componentId: string;
  componentName: string;
  category: MajorComponentCategory;
  variantId: string;
  variantTier: VariantTier;
  variantName: string;
  purchasePrice: number;
  capabilities: ComponentCapabilities;
  specifications: Record<string, string>;
  acquiredAt: number;
}

export interface AssemblySlot {
  category: MajorComponentCategory;
  categoryName: string;
  assignedVariantId: string | null;
  assignedComponent?: PurchasedComponent | null;
  installed: boolean;
}

export interface AssemblyState {
  slots: Record<MajorComponentCategory, AssemblySlot>;
  connected: boolean;
  isValidated: boolean;
  compatibilityScore: number; // 0-100
  errors: string[];
  warnings: string[];
  lastValidatedAt?: number;
}

export interface RobotTestTask {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  icon: string;
  evaluatorKey: 'speed' | 'accuracy' | 'obstacle' | 'detection' | 'pick_place' | 'efficiency';
}

export interface TaskResult {
  taskId: string;
  taskName: string;
  score: number;
  maxScore: number;
  efficiencyRating: number;
  completionTimeSec: number;
  details: string;
  status: 'pending' | 'running' | 'completed';
}

export interface TestingState {
  currentTestIndex: number;
  taskResults: Record<string, TaskResult>;
  totalPerformanceScore: number; // 0-800
  testingCompleted: boolean;
}

export interface FinalScoreResult {
  teamId: string;
  teamName: string;
  code: string;
  avatarColor: string;
  rank: number;
  totalSpent: number;
  remainingBudget: number;
  rawPerformanceScore: number; // 0-800
  normalizedPerformance: number; // 0-1000
  budgetEfficiencyScore: number; // 0-1000
  finalScore: number; // (normalizedPerformance * 0.70) + (budgetEfficiencyScore * 0.30)
  componentsCount: number;
  assemblyQuality: number;
  status: 'LOBBY' | 'AUCTIONING' | 'ASSEMBLED' | 'TESTED' | 'PUBLISHED';
  surplusValue?: number;
  portfolioBonus?: number;
  distinctCategoriesCount?: number;
  lotsWonCount?: number;
  isEliminated?: boolean;
  totalScore?: number;
  competitionScore?: number;
}

export interface Team {
  teamId: string;
  id: string;
  code: string; // e.g. "TEAM-01"
  teamName: string;
  name: string;
  pin: string;
  avatarColor: string;
  totalBudget: number; // Default ₹100,000
  balance: number;
  spentAmount: number;
  committedAmount: number;
  availableBudget: number;
  components: PurchasedComponent[];
  wonLotIds: string[];
  assembly: AssemblyState;
  testing: TestingState;
  finalScoreResult?: FinalScoreResult | null;
  totalBidsPlaced: number;
  isOnline: boolean;
  lastActive: number;
  active: boolean;
  isEliminated: boolean;
  // Compatibility fields
  productsWon?: any[];
  competitionScore?: number;
}

export interface EventLog {
  id: string;
  timestamp: number;
  type:
    | 'PHASE_CHANGE'
    | 'AUCTION_START'
    | 'AUCTION_CLOSE'
    | 'BID_PLACED'
    | 'OUTBID'
    | 'ANTI_SNIPE'
    | 'COMPONENT_SOLD'
    | 'ASSEMBLY_VALIDATED'
    | 'TEST_COMPLETED'
    | 'SCORES_PUBLISHED'
    | 'SYSTEM_ALERT'
    | 'EVENT_START'
    | 'EVENT_PAUSE'
    | 'EVENT_RESUME'
    | 'EVENT_RESET'
    | 'EVENT_END'
    | 'LOT_OPENED'
    | 'LOT_CLOSED'
    | 'TIMER_EXTENDED'
    | 'TEAM_ELIMINATED';
  componentId?: string;
  variantId?: string;
  teamId?: string;
  teamName?: string;
  message: string;
  lotId?: string;
  lotTitle?: string;
}

export interface EventState {
  phase: EventPhase;
  status: string; // "lobby" | "running" | "paused" | "ended"
  startingBudget: number; // ₹100,000
  currentRound: number;
  activeComponentId: string | null;
  activeComponentIndex: number;
  totalComponents: number; // 20
  components: Record<string, RobotComponent>; // 20 components
  teams: Record<string, Team>; // 70 teams
  leaderboard: FinalScoreResult[];
  recentLogs: EventLog[];
  startedAt: number | null;
  endedAt: number | null;
  isResultsPublished: boolean;
  isDemoMode: boolean;
  lots: Record<string, any>;
  eliminatedCount: number;
  antiSnipeSeconds?: number;
  antiSnipeThresholdSeconds?: number;
  concurrentLotsTarget?: number;
}

export type AppRole = 'team' | 'host' | 'spectator';

// Legacy compatibility aliases
export interface Product {
  id: string;
  name: string;
  category: any;
  startingBid: number;
  fairValue: number;
}

export interface Lot {
  id: string;
  lotId?: string;
  product?: any;
  title: string;
  category: any;
  description?: string;
  specifications?: Record<string, string>;
  basePrice: number;
  fairValue: number;
  currentBid: number;
  minIncrement: number;
  highestBidderId: string | null;
  highestBidderTeamId: string | null;
  highestBidderTeamName: string | null;
  status: any;
  timeRemainingMs: number;
  initialTimeSeconds: number;
  timeLeftSeconds: number;
  bidsCount: number;
  bidHistory: any[];
  winnerTeamId?: string | null;
  winningBidAmount?: number | null;
  extensionsUsed: number;
  extensionsCount: number;
  maxExtensions: number;
  hardTimeCeilingSeconds: number;
  queueOrder: number;
}

export interface ScoreDetail {
  teamId: string;
  teamName: string;
  rank: number;
  totalScore: number;
  competitionScore: number;
  remainingBalance: number;
  surplusValue: number;
  portfolioBonus: number;
  distinctCategoriesCount: number;
  lotsWonCount: number;
  categoriesCollected: any[];
  isEliminated: boolean;
}

export interface InventoryItem {
  lotId: string;
  title: string;
  category: any;
  description: string;
  specifications: Record<string, string>;
  fairValue: number;
  pricePaid: number;
  surplusValue: number;
  acquiredAt: number;
}

export interface TeamInventory {
  teamId: string;
  teamCode: string;
  teamName: string;
  totalItems: number;
  categoriesOwned: any[];
  distinctCategoriesCount: number;
  items: InventoryItem[];
  stats: {
    totalSpent: number;
    totalFairValue: number;
    netSurplusValue: number;
  };
}
