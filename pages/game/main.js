var getCookie = function (name) {
	var value = "; " + document.cookie;
	var parts = value.split("; " + name + "=");
	if (parts.length == 2) return parts.pop().split(";").shift();
};

var log = function () {
	function listen() {
		setTimeout(function () { alert("Hello"); }, 3000);
	};

	function add(message) {
		var eventlog = document.getElementById("eventlog");
		eventlog.innerHTML += "<li>" + message + "</li>";
		eventlog.scrollTop = eventlog.scrollHeight;
	}

	return {
		listen: listen,
		add: add
	};
}();

fetch('/nav').then(function (response) {
	response.text().then(function (text) {
		var nav = document.getElementById("nav");
		nav.innerHTML = text;
	});
}).catch(function (err) {
	console.warn('Something went wrong.', err);
}).then(function () {
	fetch('/login/result').then(function (response) {
		return response.json();
	}).then(function (data) {
		var btn = document.getElementById("loginbtn");
		var loggedout = typeof (data.user) == "undefined" || data.user == null;
		btn.innerHTML = loggedout ? "Login" : "Logout";
		btn.classList.add(loggedout ? "btn-success" : "btn-danger");
		btn.setAttribute("href", loggedout ? "/login" : "/logout");
		var label = document.getElementById("AccountName");
		label.innerHTML = loggedout ? "" : "Howdy " + data.username;
		var classicbtn = document.getElementById("btn-join-classic");
		if (loggedout) {
			classicbtn.classList.remove("active");
			classicbtn.classList.add("disabled");
			classicbtn.setAttribute("disabled", "");
		} else {
			classicbtn.classList.remove("disabled");
			classicbtn.classList.add("active");
			classicbtn.removeAttribute("disabled", "");
		}

		var notqueued = typeof (data.lobby) == "undefined" || data.lobby == null;
		classicbtn.classList.add(notqueued ? "btn-success" : "btn-danger");
		classicbtn.innerHTML = notqueued ? "Join Queue" : "Leave Queue";
	}).catch(function (err) {
		console.warn('Something went wrong.', err);
	});
});

document.addEventListener('click', function (event) {
	if (!event.target.matches('#btn-join-classic')) return;
	event.preventDefault();

	const op = event.target.classList.contains("btn-success") ? "join" : "leave";

	fetch('/lobby/classic/1/' + op, {
		method: 'POST'
	}).then(function (response) {
		return response.json();
	}).then(function (data) {
		console.log(data);

		var isundefined = typeof (data.id) == "undefined" || data.id == null;
		if (isundefined) {
			event.target.classList.remove("btn-danger");
			event.target.classList.add("btn-success");
			log.add("You joined the Queue");
		} else {
			event.target.classList.remove("btn-success");
			event.target.classList.add("btn-danger");
			log.add("You left the Queue");
		}

		event.target.innerHTML = isundefined ? "Join Queue" : "Leave Queue";
	});

}, false);