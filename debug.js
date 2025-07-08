function parseArgs() {
  const args = ['--name', 'test-app', '--yes'];
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      result[key] = value;
      if (value !== true) i++;
    }
  }
  return result;
}

const cliArgs = parseArgs();
console.log('CLI Args:', cliArgs);
console.log('isNonInteractive:', !!cliArgs.yes || (!!cliArgs.email && !!cliArgs.project) || !!cliArgs['source-id'] || (!!cliArgs.generate && !!cliArgs.description && !cliArgs.email)); 