import { watch, series, parallel, src, dest } from "gulp" // gulp
import noop from "gulp-noop" // gulp
import browserSync from "browser-sync" // gulp
import cacheBuster from "gulp-rev" // gulp
import sourcemaps from "gulp-sourcemaps" // gulp
import tap from "gulp-tap" // gulp
import cache from "gulp-cache"
import browserify from "browserify" // js
import buffer from "vinyl-buffer" // js
import babelify from "babelify" // js
import envify from "loose-envify" // js
import uglify from "gulp-uglify-es" // js
import fs from "fs" // general
import util from "util" // general
import glob from "glob" // general
import del from "del" // general
import yargs from "yargs" // general
import dotenv from "dotenv" // general

dotenv.config()

// set isProduction and module variables
const { production: isProduction = false } = yargs.argv

// set env variable
process.env.NODE_ENV = isProduction ? `production` : `development`

// create browserSync server
const server = browserSync.create()

const config = {
  serverUrl: process.env.HOST || `http://127.0.0.1:8000/`,
  proxyPort: 3000,
  modules: [`front`],
  buildDest: `dist/`,
  js: {
    entry: `src/*.js`,
    watch: [`src/*.js`],
  },
  manifest: {
    base: `${process.cwd()}/dist/`,
    path: `${process.cwd()}/dist/asset-manifest.json`,
    merge: true,
  },
}

/*
 * Private tasks
 * */
function reload(done) {
  server.reload()
  done()
}

async function serve() {
  await server.init({
    proxy: config.serverUrl,
    port: config.proxyPort,
    open: true,
    notify: false,
  })
}

function clean(done) {
  del(`${config.buildDest}/**/*`).then(() => done())
}

function js() {
  return src(config.js.entry, { read: false }) // no need of reading because browserify does
    .pipe(
      tap((file) => {
        // transform files using gulp-tap
        file.contents = browserify(file.path, {
          transform: [babelify, envify],
          debug: isProduction, // enable source maps on production
        }).bundle()
      })
    )
    .pipe(buffer()) // need this if you want to continue using the stream with other plugins
    .pipe(isProduction ? sourcemaps.init({ loadMaps: true }) : noop())
    .pipe(isProduction ? cacheBuster() : noop()) // cache bust on production
    .pipe(isProduction ? uglify() : noop())
    .pipe(
      isProduction ? sourcemaps.write(".", { includeContent: false }) : noop()
    )
    .pipe(isProduction ? dest(config.buildDest) : noop()) // this build is for manifest.json
    .pipe(
      isProduction
        ? cacheBuster.manifest(config.manifest.path, config.manifest)
        : noop()
    )
    .pipe(dest(config.buildDest))
}

export async function createDevManifest() {
  // asset manifest is not generated during development in order to save time
  // nevertheless, it is required by php script to load the assets
  const asyncGlob = util.promisify(glob)
  const asyncWrite = util.promisify(fs.writeFile)
  const jsFiles = await asyncGlob(config.js.entry)
  const manifest = [...jsFiles].reduce((acc, path) => {
    const filename = path.split(`/`).pop()
    acc[filename] = filename
    return acc
  }, {})
  await util.promisify(fs.mkdir)(config.manifest.base, { recursive: true })
  await asyncWrite(config.manifest.path, JSON.stringify(manifest, null, 4))
}

export async function clearCache() {
  await cache.clearAll()
}

function watchFiles() {
  watch(config.js.watch, series(js, reload))
}

/*
 * Public task
 * */
export default isProduction
  ? series(
      clean,
      js
    )
  : series(
      clean,
      parallel(js),
      createDevManifest,
      parallel(serve),
      watchFiles
    )
