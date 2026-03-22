import simpleGit from 'simple-git';

const git = simpleGit();

const gitops = {
  async queryFiles(pattern) {
    try {
      // Using git ls-files if it's tracked, but wait, pattern might mean just normal file query.
      // The old version used `ls -R`. Let's use simple-git for git tracked files at least, or keep it generic for patterns.
      // But queryFiles usually returns file tree. Since previous was `ls -R`, let's just stick to child_process for file queries, but simple-git for commits.
      // Actually, simple-git doesn't do normal shell file tree.
      // Let's use fs for query or stick to exec for arbitrary ls.
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      const { stdout } = await execPromise(`ls -R ${pattern || '.'}`);
      return { status: 'success', data: stdout };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  },

  async createCommit(message, files) {
    try {
      await git.add(files);
      const commitResult = await git.commit(message);
      return { status: 'success', message, result: commitResult };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
};

export default gitops;
