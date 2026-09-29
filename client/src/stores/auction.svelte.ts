import confetti from 'canvas-confetti';
import { socket } from '../services/socket.js';
import { soundFX } from '../services/audio.js';
import type {
  AppRole,
  Bid,
  ComponentVariant,
  EventLog,
  EventPhase,
  EventState,
  FinalScoreResult,
  RobotComponent,
  Team
} from '../types/index.js';

export interface ToastNotice {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

// Svelte 5 runes-based reactive store (.svelte.ts enables rune compilation)
class AuctionStore {
  state = $state<EventState | null>(null);
  role = $state<AppRole>(
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('robo_role') as AppRole)
      : null) || 'team'
  );
  currentTeam = $state<Team | null>(
    typeof localStorage !== 'undefined' && localStorage.getItem('robo_team')
      ? JSON.parse(localStorage.getItem('robo_team')!)
      : null
  );
  isConnected = $state(socket.connected);
  isMuted = $state(soundFX.getMuted());
  toasts = $state<ToastNotice[]>([]);
  screenReaderAnnouncement = $state<string>('');

  constructor() {
    this.#setupSocketListeners();
    if (socket.connected) {
      this.#onConnect();
    }
  }

  announce(message: string) {
    this.screenReaderAnnouncement = message;
  }

  addToast(type: ToastNotice['type'], title: string, message: string) {
    const id = `toast-${Date.now()}-${Math.random()}`;
    this.toasts = [...this.toasts.slice(-4), { id, type, title, message }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4500);
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  toggleMute() {
    const next = !this.isMuted;
    this.isMuted = next;
    soundFX.setMuted(next);
  }

  #onConnect() {
    this.isConnected = true;
    const savedRole = (typeof localStorage !== 'undefined'
      ? localStorage.getItem('robo_role')
      : null) as AppRole;

    if (savedRole === 'host') {
      const savedPass = localStorage.getItem('robo_host_pass');
      if (savedPass) {
        socket.emit('join:host', { hostPasscode: savedPass }, (res: any) => {
          if (res?.success) this.state = res.state;
        });
      }
    } else if (savedRole === 'team') {
      const savedTeamCode = localStorage.getItem('robo_team_code');
      const savedPin = localStorage.getItem('robo_team_pin');
      if (savedTeamCode && savedPin) {
        socket.emit('join:team', { teamCode: savedTeamCode, pin: savedPin }, (res: any) => {
          if (res?.success) {
            this.currentTeam = res.team;
            this.state = res.state;
          }
        });
      } else {
        socket.emit('join:spectator', {}, (res: any) => {
          if (res?.success) this.state = res.state;
        });
      }
    } else {
      socket.emit('join:spectator', {}, (res: any) => {
        if (res?.success) this.state = res.state;
      });
    }
  }

  #setupSocketListeners() {
    socket.on('connect', () => {
      this.#onConnect();
    });

    socket.on('disconnect', () => {
      this.isConnected = false;
    });

    socket.on('event:state', (syncedState: EventState) => {
      this.state = syncedState;
    });

    socket.on(
      'tick:update',
      (data: { activeComponentId: string | null; timeLeftSeconds: number; phase: EventPhase } | Record<string, any>) => {
        if (!this.state) return;

        if ('activeComponentId' in data && data.activeComponentId && this.state.components) {
          const comp = this.state.components[data.activeComponentId];
          if (comp) {
            comp.timeLeftSeconds = data.timeLeftSeconds;
            comp.timeRemainingMs = data.timeLeftSeconds * 1000;
          }
          if (data.timeLeftSeconds <= 5 && data.timeLeftSeconds > 0) {
            soundFX.playTick();
          }
        }
      }
    );

    socket.on('component:updated', (comp: RobotComponent) => {
      if (!this.state) return;
      this.state = {
        ...this.state,
        components: { ...this.state.components, [comp.id]: comp }
      };
    });

    socket.on('variant:updated', ({ variant, bid, outbidTeamId }: { variant: ComponentVariant; bid: Bid | null; outbidTeamId: string | null }) => {
      if (!this.state) return;

      // Update variant within target component
      const targetComp = this.state.components?.[variant.componentId];
      if (targetComp) {
        const vIndex = targetComp.variants.findIndex((v) => v.id === variant.id);
        if (vIndex !== -1) {
          targetComp.variants[vIndex] = variant;
        }
      }

      if (bid) {
        if (this.currentTeam && bid.teamId === this.currentTeam.id) {
          soundFX.playBidSuccess();
          this.addToast('success', 'Bid Placed!', `Your bid of ₹${bid.amount.toLocaleString()} on ${variant.name} is active.`);
        } else if (this.currentTeam && outbidTeamId === this.currentTeam.id) {
          soundFX.playOutbidAlert();
          this.addToast('warning', 'Outbid Alert!', `Your team was outbid on "${variant.name}" by ${bid.teamName}!`);
        }
      }
    });

    socket.on('variant:sold', ({ variant, winnerTeam, component }: { variant: ComponentVariant; winnerTeam: { id: string; name: string }; component: RobotComponent }) => {
      if (!this.state) return;

      if (component && this.state.components) {
        this.state.components[component.id] = component;
      }

      if (this.currentTeam && winnerTeam.id === this.currentTeam.id) {
        soundFX.playLotWon();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        this.addToast('success', '🏆 VARIANT WON!', `Congratulations! Your team won "${variant.name}" for ₹${variant.currentBid.toLocaleString()}!`);
      } else {
        this.addToast('info', 'Variant Sold', `"${variant.name}" won by ${winnerTeam.name} for ₹${variant.currentBid.toLocaleString()}.`);
      }
    });

    socket.on('team:updated', (updatedTeam: Team) => {
      if (this.currentTeam && updatedTeam.id === this.currentTeam.id) {
        this.currentTeam = updatedTeam;
        localStorage.setItem('robo_team', JSON.stringify(updatedTeam));
      }
      if (!this.state) return;
      this.state = {
        ...this.state,
        teams: { ...this.state.teams, [updatedTeam.id]: updatedTeam }
      };
    });

    socket.on('team:state', (updatedTeam: Team) => {
      this.currentTeam = updatedTeam;
      localStorage.setItem('robo_team', JSON.stringify(updatedTeam));
    });

    socket.on('leaderboard:update', (leaderboard: FinalScoreResult[]) => {
      if (!this.state) return;
      this.state = { ...this.state, leaderboard };
    });

    socket.on('log:new', (log: EventLog) => {
      if (!this.state) return;
      const recentLogs = [log, ...this.state.recentLogs].slice(0, 300);
      this.state = { ...this.state, recentLogs };

      if (log.type === 'ANTI_SNIPE') {
        soundFX.playAntiSnipe();
        this.addToast('info', '⚡ Anti-Snipe Triggered', log.message);
      }
    });
  }

  // --- Actions ---

  async loginAsTeam(teamCode: string, pin: string, teamName?: string): Promise<{ success: boolean; message?: string }> {
    if (!pin || !pin.trim()) {
      return { success: false, message: 'Team PIN is required.' };
    }
    const cleanPin = pin.trim();

    if (!socket.connected) {
      socket.connect();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            message: 'Server connection timed out. Please ensure the auction backend server is running and reachable.'
          });
        }
      }, 7000);

      socket.emit('team:join', { teamId: teamCode, pin: cleanPin, teamName }, (res: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        if (res?.success) {
          this.role = 'team';
          this.currentTeam = res.team;
          this.state = res.state;
          localStorage.setItem('robo_role', 'team');
          localStorage.setItem('robo_team_code', res.team.code);
          localStorage.setItem('robo_team_pin', cleanPin);
          localStorage.setItem('robo_team', JSON.stringify(res.team));
          this.addToast('success', 'Unit Connected', `Welcome aboard, ${res.team.name}!`);
          resolve({ success: true });
        } else {
          resolve({ success: false, message: res?.message || 'Failed to authenticate team credentials.' });
        }
      });
    });
  }

  async registerTeam(teamCode: string, pin: string, teamName?: string): Promise<{ success: boolean; message?: string }> {
    if (!pin || !pin.trim()) {
      return { success: false, message: 'Team PIN is required.' };
    }
    const cleanPin = pin.trim();

    if (!socket.connected) {
      socket.connect();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            message: 'Server connection timed out. Please ensure the auction backend server is running and reachable.'
          });
        }
      }, 7000);

      socket.emit('team:register', { teamCode, pin: cleanPin, teamName }, (res: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        if (res?.success) {
          this.role = 'team';
          this.currentTeam = res.team;
          this.state = res.state;
          localStorage.setItem('robo_role', 'team');
          localStorage.setItem('robo_team_code', res.team.code);
          localStorage.setItem('robo_team_pin', cleanPin);
          localStorage.setItem('robo_team', JSON.stringify(res.team));
          this.addToast('success', 'Unit Registered', `Welcome aboard, ${res.team.name}!`);
          resolve({ success: true });
        } else {
          resolve({ success: false, message: res?.message || 'Failed to register team.' });
        }
      });
    });
  }

  async loginAsHost(hostPasscode: string): Promise<{ success: boolean; message?: string }> {
    if (!hostPasscode || !hostPasscode.trim()) {
      return { success: false, message: 'Host passcode is required.' };
    }
    const cleanPass = hostPasscode.trim();

    if (!socket.connected) {
      socket.connect();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            message: 'Server connection timed out. Please ensure the auction backend server is running and reachable.'
          });
        }
      }, 7000);

      socket.emit('join:host', { hostPasscode: cleanPass }, (res: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        if (res?.success) {
          this.role = 'host';
          this.state = res.state;
          localStorage.setItem('robo_role', 'host');
          localStorage.setItem('robo_host_pass', cleanPass);
          this.addToast('success', 'Host Command Online', 'Full Robo Auction command center active.');
          resolve({ success: true });
        } else {
          resolve({ success: false, message: res?.message || 'Invalid host passcode.' });
        }
      });
    });
  }

  loginAsSpectator() {
    this.role = 'spectator';
    localStorage.setItem('robo_role', 'spectator');
    socket.emit('join:spectator', {}, (res: any) => {
      if (res?.success) this.state = res.state;
    });
  }

  logout() {
    localStorage.removeItem('robo_role');
    localStorage.removeItem('robo_team');
    localStorage.removeItem('robo_team_code');
    localStorage.removeItem('robo_team_pin');
    localStorage.removeItem('robo_host_pass');
    this.role = 'team';
    this.currentTeam = null;
  }

  /**
   * Bids on a specific variant of the active component (Sections 6, 7, 10, 34)
   */
  async placeVariantBid(variantId: string, amount: number): Promise<{ success: boolean; message: string }> {
    if (!this.currentTeam) {
      return { success: false, message: 'You must select a team to bid.' };
    }
    const team = this.currentTeam;
    return new Promise((resolve) => {
      socket.emit('bid:placeVariant', { variantId, teamId: team.id, amount }, (res: any) => {
        if (!res?.success) {
          this.addToast('error', 'Bid Rejected', res?.message || 'Could not place bid.');
        }
        resolve(res);
      });
    });
  }

  async validateAssembly(): Promise<void> {
    if (!this.currentTeam) return;
    return new Promise((resolve) => {
      socket.emit('assembly:validate', { teamId: this.currentTeam!.id }, (res: any) => {
        if (res?.success && this.currentTeam) {
          this.currentTeam.assembly = res.assembly;
          this.addToast(
            res.assembly.isValidated ? 'success' : 'warning',
            res.assembly.isValidated ? 'Assembly Validated!' : 'Assembly Warning',
            res.assembly.isValidated ? 'All components connected & compatible.' : `${res.assembly.errors.length} errors, ${res.assembly.warnings.length} warnings.`
          );
        }
        resolve();
      });
    });
  }

  async runTesting(): Promise<void> {
    if (!this.currentTeam) return;
    return new Promise((resolve) => {
      socket.emit('testing:run', { teamId: this.currentTeam!.id }, (res: any) => {
        if (res?.success && this.currentTeam) {
          this.currentTeam.testing = res.testing;
          this.addToast('success', 'Tests Completed!', `Total Performance: ${res.testing.totalPerformanceScore}/800 points.`);
        }
        resolve();
      });
    });
  }

  // --- Host Administrative Controls ---

  async hostSetPhase(phase: EventPhase) {
    socket.emit('host:action', { type: 'SET_PHASE', phase });
  }

  async hostOpenComponent(componentId: string, seconds = 60) {
    socket.emit('host:action', { type: 'OPEN_COMPONENT', componentId, seconds });
  }

  async hostOpenNextComponent() {
    socket.emit('host:action', { type: 'OPEN_NEXT' });
  }

  async hostCloseComponent(componentId: string) {
    socket.emit('host:action', { type: 'CLOSE_COMPONENT', componentId });
  }

  async hostRunTests() {
    socket.emit('host:action', { type: 'RUN_TESTS' });
  }

  async hostPublishResults() {
    socket.emit('host:action', { type: 'PUBLISH_RESULTS' });
  }

  async hostRunDemo() {
    socket.emit('host:action', { type: 'RUN_DEMO' });
  }

  async hostPause() {
    socket.emit('host:action', { type: 'PAUSE' });
  }

  async hostResume() {
    socket.emit('host:action', { type: 'RESUME' });
  }

  async hostReset() {
    socket.emit('host:action', { type: 'RESET' });
  }

  async hostExtendTime(seconds = 15) {
    socket.emit('host:action', { type: 'EXTEND_TIME', seconds });
  }

  // --- Backwards Compatibility Helpers ---
  watchLot(lotId: string) {
    if (lotId) socket.emit('lot:watch', { lotId });
  }

  unwatchLot(lotId: string) {
    if (lotId) socket.emit('lot:unwatch', { lotId });
  }

  async placeBid(lotId: string, amount: number): Promise<{ success: boolean; message: string }> {
    return this.placeVariantBid(lotId, amount);
  }

  async hostAction(
    type: string,
    lotId?: string,
    seconds?: number,
    count?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      socket.emit('host:action', { type, componentId: lotId, lotId, seconds, count }, (res: any) => {
        if (res?.success && res?.state) {
          this.state = res.state;
        }
        resolve();
      });
    });
  }
}

// Singleton export
export const auction = new AuctionStore();
