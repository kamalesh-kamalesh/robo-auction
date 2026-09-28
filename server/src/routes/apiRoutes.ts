import { Router, Request, Response, NextFunction } from 'express';
import { AuctionEngine } from '../engine/AuctionEngine.js';

export function createApiRouter(engine: AuctionEngine): Router {
  const router = Router();
  const HOST_PASSCODE = process.env.HOST_PASSCODE || 'host2026';

  // Middleware to require Host authorization on administrative endpoints
  const requireHostAuth = (req: Request, res: Response, next: NextFunction) => {
    const headerPasscode = req.headers['x-host-passcode'] as string;
    const authHeader = req.headers['authorization'];
    let bearerPasscode: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerPasscode = authHeader.substring(7).trim();
    }
    const bodyPasscode = req.body?.hostPasscode || req.body?.passcode;
    const queryPasscode = (req.query?.passcode || req.query?.hostPasscode) as string;

    const providedPasscode = headerPasscode || bearerPasscode || bodyPasscode || queryPasscode;

    if (!providedPasscode || providedPasscode !== HOST_PASSCODE) {
      res.status(401).json({ error: 'Unauthorized: Valid host passcode required.' });
      return;
    }
    next();
  };

  // Public health check and summary
  router.get('/status', (_, res) => {
    const state = engine.getState();
    res.json({
      status: state.status,
      phase: state.phase,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      activeComponentId: state.activeComponentId,
      totalComponents: state.totalComponents,
      totalTeams: Object.values(state.teams).length,
      onlineTeams: Object.values(state.teams).filter((t) => t.isOnline).length,
      isResultsPublished: state.isResultsPublished,
      isDemoMode: state.isDemoMode
    });
  });

  // Section 43: GET /api/event/status
  router.get('/event/status', (_, res) => {
    const state = engine.getState();
    res.json({
      phase: state.phase,
      status: state.status,
      activeComponentId: state.activeComponentId,
      activeComponentIndex: state.activeComponentIndex,
      totalComponents: state.totalComponents,
      startedAt: state.startedAt,
      isResultsPublished: state.isResultsPublished,
      isDemoMode: state.isDemoMode
    });
  });

  // Section 43: GET /api/leaderboard
  router.get('/leaderboard', (_, res) => {
    res.json(engine.getLeaderboard());
  });

  // Section 43: GET /api/team/:id
  router.get('/team/:id', (req, res) => {
    const team = engine.getTeam(req.params.id);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    const safeTeam = { ...team, pin: undefined };
    res.json(safeTeam);
  });

  // Section 43: GET /api/team/:id/inventory
  router.get('/team/:id/inventory', (req, res) => {
    const inventory = engine.getTeamInventory(req.params.id);
    if (!inventory) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json(inventory);
  });

  // All 20 Components listing
  router.get('/components', (_, res) => {
    const state = engine.getState();
    res.json(Object.values(state.components).sort((a, b) => a.order - b.order));
  });

  // Protected Admin Controls (POST only with Host Authentication)
  router.post('/start', requireHostAuth, (_, res) => {
    const result = engine.startEvent();
    if (!result.success) {
      res.status(400).json({ error: result.message, phase: engine.getState().phase });
      return;
    }
    res.json({ success: true, phase: engine.getState().phase });
  });

  router.post('/pause', requireHostAuth, (_, res) => {
    const result = engine.pauseEvent();
    res.json({ success: true, status: engine.getState().status });
  });

  router.post('/resume', requireHostAuth, (_, res) => {
    const result = engine.resumeEvent();
    if (!result.success) {
      res.status(400).json({ error: result.message, status: engine.getState().status });
      return;
    }
    res.json({ success: true, status: engine.getState().status });
  });

  router.post('/reset', requireHostAuth, (_, res) => {
    engine.resetEvent();
    res.json({ success: true, phase: engine.getState().phase });
  });

  // Trigger Demo Mode
  router.post('/demo', requireHostAuth, (_, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_MODE !== 'true') {
      res.status(403).json({ error: 'Demo simulation is disabled in production mode. Set ALLOW_DEMO_MODE=true to enable.' });
      return;
    }
    engine.runDemoSimulation();
    res.json({ success: true, message: 'Demo simulation completed successfully!' });
  });

  // Host phase change
  router.post('/phase', requireHostAuth, (req, res) => {
    const { phase } = req.body || {};
    if (!phase) {
      res.status(400).json({ error: 'Phase parameter required' });
      return;
    }
    const result = engine.setPhase(phase);
    if (!result.success) {
      res.status(400).json({ error: result.message, phase: result.phase });
      return;
    }
    res.json({ success: true, phase: result.phase });
  });

  // Team Registration & Authentication REST Endpoints
  router.post('/teams/register', (req, res) => {
    const { code, pin, teamName } = req.body || {};
    const result = engine.registerTeam(code, pin, teamName);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    const safeTeam = { ...result.team, pin: undefined };
    res.status(201).json({ success: true, team: safeTeam });
  });

  router.post('/teams/login', (req, res) => {
    const { code, pin } = req.body || {};
    const result = engine.loginTeam(code, pin);
    if (!result.success) {
      res.status(401).json({ error: result.message });
      return;
    }
    const safeTeam = { ...result.team, pin: undefined };
    res.json({ success: true, team: safeTeam });
  });

  // Export event audit trail (JSON)
  router.get('/export', (_, res) => {
    const state = engine.getState();
    const exportData = {
      exportedAt: new Date().toISOString(),
      eventPhase: state.phase,
      eventStatus: state.status,
      startedAt: state.startedAt ? new Date(state.startedAt).toISOString() : null,
      endedAt: state.endedAt ? new Date(state.endedAt).toISOString() : null,
      leaderboard: state.leaderboard,
      components: Object.values(state.components).map((c) => ({
        id: c.id,
        order: c.order,
        name: c.name,
        category: c.category,
        status: c.status,
        variants: c.variants.map((v) => ({
          id: v.id,
          name: v.name,
          tier: v.tier,
          startingPrice: v.startingPrice,
          winningPrice: v.winningPrice || v.currentBid,
          status: v.status,
          winnerTeamId: v.winnerTeamId,
          winnerTeamName: v.highestBidderTeamName
        }))
      })),
      teams: Object.values(state.teams).map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        totalBudget: t.totalBudget,
        spentAmount: t.spentAmount,
        availableBudget: t.availableBudget,
        componentsCount: t.components.length,
        components: t.components.map((cp) => ({
          name: cp.variantName,
          category: cp.category,
          price: cp.purchasePrice
        })),
        assemblyValid: t.assembly?.isValidated,
        compatibilityScore: t.assembly?.compatibilityScore,
        performanceScore: t.testing?.totalPerformanceScore,
        finalScore: t.finalScoreResult?.finalScore
      })),
      eventLogs: state.recentLogs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=robo-auction-export-${Date.now()}.json`
    );
    res.send(JSON.stringify(exportData, null, 2));
  });

  // Pre-seeded teams list
  router.get('/teams', (_, res) => {
    const state = engine.getState();
    const teams = Object.values(state.teams).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      avatarColor: t.avatarColor,
      isOnline: t.isOnline,
      componentsCount: t.components.length,
      spentAmount: t.spentAmount,
      balance: t.balance
    }));
    res.json(teams);
  });

  return router;
}
