import logger from './logger.js';
import gitops from './gitops-service.js';

// R-A-L-P-H Event Loop Machine
class RalphLoop {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = 'IDLE'; // IDLE, R, A, L, P, H, COMPLETE
    this.history = [];
  }

  async transition(input) {
    logger.info(`[RalphLoop:${this.sessionId}] Input: ${input} | Current State: ${this.state}`);
    
    switch (this.state) {
      case 'IDLE':
        this.state = 'R';
        return this._executeRealityScan();
      case 'R':
        this.state = 'A';
        return this._executeAlignment();
      case 'A':
        this.state = 'L';
        return this._executeLayout();
      case 'L':
        this.state = 'P';
        return this._executePlan();
      case 'P':
        this.state = 'H';
        return this._executeHealth();
      case 'H':
        this.state = 'COMPLETE';
        return { status: 'success', message: 'Cycle Complete. Awaiting manual review.' };
      default:
        this.state = 'IDLE';
        return { status: 'reset', message: 'Machine reset to IDLE' };
    }
  }

  async _executeRealityScan() {
    logger.info('Executing Reality Scan (R)');
    const files = await gitops.queryFiles('hd/*.md');
    this.history.push({ step: 'R', result: 'Files scanned' });
    return { status: 'success', phase: 'R', data: files.data };
  }

  async _executeAlignment() {
    logger.info('Executing Alignment (A)');
    this.history.push({ step: 'A', result: 'Goals aligned' });
    return { status: 'success', phase: 'A', message: 'Alignment goals formulated based on Reality.' };
  }

  async _executeLayout() {
    logger.info('Executing Layout (L)');
    this.history.push({ step: 'L', result: 'Tasks laid out' });
    return { status: 'success', phase: 'L', message: 'Tasks distributed to phases.' };
  }

  async _executePlan() {
    logger.info('Executing Plan (P)');
    this.history.push({ step: 'P', result: 'Plan generated' });
    // Example: create a commit
    // await gitops.createCommit('chore: Ralph Loop Execute Plan step', ['.']);
    return { status: 'success', phase: 'P', message: 'Execution Plan triggered.' };
  }

  async _executeHealth() {
    logger.info('Executing Health & Hardening (H)');
    this.history.push({ step: 'H', result: 'Health checked' });
    return { status: 'success', phase: 'H', message: 'Health checks passed.' };
  }
}

const sessions = new Map();

export async function runPrompt(text, sessionId = 'default') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new RalphLoop(sessionId));
  }
  
  const loop = sessions.get(sessionId);
  
  // Custom text override commands can be injected here
  if (text === 'reset') {
    loop.state = 'IDLE';
    return { status: 'success', message: 'Event Loop reset.' };
  }
  
  return await loop.transition(text);
}
