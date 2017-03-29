'use strict';

var gulp       = require('gulp'),
	sourcemaps = require('gulp-sourcemaps'),
	postcss    = require('gulp-postcss'),
	concat     = require('gulp-concat'),
	uglify     = require('gulp-uglify'),
	sprite     = require('gulp-svg-sprite');

var paths = {
	styles:  ['assets/styles/*.css', '!assets/styles/build/**'],
	scripts: ['node_modules/boomsvgloader/dist/js/boomsvgloader.js', 'assets/scripts/*.js', '!assets/scripts/build/**'],
	sprites: ['assets/images/icons/*.svg', '!assets/images/icons/icon-sprite.svg']
};

var processors = [
	require('postcss-import'),
	require('postcss-nested'),
	require('postcss-custom-properties'),
	require('css-mqpacker')({sort: true}),
	require('autoprefixer'),
	require('cssnano')({autoprefixer: false, reduceIdents: false}) // Autoprefixer has just been run, don't do it again; reduceIdents is pretty unsafe.
];

gulp.task(function styles() {
	return gulp.src('assets/styles/app.css')
		.pipe(sourcemaps.init())
			.pipe(postcss(processors))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('assets/styles/build/'));
});

gulp.task(function scripts() {
	return gulp.src(paths.scripts)
		.pipe(sourcemaps.init())
			.pipe(concat('app.js'))
			.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('assets/scripts/build/'));
});

gulp.task(function sprites() {
	var options = {
		mode: {
			symbol: { // Create a «symbol» sprite.
				dest: '.', // Don't create 'symbols/' directory.
				prefix: '', // Don't prefix output title.
				sprite: 'icon-sprite' // '.svg' will be appended if not included.
			}
		}
	};

	return gulp.src(paths.sprites)
		.pipe(sprite(options))
		.pipe(gulp.dest('assets/images/icons'));
});

gulp.task(function watch() {
	gulp.watch(paths.styles, gulp.series('styles'));
	gulp.watch(paths.scripts, gulp.series('scripts'));
	gulp.watch(paths.sprites, gulp.series('sprites'));
});

// Workflows
// $ gulp: Builds and watches for changes. The works.
gulp.task('default', gulp.parallel('styles', 'scripts', 'sprites', 'watch', function(done) {
	done();
}));

// $ gulp build: Builds for deployments.
gulp.task('build', gulp.parallel('styles', 'scripts', 'sprites', function(done) {
	done();
}));
