import {
  ComponentVariant,
  PurchasedComponent,
  RobotComponent,
  Team,
  VariantTier
} from '../types/index.js';
import { AssemblyEngine } from './AssemblyEngine.js';
import { TestingEngine } from './TestingEngine.js';
import { ScoringEngine } from './ScoringEngine.js';

export class DemoSimulation {
  /**
   * Simulates an authentic competition across 70 teams:
   * Each team builds a robot matching an engineering archetype:
   * 1. "Pro High-Rollers" (High spend, maximum pro parts, top raw performance)
   * 2. "Budget Engineers" (Low spend, smart basic parts, high budget efficiency)
   * 3. "Balanced Innovators" (Mid spend, advanced parts, optimal hybrid score)
   */
  public static runFullSimulation(
    teams: Record<string, Team>,
    components: Record<string, RobotComponent>
  ): {
    updatedTeams: Record<string, Team>;
    updatedComponents: Record<string, RobotComponent>;
  } {
    const compList = Object.values(components);
    const teamList = Object.values(teams);
    if (teamList.length === 0 || compList.length === 0) {
      return { updatedTeams: teams, updatedComponents: components };
    }

    const simulatedTeams: Record<string, Team> = {};
    const archetypes: ('pro' | 'advanced' | 'basic')[] = ['pro', 'advanced', 'basic', 'advanced'];

    // Map component categories to components
    const compByCategory = new Map<string, RobotComponent>();
    for (const c of compList) {
      compByCategory.set(c.category, c);
    }

    // 1. Build simulated teams with realistic component loads
    teamList.forEach((origTeam, idx) => {
      const preferredTier: VariantTier = archetypes[idx % archetypes.length];
      const teamId = origTeam.id;

      // Select 6-12 components for each team including essential core: chassis, controller, battery, motor
      const essentialCategories = ['chassis', 'controller', 'battery', 'motor', 'motor_driver', 'wheel_set'];
      const optionalCategories = [
        'ultrasonic_sensor', 'ir_sensor', 'line_sensor', 'servo_motor',
        'gearbox', 'encoder', 'camera', 'comm_module', 'gripper',
        'robotic_arm', 'power_regulator', 'imu', 'distance_sensor', 'control_interface'
      ];

      // Shuffle optional categories and pick a subset based on tier
      const optionalsCount = preferredTier === 'pro' ? 8 : preferredTier === 'advanced' ? 5 : 3;
      const shuffledOptionals = [...optionalCategories].sort(() => 0.5 - Math.random()).slice(0, optionalsCount);
      const chosenCategories = [...essentialCategories, ...shuffledOptionals];

      const purchasedComponents: PurchasedComponent[] = [];
      let totalSpent = 0;

      for (const cat of chosenCategories) {
        const comp = compByCategory.get(cat);
        if (!comp) continue;

        // Choose variant matching tier or fallback
        let variant = comp.variants.find((v) => v.tier === preferredTier);
        if (!variant) variant = comp.variants[0];

        const priceVariance = Math.floor(Math.random() * 3) * variant.minIncrement;
        const purchasePrice = variant.startingPrice + priceVariance;

        if (totalSpent + purchasePrice <= 95000) {
          totalSpent += purchasePrice;
          purchasedComponents.push({
            componentId: comp.id,
            componentName: comp.name,
            category: comp.category,
            variantId: variant.id,
            variantTier: variant.tier,
            variantName: variant.name,
            purchasePrice,
            capabilities: variant.capabilities,
            specifications: variant.specifications,
            acquiredAt: Date.now() - Math.floor(Math.random() * 3600000)
          });
        }
      }

      const teamBudget = origTeam.totalBudget || 100000;
      const remaining = Math.max(0, teamBudget - totalSpent);

      simulatedTeams[teamId] = {
        ...origTeam,
        totalBudget: teamBudget,
        spentAmount: totalSpent,
        balance: remaining,
        committedAmount: 0,
        availableBudget: remaining,
        components: purchasedComponents,
        wonLotIds: purchasedComponents.map((c) => c.variantId),
        assembly: AssemblyEngine.createInitialState(),
        testing: TestingEngine.createInitialState(),
        totalBidsPlaced: Math.floor(Math.random() * 12) + 6
      };
    });

    // 2. Update components in catalogue to display realistic auction winners
    const simulatedComponents: Record<string, RobotComponent> = JSON.parse(
      JSON.stringify(components)
    );

    for (const comp of Object.values(simulatedComponents)) {
      comp.status = 'closed';
      comp.timeLeftSeconds = 0;
      comp.timeRemainingMs = 0;

      for (const variant of comp.variants) {
        // Find if any team purchased this variant
        const buyer = Object.values(simulatedTeams).find((t) =>
          t.components.some((c) => c.variantId === variant.id)
        );

        if (buyer) {
          const compPurchased = buyer.components.find((c) => c.variantId === variant.id)!;
          variant.status = 'SOLD';
          variant.winnerTeamId = buyer.id;
          variant.winningPrice = compPurchased.purchasePrice;
          variant.currentBid = compPurchased.purchasePrice;
          variant.highestBidderTeamId = buyer.id;
          variant.highestBidderTeamName = buyer.name;
        } else {
          variant.status = 'AVAILABLE';
        }
      }
    }

    // 3. Run authoritative assembly validation and testing for all 70 teams
    for (const team of Object.values(simulatedTeams)) {
      team.assembly = AssemblyEngine.syncPurchasedComponents(team);
      team.testing = TestingEngine.evaluateRobot(team);
    }

    // 4. Calculate authoritative final scores
    const leaderboard = ScoringEngine.calculateFinalScores(simulatedTeams);
    for (const entry of leaderboard) {
      const team = simulatedTeams[entry.teamId];
      if (team) {
        team.finalScoreResult = entry;
      }
    }

    return {
      updatedTeams: simulatedTeams,
      updatedComponents: simulatedComponents
    };
  }
}
