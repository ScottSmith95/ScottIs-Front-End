// Set explicitly for local/staging builds; the form, snapshot and enhancement share it.
const url = new URL( process.env.SCOTTIS_API_URL || 'https://api.scottsmith.is/v1.5/responses' );
if ( ![ 'http:', 'https:' ].includes( url.protocol ) || url.username || url.password || url.search || url.hash ) {
	throw new Error( 'SCOTTIS_API_URL must be an HTTP(S) endpoint without credentials, a query or a fragment.' );
}
export default url.href;
