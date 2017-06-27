'use strict';

var gulp       = require('gulp'),
	sourcemaps = require('gulp-sourcemaps'),
	postcss    = require('gulp-postcss'),
	concat     = require('gulp-concat'),
	uglify     = require('gulp-uglify'),
	sprite     = require('gulp-svg-sprite');

var paths = {
	styles: {
		src: 'assets/styles/app.css',
		dest: 'assets/styles/build/'
	},
	scripts: {
		src: ['node_modules/boomsvgloader/dist/js/boomsvgloader.js', 'assets/scripts/*.js', '!assets/scripts/build/**'],
		dest: 'assets/scripts/build/'
	},
	sprites: {
		src: ['assets/images/icons/*.svg', '!assets/images/icons/icon-sprite.svg'],
		dest: 'assets/images/icons'
	}
};

var processors = [
	require('postcss-import'),
	require('postcss-nested'),
	require('postcss-custom-properties'),
	require('css-mqpacker')({sort: true}),
	require('autoprefixer'),
	require('cssnano')({autoprefixer: false, reduceIdents: false}) // Autoprefixer has just been run, don't do it again; reduceIdents is pretty unsafe.
];

function styles() {
	return gulp.src(paths.styles.src)
		.pipe(sourcemaps.init())
			.pipe(postcss(processors))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.styles.dest));
}

function scripts() {
	return gulp.src(paths.scripts.src)
		.pipe(sourcemaps.init())
			.pipe(concat('app.js'))
			.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.scripts.dest));
}

function sprites() {
	var options = {
		mode: {
			symbol: { // Create a «symbol» sprite.
				dest: '.', // Don't create 'symbols/' directory.
				prefix: '', // Don't prefix output title.
				sprite: 'icon-sprite' // '.svg' will be appended if not included.
			}
		}
	};

	return gulp.src(paths.sprites.src)
		.pipe(sprite(options))
		.pipe(gulp.dest(paths.sprites.dest));
}

function watch() {
	gulp.watch(paths.styles.src, styles);
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch(paths.sprites.src, sprites);
}

// Workflows
// $ gulp: Builds and watches for changes. The works.
var defaultTask = gulp.parallel(styles, scripts, sprites, watch);

// $ gulp build: Builds for deployments.
var buildTask = gulp.parallel(styles, scripts, sprites);

// Exports
// Externalise individual tasks.
exports.styles = styles;
exports.scripts = scripts;
exports.sprites = sprites;
exports.watch = watch;

// Externalise Workflows.
exports.build = buildTask;
exports.default = defaultTask;