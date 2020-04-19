(function(){'use strict';
var a = document.querySelectorAll(".js-random-link-link[href]");
document.querySelector(".js-random-link").setAttribute("href", a[Math.floor(Math.random() * a.length)].getAttribute("href"));
}).call(this);