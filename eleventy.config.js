/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */

import path from "path";
import { open, stat, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import { minify } from "terser";
import svgSprite from "svg-sprite";

const paths = {
	sprites: {
		src: "assets/images/icons/",
		dest: "_site/assets/images/icons/",
	},
	sitemap: {
		src: ["_site", "!_site/error/*.html"],
	},
};

async function saveSourcemap( filepath, map ) {
	const outPath = path.parse( filepath );

	try {
		const outDir = await open( outPath.dir );
		outDir.close();
	} catch( error ) {
		console.log( `${filepath} could not be opened. Attempting to create directory.` );
		await mkdir( outPath.dir, {
			recursive: true,
		} );
	}

	if (typeof map !== 'string' || typeof map !== 'Buffer') {
		map = map.toString();
	}

	return await writeFile(
		`${filepath}.map`,
		map
	);
}

export default function ( eleventyConfig ) {

	// Passthrough files
	eleventyConfig.addPassthroughCopy("./manifest.webmanifest");
	eleventyConfig.addPassthroughCopy("./assets/images");

	// Passthrough during serve
	eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	const additionalLogging = process.env.CI == true || process.env.ENV === 'production' || process.env.VERCEL_ENV === 'production';

	eleventyConfig.addExtension( 'css', {
		outputFileExtension: 'css',

		// `compile` is called once per .css file in the input directory
		compile: async function ( inputContent, inputPath ) {
			// Skip names beginning with an underscore.
			let parsed = path.parse(inputPath);
			if ( parsed.name.startsWith( '_' ) || parsed.name.includes( 'variables' ) ) {
				return;
			}

			const { plugins, options } = await postcssrc( {
				from: inputPath,
				to: path.join( eleventyConfig.dir.output, inputPath )
			} );
			let result = await postcss( plugins ).process( inputContent, options );

			// Save sourcemap to file
			if ( typeof result.map !== 'undefined' ) {
				await saveSourcemap( path.join( eleventyConfig.dir.output, inputPath ), result.map );
			}

			// This is the render function, `data` is the full data cascade
			return async ( data ) => {
				return result.css;
			};
		},
		
		compileOptions: {
			permalink: "raw"
		},
	});

	eleventyConfig.addExtension( 'js', {
		outputFileExtension: 'js',

		// `compile` is called once per .css file in the input directory
		compile: async function ( inputContent, inputPath, page ) {
			let parsed = path.parse( inputPath );

			if (
				parsed.name.includes( 'eleventy' ) ||
				parsed.name.includes( 'service-worker' )
			) {
				// Skip dev files
				return;
			}

			const options = {
				sourceMap: {
					filename: parsed.base,
					url: `${parsed.base}.map`,
				},
			};
			let result = await minify( inputContent, options );

			// Save sourcemap to file
			if ( typeof result.map !== 'undefined' ) {
				await saveSourcemap( path.join( eleventyConfig.dir.output, inputPath ), result.map );
			}

			// This is the render function, `data` is the full data cascade
			return async ( data ) => {
				return result.code;
			};
		},
		
		compileOptions: {
			permalink: "raw"
		},
	} );

	eleventyConfig.on("eleventy.before", async () => {
		const options = {
			mode: {
				symbol: {
					// Create a «symbol» sprite.
					inline: true,
					dest: ".", // Don't create 'symbols/' directory.
					prefix: "", // Don't prefix output title.
					sprite: "icon-sprite", // '.svg' will be appended if not included.
				},
			},
		};
		const spriter = new svgSprite( options );
		const svgDirFileNames = await readdir( paths.sprites.src );

		for ( const fileName of svgDirFileNames ) {
			const filePath = path.join( paths.sprites.src, fileName );

			// The below can error if there is a directory found. TODO: Add check for is directory/is readable.
			let fileContents = await readFile( filePath, {
				encoding: "utf8",
			} );
			spriter.add( path.resolve( filePath ), fileName, fileContents );
		}

		const { result } = await spriter.compileAsync();
		for ( const mode of Object.values( result ) ) {
			for ( const resource of Object.values( mode ) ) {
				await mkdir( paths.sprites.dest, {
					recursive: true,
				} );
				await writeFile(
					path.join( paths.sprites.dest, path.parse( resource.path ).base ),
					resource.contents
				);
			}
		}
	});

	return {
		templateFormats: [ 'html', 'css', 'js' ],
	};
};
