// Gulp plugins
var gulp            = require('gulp'),
    sass            = require('gulp-sass'),
    jade            = require('gulp-jade'),
    del             = require('del'),
    express         = require('express'),
    app             = express(),
    tinylr          = require('tiny-lr')();

ASSETS_DIR = 'src/assets',
SCSS_DIR = 'src/assets/scss',
JS_DIR = 'src/assets/js',
BUILD_DIR = 'build',
CONTENT_DIR = 'src/content',
IMG_DIR = 'src/img';

EXPRESS_ROOT = BUILD_DIR;
EXPRESS_PORT = 3000;
LIVERELOAD_PORT = 35729;

// Start an Express-server
gulp.task('express', function() {
    app.use(require('connect-livereload')({port: LIVERELOAD_PORT}));
    app.use(express.static(EXPRESS_ROOT));
    app.listen(EXPRESS_PORT, '0.0.0.0');
});

// Enable livereload without browser plugin
gulp.task('livereload', function() {
    tinylr.listen(LIVERELOAD_PORT);
});

function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname, event.path);

  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

// Clean
gulp.task('clean', function(cb) {
    del([BUILD_DIR], cb);
});

// Compile SASS and Jade
gulp.task('compile-sass', function() {
    return gulp.src(SCSS_DIR + '/style.scss')
        .pipe(sass({ outputStyle: 'compressed', errLogToConsole: false, includePaths: [SCSS_DIR] }))
        .pipe(gulp.dest(BUILD_DIR))
});

gulp.task('compile-jade', function() {
    return gulp.src(CONTENT_DIR + '/*.jade')
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(BUILD_DIR))
});

// Build
gulp.task('build', ['compile-sass', 'compile-jade'], function(cb) {
    cb();
});

// Watch
gulp.task('watch', ['express', 'compile-sass', 'compile-jade', 'livereload'], function(cb){
    gulp.watch(SCSS_DIR + '/**', ['compile-sass']);
    gulp.watch(CONTENT_DIR + '/*.jade', ['compile-jade']);
    gulp.watch(BUILD_DIR + '/**', notifyLiveReload);
});
