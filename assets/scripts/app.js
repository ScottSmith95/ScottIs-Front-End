'use strict';

/* Global Variables */
/* global boomsvgloader:false */
const get_url = 'https://api.scottsmith.is/v1.2/responses';
const post_url = 'https://api.scottsmith.is/v1.2/responses';
let response_json;

/* Page Elements */
const mainElement = document.querySelector( 'main' );
const responseForm = document.querySelector( '.input-form' );
const textInput = document.querySelector( '.input-form input[type="text"]' );
const helpButton = document.querySelector( 'header .help' );
const helpText = document.querySelector( '.help-text' );

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
		alertEl.classList.add( 'status', type );
		const textEl = document.createElement( 'p' );
		textEl.textContent = message;
		alertEl.appendChild( textEl );
		responseForm.insertAdjacentElement( 'afterend', alertEl );

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

	layout( responses ) {
		// Add Response container to DOM.
		let response_container = document.querySelector( '.responses' );
		if ( response_container ) {
			response_container.remove();
		}
		const response_container_element = document.createElement( 'ul' );
		response_container_element.classList.add( 'responses' );
		mainElement.insertAdjacentElement( 'beforeend', response_container_element );
		// Redefine element after removal.
		response_container = document.querySelector( '.responses' );

		// Position each response with a random position.
		for ( let r in responses ) {
			if ( Object.prototype.hasOwnProperty.call( responses, r ) ) {
				// Add content divs
				const response_html = `<li class="response" id="${ r }">${ responses[ r ] }</li>`;
				response_container.insertAdjacentHTML( 'afterbegin', response_html );
				this.word_cloud( document.getElementById( r ) );
			}
		}
	},

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
		if ( textInput.value.length > 20 ) {
			Alert.make_alert( 'Try to keep responses under 20 chars. 😅', 'failure' );
			return false;
		}
		if ( textInput.value.length == 0 ) {
			Alert.make_alert( "You've gotta actually have something to say. 😒", 'failure' );
			return false;
		}

		const data = ScottIs.serialize( responseForm );

		ScottIs.send_response( post_url, data );
		responseForm.reset();
	},

	load_responses( url, limit = 100 ) {
		const req_url = `${ url }?limit=${ limit }`;
		const httpRequest = new XMLHttpRequest();
		httpRequest.open( 'GET', req_url, true );
		httpRequest.send();
		httpRequest.onload = () => {
			response_json = JSON.parse( httpRequest.responseText );
			this.layout( response_json );
		};
	},

	send_response( url, data ) {
		const httpRequest = new XMLHttpRequest();
		httpRequest.open( 'POST', url, true );
		httpRequest.onreadystatechange = () => {
			this.after_response( httpRequest );
		};
		httpRequest.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
		httpRequest.send( data );
	},

	after_response( httpRequest ) {
		if ( httpRequest.readyState === XMLHttpRequest.DONE ) {
			if ( httpRequest.status === 200 ) {
				Alert.make_alert( 'Success! Message posted. 👍', 'success' );
				this.load_responses( get_url );
			} else if ( httpRequest.status === 202 ) {
				Alert.make_alert( 'Uh oh! That is a duplicate response. Try coming up with something new!', 'failure' );
			} else {
				Alert.make_alert( 'Uh small problem. Tell me about it. 😕', 'failure' );
				console.error( 'There was a problem with the request.' );
			}
		}
	},

	help_button( event ) {
		event.preventDefault();
		helpButton.classList.toggle( 'visible' );
		helpText.classList.toggle( 'hidden' );
		helpText.classList.toggle( 'visible' );
	},

	help_setup() {
		if ( window.location.hash == '#help' ) {
			helpButton.classList.toggle( 'visible' );
			helpText.classList.remove( 'hidden' );
		}
	}
};

/* Client Actions */
try {
	boomsvgloader.load( '/assets/images/icons/icon-sprite.svg' );
} catch ( error ) {
	console.error( error );
}

ScottIs.load_responses( get_url );
responseForm.addEventListener( 'submit', ScottIs.handle_form );
ScottIs.help_setup();
helpButton.addEventListener( 'click', ScottIs.help_button );
