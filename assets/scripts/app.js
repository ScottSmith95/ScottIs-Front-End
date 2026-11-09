'use strict';

const initial_response_limit = 25;
const response_batch_size = 25;

/* Page Elements */
const responseForm = document.querySelector( '.input-form' );
const textInput = document.querySelector( '.input-form input[type="text"]' );
const loadMoreButton = document.querySelector( '.load-more' );
const get_url = responseForm.action;
const post_url = get_url;

/* Responses Web Component */
class ResponseList extends HTMLElement {
	connectedCallback() {
		this.currentLimit = initial_response_limit;
		this.lastLoadedCount = 0;
		this.revision = 0;
		this.load();
	}

	createResponseItem( id, responseText ) {
		const li = document.createElement( 'li' );
		li.classList.add( 'response' );
		li.id = `${ id }`;
		li.setAttribute( 'rel', 'ugc' );
		li.textContent = responseText;
		ScottIs.word_cloud( li );
		return li;
	}

	setLoadMoreVisibility() {
		if ( loadMoreButton ) {
			loadMoreButton.hidden = this.lastLoadedCount < this.currentLimit;
		}
	}

	async load( url = get_url, limit = this.currentLimit ) {
		if ( this.loading ) return;
		this.loading = true;
		const revision = this.revision;
		if ( !this.children.length ) this.innerHTML = '<p class="loading-state">Loading…</p>';
		this.setAttribute( 'aria-busy', 'true' );
		if ( loadMoreButton ) {
			loadMoreButton.disabled = true;
		}

		const reqUrl = `${ url }?limit=${ limit }`;
		try {
			const res = await fetch( reqUrl );
			if ( !res.ok ) throw new Error( `Response API returned ${ res.status }` );
			const json = await res.json();
			if ( !json || Array.isArray( json ) || typeof json !== 'object' || Object.values( json ).some( value => typeof value !== 'string' ) ) {
				throw new Error( 'Invalid responses payload' );
			}
			const entries = Object.entries( json );

			const ul = document.createElement( 'ul' );
			ul.classList.add( 'responses' );

			for ( let i = entries.length - 1; i >= 0; i-- ) {
				const [ id, responseText ] = entries[ i ];
				const li = this.createResponseItem( id, responseText );
				ul.appendChild( li );
			}

			if ( revision !== this.revision ) return;
			this.innerHTML = '';
			this.appendChild( ul );
			this.currentLimit = limit;
			this.lastLoadedCount = entries.length;
			this.setLoadMoreVisibility();
		} catch ( error ) {
			if ( !this.querySelector( '.responses' ) ) this.innerHTML = '<p class="loading-state">Failed to load</p>';
			else Alert.make_alert( 'Could not refresh responses. Showing the responses already loaded.', 'failure' );
			console.error( 'There was a problem loading responses.', error );
		} finally {
			this.loading = false;
			this.removeAttribute( 'aria-busy' );
			if ( loadMoreButton ) {
				loadMoreButton.disabled = false;
			}
		}
	}

	prependResponse( responseText, id = Date.now() ) {
		if ( typeof responseText !== 'string' || responseText.length === 0 ) {
			return;
		}

		this.revision++;
		let ul = this.querySelector( 'ul.responses' );
		if ( !ul ) {
			ul = document.createElement( 'ul' );
			ul.classList.add( 'responses' );
			this.innerHTML = '';
			this.appendChild( ul );
		}

		ul.querySelector( '.loading-state' )?.remove();
		const li = this.createResponseItem( id, responseText );
		ul.insertAdjacentElement( 'afterbegin', li );

		while ( ul.children.length > this.currentLimit ) {
			ul.lastElementChild.remove();
		}

		this.lastLoadedCount = ul.children.length;
		this.setLoadMoreVisibility();
	}
}

/* Alerts Module */
class Alert {
	constructor( message, type = 'neutral', duration = 4000 ) {
		this.constructor.make_alert( message, type, duration );
	}

	static make_alert( message, type = 'neutral', duration = 4000 ) {
		return new Promise( resolve => {
			// Check for and remove any preexisting alerts.
			if ( document.querySelector( '[role=alert]' ) ) {
				const oldAlert = document.querySelector( '[role=alert]' );
				const oldAlertId = oldAlert.getAttribute( 'id' ).replace( 'alert-', '' );
				this.remove_alert( oldAlertId, true );
			}

			// Create alert element.
			const alertEl = this.create_alert_element( message, type );

			// Remove alert after duration.
			const alertTimeoutId = window.setTimeout( () => {
				this.remove_alert( alertTimeoutId );
				resolve();
			}, duration );

			// Save alert ID (timeout ID counter) as element id.
			alertEl.setAttribute( 'id', `alert-${ alertTimeoutId }` );

			// Allow user to dismiss alert by clicking.
			alertEl.addEventListener( 'click', () => {
				this.remove_alert( alertTimeoutId );
				resolve();
			}, false );
		} );
	}

