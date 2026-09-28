import { Server, Socket } from 'socket.io';
import { AuctionEngine } from '../engine/AuctionEngine.js';
import { EventPhase } from '../types/index.js';

const HOST_PASSCODE = process.env.HOST_PASSCODE || 'host2026';

export function setupSocketHandlers(io: Server, engine: AuctionEngine) {
  // Bind engine real-time callbacks to broadcast to appropriate rooms
  engine.setEventCallbacks({
    onStateTick: (tickData) => {
      io.to('lobby').to('host').to('spectators').emit('tick:update', tickData);
    },
    onComponentUpdated: (comp) => {
      io.to('lobby').to('host').to('spectators').emit('component:updated', comp);
    },
    onVariantUpdated: (variant, bid, outbidTeamId) => {
      io.to('lobby').to('host').to('spectators').emit('variant:updated', { variant, bid, outbidTeamId });
      io.to('lobby').to('host').to('spectators').emit('leaderboard:update', engine.getLeaderboard());

      // If a team was outbid, notify their private team room directly
      if (outbidTeamId) {
        io.to(`team:${outbidTeamId}`).emit('team:outbid', {
          variantId: variant.id,
          variantName: variant.name,
          currentBid: variant.currentBid,
          message: `Your team was outbid on "${variant.name}" by ${bid?.teamName || 'another team'}!`
        });
      }
    },
    onVariantSold: (variant, winnerTeam, comp) => {
      io.to('lobby').to('host').to('spectators').emit('variant:sold', {
        variant,
        winnerTeam: { id: winnerTeam.id, code: winnerTeam.code, name: winnerTeam.name },
        component: comp
      });
      io.to('lobby').to('host').to('spectators').emit('leaderboard:update', engine.getLeaderboard());
    },
    onTeamUpdated: (team) => {
      const safeTeam = { ...team, pin: undefined as any };
      io.to(`team:${team.id}`).emit('team:updated', safeTeam);
      io.to(`team:${team.id}`).emit('team:state', safeTeam);
      io.to('host').emit('team:status', team);
    },
    onEventStateChange: (state) => {
      io.to('host').emit('event:state', state);
      io.to('lobby').to('spectators').emit('event:state', engine.getSanitizedState());
      io.to('lobby').to('host').to('spectators').emit('leaderboard:update', engine.getLeaderboard());
    },
    onLog: (log) => {
      io.to('host').to('lobby').emit('log:new', log);
    }
  });

  io.on('connection', (socket: Socket) => {
    let currentTeamId: string | null = null;
    let isHost = false;

    // Team login / authentication
    socket.on('team:join', ({ teamId, pin, teamName }: { teamId: string; pin?: string; teamName?: string }, callback) => {
      const auth = engine.validateTeamAuth(teamId, pin, teamName);
      if (!auth.success || !auth.team) {
        socket.emit('team:rejected', { reason: auth.message || 'Invalid team credentials.' });
        if (callback) callback({ success: false, message: auth.message });
        return;
      }

      const team = auth.team;
      currentTeamId = team.id;
      socket.join(`team:${team.id}`);
      socket.join('lobby');
      socket.join('teams');

      engine.setTeamOnline(team.id, true);

      const safeTeam = { ...team, pin: undefined as any };
      socket.emit('team:state', safeTeam);
      if (callback) callback({ success: true, team: safeTeam, state: engine.getSanitizedState(team.id) });
    });

    // Alias: join:team
    socket.on('join:team', ({ teamCode, pin, teamName }: { teamCode: string; pin?: string; teamName?: string }, callback) => {
      const auth = engine.validateTeamAuth(teamCode, pin, teamName);
      if (!auth.success || !auth.team) {
        if (callback) callback({ success: false, message: auth.message });
        return;
      }

      const team = auth.team;
      currentTeamId = team.id;
      socket.join(`team:${team.id}`);
      socket.join('lobby');
      socket.join('teams');

      engine.setTeamOnline(team.id, true);

      const safeTeam = { ...team, pin: undefined as any };
      if (callback) {
        callback({
          success: true,
          team: safeTeam,
          state: engine.getSanitizedState(team.id)
        });
      }
    });

    // Explicit team registration
    socket.on('team:register', ({ teamCode, pin, teamName }: { teamCode: string; pin: string; teamName?: string }, callback) => {
      const reg = engine.registerTeam(teamCode, pin, teamName);
      if (!reg.success || !reg.team) {
        socket.emit('team:rejected', { reason: reg.message || 'Registration failed.' });
        if (callback) callback({ success: false, message: reg.message });
        return;
      }

      const team = reg.team;
      currentTeamId = team.id;
      socket.join(`team:${team.id}`);
      socket.join('lobby');
      socket.join('teams');

      engine.setTeamOnline(team.id, true);

      const safeTeam = { ...team, pin: undefined as any };
      socket.emit('team:state', safeTeam);
      if (callback) callback({ success: true, team: safeTeam, state: engine.getSanitizedState(team.id) });
    });

    // Variant Bidding (Section 6, 7, 10, 34)
    socket.on('bid:placeVariant', async (data: { variantId: string; amount: number; teamId?: string }, callback) => {
      if (!currentTeamId) {
        socket.emit('bid:rejected', { reason: 'Authentication required to place bids.' });
        if (callback) callback({ success: false, message: 'Authentication required to place bids.' });
        return;
      }

      // Reject any attempt to supply a different teamId than the authenticated socket
      if (data.teamId && data.teamId.toLowerCase() !== currentTeamId.toLowerCase()) {
        socket.emit('bid:rejected', { reason: 'Impersonation rejected: cannot bid on behalf of another team.' });
        if (callback) callback({ success: false, message: 'Impersonation rejected: cannot bid on behalf of another team.' });
        return;
      }

      if (typeof data.amount !== 'number' || !Number.isFinite(data.amount)) {
        socket.emit('bid:rejected', { reason: 'Invalid bid amount: Must be a number.' });
        if (callback) callback({ success: false, message: 'Invalid bid amount: Must be a number.' });
        return;
      }

      const result = await engine.placeVariantBid(data.variantId, currentTeamId, data.amount);

      if (result.success && result.variant) {
        io.to('lobby').to('host').to('spectators').emit('bid:accepted', {
          variantId: data.variantId,
          amount: data.amount,
          bid: result.bid,
          variant: result.variant,
          component: result.component
        });

        if (result.team) {
          const safeTeam = { ...result.team, pin: undefined as any };
          socket.emit('team:state', safeTeam);
        }
        if (callback) callback(result);
      } else {
        socket.emit('bid:rejected', { variantId: data.variantId, amount: data.amount, reason: result.message });
        if (callback) callback(result);
      }
    });

    // Legacy bid:place alias
    socket.on('bid:place', async (data: { lotId: string; amount: number; teamId?: string }, callback) => {
      if (!currentTeamId) {
        if (callback) callback({ success: false, message: 'Authentication required to place bids.' });
        return;
      }
      if (data.teamId && data.teamId.toLowerCase() !== currentTeamId.toLowerCase()) {
        if (callback) callback({ success: false, message: 'Impersonation rejected: cannot bid on behalf of another team.' });
        return;
      }
      const result = await engine.placeBid(data.lotId, currentTeamId, data.amount);
      if (callback) callback(result);
    });

    // Assembly validation
    socket.on('assembly:validate', (data: { teamId?: string } | undefined, callback) => {
      if (!currentTeamId) {
        if (callback) callback({ success: false, message: 'Authentication required to validate assembly.' });
        return;
      }
      if (data?.teamId && data.teamId.toLowerCase() !== currentTeamId.toLowerCase()) {
        if (callback) callback({ success: false, message: 'Impersonation rejected: cannot validate another team\'s assembly.' });
        return;
      }
      const assembly = engine.validateTeamAssembly(currentTeamId);
      if (callback) callback({ success: true, assembly });
    });

    // Testing run
    socket.on('testing:run', (data: { teamId?: string } | undefined, callback) => {
      if (!currentTeamId) {
        if (callback) callback({ success: false, message: 'Authentication required to run robot tests.' });
        return;
      }
      if (data?.teamId && data.teamId.toLowerCase() !== currentTeamId.toLowerCase()) {
        if (callback) callback({ success: false, message: 'Impersonation rejected: cannot run tests for another team.' });
        return;
      }
      const testing = engine.runTeamTest(currentTeamId);
      if (callback) callback({ success: true, testing });
    });

    // Host login
    socket.on('join:host', ({ hostPasscode }: { hostPasscode: string }, callback) => {
      if (hostPasscode !== HOST_PASSCODE) {
        if (callback) callback({ success: false, message: 'Invalid Host Passcode.' });
        return;
      }

      isHost = true;
      socket.join('host');
      socket.join('lobby');

      if (callback) {
        callback({
          success: true,
          state: engine.getState()
        });
      }
    });

    // Spectator join (Projector)
    socket.on('join:spectator', (_, callback) => {
      socket.join('spectators');
      socket.join('lobby');

      if (callback) {
        callback({
          success: true,
          state: engine.getSanitizedState()
        });
      }
    });

    // Host administrative actions
    socket.on('host:action', (data: {
      type:
        | 'SET_PHASE'
        | 'OPEN_COMPONENT'
        | 'OPEN_NEXT'
        | 'CLOSE_COMPONENT'
        | 'RUN_TESTS'
        | 'PUBLISH_RESULTS'
        | 'RUN_DEMO'
        | 'START'
        | 'PAUSE'
        | 'RESUME'
        | 'RESET'
        | 'EXTEND_TIME';
      phase?: EventPhase;
      componentId?: string;
      seconds?: number;
    }, callback) => {
      if (!isHost) {
        if (callback) callback({ success: false, message: 'Host authorization required.' });
        return;
      }

      switch (data.type) {
        case 'SET_PHASE':
          if (data.phase) engine.setPhase(data.phase);
          break;
        case 'OPEN_COMPONENT':
          if (data.componentId) engine.openComponent(data.componentId, data.seconds || 60);
          break;
        case 'OPEN_NEXT':
          engine.openNextComponent();
          break;
        case 'CLOSE_COMPONENT':
          if (data.componentId) engine.closeComponent(data.componentId);
          break;
        case 'RUN_TESTS':
          engine.runAllRobotTests();
          break;
        case 'PUBLISH_RESULTS':
          engine.publishResults();
          break;
        case 'RUN_DEMO':
          if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_MODE !== 'true') {
            socket.emit('error', { message: 'Demo simulation is disabled in production mode.' });
            break;
          }
          engine.runDemoSimulation();
          break;
        case 'START':
          engine.startEvent();
          break;
        case 'PAUSE':
          engine.pauseEvent();
          break;
        case 'RESUME':
          engine.resumeEvent();
          break;
        case 'RESET':
          engine.resetEvent();
          break;
        case 'EXTEND_TIME':
          engine.extendLotTime(data.componentId || '', data.seconds || 15);
          break;
      }

      if (callback) {
        callback({ success: true, state: engine.getState() });
      }
    });

    socket.on('disconnect', () => {
      if (currentTeamId) {
        engine.setTeamOnline(currentTeamId, false);
      }
    });
  });
}
