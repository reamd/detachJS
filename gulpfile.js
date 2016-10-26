/**
 * Created by reamd on 2016/10/25.
 */
var gulp = require('gulp'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    notify = require('gulp-notify');
gulp.task('uglify', function() {
    return gulp.src('code.js')
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'uglify task complete' }));
});
