import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * GitOps v2 Service (ESM)
 */
class GitOpsService {
  async queryFiles(pattern = '*') {
    try {
      console.log(`[GitOps] Querying files with pattern: ${pattern}`);
      const result = execSync(`find . -maxdepth 2 -not -path '*/.*' -name "${pattern}"`, {
        cwd: process.cwd(),
      }).toString().trim();
      
      const files = result.split('\n').filter(f => f && f !== '.');
      return { status: 'success', files };
    } catch (err) {
      return { status: 'failed', message: err.message };
    }
  }

  async createCommit(message, files = '.') {
    try {
      console.log(`[GitOps] Creating commit: "${message}"`);
      execSync(`git add ${files}`, { cwd: process.cwd() });
      const result = execSync(`git commit -m "${message}"`, { cwd: process.cwd() });
      
      const hash = execSync('git rev-parse HEAD', { cwd: process.cwd() }).toString().trim();
      return { status: 'success', hash, log: result.toString().trim() };
    } catch (err) {
      return { status: 'failed', message: err.message };
    }
  }
}

const gitopsService = new GitOpsService();
export default gitopsService;
