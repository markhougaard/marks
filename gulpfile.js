// Gulp and Node plugins
var gulp            = require('gulp'), // We need Gulp itself to perform Gulp tasks
    sass            = require('gulp-sass'), // gulp-sass will let us compile scss-files to css
    pug             = require('gulp-pug'), // gulp-pug is our template language of choice
    awspublish      = require('gulp-awspublish'), // gulp-awspublish enables deployments to AWS S3
    del             = require('del'), // del is used instead of gulp-clean so the build folder will be wiped
    express         = require('express'), // express is a great little server we use to watch our files
    fs              = require('fs'), // fs lets us read the file system
    app             = express(),
    tinylr          = require('tiny-lr')(); // tinylr is a neat little way to live-reload changes so we can watch our styles and templates update in real-time

// Define the variables for locating our stuff
SCSS_DIR = 'src/assets/scss', // This is where the SASS-files go
BUILD_DIR = 'build', // This is the folder we output the compiled files to
CONTENT_DIR = 'src/content'; // This is where we keep the templates with content

EXPRESS_ROOT = BUILD_DIR; // For our express-server, we need to know where the 'root' is, and by making it the same as the BUILD_DIR, we can serve it at http://localhost:3000/ instead of http://localhost:3000/build
EXPRESS_PORT = 3000; // The port we will use to serve the files. This should not conflict with anything else you're running currently
LIVERELOAD_PORT = 35729; // The default port for live-reload

// Start an Express-server
gulp.task('express', function() { // Define a task called 'express'
    app.use(require('connect-livereload')({port: LIVERELOAD_PORT})); // Our express app uses connect-reload to match the express-server with live-reload on the LIVERELOAD_PORT
    app.use(express.static(EXPRESS_ROOT)); // Defining the location for where the express-server will serve the static files from
    app.listen(EXPRESS_PORT, '0.0.0.0'); // Where can we listen to the express-server? At 'http://0.0.0.0' i.e. 'http://localhost' on the port defined in EXPRESS_PORT, i.e. 3000
});

// Enable livereload without browser plugin
gulp.task('livereload', function() { // We name the task appropriately 'livereload'
    tinylr.listen(LIVERELOAD_PORT); // Tinylr should listen on this port
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

// Compile SASS and pug
gulp.task('compile-sass', function() {
    return gulp.src(SCSS_DIR + '/style.scss')
        .pipe(sass({ outputStyle: 'compressed', errLogToConsole: false, includePaths: [SCSS_DIR] }))
        .pipe(gulp.dest(BUILD_DIR))
});

gulp.task('compile-pug', function() {
    return gulp.src(CONTENT_DIR + '/*.pug')
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(BUILD_DIR))
});

// Build
gulp.task('build', ['compile-sass', 'compile-pug'], function(cb) {
    cb();
});

// Watch
gulp.task('watch', ['express', 'compile-sass', 'compile-pug', 'livereload'], function(cb){
    gulp.watch(SCSS_DIR + '/**', ['compile-sass']);
    gulp.watch(CONTENT_DIR + '/*.pug', ['compile-pug']);
    gulp.watch(BUILD_DIR + '/**', notifyLiveReload);
});

// Deploy
var awspublish = require('gulp-awspublish');

gulp.task('deploy', ['build'], function() {

    // Read the settings from their own file
    awsoptions = JSON.parse(fs.readFileSync('aws.json'));

    // Read those settings
    var publisher = awspublish.create(awsoptions);

    // Define the cache
    var headers = {
        'Cache-Control': 'max-age=315360000, no-transform, public'
    };

    return gulp.src(BUILD_DIR + '/**')

        // Add cache headers
        .pipe(publisher.publish(headers))

        // Check cache file for changes to avoid unnecessary uploads
        .pipe(publisher.cache())

        // Tell what's going on
        .pipe(awspublish.reporter());
});
