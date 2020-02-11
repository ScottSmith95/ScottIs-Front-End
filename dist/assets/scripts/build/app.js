/*! BoomSVGLoader 0.0.1 | http://boomtownroi.github.io/boomsvgloader/ | (c) 2015 BoomTown | MIT License */
!function(e,t){"function"==typeof define&&define.amd?define(["boomsvgloader"],t):"object"==typeof exports?module.exports=t():e.boomsvgloader=t()}(this,(function(){"use strict";return{load:function(e){var t=new XMLHttpRequest;t.open("GET",e,!0),t.send(),t.onload=function(e){var s=document.createElement("div");s.style.cssText="border: 0; clip: rect(0 0 0 0); height: 0; overflow: hidden; padding: 0; position: absolute; width: 0;",s.innerHTML=t.responseText,document.body.insertBefore(s,document.body.childNodes[0])}}}}));const api_version="1.4";let api_domain;api_domain=location.hostname.includes("dev")?"dev-api.scottsmith.is":"api.scottsmith.is";const get_url=`https://${api_domain}/v1.4/responses`,post_url=`https://${api_domain}/v1.4/responses`;let response_json;const mainElement=document.querySelector("main"),responseForm=document.querySelector(".input-form"),textInput=document.querySelector('.input-form input[type="text"]'),helpButton=document.querySelector("header .help"),helpText=document.querySelector(".help-text");class Alert{constructor(e,t="neutral",s=4e3){this.constructor.make_alert(e,t,s)}static make_alert(e,t="neutral",s=4e3){return new Promise(o=>{if(document.querySelector("[role=alert]")){const e=document.querySelector("[role=alert]").getAttribute("id").replace("alert-","");this.remove_alert(e,!0)}const r=this.create_alert_element(e,t),n=window.setTimeout(()=>{this.remove_alert(n),o()},s);r.setAttribute("id",`alert-${n}`),r.addEventListener("click",()=>{this.remove_alert(n),o()},!1)})}static create_alert_element(e,t){const s=document.createElement("div");s.setAttribute("role","alert"),s.setAttribute("aria-live","assertive"),s.classList.add("alert",t),s.style.cursor="pointer";const o=document.createElement("p");return o.textContent=e,s.appendChild(o),responseForm.insertAdjacentElement("afterend",s),s}static remove_alert(e,t=!1){window.clearTimeout(e);const s=document.getElementById(`alert-${e}`);s&&!1===t&&(s.classList.add("remove"),setTimeout(()=>{s.remove()},1e3)),s&&!0===t&&s.remove()}}const ScottIs={layout(e){let t=document.querySelector(".responses");t&&t.remove();const s=document.createElement("ul");s.classList.add("responses"),mainElement.insertAdjacentElement("beforeend",s),t=document.querySelector(".responses");for(let s in e)if(Object.prototype.hasOwnProperty.call(e,s)){const o=`<li class="response" id="${s}">${e[s]}</li>`;t.insertAdjacentHTML("afterbegin",o),this.word_cloud(document.getElementById(s))}},getRandomIntInclusive(e,t){const s=Math.ceil(e),o=Math.floor(t);return Math.floor(Math.random()*(o-s+1))+s},word_cloud(e){const t=this.getRandomIntInclusive(1,4);e.classList.add(`size-${t}`)},serialize:e=>new URLSearchParams(new FormData(e)).toString(),handle_form(e){if(e.preventDefault(),textInput.value.length>20)return Alert.make_alert("Try to keep responses under 20 chars. 😅","failure"),!1;if(0==textInput.value.length)return Alert.make_alert("You've gotta actually have something to say. 😒","failure"),!1;const t=ScottIs.serialize(responseForm);ScottIs.send_response(post_url,t),responseForm.reset()},load_responses(e,t=100){const s=`${e}?limit=${t}`,o=new XMLHttpRequest;o.open("GET",s,!0),o.send(),o.onload=()=>{response_json=JSON.parse(o.responseText),this.layout(response_json)}},send_response(e,t){const s=new XMLHttpRequest;s.open("POST",e,!0),s.onreadystatechange=()=>{this.after_response(s)},s.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8"),s.send(t)},after_response(e){e.readyState===XMLHttpRequest.DONE&&(200===e.status?(Alert.make_alert("Success! Message posted. 👍","success"),this.load_responses(get_url)):202===e.status?Alert.make_alert("Uh oh! That is a duplicate response. Try coming up with something new!","failure"):(Alert.make_alert("Uh small problem. Tell me about it. 😕","failure"),console.error("There was a problem with the request.")))},help_button(e){e.preventDefault(),helpButton.classList.toggle("visible"),helpText.classList.toggle("hidden"),helpText.classList.toggle("visible")},help_setup(){"#help"==window.location.hash&&(helpButton.classList.toggle("visible"),helpText.classList.remove("hidden"))}};try{boomsvgloader.load("/assets/images/icons/icon-sprite.svg")}catch(e){console.error(e)}ScottIs.load_responses(get_url),responseForm.addEventListener("submit",ScottIs.handle_form),ScottIs.help_setup(),helpButton.addEventListener("click",ScottIs.help_button);
//# sourceMappingURL=app.js.map