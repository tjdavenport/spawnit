const program = require('commander');
const commands = require('./lib/commands');

program.version('0.0.1');
program.option('-p, --port <n>', 'Port number the development server will listen on.', parseInt);
program.option('-e, --errorNotify', 'Pass bundle/sass errors to desktop notifier');
program.option('-n, --noOpen', 'Do not open webpage in default browser');
program.parse(process.argv);

commands.dev(program);

module.exports = program;
