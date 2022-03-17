'use strict';

import gulp from 'gulp';
import postcss from 'gulp-postcss';
import concat from 'gulp-concat';
import minify from 'gulp-terser';
import sprite from 'gulp-svg-sprite';

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
	require( 'postcss-custom-properties' ),
	require( 'postcss-sort-media-queries' ),
	require( 'postcss-100vh-fix' ),
	require( 'autoprefixer' ),
	require( 'postcss-normalize' ),
	require( 'cssnano' )( { preset: 'default' } )
];

function styles() {
	return gulp
		.src( paths.styles.src, { sourcemaps: true } )
		.pipe( postcss( processors ) )
		.pipe( gulp.dest( paths.styles.dest, { sourcemaps: '.' } ) );
}

function scripts() {
	return gulp
		.src( paths.scripts.src, { sourcemaps: true } )
		.pipe( concat( 'app.js' ) )
		.pipe( minify() )
		.pipe( gulp.dest( paths.scripts.dest, { sourcemaps: '.' } ) );
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

	return gulp
		.src( paths.sprites.src )
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
