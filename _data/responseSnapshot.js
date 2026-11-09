import apiUrl from './apiUrl.js';

// Render a small cloud at build time; the browser can refresh it when JavaScript is available.
export default async function () {
	const response = await fetch( `${ apiUrl }?limit=25`, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout( 8000 ),
	} );
	if ( !response.ok ) throw new Error( `Could not build response snapshot: HTTP ${ response.status }` );
	const data = await response.json();
	if ( !data || Array.isArray( data ) || typeof data !== 'object'
		|| Object.entries( data ).some( ( [ id, text ] ) => !/^[1-9]\d{0,15}$/.test( id ) || !Number.isSafeInteger( Number( id ) ) || typeof text !== 'string' ) ) {
		throw new Error( 'Could not build response snapshot: invalid API data' );
	}
	return Object.entries( data )
		.sort( ( a, b ) => Number( b[ 0 ] ) - Number( a[ 0 ] ) )
		.slice( 0, 25 )
		.map( ( [ id, text ], index ) => ( { id, text, size: index % 4 + 1 } ) );
}
