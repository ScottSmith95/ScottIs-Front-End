'use strict';

/* Global Variables */
const get_url = 'https://api.scottsmith.is/v1.2/responses'
const post_url = 'https://api.scottsmith.is/v1.2/responses'
var response_json 

/* Page Elements */
var mainElement = document.querySelector('main');
var responseForm = document.querySelector('.input-form');
var textInput = document.querySelector('.input-form input[type="text"]');
var submitButton = document.querySelector('.input-form input[type="submit"]');
var helpButton = document.querySelector('header .help');
var helpText = document.querySelector('.help-text');

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

	layout(responses) {
		// Add Response container to DOM.
		var response_container = document.querySelector('.responses');
		if (response_container) {
			response_container.remove();
		}
		var response_container_html = "<ul class='responses'></ul>"
		mainElement.insertAdjacentHTML('beforeend', response_container_html);
		// Redefine element after removal.
		response_container = document.querySelector('.responses');

		var response_number = Object.keys(responses).length

		// Position each response with a random position.
		for (var r in responses) {
			// Add content divs
			var response_html = "<li class='response' id='" + r + "'>" + responses[r] + "</li>";
			response_container.insertAdjacentHTML('afterbegin', response_html);
			var el = document.getElementById(r);
			word_cloud(el);
		}
	},

	getRandomIntInclusive(min, max) {
	  min = Math.ceil(min);
	  max = Math.floor(max);
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	word_cloud(el) {
		var mod = getRandomIntInclusive(1, 4)
		el.classList.add('size' + mod);
	},
	
	serialize(form, evt, targ) {
		// Source: http://stackoverflow.com/a/42494626/1867887
		if (typeof(form) !== 'object' && form.nodeName !== "FORM")
			return '';
		
		var field, query = '';
		
		var encode = function(field, name) {
			if (field.disabled) return '';
		
			return '&' + (name || field.name) + '=' +
				encodeURIComponent(field.value).replace(/%20/g,'+');
		}
		
		// Fields without names can't be serialized.
		var hasName = function(el) {
			return (el.name && el.name.length > 0)
		}
		
		var ignorableField = function(el, evt) {
			return ((el.type == 'file' || el.type == 'reset')
				|| ((el.type == 'submit' || el.type == 'button') && evt.target != el)
				|| ((el.type == 'checkbox' || el.type == 'radio') && !el.checked))
		}
		
		var parseMultiSelect = function(field) {
			var q = '';
			
			for (var j=field.options.length-1; j>=0; j--) {
				if (field.options[j].selected) {
					q += encode(field.options[j], field.name);
				}
			}
			
			return q;
		};
		
		for (var i = form.elements.length - 1; i >= 0; i--) {
			field = form.elements[i];
			
			if (!hasName(field) || field.value == '' || ignorableField(field, evt))
				continue;
			
			query += (field.type == 'select-multiple') ? parseMultiSelect(field)
				: encode(field);
		}
			
		return (query.length == 0) ? '' : query.substr(1);
	},

	handle_form(event) {
		event = event || window.event;
		event.preventDefault();
		var targ = event.target || event.srcElement || null;
		var form = targ;
		if (textInput.value.length > 20) {
			Alerts.make_alert("Try to keep responses under 20 chars. 😅", 'failure');
			return false
		}
		if (textInput.value.length == 0) {
			Alerts.make_alert("You've gotta actually have something to say. 😒", 'failure');
			return false
		}
		
// 		var data = new FormData(form);
		var data = ScottIs.serialize(form, event, targ);
		
		ScottIs.send_response(post_url, data);
		form.reset();
	},

	load_responses(url, limit = 100) {
		var req_url = url + '?limit=' + limit
		var httpRequest = new XMLHttpRequest();
		httpRequest.open('GET', req_url, true);
		httpRequest.send();
		httpRequest.onload = function(e) {
			response_json = JSON.parse(httpRequest.responseText);
			scottis.layout(response_json);
		};
	},

	send_response(url, data) {
		var httpRequest = new XMLHttpRequest();
		httpRequest.open('POST', url, true);
		httpRequest.onreadystatechange = function() {
			after_response(httpRequest)
		};
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		httpRequest.send(data)
	},

	after_response(httpRequest) {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === 200) {
				Alerts.make_alert("Success! Message posted. 👍", 'success');
				load_responses(get_url)
			} else if (httpRequest.status === 202) {
				Alerts.make_alert("Uh oh! That is a duplicate response. Try coming up with something new!", 'failure');
			} else {
				Alerts.make_alert("Uh small problem. Tell me about it. 😕", 'failure');
				console.log('There was a problem with the request.');
			}
		}
	},

	help_button(event) {
		event = event || window.event;
		event.preventDefault();
		helpButton.classList.toggle('visible');
		helpText.classList.toggle('hidden');
		helpText.classList.toggle('visible');
	},

	help_setup() {
		if (window.location.hash == '#help') {
			helpButton.classList.toggle('visible');
			helpText.classList.remove('hidden');
		}
	}
};

/* Client Actions */
try {
	boomsvgloader.load('/assets/images/icons/icon-sprite.svg');
} catch (e) {
	console.log(e)
}

ScottIs.load_responses(get_url);
responseForm.addEventListener('submit', ScottIs.handle_form);
ScottIs.help_setup();
helpButton.addEventListener('click', ScottIs.help_button);