	static create_alert_element( message, type ) {
		const alertEl = document.createElement( 'div' );
		alertEl.setAttribute( 'role', 'alert' );
		alertEl.setAttribute( 'aria-live', 'assertive' );
		alertEl.classList.add( 'alert', type );
		alertEl.style.cursor = 'pointer';
		const textEl = document.createElement( 'p' );
		textEl.textContent = message;
		alertEl.appendChild( textEl );
		if ( responseForm ) {
			responseForm.insertAdjacentElement( 'afterend', alertEl );
		}

		return alertEl;
	}

	static remove_alert( timeout, instant = false ) {
		window.clearTimeout( timeout );
		const alertEl = document.getElementById( `alert-${ timeout }` );

		if ( alertEl && instant === false ) {
			alertEl.classList.add( 'remove' );

			setTimeout( () => {
				alertEl.remove();
			}, 1000 );
		}

		if ( alertEl && instant === true ) {
			alertEl.remove();
		}
	}
}

/* Client Module */
const ScottIs = {

	getRandomIntInclusive( min, max ) {
		const low = Math.ceil( min );
		const high = Math.floor( max );
		return Math.floor( Math.random() * ( high - low + 1 ) ) + low;
	},

	word_cloud( el ) {
		const mod = this.getRandomIntInclusive( 1, 4 );
		el.classList.add( `size-${ mod }` );
	},

	serialize( form ) {
		// Source: https://stackoverflow.com/a/44033425/1867887
		return new URLSearchParams( new FormData( form ) ).toString();
	},

	/*
	 *  This function is called with the event scope and thus needs to reference
	 *  other functions in the object as 'ScottIs.func()' instead of 'this.func()'.
	 */
	handle_form( event ) {
		event.preventDefault();
		textInput.value = textInput.value.trim();
		if ( textInput.value.length > 20 ) {
			Alert.make_alert( 'Try to keep responses under 20 chars. 😅', 'failure' );
			return false;
		}
		if ( textInput.value.length === 0 ) {
			Alert.make_alert( "You've gotta actually have something to say. 😒", 'failure' );
			return false;
		}

		const data = ScottIs.serialize( responseForm );

		ScottIs.send_response( post_url, data );
	},

	load_responses( url, limit = initial_response_limit ) {
		const component = document.querySelector( 'response-list' );
		if ( component ) {
			component.load( url, limit );
		}
	},

	prepend_response( responseText, timestamp ) {
		const component = document.querySelector( 'response-list' );
		if ( component && typeof component.prependResponse === 'function' ) {
			component.prependResponse( responseText, timestamp );
			return;
		}
		this.load_responses( get_url, initial_response_limit );
	},

	send_response( url, data ) {
		const submittedText = textInput.value;
		fetch( url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: data
		} )
		.then( async ( response ) => {
			let payload;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}

			if ( response.status === 202 ) {
				Alert.make_alert( 'Uh oh! That is a duplicate response. Try coming up with something new!', 'failure' );
			} else if ( !response.ok ) {
				Alert.make_alert( 'Uh small problem. Tell me about it. 😕', 'failure' );
				throw new Error( 'There was a problem with the request.' );
			} else if ( !payload || typeof payload.response !== 'string' ) {
				throw new Error( 'Invalid submission response' );
			} else {
				if ( textInput.value === submittedText ) textInput.value = '';
				Alert.make_alert( 'Success! Message posted. 👍', 'success' );
				this.prepend_response( payload?.response || submittedText, payload?.timestamp );
			}
		} )
		.catch( ( error ) => {
			Alert.make_alert( 'Uh small problem. Tell me about it. 😕', 'failure' );
			console.error( 'There was a problem with the request.', error );
		} );
	},

	load_more_responses( event ) {
		event.preventDefault();
		const component = document.querySelector( 'response-list' );
		if ( component ) {
			component.load( get_url, component.currentLimit + response_batch_size );
		}
	}
};

/* Client Actions */
customElements.define( 'response-list', ResponseList );
document.documentElement.classList.replace( 'no-js', 'js' );
if ( responseForm ) {
	responseForm.addEventListener( 'submit', ScottIs.handle_form );
}
if ( loadMoreButton ) {
	loadMoreButton.addEventListener( 'click', ScottIs.load_more_responses );
}
