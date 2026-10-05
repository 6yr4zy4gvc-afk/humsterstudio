/* =========================================================================
   build-standalone.js — собирает standalone.html из модульной версии.

   Что делает:
   1) прогоняет script.js на минимальном DOM-стабе и забирает готовую разметку
      секций (услуги, работы, стек, этапы), которую тот строит из CONFIG;
   2) встраивает в index.html стили, скрипт и фото фона (base64) — получается
      один самодостаточный файл;
   3) проверяет результат: скрипт и стили совпадают с исходниками побайтно,
      внешних ссылок нет.

   Запуск (из папки bio-site):
       node tools/build-standalone.js

   ВАЖНО про подстановку: используется функция-заменитель, а не строка.
   В строке замены у String.replace свои правила — "$$" превращается в "$",
   "$&" — в найденный текст. В script.js есть "$$" (хелпер querySelectorAll),
   поэтому обычная замена ломает код: страница открывается пустой.
   ========================================================================= */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var ROOT = path.join(__dirname, "..");
var read = function (p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); };
var sha = function (s) { return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12); };

/* ================= 1. Рендерим контент из CONFIG на DOM-стабе ================= */
function makeEl(attrs) {
  return {
    style: new Proxy({ setProperty: function () {} }, { set: function (t, k, v) { t[k] = v; return true; } }),
    children: [], textContent: "", innerHTML: "", value: "",
    _attrs: attrs || {}, _h: {},
    classList: { add: function () {}, remove: function () {}, toggle: function () { return true; }, contains: function () { return false; } },
    addEventListener: function () {}, removeEventListener: function () {},
    getAttribute: function (n) { return Object.prototype.hasOwnProperty.call(this._attrs, n) ? this._attrs[n] : null; },
    setAttribute: function () {},
    getBoundingClientRect: function () { return { top: 0, left: 0, right: 600, bottom: 400, width: 600, height: 400 }; },
    closest: function () { return null; }, contains: function () { return false; },
    querySelector: function (s) { return stub.q(s); },
    querySelectorAll: function (s) { return stub.qa(s); },
    appendChild: function (c) { this.children.push(c); return c; },
    remove: function () {}, cloneNode: function () { return makeEl(); }, select: function () {},
    parentNode: null, firstElementChild: null
  };
}

var containers = { services: makeEl(), works: makeEl(), skills: makeEl(), steps: makeEl() };

var stub = {
  q: function (sel) {
    var map = {
      "#services-grid": containers.services,
      "#works-grid": containers.works,
      "#skills-list": containers.skills,
      "#steps-list": containers.steps
    };
    if (sel === ".fx-toggle__text") return makeEl();
    if (["#contact-mail", "#contact-tg", "#contact-gh"].indexOf(sel) >= 0) return makeEl();
    return map[sel] || makeEl();
  },
  qa: function () { return []; }
};

global.window = {
  innerWidth: 1440, innerHeight: 900, scrollY: 0,
  matchMedia: function (q) { return { matches: /pointer: fine/.test(q) }; },
  addEventListener: function () {}, removeEventListener: function () {},
  scrollTo: function () {}, requestAnimationFrame: function () {},
  performance: { now: function () { return Date.now(); } },
  getComputedStyle: function () { return { getPropertyValue: function () { return ""; } }; }
};
global.document = {
  documentElement: makeEl(), body: makeEl(), readyState: "complete", hidden: false,
  addEventListener: function () {}, removeEventListener: function () {},
  querySelector: stub.q, querySelectorAll: stub.qa,
  createElement: function () { return makeEl(); }, execCommand: function () { return true; }
};
try {
  Object.defineProperty(global, "navigator", { value: { hardwareConcurrency: 8, maxTouchPoints: 0 }, writable: true, configurable: true });
} catch (e) {
  global.navigator = { hardwareConcurrency: 8, maxTouchPoints: 0 };
}
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.history = { replaceState: function () {} };
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.matchMedia = global.window.matchMedia;
global.performance = global.window.performance;
global.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {}; };
global.window.IntersectionObserver = global.IntersectionObserver;

var html = read("index.html");
var css = read("styles.css");
var js = read("script.js");

require(path.join(ROOT, "script.js"));

var FRAGMENTS = {
  services: containers.services.innerHTML,
  works: containers.works.innerHTML,
  skills: containers.skills.innerHTML,
  steps: containers.steps.innerHTML
};

/* ================= 2. Собираем файл ================= */
function insert(src, needle, replacement) {
  if (src.indexOf(needle) < 0) { console.log("НЕ НАЙДЕНО в разметке: " + needle); process.exit(1); }
  return src.replace(needle, function () { return replacement; });   // см. комментарий в шапке
}

