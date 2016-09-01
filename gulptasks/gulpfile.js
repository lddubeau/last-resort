/* global __dirname */
import "babel-polyfill";
import gulp from "gulp";
import { Server } from "karma";
import uglify from "gulp-uglify";
import rename from "gulp-rename";
import del from "del";
import Promise from "bluebird";
import _fs from "fs-extra";
import _child_process from "child_process"; // eslint-disable-line camelcase
import gutil from "gulp-util";
import eslint from "gulp-eslint";
import sourcemaps from "gulp-sourcemaps";
import tslint from "gulp-tslint";
import ts from "gulp-typescript";
import es from "event-stream";
import wrap from "gulp-wrap-js";
import path from "path";

// eslint-disable-next-line camelcase
const child_process = Promise.promisifyAll(_child_process);
const execFileAsync = child_process.execFileAsync;

const fs = Promise.promisifyAll(_fs);
const project = ts.createProject("tsconfig.json");

function exec(command, options) {
  return new Promise((resolve, reject) => {
    child_process.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        gutil.log(stdout);
        gutil.log(stderr);
        reject(err);
      }
      resolve([stdout, stderr]);
    });
  });
}

gulp.task("default", ["dist"]);

const template = fs.readFileSync("src/wrap.js").toString()
      .replace(/\/\*\s*<%= contents %>\s*\*\//, "%= body %");

gulp.task("dist", ["uglify"],
          () => gulp.src("build/src/*").pipe(gulp.dest("dist")));

gulp.task("build", ["tslint"], () => {
  const result = project.src()
          .pipe(sourcemaps.init({ loadMaps: true }))
          .pipe(ts(project));

  return es.merge(result.js.pipe(wrap(template))
                  .pipe(sourcemaps.write("."))
                  .pipe(gulp.dest("build")),
                  result.dts.pipe(gulp.dest("build")));
});

gulp.task("uglify", ["build"], () => gulp.src("build/src/last-resort.js")
          .pipe(sourcemaps.init())
          .pipe(uglify({
            preserveComments: "license",
          }))
          .pipe(rename("last-resort.min.js"))
          // Writing to . prevents inlining the map.
          .pipe(sourcemaps.write("."))
          .pipe(gulp.dest("build/src")));

gulp.task("lint", ["eslint", "tslint"]);

gulp.task("eslint", () =>
          gulp.src(["*.js", "test/**/*.js", "gulptasks/**/*.js"])
          .pipe(eslint())
          .pipe(eslint.format())
          .pipe(eslint.failAfterError()));

gulp.task("tslint", () =>
          gulp.src(["src/**/*.ts"])
          .pipe(tslint())
          .pipe(tslint.report()));

gulp.task("test", ["lint", "versync", "test-karma", "pack"]);

gulp.task("versync",
          () => execFileAsync("./node_modules/.bin/versync", ["-v"]));

gulp.task("test-karma", (done) => {
  new Server({
    configFile: `${__dirname}/../karma.conf.js`,
    singleRun: true,
  }, done).start();
});

gulp.task("pack", ["default"], Promise.coroutine(function *distTask() {
  const dir = "build/pack";
  const t = path.join(dir, "t");
  yield fs.ensureDirAsync(dir);
  yield exec("ln -sf `npm pack ../..` LATEST-DIST.tgz", { cwd: dir });
  // Test that the package can actually be installed.
  yield del(t);
  yield fs.ensureDirAsync(path.join(t, "node_modules"));
  yield exec(`(cd ${t}; npm install ../LATEST-DIST.tgz)`);
  yield del(t);
}));

gulp.task("clean", () => del(["build", "dist"]));
