/**
 * Created by reamd on 2016/10/25.
 */
var gulp = require('gulp'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    notify = require('gulp-notify'),
    del = require('del');

gulp.task('scripts', function() {
    return gulp.src('src/detach.js')
        .pipe(gulp.dest('dist/'))
        .pipe(rename('detach.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/'))
        .pipe(notify("<%= file.relative %> uglify success!"));
});
gulp.task('del', function () {
    return del.sync('dist');
});
gulp.task('default', ['del', 'scripts']);