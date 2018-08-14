'use strict';

const gulp       = require( 'gulp' );
const sourcemaps = require( 'gulp-sourcemaps' );
const postcss    = require( 'gulp-postcss' );
const concat     = require( 'gulp-concat' );
// Use uglify-es minifier with gulp-uglify for ES2015 support.
const composer   = require( 'gulp-uglify/composer' );
const uglifyes   = require( 'uglify-es' );
const minify     = composer( uglifyes, console );
const sprite     = require( 'gulp-svg-sprite' );

const paths = {
	styles: {
		src: 'assets/styles/app.css',
		dest: 'assets/styles/build/',
		watch: [ 'assets/styles/**/*.css', '!assets/styles/build/**' ]
	},
	scripts: {
		src: [ 'node_modules/boomsvgloader/dist/js/boomsvgloader.js', 'assets/scripts/*.js', '!assets/scripts/build/**' ],
		dest: 'assets/scripts/build/'
	},
	sprites: {
		src: [ 'assets/images/icons/*.svg', '!assets/images/icons/icon-sprite.svg' ],
		dest: 'assets/images/icons'
	}
};

const processors = [
	require( 'postcss-import' ),
	require( 'postcss-nested' ),
	require( 'postcss-custom-properties' )( { warnings: true } ),
	require( 'css-mqpacker' )( { sort: true } ),
	require( 'autoprefixer' ),
	require( 'postcss-normalize' ),
	require( 'cssnano' )( { preset: 'default' } )
];

function styles() {
	return gulp.src( paths.styles.src )
		.pipe( sourcemaps.init() )
			.pipe( postcss( processors ) )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( paths.styles.dest ) );
}

function scripts() {
	return gulp.src( paths.scripts.src )
		.pipe( sourcemaps.init() )
			.pipe( concat( 'app.js' ) )
			.pipe( minify() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( paths.scripts.dest ) );
}

function sprites() {
	const options = {
		mode: {
			symbol: { // Create a «symbol» sprite.
				dest: '.', // Don't create 'symbols/' directory.
				prefix: '', // Don't prefix output title.
				sprite: 'icon-sprite' // '.svg' will be appended if not included.
			}
		}
	};

	return gulp.src( paths.sprites.src )
		.pipe( sprite( options ) )
		.pipe( gulp.dest( paths.sprites.dest ) );
}

function watch() {
	gulp.watch( paths.styles.watch, styles );
	gulp.watch( paths.scripts.src, scripts );
	gulp.watch( paths.sprites.src, sprites );
}

/* Workflows */
// $ gulp: Builds and watches for changes. The works.
const defaultTask = gulp.parallel( styles, scripts, sprites, watch );

// $ gulp build: Builds for deployments.
const buildTask = gulp.parallel( styles, scripts, sprites );

/* Exports */
// Externalise individual tasks.
exports.styles = styles;
exports.scripts = scripts;
exports.sprites = sprites;
exports.watch = watch;

// Externalise Workflows.
exports.build = buildTask;
exports.default = defaultTask;
