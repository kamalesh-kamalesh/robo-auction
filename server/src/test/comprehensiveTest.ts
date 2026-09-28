import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { AuctionEngine } from '../engine/AuctionEngine.js';
import { createApiRouter } from '../routes/apiRoutes.js';
import { setupSocketHandlers } from '../socket/socketHandlers.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, extraInfo?: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${testName} ${extraInfo ? `— ${extraInfo}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
  passedTests++;
  console.log(`  ✓ PASS: ${testName}`);
}

async function runComprehensiveTests() {
  console.log('\n============================================================');
  console.log('🤖 ROBO AUCTION COMPREHENSIVE TEST SUITE');
  console.log('============================================================\n');

  // =========================================================================
  // 1. TEAM AUTHORIZATION, REGISTRATION LIMIT & DUPLICATE REJECTION
  // =========================================================================
  console.log('--- TEST GROUP 1: Team Authorization & Registration (up to 70) ---');
  {
    const engine = new AuctionEngine();

    // 1.1 Reject registration without PIN
    const noPinAuth = engine.validateTeamAuth('TEAM-01', '');
    assert(!noPinAuth.success, 'Registration rejected when PIN is empty');

    const undefinedPinAuth = engine.validateTeamAuth('TEAM-01', undefined);
    assert(!undefinedPinAuth.success, 'Registration rejected when PIN is undefined');

    // 1.2 Successful registration with PIN
    const reg1 = engine.registerTeam('TEAM-01', '1234', 'Squad Alpha');
    assert(reg1.success && reg1.team !== undefined, 'Register TEAM-01 with PIN succeeds');
    assert(reg1.team?.totalBudget === 100000 && reg1.team?.availableBudget === 100000, 'New team gets ₹100,000 initial budget');

    // 1.3 Reject duplicate team code
    const duplicateReg = engine.registerTeam('TEAM-01', '5678', 'Imposter Team');
    assert(!duplicateReg.success, 'Register duplicate team code rejected');

    const duplicateCaseReg = engine.registerTeam('team-01', '9999', 'Imposter Team Lowercase');
    assert(!duplicateCaseReg.success, 'Register case-insensitive duplicate team code rejected');

    // 1.4 Login with correct PIN
    const loginOk = engine.loginTeam('TEAM-01', '1234');
    assert(loginOk.success, 'Login with correct PIN succeeds');

    // 1.5 Login with wrong PIN
    const loginBad = engine.loginTeam('TEAM-01', '9999');
    assert(!loginBad.success, 'Login with incorrect PIN is rejected');

    // 1.6 Login with nonexistent team
    const loginNonExistent = engine.loginTeam('TEAM-99', '1234');
    assert(!loginNonExistent.success, 'Login with non-existent team code rejected');

    // 1.7 Register up to 70 teams (TEAM-02 through TEAM-70)
    for (let i = 2; i <= 70; i++) {
      const code = `TEAM-${i.toString().padStart(2, '0')}`;
      const res = engine.registerTeam(code, '1000', `Squad ${code}`);
      if (!res.success) {
        throw new Error(`Failed to register team ${code}: ${res.message}`);
      }
    }
    const teamCount = Object.keys(engine.getState().teams).length;
    assert(teamCount === 70, 'Successfully registered exactly 70 teams');

    // 1.8 Reject 71st team registration
    const reg71 = engine.registerTeam('TEAM-71', '1000', 'Squad 71');
    assert(!reg71.success, 'Registration of 71st team rejected (maximum limit of 70 reached)');
  }

  // =========================================================================
  // 2. ADMIN REST ENDPOINTS & HTTP METHOD / AUTH PROTECTION
  // =========================================================================
  console.log('\n--- TEST GROUP 2: Admin REST Endpoints & Host Auth Protection ---');
  {
    const engine = new AuctionEngine();
    const app = express();
    app.use(express.json());
    app.use('/api', createApiRouter(engine));

    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const baseUrl = `http://localhost:${port}/api`;

    try {
      // 2.1 GET on /api/start, /api/pause, /api/reset, /api/demo must NOT be allowed (404)
      for (const endpoint of ['/start', '/pause', '/reset', '/demo']) {
        const getRes = await fetch(`${baseUrl}${endpoint}`);
        assert(getRes.status === 404, `GET ${endpoint} rejected (returns 404, router.all removed)`);
      }

      // 2.2 POST on admin endpoints without host auth must return 401 Unauthorized
      for (const endpoint of ['/start', '/pause', '/reset', '/demo']) {
        const postNoAuth = await fetch(`${baseUrl}${endpoint}`, { method: 'POST' });
        assert(postNoAuth.status === 401, `POST ${endpoint} without host auth returns 401 Unauthorized`);
      }

      // 2.3 POST on admin endpoints with incorrect host auth must return 401 Unauthorized
      const postBadAuth = await fetch(`${baseUrl}/start`, {
        method: 'POST',
        headers: { 'x-host-passcode': 'wrongpass' }
      });
      assert(postBadAuth.status === 401, 'POST /start with invalid passcode returns 401 Unauthorized');

      // 2.4 POST on admin endpoints with valid host auth succeeds
      const postStart = await fetch(`${baseUrl}/start`, {
        method: 'POST',
        headers: { 'x-host-passcode': 'host2026' }
      });
      assert(postStart.status === 200, 'POST /start with valid host passcode returns 200 OK');
      const startJson = (await postStart.json()) as any;
      assert(startJson.phase === 'AUCTION', 'POST /start transitions phase to AUCTION');

      const postPause = await fetch(`${baseUrl}/pause`, {
        method: 'POST',
        headers: { 'x-host-passcode': 'host2026' }
      });
      assert(postPause.status === 200, 'POST /pause with valid host passcode returns 200 OK');

      const postResume = await fetch(`${baseUrl}/resume`, {
        method: 'POST',
        headers: { 'x-host-passcode': 'host2026' }
      });
      assert(postResume.status === 200, 'POST /resume with valid host passcode returns 200 OK');

      const postReset = await fetch(`${baseUrl}/reset`, {
        method: 'POST',
        headers: { 'x-host-passcode': 'host2026' }
      });
      assert(postReset.status === 200, 'POST /reset with valid host passcode returns 200 OK');
      assert(engine.getState().phase === 'LOBBY', 'POST /reset resets tournament to LOBBY phase');

      // 2.5 REST Team registration & login
      const restReg = await fetch(`${baseUrl}/teams/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'REST-01', pin: '4321', teamName: 'REST Squad' })
      });
      assert(restReg.status === 201, 'POST /teams/register creates team (201 Created)');

      const restLogin = await fetch(`${baseUrl}/teams/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'REST-01', pin: '4321' })
      });
      assert(restLogin.status === 200, 'POST /teams/login succeeds with correct PIN');

      const restLoginBad = await fetch(`${baseUrl}/teams/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'REST-01', pin: '0000' })
      });
      assert(restLoginBad.status === 401, 'POST /teams/login rejects incorrect PIN (401)');
    } finally {
      server.close();
    }
  }

  // =========================================================================
  // 3. SOCKET.IO AUTHENTICATED IDENTITY & IMPERSONATION REJECTION
  // =========================================================================
  console.log('\n--- TEST GROUP 3: Socket.IO Identity & Anti-Impersonation ---');
  {
    const engine = new AuctionEngine();
    engine.registerTeam('TEAM-A', '1111', 'Squad A');
    engine.registerTeam('TEAM-B', '2222', 'Squad B');
    engine.openComponent('comp-01', 60);

    const app = express();
    const server = createServer(app);
    const io = new Server(server);
    setupSocketHandlers(io, engine);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const socketUrl = `http://localhost:${port}`;

    const clientSocketA = ClientSocket(socketUrl);
    const clientSocketB = ClientSocket(socketUrl);

    await new Promise<void>((resolve) => {
      let count = 0;
      const onConn = () => {
        count++;
        if (count === 2) resolve();
      };
      clientSocketA.on('connect', onConn);
      clientSocketB.on('connect', onConn);
    });

    try {
      // 3.1 Unauthenticated socket cannot bid
      const unauthBidRes = await new Promise<any>((resolve) => {
        clientSocketA.emit('bid:placeVariant', { variantId: 'comp-01-basic', amount: 5000 }, resolve);
      });
      assert(!unauthBidRes.success, 'Unauthenticated socket bid is rejected');

      // 3.2 Authenticate Socket A as TEAM-A
      const authResA = await new Promise<any>((resolve) => {
        clientSocketA.emit('team:join', { teamId: 'TEAM-A', pin: '1111' }, resolve);
      });
      assert(authResA.success && authResA.team.id === 'team-a', 'Socket A authenticated as TEAM-A');

      // 3.3 Socket A placing a valid bid for TEAM-A succeeds
      const bidOkA = await new Promise<any>((resolve) => {
        clientSocketA.emit('bid:placeVariant', { variantId: 'comp-01-basic', amount: 5000 }, resolve);
      });
      assert(bidOkA.success, 'Socket A placed valid bid for TEAM-A');

      // 3.4 Impersonation Attempt: Socket A tries to bid passing teamId: "team-b"
      const imposterBidRes = await new Promise<any>((resolve) => {
        clientSocketA.emit('bid:placeVariant', { variantId: 'comp-01-basic', teamId: 'team-b', amount: 5500 }, resolve);
      });
      assert(!imposterBidRes.success, 'Impersonation rejected: Socket A cannot bid on behalf of TEAM-B');

      // 3.5 Impersonation Attempt on assembly validation
      const imposterAssembly = await new Promise<any>((resolve) => {
        clientSocketA.emit('assembly:validate', { teamId: 'team-b' }, resolve);
      });
      assert(!imposterAssembly.success, 'Impersonation rejected: Socket A cannot validate assembly for TEAM-B');

      // 3.6 Impersonation Attempt on testing
      const imposterTesting = await new Promise<any>((resolve) => {
        clientSocketA.emit('testing:run', { teamId: 'team-b' }, resolve);
      });
      assert(!imposterTesting.success, 'Impersonation rejected: Socket A cannot run tests for TEAM-B');
    } finally {
      clientSocketA.disconnect();
      clientSocketB.disconnect();
      io.close();
      server.close();
    }
  }

  // =========================================================================
  // 4. SERVER-SIDE BID VALIDATION & BUDGET COMMITMENTS
  // =========================================================================
  console.log('\n--- TEST GROUP 4: Server-Side Bid & Budget Validation ---');
  {
    const engine = new AuctionEngine();
    engine.registerTeam('TEAM-01', '1000', 'Squad 1');
    engine.registerTeam('TEAM-02', '1000', 'Squad 2');
    engine.openComponent('comp-01', 60);

    const variantId = 'comp-01-basic';
    const comp = engine.getState().components['comp-01'];
    const variant = comp.variants.find((v) => v.id === variantId)!;
    const startPrice = variant.startingPrice; // e.g. 5000
    const minInc = variant.minIncrement; // 500

    // 4.1 Reject NaN, Infinity, -Infinity, strings, decimals, non-positive
    const nanBid = await engine.placeVariantBid(variantId, 'team-01', NaN);
    assert(!nanBid.success, 'Reject NaN bid amount');

    const infBid = await engine.placeVariantBid(variantId, 'team-01', Infinity);
    assert(!infBid.success, 'Reject Infinity bid amount');

    const negInfBid = await engine.placeVariantBid(variantId, 'team-01', -Infinity);
    assert(!negInfBid.success, 'Reject -Infinity bid amount');

    const stringBid = await engine.placeVariantBid(variantId, 'team-01', '5000' as any);
    assert(!stringBid.success, 'Reject string bid amount');

    const zeroBid = await engine.placeVariantBid(variantId, 'team-01', 0);
    assert(!zeroBid.success, 'Reject 0 bid amount');

    const negBid = await engine.placeVariantBid(variantId, 'team-01', -500);
    assert(!negBid.success, 'Reject negative bid amount');

    const decimalBid = await engine.placeVariantBid(variantId, 'team-01', 5000.75);
    assert(!decimalBid.success, 'Reject fractional/decimal bid amount');

    // 4.2 Reject below starting price
    const belowStartBid = await engine.placeVariantBid(variantId, 'team-01', startPrice - 100);
    assert(!belowStartBid.success, 'Reject bid below starting price');

    // 4.3 Reject invalid increment on initial bid (e.g. startPrice + 123)
    const invalidStartInc = await engine.placeVariantBid(variantId, 'team-01', startPrice + 123);
    assert(!invalidStartInc.success, 'Reject invalid starting increment (must be multiple of minIncrement)');

    // 4.4 Valid initial bid at starting price
    const validInitial = await engine.placeVariantBid(variantId, 'team-01', startPrice);
    assert(validInitial.success, `Valid initial bid at starting price ₹${startPrice} accepted`);

    // Verify budget commitment for team 1
    const team1 = engine.getTeam('team-01')!;
    assert(team1.committedAmount === startPrice, 'Team 1 committedAmount equals leading bid');
    assert(team1.availableBudget === 100000 - startPrice, 'Team 1 availableBudget correctly reduced by leading bid');

    // 4.5 Reject invalid increment on subsequent bid
    const invalidNextInc = await engine.placeVariantBid(variantId, 'team-02', startPrice + 250);
    assert(!invalidNextInc.success, 'Reject bid increment less than minIncrement (500)');

    const nonMultipleInc = await engine.placeVariantBid(variantId, 'team-02', startPrice + 750);
    assert(!nonMultipleInc.success, 'Reject bid increment that is not a multiple of 500');

    // 4.6 Reject bid exceeding available budget
    const excessiveBid = await engine.placeVariantBid(variantId, 'team-02', 150000);
    assert(!excessiveBid.success, 'Reject bid exceeding team available budget');

    // 4.7 Valid outbid by Team 2
    const team2Bid = startPrice + minInc;
    const validOutbid = await engine.placeVariantBid(variantId, 'team-02', team2Bid);
    assert(validOutbid.success, `Team 2 outbid accepted at ₹${team2Bid}`);

    // Verify commitments updated: Team 1 released, Team 2 committed
    engine.refreshCommittedBalances();
    assert(team1.committedAmount === 0, 'Team 1 committed amount released after being outbid');
    assert(team1.availableBudget === 100000, 'Team 1 available budget fully restored to ₹100,000');

    const team2 = engine.getTeam('team-02')!;
    assert(team2.committedAmount === team2Bid, 'Team 2 committed amount locked');
    assert(team2.availableBudget === 100000 - team2Bid, 'Team 2 available budget correctly reduced');
  }

  // =========================================================================
  // 5. PHASE TRANSITIONS & RESULTS IMMUTABILITY
  // =========================================================================
  console.log('\n--- TEST GROUP 5: Phase Transitions & Immutability ---');
  {
    const engine = new AuctionEngine();
    assert(engine.getState().phase === 'LOBBY', 'Initial phase is LOBBY');

    // 5.1 Reject illegal transition from LOBBY directly to TESTING
    const badPhase1 = engine.setPhase('TESTING');
    assert(!badPhase1.success, 'Reject invalid transition LOBBY -> TESTING');

    // 5.2 Valid sequence: LOBBY -> AUCTION
    const toAuction = engine.setPhase('AUCTION');
    assert(toAuction.success && engine.getState().phase === 'AUCTION', 'Transition LOBBY -> AUCTION succeeds');

    // 5.3 Valid sequence: AUCTION -> AUCTION_COMPLETE
    const toAuctionComp = engine.setPhase('AUCTION_COMPLETE');
    assert(toAuctionComp.success && engine.getState().phase === 'AUCTION_COMPLETE', 'Transition AUCTION -> AUCTION_COMPLETE succeeds');

    // 5.4 Valid sequence: AUCTION_COMPLETE -> ASSEMBLY
    const toAssembly = engine.setPhase('ASSEMBLY');
    assert(toAssembly.success && engine.getState().phase === 'ASSEMBLY', 'Transition AUCTION_COMPLETE -> ASSEMBLY succeeds');

    // 5.5 Valid sequence: ASSEMBLY -> TESTING
    const toTesting = engine.setPhase('TESTING');
    assert(toTesting.success && engine.getState().phase === 'TESTING', 'Transition ASSEMBLY -> TESTING succeeds');

    // 5.6 Valid sequence: TESTING -> LEADERBOARD
    const toLeaderboard = engine.setPhase('LEADERBOARD');
    assert(toLeaderboard.success && engine.getState().phase === 'LEADERBOARD', 'Transition TESTING -> LEADERBOARD succeeds');

    // 5.7 Valid sequence: LEADERBOARD -> EVENT_COMPLETE
    const toComplete = engine.setPhase('EVENT_COMPLETE');
    assert(toComplete.success && engine.getState().phase === 'EVENT_COMPLETE', 'Transition LEADERBOARD -> EVENT_COMPLETE succeeds');
    assert(engine.getState().isResultsPublished, 'EVENT_COMPLETE automatically publishes results');

    // 5.8 Reject transitions once EVENT_COMPLETE / results are published
    const backwardsTransition = engine.setPhase('AUCTION');
    assert(!backwardsTransition.success, 'Reject backwards phase transition once results are published');
  }

  // =========================================================================
  // 6. SCORING ENGINE & IMMUTABLE PUBLISHED RESULTS
  // =========================================================================
  console.log('\n--- TEST GROUP 6: Scoring Engine & Published Results Immutability ---');
  {
    const engine = new AuctionEngine();
    engine.registerTeam('TEAM-01', '1000', 'Squad 1');
    engine.registerTeam('TEAM-02', '1000', 'Squad 2');

    // Run demo simulation which executes auction, assembly, testing & publishes results
    engine.runDemoSimulation();
    assert(engine.getState().isResultsPublished, 'Results are published after demo simulation');

    const leaderboardBefore = JSON.parse(JSON.stringify(engine.getLeaderboard()));
    assert(leaderboardBefore.length === 2, 'Leaderboard contains both teams');

    // Check scoring formula verification
    for (const entry of leaderboardBefore) {
      assert(entry.finalScore >= 0 && entry.finalScore <= 1000, `Team ${entry.teamId} score in 0-1000 range: ${entry.finalScore}`);
      assert(entry.rank >= 1 && entry.rank <= 2, `Team ${entry.teamId} has valid rank: ${entry.rank}`);
    }

    // Verify Rank 1 >= Rank 2 score
    assert(leaderboardBefore[0].finalScore >= leaderboardBefore[1].finalScore, 'Rank 1 score is >= Rank 2 score');

    // 6.1 Attempts to place bids after publication must be rejected
    const postPubBid = await engine.placeVariantBid('comp-01-basic', 'team-01', 10000);
    assert(!postPubBid.success, 'Bids are locked after results are published');

    // 6.2 Attempts to re-run team tests after publication must not mutate score
    engine.runTeamTest('team-01');
    engine.runAllRobotTests();
    engine.recalculateLeaderboard();

    const leaderboardAfter = engine.getLeaderboard();
    assert(
      JSON.stringify(leaderboardBefore) === JSON.stringify(leaderboardAfter),
      'Leaderboard scores and ranks are completely immutable after publication'
    );
  }

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} COMPREHENSIVE TESTS PASSED SUCCESSFULLY!`);
  console.log('============================================================\n');
}

runComprehensiveTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