function indent(str, spaces) {
  var pad = new Array(spaces + 1).join(" ");
  return str.split("\n").map(function (line) { return line ? pad + line : line; }).join("\n");
}

/* Все картинки из assets/ встраиваем как data-URI: файл должен быть один.
   Работает для любого числа картинок — новые фоны подхватятся сами. */
var inlined = 0;
css = css.replace(/url\("assets\/([^"]+)"\)/g, function (whole, file) {
  var full = path.join(ROOT, "assets", file);
  if (!fs.existsSync(full)) { console.log("НЕ НАЙДЕН файл ассета: " + file); process.exit(1); }
  var mime = /\.png$/i.test(file) ? "image/png" : (/\.webp$/i.test(file) ? "image/webp" : "image/jpeg");
  inlined++;
  return 'url("data:' + mime + ';base64,' + fs.readFileSync(full).toString("base64") + '")';
});
if (!inlined) { console.log("В CSS не нашлось ни одного assets/... — проверь пути"); process.exit(1); }

/* Картинки, подключённые прямо в разметке (логотип в шапке, иконка сайта),
   тоже встраиваем — иначе в однофайловой версии они бы не загрузились. */
html = html.replace(/(src|href)="assets\/([^"]+)"/g, function (whole, attr, file) {
  var full = path.join(ROOT, "assets", file);
  if (!fs.existsSync(full)) { console.log("НЕ НАЙДЕН файл ассета: " + file); process.exit(1); }
  var mime = /\.png$/i.test(file) ? "image/png" : (/\.webp$/i.test(file) ? "image/webp" : "image/jpeg");
  inlined++;
  return attr + '="data:' + mime + ';base64,' + fs.readFileSync(full).toString("base64") + '"';
});

html = insert(html, '<div class="cards" id="services-grid"></div>',
  '<div class="cards" id="services-grid">\n' + indent(FRAGMENTS.services, 10) + "\n        </div>");
html = insert(html, '<div class="works" id="works-grid" data-stagger></div>',
  '<div class="works" id="works-grid" data-stagger>\n' + indent(FRAGMENTS.works, 10) + "\n        </div>");
html = insert(html, '<div class="chips" id="skills-list"></div>',
  '<div class="chips" id="skills-list">\n' + indent(FRAGMENTS.skills, 14) + "\n            </div>");
html = insert(html, '<ol class="steps" id="steps-list" data-stagger></ol>',
  '<ol class="steps" id="steps-list" data-stagger>\n' + indent(FRAGMENTS.steps, 10) + "\n        </ol>");

html = insert(html, '  <link rel="stylesheet" href="styles.css" />',
  "  <!-- стили встроены: файл самодостаточный -->\n  <style>\n" + css + "\n  </style>");
html = insert(html, '  <script src="script.js"></script>',
  "  <!-- скрипт встроен: файл самодостаточный -->\n  <script>\n" + js + "\n  </script>");

html = insert(html, "</head>",
  "  <!--\n    standalone.html — весь сайт в одном файле.\n" +
  "    Модульная версия: index.html + styles.css + script.js + assets/.\n" +
  "    Собрано скриптом tools/build-standalone.js\n" +
  "  -->\n</head>");

var out = path.join(ROOT, "standalone.html");
fs.writeFileSync(out, html, "utf8");

/* ================= 3. Самопроверка сборки ================= */
var back = fs.readFileSync(out, "utf8");
var inlinedJs = back.match(/<!-- скрипт встроен[\s\S]*?<script>\n([\s\S]*?)\n  <\/script>/);
var inlinedCss = back.match(/<style>\n([\s\S]*?)\n  <\/style>/);
var jsInFile = inlinedJs ? inlinedJs[1] : "";

console.log("контент: услуги " + FRAGMENTS.services.length + ", работы " + FRAGMENTS.works.length +
  ", стек " + FRAGMENTS.skills.length + ", этапы " + FRAGMENTS.steps.length + " символов");
console.log("картинок встроено: " + inlined + " (data-URI)");
console.log("скрипт совпадает с script.js: " + (jsInFile === js ? "да" : "НЕТ"));
console.log("стили совпадают со styles.css: " + (inlinedCss && sha(inlinedCss[1]) === sha(css) ? "да" : "НЕТ"));
console.log("внешних ссылок на файлы: " +
  ((back.match(/(?:href|src)="(?!data:|#)[^"]*\.(?:css|js|jpg|png)"/g) || []).length) + " (должно быть 0)");
console.log("\"$$\" в скрипте внутри файла: " + (jsInFile.match(/\$\$/g) || []).length +
  " (в script.js: " + (js.match(/\$\$/g) || []).length + ")");
console.log("готово: standalone.html — " + (fs.statSync(out).size / 1024).toFixed(1) + " КБ");
