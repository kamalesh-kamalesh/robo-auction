import { FinalScoreResult, Team } from '../types/index.js';

export interface ScoringWeights {
  performanceWeight: number; // default 0.70
  efficiencyWeight: number; // default 0.30
}

export class ScoringEngine {
  public static readonly DEFAULT_WEIGHTS: ScoringWeights = {
    performanceWeight: 0.70,
    efficiencyWeight: 0.30
  };

  /**
   * Calculates comprehensive final scores for all teams:
   * Final Score = (Normalized Performance × 0.70) + (Budget Efficiency × 0.30)
   *
   * Where:
   * Raw Performance = sum of 6 tasks (0 - 800)
   * Normalized Performance = (Raw / 800) * 1000 (0 - 1000)
   * Budget Efficiency = (Raw Performance / Total Spent) normalized to 0 - 1000
   */
  public static calculateFinalScores(
    teams: Record<string, Team>,
    weights: ScoringWeights = this.DEFAULT_WEIGHTS
  ): FinalScoreResult[] {
    const teamList = Object.values(teams);
    if (teamList.length === 0) return [];

    // First pass: compute raw metrics and find max efficiency for dynamic normalization
    const rawMetrics = teamList.map((team) => {
      const rawPerformance = team.testing?.totalPerformanceScore ?? 0;
      const totalSpent = team.spentAmount ?? 0;
      const remainingBudget = Math.max(0, team.totalBudget - totalSpent);
      const componentsCount = team.components?.length ?? 0;
      const assemblyQuality = team.assembly?.compatibilityScore ?? 0;

      // Raw efficiency ratio: points per ₹1,000 spent
      // If team spent nothing but has 0 points, efficiency is 0
      const rawEfficiency =
        totalSpent > 0 && rawPerformance > 0
          ? (rawPerformance / totalSpent) * 100000
          : 0;

      return {
        team,
        rawPerformance,
        totalSpent,
        remainingBudget,
        componentsCount,
        assemblyQuality,
        rawEfficiency
      };
    });

    // Determine highest raw efficiency among valid bots to normalize cleanly
    const maxRawEfficiency = Math.max(
      ...rawMetrics.map((m) => m.rawEfficiency),
      1000
    );

    const results: FinalScoreResult[] = rawMetrics.map((m) => {
      // Normalized Performance: 0 to 1000
      const normalizedPerformance = Math.min(
        1000,
        Math.round((m.rawPerformance / 800) * 1000)
      );

      // Normalized Budget Efficiency: 0 to 1000
      // Scaled by max efficiency or capped benchmark
      const budgetEfficiencyScore =
        maxRawEfficiency > 0
          ? Math.min(1000, Math.round((m.rawEfficiency / maxRawEfficiency) * 1000))
          : 0;

      // Final Score calculation
      const finalScore = Number(
        (
          normalizedPerformance * weights.performanceWeight +
          budgetEfficiencyScore * weights.efficiencyWeight
        ).toFixed(1)
      );

      let status: FinalScoreResult['status'] = 'LOBBY';
      if (m.team.testing?.testingCompleted) {
        status = 'TESTED';
      } else if (m.team.assembly?.isValidated) {
        status = 'ASSEMBLED';
      } else if (m.team.components?.length > 0) {
        status = 'AUCTIONING';
      }

      return {
        teamId: m.team.id,
        teamName: m.team.name || m.team.teamName,
        code: m.team.code || m.team.id,
        avatarColor: m.team.avatarColor || '#00e5ff',
        rank: 0,
        totalSpent: m.totalSpent,
        remainingBudget: m.remainingBudget,
        rawPerformanceScore: m.rawPerformance,
        normalizedPerformance,
        budgetEfficiencyScore,
        finalScore,
        componentsCount: m.componentsCount,
        assemblyQuality: m.assemblyQuality,
        status
      };
    });

    // Rank sorting: descending by finalScore, then normalizedPerformance, then budget efficiency
    results.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.normalizedPerformance !== a.normalizedPerformance) {
        return b.normalizedPerformance - a.normalizedPerformance;
      }
      return b.budgetEfficiencyScore - a.budgetEfficiencyScore;
    });

    // Assign 1-indexed ranks
    results.forEach((res, idx) => {
      res.rank = idx + 1;
    });

    return results;
  }

  /**
   * Backward compatibility calculation for previous callers
   */
  public static calculateScores(teams: Record<string, Team>, lots: Record<string, any>): any[] {
    const finalScores = this.calculateFinalScores(teams);
    return finalScores.map((f) => ({
      teamId: f.teamId,
      teamName: f.teamName,
      rank: f.rank,
      totalScore: f.finalScore,
      competitionScore: f.finalScore,
      remainingBalance: f.remainingBudget,
      surplusValue: Math.round(f.budgetEfficiencyScore),
      portfolioBonus: f.componentsCount * 20,
      distinctCategoriesCount: f.componentsCount,
      lotsWonCount: f.componentsCount,
      categoriesCollected: [],
      isEliminated: false,
      profitScore: f.budgetEfficiencyScore,
      synergyScore: f.normalizedPerformance,
      hoardingPenalty: 0,
      capitalEfficiencyBonus: Math.round(f.remainingBudget * 0.01),
      isCompleteRobotBuilt: f.componentsCount >= 10
    }));
  }
}
