/* Vervangt inline event-handlers (onclick=, onmouseover=, ...) zodat de CSP geen
   'unsafe-inline' in script-src nodig heeft.
     data-s-<event>="this.style.x='y'; ..."  -> stijl via CSSOM (toegestaan onder CSP)
     data-a-<event>="functienaam"            -> roept window[functienaam] aan (this = element)
     data-args-<event>='["@this", 6]'        -> argumenten; @this, @event, @value worden ingevuld
   Ingebouwd: @stop (stopPropagation), @goto (location.href), @toggleMenu. */
(function () {
  'use strict';

  var EVENTS = ['click', 'change', 'submit', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousedown', 'focus', 'blur'];
  var STMT = /^\s*this(?:\.querySelector\('([^']+)'\))?\.style\.([A-Za-z]+)\s*=\s*'([^']*)'\s*$/;

  function runStyle(el, code) {
    code.split(';').forEach(function (part) {
      if (!part.trim()) return;
      var m = STMT.exec(part);
      if (!m) return;
      var target = m[1] ? el.querySelector(m[1]) : el;
      if (target) target.style[m[2]] = m[3];
    });
  }

  var BUILTIN = {
    '@stop': function (el, ev) { ev.stopPropagation(); },
    '@goto': function (el, ev, url) { window.location.href = url; },
    '@toggleMenu': function () {
      var m = document.getElementById('mobile-menu');
      if (m) m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    }
  };

  function fill(arg, el, ev) {
    if (arg === '@this') return el;
    if (arg === '@event') return ev;
    if (arg === '@value') return el.value;
    return arg;
  }

  function runAction(el, ev, name, rawArgs) {
    var args = rawArgs ? JSON.parse(rawArgs) : [];
    if (BUILTIN[name]) return BUILTIN[name].apply(null, [el, ev].concat(args));
    var fn = window[name];
    if (typeof fn !== 'function') return;
    return fn.apply(el, args.map(function (a) { return fill(a, el, ev); }));
  }

  function bind() {
    EVENTS.forEach(function (evt) {
      var nodes = document.querySelectorAll('[data-s-' + evt + '],[data-a-' + evt + ']');
      Array.prototype.forEach.call(nodes, function (el) {
        var style = el.getAttribute('data-s-' + evt);
        var action = el.getAttribute('data-a-' + evt);
        var args = el.getAttribute('data-args-' + evt);
        el.addEventListener(evt, function (ev) {
          if (style) runStyle(el, style);
          if (action) runAction(el, ev, action, args);
        });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
