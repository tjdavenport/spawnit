const CLIEngine = require('eslint').CLIEngine;

class Linter {

  constructor(options, logger) {
    this.engine = new CLIEngine(options);
    this.logger = logger;
  }

  /**
    Function: lint
      Performs the actual linting of files, and logs error results

    TODO: add an option for `full` report publishing
      `this.logger.log(formatter(report.results))` --> full report publish
  */
  lint() {
    // get a linting report that contains information about
    //  errors, warnings, and detailed messages including line numbers and columns.
    const report = this.engine.executeOnFiles([this.engine.options.cwd]);
    // get the default eslint report formatter
    const formatter = this.engine.getFormatter();

    if (report.errorCount > 0) {
      // extract just the errors. Right now, to keep logging messages concise
      //  that's all that will be published.
      const errorReport = CLIEngine.getErrorResults(report.results);
      this.logger.log(formatter(errorReport));
      return false;
    }
    return true;
  }

  /**
    Function: process
      Returns a Promise that resolves if there are no linting errors, else rejects
  */
  process() {
    return new Promise((resolve, reject)=> {
      if (this.lint()) {
        resolve(true);
      }
      else {
        reject(false);
      }
    });
  }

};

module.exports = (options, logger)=> {return new Linter(options, logger)};
