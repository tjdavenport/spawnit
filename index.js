const program = require('commander');
const commands = require('./lib/commands');

program
  .version('0.0.1');

program
  .command('dev')
  .description('Start a development environment for single page Javascript applications.')
  .option('-p, --port [number]', 'Port number the development server will listen on.')
  .action(commands.dev);

program.parse(process.argv);
