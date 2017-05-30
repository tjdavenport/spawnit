# spawnit

[![Build Status](https://travis-ci.org/tjdavenport/spawnit.svg?branch=master)](https://travis-ci.org/tjdavenport/spawnit) [![Coverage Status](https://coveralls.io/repos/github/tjdavenport/spawnit/badge.svg?branch=master)](https://coveralls.io/github/tjdavenport/spawnit?branch=master)

Spawnit allows you to start prototyping your Javascript browser application with zero boilerplate. It will start a configurable,
customizeable expressjs development server that supports live reloading, live css injection, SASS transpilation, bundling 
with Browserify, and script concatenation. No boilerplate is needed to start creating elaborate single page applications.

![Demonstration gif](http://i.imgur.com/Q9kaW9d.gif)

## CLI Options
```
  Usage: index [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -p, --port <n>     Port number the development server will listen on.
    -w, --wssPort <n>  Port number the websocket server will listen on.
    -e, --errorNotify  Pass bundle/sass errors to desktop notifier
    -n, --noOpen       Do not open webpage in default browser
```

## Configuration File
Spawnit will look for a `spawnit-config.js` file in the current working directory. The file should export an object with configuration keys/values. All CLI options can be set in this file. Example:

``` javascript
// spawnit-config.js

module.exports = {
  port: 1337,
  wssPort: 1338,
  /**
   * These options will be used to create a Browserify instance
   */
  browserifyOpts: {},
  /**
   * These options will be passed to node-sass.render
   */
  nodeSassOpts: {},
  errorNotify: false,
  /**
   * These scripts will be concatenated with sourcemaps. 
   * Great for including modules that aren't compatible with bundling.
   */
  scripts: [],
  noOpen: false,
  /**
   * These files/folders will be watched. Changes will trigger css injection.
   */
  scssFiles: [
    path.join(process.cwd(), 'styles.scss'),
    path.join(process.cwd(), 'styles'),
  ],
};

```

## Custom index.html

Spawnit determines what HTML to respond with in one of two places.
1. It will look for `index.html` in the current working directory.
2. If no index exists in the current working directory, it will use the [hardcoded default](https://github.com/tjdavenport/spawnit/blob/master/lib/getHtml.js),

Spawnit assumes that you're developing an SPA, so the default body only contains a single div element: `<div id="app"></div>`. If you decide you need more control of the index file, be sure to include the following tags so everything still works:

``` html
<!-- this will load rendered css from the server -->
<link id="_spawnitcss" rel="stylesheet" href="/_spawnit/css">
<!-- this will load concatenated scripts defined in the config file -->
<script src="/_spawnit/bundle"></script>
<!-- this will load the compiled Browserify bundle -->
<script src="/_spawnit/bundle"></script>
<!--
  this will establish a websocket connection with the Spawnit server,
  allowing the utility features (live reload etc) to work
-->
<script src="/_spawnit/remote"></script>
```
## Roadmap
1. Get coveralls badge working
2. Add plugins config option to allow for complete customization of the expressjs server.
3. Add Webdriver support?
