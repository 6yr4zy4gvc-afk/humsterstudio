/* =========================================================================
   bio-site — script.js
   Чистый ванильный JS: без библиотек, сборщиков и внешних шрифтов.
   Файл — один IIFE, внутри 11 нумерованных разделов (см. заголовки ниже).

   ЧТО ГДЕ:
   1  CONFIG      — весь контент сайта (имя, контакты, услуги, проекты, стек)
   3  render      — отрисовка контента из CONFIG в DOM
   5  smoothScroll— инерционный скролл: перехват колеса + lerp по кадрам
   6  frame()     — единственный requestAnimationFrame на всю страницу
   7  background  — параллакс фона, пылинки, вспышка от скорости
   9  cursor      — кастомный курсор (круг + кластер точек в центре)
   10 typewriter  — печать текста в консольной карточке

   ПРАВИЛА ПРОИЗВОДИТЕЛЬНОСТИ:
   • в кадре меняются только transform и opacity — их считает композитор;
   • запись в style идёт через setStyle() и только когда значение изменилось;
   • когда мышь и скролл стоят, кадр не делает ни одной записи в DOM;
   • бегущая строка, печать текста и кадры останавливаются вне экрана и во
     вкладке-фоне.
   ========================================================================= */
(function () {
  "use strict";

  /* =======================================================================
     1. CONFIG — правь только этот блок
     ======================================================================= */
  var CONFIG = {
    /* --- кто вы --- */
    name: "HumsterStudio",                      // название студии (шапка, hero, футер)
    status: "Берём новые проекты",              // строка-статус в hero
    availability: "Отвечаем в течение дня",

    /* --- команда: роли, которые показываются в панели справа --- */
    roles: [
      { title: "Frontend", text: "Вёрстка, интерфейсы, анимации, адаптив." },
      { title: "Backend", text: "Серверная логика, база данных, API и интеграции." },
      { title: "Десктоп", text: "Программы для Windows: утилиты, окна, работа с файлами." },
      { title: "Дизайн", text: "Макеты, типографика, иконки и UI-кит." },
      { title: "QA и поддержка", text: "Тесты, приёмка и доработки после релиза." }
    ],

    /* --- контакты: value показывается на сайте, url — куда ведёт --- */
    contacts: {
      email: { value: "humsterstudio@bk.ru", url: "mailto:humsterstudio@bk.ru" },
      telegram: { value: "@HumsterStudio", url: "https://t.me/HumsterStudio" },
      github: { value: "github.com/pheIsn", url: "https://github.com/pheIsn" }
    },

    /* --- услуги --- */
    services: [
      {
        title: "Сайты и лендинги",
        text: "Страница под одну задачу: продаёт, собирает заявки, объясняет продукт.",
        list: ["Структура и текст под цель", "Адаптив под телефон", "Формы и заявки"],
        price: "Срок: от 3 дней"
      },
      {
        title: "Интернет-магазины и веб-приложения",
        text: "Каталог, корзина, оплата, личный кабинет, админка для товаров.",
        list: ["Каталог и фильтры", "Оплата и доставка", "Панель управления"],
        price: "Срок: от 2 недель"
      },
      {
        title: "Программы для ПК",
        text: "Десктопные приложения для Windows: утилиты, окна, работа с файлами и базой.",
        list: ["Сборка в .exe", "Локальная база данных", "Автозапуск и трей"],
        price: "Срок: от 5 дней"
      },
      {
        title: "Автоматизация рутины",
        text: "Скрипты, парсеры, боты и отчёты — то, что раньше делалось руками.",
        list: ["Сбор данных", "Отчёты в Excel", "Интеграции и API"],
        price: "Срок: от 2 дней"
      },
      {
        title: "Доработка и поддержка",
        text: "Правим чужой код и продолжаем свой: новые блоки, багфиксы, ускорение.",
        list: ["Разбор чужого проекта", "Точечные доработки", "Регулярная поддержка"],
        price: "Оплата по задаче"
      },
      {
        title: "Вёрстка и дизайн",
        text: "Аккуратная вёрстка по макету или дизайн с нуля, если макета нет.",
        list: ["Figma → код", "Пиксель в пиксель", "Анимации и плавность"],
        price: "Срок: от 2 дней"
      }
    ],

    /* --- проекты: ссылки добавим позже ---
       url: null  → карточка с бейджем «скоро»
       url: "https://..." → живая ссылка                                */
    projects: [
      {
        title: "Проект #1 — сайт",
        text: "Коротко: что за проект, какая задача была и что получилось.",
        tags: ["Сайт", "Адаптив"],
        year: "2025",
        url: null
      },
      {
        title: "Проект #2 — веб-приложение",
        text: "Коротко: функционал, для кого, какой результат дал.",
        tags: ["Web App", "API"],
        year: "2025",
        url: null
      },
      {
        title: "Проект #3 — программа для ПК",
        text: "Коротко: что автоматизирует и почему это было нужно.",
        tags: ["Windows", ".exe"],
        year: "2024",
        url: null
      },
      {
        title: "Проект #4 — доработка",
        text: "Коротко: что было до и что стало после твоей работы.",
        tags: ["Поддержка", "Рефакторинг"],
        year: "2024",
        url: null
      }
    ],

    /* --- стек (поправь под себя) --- */
    skills: [
      "HTML / CSS", "JavaScript", "React", "Node.js",
      "Python", "C# / .NET", "SQL", "Git", "Electron", "REST API"
    ],

    /* --- этапы работы --- */
    steps: [
      { title: "Бриф", text: "Обсуждаем задачу, цель и то, что точно должно работать.", meta: "15–30 минут" },
      { title: "Оценка и сроки", text: "Присылаем план, этапы и точный срок сдачи.", meta: "1 день" },
      { title: "Разработка", text: "Делаем по этапам, показываем промежуточный результат.", meta: "по договорённости" },
      { title: "Сдача и поддержка", text: "Отдаём проект с инструкцией и остаёмся на связи.", meta: "после релиза" }
    ],

    /* --- текст в консольной карточке hero --- */
    consoleLines: [
      { text: "$ whoami", cls: "cm" },
      { text: "humsterstudio · команда разработчиков", cls: "k" },
      { text: "$ status", cls: "cm" },
      { text: "дедлайны соблюдаем ✓", cls: "k" },
      { text: "$ start --project \"твоя идея\"", cls: "cm" }
    ]
  };

  /* =======================================================================
     2. Утилиты
     ======================================================================= */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, min, max) { return v < min ? min : (v > max ? max : v); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  /* «тонкий» указатель = мышь/трекпад. hover не требуем: на гибридных ноутбуках
     с тачскрином он иногда рапортует hover: none, и курсор молча отключался */
  var finePointer = window.matchMedia("(pointer: fine)").matches ||
                    window.matchMedia("(any-pointer: fine)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches && !finePointer;

  /* Слабые машины: меньше пылинок, без блика. navigator.deviceMemory есть не везде,
     поэтому смотрим ещё и на число ядер. */
  var liteMode = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                 (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                 isTouch;

  /* ЭФФЕКТЫ: курсор, стретч, плавный скролл, анимации фона.
     Включены по умолчанию — НЕ зависим от системной настройки «уменьшить движение»
     (раньше именно она глушила всё). Управляются кнопкой внизу справа. */
  var FX = {
    on: (function () {
      try { return localStorage.getItem("bio:fx") !== "0"; } catch (e) { return true; }
    })()
  };

  /* Запись в style только когда значение реально изменилось.
     Иначе ~20 присваиваний в кадр заставляют браузер пересчитывать стили впустую. */
  function setStyle(el, prop, value) {
    var cache = el.__styleCache || (el.__styleCache = {});
    if (cache[prop] === value) return;
    cache[prop] = value;
    el.style[prop] = value;
  }

  /* высоту документа кэшируем: читать scrollHeight каждый кадр = лишний reflow */
  var maxCache = 0;
  var measureMax = function () {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  };
  var maxScroll = function () { return maxCache; };
  var refreshMax = function () {
    maxCache = measureMax();
    scroll.target = clamp(scroll.target, 0, maxCache);
  };

  /* =======================================================================
     3. Рендер контента из CONFIG
     ======================================================================= */
  function renderContent() {
    /* подстановки name / status / год */
    $$("[data-fill]").forEach(function (el) {
      var key = el.getAttribute("data-fill");
      if (key === "year") { el.textContent = new Date().getFullYear(); return; }
      /* у контактов своя структура (value + url) — их ставит блок ниже */
      if (CONFIG.contacts[key]) return;
      if (CONFIG[key]) el.textContent = CONFIG[key];
    });

    /* контакты: подпись берём из value, ссылку — из url */
    var c = CONFIG.contacts;
    [
      ["#contact-mail", c.email],
      ["#contact-tg", c.telegram],
      ["#contact-gh", c.github]
    ].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      var value = el.querySelector(".contact__value");
      if (value) value.textContent = pair[1].value;
      el.setAttribute("href", pair[1].url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });

    /* услуги */
    var servicesGrid = $("#services-grid");
    if (servicesGrid) {
      servicesGrid.innerHTML = CONFIG.services.map(function (s, i) {
        return '' +
          '<article class="card reveal reveal--card" data-spotlight data-tilt>' +
            /* стретч — на внутреннем слое, внешний отдан .reveal и линиям */
            '<div class="card__body" data-stretch-soft>' +
              '<span class="card__num">' + String(i + 1).padStart(2, "0") + '</span>' +
              '<h3 class="card__title">' + esc(s.title) + '</h3>' +
              '<p class="card__text">' + esc(s.text) + '</p>' +
              '<ul class="card__list">' + s.list.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + '</ul>' +
              '<p class="card__price"><b>' + esc(s.price) + '</b></p>' +
            '</div>' +
          '</article>';
      }).join("");
    }

    /* работы */
    var worksGrid = $("#works-grid");
    if (worksGrid) {
      worksGrid.innerHTML = CONFIG.projects.map(function (p) {
        var live = !!p.url;
        return '' +
          '<article class="work reveal reveal--card' + (live ? "" : " work--empty") + '" data-spotlight data-tilt>' +
            /* стретч живёт на внутреннем слое, чтобы не спорить с transform у .reveal */
            '<div class="work__body" data-stretch-soft>' +
              '<div class="work__top">' +
                (live
                  ? '<span class="badge">готово</span>'
                  : '<span class="badge badge--soft">ссылка скоро</span>') +
                '<span class="work__year">' + esc(p.year || "") + '</span>' +
              '</div>' +
              '<h3 class="work__title">' + esc(p.title) + '</h3>' +
              '<p class="work__text">' + esc(p.text) + '</p>' +
              '<div class="work__tags">' + (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + '</div>' +
              (live
                ? '<a class="work__link" href="' + esc(p.url) + '" target="_blank" rel="noopener">Открыть проект <i>↗</i></a>'
                : '<span class="work__link">Ссылка появится позже <i>•</i></span>') +
            '</div>' +
          '</article>';
      }).join("");
    }

    /* роли в команде */
    var rolesList = $("#roles-list");
    if (rolesList) {
      rolesList.innerHTML = CONFIG.roles.map(function (r) {
        return '<li class="role reveal reveal--card" data-tilt><b>' + esc(r.title) + '</b><span>' + esc(r.text) + '</span></li>';
      }).join("");
    }

    /* стек: каждый чип появляется своим шагом */
    var skills = $("#skills-list");
    if (skills) {
      skills.innerHTML = CONFIG.skills.map(function (s, i) {
        return '<span class="reveal reveal--scale" style="--delay:' + (i * 35) + 'ms">' + esc(s) + "</span>";
      }).join("");
    }

    /* этапы */
    var steps = $("#steps-list");
    if (steps) {
      steps.innerHTML = CONFIG.steps.map(function (s, i) {
        return '' +
          '<li class="step reveal reveal--card" data-spotlight data-tilt>' +
            '<div class="step__body" data-stretch-soft>' +
              '<span class="step__num">0' + (i + 1) + '</span>' +
              '<h3 class="step__title">' + esc(s.title) + '</h3>' +
              '<p class="step__text">' + esc(s.text) + '</p>' +
              '<p class="step__meta">' + esc(s.meta) + '</p>' +
            '</div>' +
          '</li>';
      }).join("");
    }
  }

  /* =======================================================================
     4. Появление блоков при прокрутке (+ каскад)
     ======================================================================= */
  function initReveal() {
    var items = $$(".reveal");

    /* каскад внутри контейнеров data-stagger и в сетках карточек */
    var groups = $$("[data-stagger], .cards, .works, .contact__grid, .steps, .principles");
    groups.forEach(function (group) {
      $$(".reveal", group).forEach(function (el, i) {
        if (!el.style.getPropertyValue("--delay")) {
          el.style.setProperty("--delay", (i * 55) + "ms");
        }
      });
    });

    if (!FX.on || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        io.unobserve(el);
        /* Каскадная задержка нужна только на входе. Если оставить её навсегда,
           она тормозила бы и hover-анимации карточки — поэтому снимаем. */
        setTimeout(function () { el.style.setProperty("--delay", "0ms"); }, 1400);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================================
     5. Плавный скролл (свой «lenis»): колесо → инерционное движение
     ======================================================================= */
  var now = function () {
    return window.performance && performance.now ? performance.now() : Date.now();
  };

  var scroll = {
    on: false,
    target: window.scrollY,
    current: window.scrollY,
    written: window.scrollY,   // что мы сами записали через scrollTo
    lastY: window.scrollY,
    vel: 0,          // мгновенная скорость (px/кадр)
    smoothVel: 0,    // сглаженная скорость — от неё зависят стретч-эффекты
    ease: 0.24,      // пока колесо крутят — догоняем быстро
    settle: 0.55,    // колесо отпустили — доводим почти сразу, без «долгого доезда»
    maxStep: 150,    // не больше 150 px за кадр, чтобы не было рывков
    gain: 1.15,      // сколько пикселей на один «щелчок» колеса
    lastWheel: -1e9
  };

  /* Единственное место, где мы двигаем страницу сами: запоминаем значение,
     чтобы отличить свой скролл от чужого (клавиатура, скроллбар, якорь). */
  function writeScroll(v) {
    scroll.written = v;
    window.scrollTo(0, v);
  }

  /* Если страницу сдвинули не мы — подхватываем её позицию как новую точку отсчёта.
     Без этого первый щелчок колеса после прокрутки клавиатурой пропадал. */
  function syncFromPage() {
    var y = window.scrollY;
    if (Math.abs(y - scroll.written) > 2) {
      scroll.current = scroll.target = scroll.written = y;
    }
  }

  function syncScrollMode() {
    scroll.on = !!(FX.on && finePointer && !isTouch);
    if (!scroll.on) {
      scroll.target = scroll.current = scroll.written = scroll.lastY = window.scrollY;
    }
  }

  function initSmoothScroll() {
    syncScrollMode();

    window.addEventListener("wheel", function (e) {
      if (!scroll.on) return;                                    // эффекты выключены — нативный скролл
      if (e.ctrlKey || e.metaKey) return;                        // не мешаем зуму
      if (e.target.closest && e.target.closest("[data-scrollable]")) return; // внутренние скроллы
      e.preventDefault();

      syncFromPage();                                            // подхватить чужой скролл
      var unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1);
      scroll.lastWheel = now();
      scroll.target = clamp(scroll.target + e.deltaY * unit * scroll.gain, 0, maxScroll());

      /* не даём цели убежать далеко вперёд: иначе после остановки
         страница продолжает ехать, и прокрутка кажется бесконечной */
      var maxLag = window.innerHeight * 0.7;
      if (scroll.target - scroll.current > maxLag) scroll.target = scroll.current + maxLag;
      if (scroll.current - scroll.target > maxLag) scroll.target = scroll.current - maxLag;
    }, { passive: false });
  }

  function scrollToY(y, immediate) {
    var to = clamp(y, 0, maxScroll());
    if (!scroll.on || immediate) {
      writeScroll(to);
      scroll.target = scroll.current = scroll.lastY = to;
      return;
    }
    /* переход по якорю: короткий плавный проезд, без ограничения отставания */
    scroll.lastWheel = now() - 200;
    scroll.target = to;
    if (Math.abs(scroll.current - window.scrollY) > 4) scroll.current = window.scrollY;
  }

  /* якоря — плавный переход */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var el = id === "#top" ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var y = id === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 70;
      scrollToY(y);
      history.replaceState(null, "", id);
    });
  }

  /* =======================================================================
     6. Главный кадр: скролл, прогресс, стретч, бегущая строка
     ======================================================================= */
  var stretchEls = [];
  var softEls = [];
  var marquee = null;
  var progressBar = null;
  var frameCounter = 0;
  var slides = [];          // секции с полоской прогресса

  /* Геометрия секций нужна для полосок прогресса. Считаем её редко
     (старт, ресайз, раз в секунду), а в кадре только читаем числа —
     иначе getBoundingClientRect каждый кадр = лишний reflow. */
  function measureSlides() {
    slides = $$("[data-slide]").map(function (sec) {
      var r = sec.getBoundingClientRect();
      return {
        sec: sec,
        bar: $(".section__index-bar", sec),
        top: r.top + window.scrollY,
        height: r.height
      };
    });
  }

  function initFrameParts() {
    stretchEls = $$("[data-stretch]");
    softEls = $$("[data-stretch-soft]");
    progressBar = $(".progress__bar");
    measureSlides();

    /* бегущая строка: клонируем группу и двигаем вручную.
       Анимация идёт только пока строка на экране — иначе это вечный расход CPU. */
    var track = $("[data-marquee-track]");
    if (track) {
      var group = track.firstElementChild;
      if (group) {
        var groupW = group.getBoundingClientRect().width || 1;
        var need = Math.ceil((window.innerWidth * 2.2) / groupW) + 1;
        for (var i = 0; i < need; i++) track.appendChild(group.cloneNode(true));
        marquee = { track: track, offset: 0, width: groupW, visible: true };

        var host = track.parentNode;
        if (host && "IntersectionObserver" in window) {
          marquee.visible = false;
          new IntersectionObserver(function (entries) {
            marquee.visible = entries[0].isIntersecting;
          }, { rootMargin: "120px 0px" }).observe(host);
        }
      }
    }
    window.addEventListener("resize", function () {
      refreshMax();
      measureSlides();
      if (!marquee) return;
      var g = marquee.track.firstElementChild;
      var w = g.getBoundingClientRect().width || 1;
      marquee.width = w;
      marquee.offset = marquee.offset % w;
    });
  }

  function frame() {
    var y = window.scrollY;

    /* раз в секунду мягко пересчитываем высоту страницы и геометрию секций */
    if (++frameCounter % 60 === 0) { refreshMax(); measureSlides(); }

    /* --- скролл --- */
    if (scroll.on) {
      /* Раньше здесь сравнивалось «старое y» с «новым current», и на каждом кадре
         цель сбрасывалась — страница проезжала в разы меньше, чем давал щелчок колеса. */
      syncFromPage();

      var lag = scroll.target - scroll.current;
      if (Math.abs(lag) > 1) {
        /* пока колесо крутят — обычная скорость догона,
           как только отпустили — доводим быстро и не «едем» дальше */
        var idle = now() - scroll.lastWheel;
        var stepPx = lag * (idle > 90 ? scroll.settle : scroll.ease);
        if (stepPx > scroll.maxStep) stepPx = scroll.maxStep;
        if (stepPx < -scroll.maxStep) stepPx = -scroll.maxStep;
        scroll.current += stepPx;
        writeScroll(scroll.current);
      } else if (lag !== 0) {
        scroll.current = scroll.target;
        writeScroll(scroll.current);
      }
    } else {
      scroll.current = scroll.target = y;
    }

    /* --- скорость прокрутки --- */
    var raw = y - scroll.lastY;
    scroll.lastY = y;
    scroll.vel = raw;
    scroll.smoothVel = lerp(scroll.smoothVel, raw, 0.2);
    if (Math.abs(scroll.smoothVel) < 0.02) scroll.smoothVel = 0;

    var n = clamp(scroll.smoothVel / 60, -1, 1);   // нормализованная скорость
    var abs = Math.abs(n);

    /* --- стретч: чем быстрее крутишь, тем сильнее тянет.
       Заголовки тянутся заметно (по вертикали, с подкосом по направлению),
       карточки, панели и консоль — мягко, чтобы не рябило. --- */
    if (FX.on) {
      var t1 = abs > 0.01
        ? "scaleY(" + (1 + abs * 0.26).toFixed(3) + ") scaleX(" + (1 - abs * 0.07).toFixed(3) + ") skewY(" + (n * 2.4).toFixed(2) + "deg)"
        : "";
      for (var i = 0; i < stretchEls.length; i++) setStyle(stretchEls[i], "transform", t1);
      var t2 = abs > 0.01 ? "scaleY(" + (1 + abs * 0.08).toFixed(3) + ")" : "";
      for (var j = 0; j < softEls.length; j++) setStyle(softEls[j], "transform", t2);
    }

    /* --- живой фон: параллакс от скролла, реакция на мышь и на скорость --- */
    updateBackground(n);

    /* --- параллакс слоёв hero и наклон карточек --- */
    updateParallax();
    updateTilts();

    /* --- прогресс страницы --- */
    if (progressBar && maxCache) {
      setStyle(progressBar, "transform", "scaleX(" + clamp(y / maxCache, 0, 1).toFixed(4) + ")");
    }

    /* --- полоска у номера секции: заполняется, пока идёт слайд --- */
    if (FX.on) {
      var vh = window.innerHeight;
      for (var s = 0; s < slides.length; s++) {
        var sl = slides[s];
        if (!sl.bar || !sl.height) continue;
        var p = clamp((y - sl.top + vh) / (sl.height + vh), 0, 1);
        setStyle(sl.bar, "transform", "scaleX(" + p.toFixed(2) + ")");
      }
    }

    /* --- бегущая строка: работает, только когда видна на экране --- */
    if (marquee && marquee.visible && FX.on) {
      marquee.offset += 0.6 + scroll.smoothVel * 0.55;
      if (marquee.offset >= marquee.width) marquee.offset -= marquee.width;
      if (marquee.offset < 0) marquee.offset += marquee.width;
      setStyle(marquee.track, "transform", "translate3d(" + (-marquee.offset).toFixed(1) + "px,0,0)");
    }

    /* --- курсор --- */
    updateCursor();

    if (!document.hidden) requestAnimationFrame(frame);
  }

  /* =======================================================================
     7. Живой фон: параллакс, реакция на мышь, пылинки в луче
     ======================================================================= */
  var bg = { el: null, flash: null, x: 0, y: 0 };

  function initBackground() {
    bg.el = $("[data-bg-parallax]");
    bg.flash = $("[data-bg-flash]");

    /* пылинки: 16 штук, параметры задаём инлайном.
       На слабых машинах (liteMode) пылинок нет вовсе — там фон статичен. */
    var holder = $("[data-particles]");
    if (holder && FX.on && !liteMode && window.innerWidth > 700) {
      var count = 16;
      var html = "";
      for (var i = 0; i < count; i++) {
        var dur = (18 + Math.random() * 20).toFixed(1);
        var tw = (3 + Math.random() * 4).toFixed(1);
        html += '<span style="' +
          "left:" + (Math.random() * 100).toFixed(2) + "%;" +
          "animation-duration:" + dur + "s," + tw + "s;" +
          "animation-delay:" + (-Math.random() * 30).toFixed(1) + "s," + (Math.random() * 5).toFixed(1) + "s;" +
          "--dx:" + (Math.random() * 70 - 35).toFixed(0) + "px;" +
          "--sc:" + (0.5 + Math.random() * 1.2).toFixed(2) + ";" +
          "--po:" + (0.25 + Math.random() * 0.55).toFixed(2) +
          '"></span>';
      }
      holder.innerHTML = html;
    }
  }

  function updateBackground(n) {
    if (!bg.el || !FX.on) return;
    var abs = Math.abs(n || 0);

    /* вспышка от скорости: меняем только opacity — самый дешёвый кадр.
       Значение квантуем, чтобы не писать в стиль каждую миллисекунду.
       Держим слабой: при прежних 0.9 это читалось как второй фон поверх картинки. */
    if (bg.flash) {
      var flash = Math.round(clamp(abs * 0.32, 0, 1) * 20) / 20;
      setStyle(bg.flash, "opacity", String(flash));
    }

    var w = window.innerWidth, h = window.innerHeight;
    var mx = cur.on ? (cur.x - w / 2) / w : 0;
    var my = cur.on ? (cur.y - h / 2) / h : 0;
    var p = maxCache ? clamp(window.scrollY / maxCache, 0, 1) : 0;

    /* цель: уехать вбок за мышью и вверх по мере прокрутки */
    var tx = -mx * 2.6;
    var ty = -(p * 5.5) - my * 1.8;

    bg.x = lerp(bg.x, tx, 0.12);
    bg.y = lerp(bg.y, ty, 0.12);

    setStyle(bg.el, "transform",
      "translate3d(" + bg.x.toFixed(3) + "%," + bg.y.toFixed(3) + "%,0) scale(" +
      (1 + abs * 0.03).toFixed(3) + "," + (1 + abs * 0.06).toFixed(3) + ")");
  }

  /* =======================================================================
     8. Параллакс слоёв hero + 3D-наклон карточек за курсором
     ======================================================================= */
  var parallaxEls = [];
  var tilts = [];
  var TILT_DEG = 5;          // максимальный подворот карточки, градусы

  function initParallax() {
    parallaxEls = $$("[data-parallax]").map(function (el) {
      return { el: el, k: parseFloat(el.getAttribute("data-parallax")) || 0.1, y: 0 };
    });
  }

  /* Наклон вешаем и на карточки ([data-tilt]), и на консоль в hero.
     Два подворота (по X и по Y) собираются в одну ось свойства rotate —
     оно независимое и не конфликтует с transform от .reveal и стретча. */
  function initTilt() {
    if (!finePointer || isTouch || !FX.on) return;

    var items = $$("[data-tilt]").map(function (el) { return { el: el, host: el }; });

    var heroCard = $(".hero__card");
    var heroInner = heroCard && $(".console", heroCard);
    if (heroInner) items.push({ el: heroInner, host: heroCard });

    tilts = items.map(function (item) {
      var t = { el: item.el, host: item.host, rect: null, rx: 0, ry: 0, trx: 0, try_: 0, active: false };

      t.host.addEventListener("mouseenter", function () {
        t.active = true;
        t.rect = t.host.getBoundingClientRect();
      });
      t.host.addEventListener("mousemove", function (e) {
        if (!t.rect) t.rect = t.host.getBoundingClientRect();
        var dx = (e.clientX - (t.rect.left + t.rect.width / 2)) / (t.rect.width / 2);
        var dy = (e.clientY - (t.rect.top + t.rect.height / 2)) / (t.rect.height / 2);
        t.try_ = clamp(dx, -1, 1) * TILT_DEG;    // подворот вокруг вертикальной оси
        t.trx = clamp(dy, -1, 1) * -TILT_DEG;    // и вокруг горизонтальной
      });
      t.host.addEventListener("mouseleave", function () {
        t.active = false;
        t.rect = null;
        t.trx = 0;
        t.try_ = 0;
      });
      return t;
    });
  }

  function updateParallax() {
    if (FX.on) {
      for (var i = 0; i < parallaxEls.length; i++) {
        var p = parallaxEls[i];
        p.y = lerp(p.y, -window.scrollY * p.k, 0.2);
        setStyle(p.el, "transform", "translate3d(0," + p.y.toFixed(1) + "px,0)");
      }
    }
  }

  function updateTilts() {
    for (var i = 0; i < tilts.length; i++) {
      var t = tilts[i];
      t.rx = lerp(t.rx, t.trx, 0.3);
      t.ry = lerp(t.ry, t.try_, 0.3);

      var len = Math.sqrt(t.rx * t.rx + t.ry * t.ry);
      if (len < 0.05 && !t.active) {
        setStyle(t.el, "rotate", "");        // карточка вернулась — снимаем свойство
        continue;
      }
      if (len < 0.001) len = 0.001;
      setStyle(t.el, "rotate",
        (t.rx / len).toFixed(3) + " " + (t.ry / len).toFixed(3) + " 0 " + len.toFixed(2) + "deg");
    }
  }

  /* =======================================================================
     9. Кастомный курсор: круг + точки в центре (динамика от скорости)
     ======================================================================= */
  var cur = {
    on: false,
    x: window.innerWidth / 2, y: window.innerHeight / 2,
    px: window.innerWidth / 2, py: window.innerHeight / 2,
    ringX: window.innerWidth / 2, ringY: window.innerHeight / 2,
    dotX: window.innerWidth / 2, dotY: window.innerHeight / 2,
    scale: 1, targetScale: 1,
    angle: 0, energy: 0, hover: false, still: 0,
    sats: []
  };

  function initCursor() {
    var root = $(".cursor");
    if (!root) return;

    var sats = $$(".cursor__sat", root);
    cur.el = {
      root: root,
      ring: $(".cursor__ring", root),
      dot: $(".cursor__dot", root),
      label: $(".cursor__label", root)
    };
    cur.sats = sats.map(function (el, i) {
      return { el: el, x: cur.x, y: cur.y, k: 0.2 + i * 0.04, phase: (Math.PI * 2 / sats.length) * i, trail: 0.5 + i * 0.12 };
    });

    document.addEventListener("mousemove", function (e) {
      cur.x = e.clientX;
      cur.y = e.clientY;
      if (!FX.on || isTouch) return;
      if (!cur.on) {                      // включаемся только когда мышь реально двинулась
        cur.on = true;
        document.documentElement.classList.add("cursor-custom");
      }
      cur.el.root.classList.add("is-on");
    }, { passive: true });

    document.addEventListener("mouseleave", function () { cur.el.root.classList.remove("is-on"); });
    document.addEventListener("mouseenter", function () { if (cur.on) cur.el.root.classList.add("is-on"); });

    /* состояния: над ссылкой / кнопкой / элементом с data-cursor */
    document.addEventListener("mouseover", function (e) {
      if (!cur.on) return;
      var t = e.target.closest && e.target.closest("a, button, [data-cursor]");
      if (!t) return;
      var label = t.getAttribute("data-cursor-label") || "";
      if (label) { cur.el.label.textContent = label; cur.el.root.classList.add("has-label"); }
      cur.hover = true;
      cur.targetScale = 1.85;
      cur.el.root.classList.add("is-hover");
    });

    document.addEventListener("mouseout", function (e) {
      if (!cur.on) return;
      var t = e.target.closest && e.target.closest("a, button, [data-cursor]");
      if (!t) return;
      if (t.contains(e.relatedTarget)) return;
      cur.hover = false;
      cur.targetScale = 1;
      cur.el.root.classList.remove("is-hover", "has-label");
    });

    /* клик: сжатие круга + волна */
    document.addEventListener("mousedown", function () {
      if (!cur.on) return;
      cur.el.root.classList.add("is-down");
      cur.targetScale = 0.78;
    });
    document.addEventListener("mouseup", function () {
      if (!cur.on) return;
      cur.el.root.classList.remove("is-down");
      cur.targetScale = cur.hover ? 1.85 : 1;
      pulse();
    });
    document.addEventListener("click", function () { if (cur.on) pulse(); });

    function pulse() {
      var p = document.createElement("span");
      p.className = "cursor__pulse";
      /* позиционируем через left/top: transform занят CSS-анимацией волны */
      p.style.left = cur.x + "px";
      p.style.top = cur.y + "px";
      document.body.appendChild(p);
      setTimeout(function () { p.remove(); }, 620);
    }
  }

  function updateCursor() {
    if (!cur.on) return;

    /* скорость указателя → «энергия» кластера точек */
    var dx = cur.x - cur.px;
    var dy = cur.y - cur.py;
    var speed = Math.min(Math.hypot(dx, dy), 90);
    cur.px = cur.x; cur.py = cur.y;
    cur.energy = lerp(cur.energy, speed, 0.22);
    if (cur.energy < 0.01) cur.energy = 0;
    cur.still = (dx === 0 && dy === 0) ? cur.still + 1 : 0;

    /* круг идёт с задержкой, точка — почти сразу */
    cur.ringX = lerp(cur.ringX, cur.x, 0.22);
    cur.ringY = lerp(cur.ringY, cur.y, 0.22);
    cur.dotX = lerp(cur.dotX, cur.x, 0.52);
    cur.dotY = lerp(cur.dotY, cur.y, 0.52);
    cur.scale = lerp(cur.scale, cur.targetScale, 0.2);

    /* мышь стоит полторы секунды и всё успокоилось — не считаем кадр зря */
    if (cur.still > 90 && !cur.energy && Math.abs(cur.scale - cur.targetScale) < 0.002) return;

    /* орбита точек: спокойно вращается, при движении ускоряется и расширяется */
    cur.angle += 0.006 + cur.energy * 0.0032;
    var radius = 3.6 + cur.energy * 0.42;                  // радиус кластера вокруг точки
    var stretch = 1 + Math.min(cur.energy / 90, 1) * 0.75; // вытягивание по ходу движения
    var dir = speed > 0.4 ? Math.atan2(dy, dx) : 0;

    setStyle(cur.el.ring, "transform",
      "translate3d(" + cur.ringX.toFixed(1) + "px," + cur.ringY.toFixed(1) + "px,0) scale(" + cur.scale.toFixed(3) + ")");
    setStyle(cur.el.dot, "transform",
      "translate3d(" + cur.dotX.toFixed(1) + "px," + cur.dotY.toFixed(1) + "px,0) scale(" + (1 + cur.energy * 0.012).toFixed(3) + ")");
    setStyle(cur.el.label, "transform",
      "translate3d(" + cur.ringX.toFixed(1) + "px," + (cur.ringY - 46).toFixed(1) + "px,0) translate(-50%,-50%)");

    var op = lerp(0.35, 1, Math.min(cur.energy / 6, 1)).toFixed(2);
    for (var i = 0; i < cur.sats.length; i++) {
      var s = cur.sats[i];
      var a = cur.angle * (1 + i * 0.22) + s.phase;
      var ox = Math.cos(a) * radius * (1 - i * 0.05);
      var oy = Math.sin(a) * radius * (1 - i * 0.05);

      /* вытягивание орбиты вдоль направления движения + шлейф позади */
      if (cur.energy > 0.6) {
        var cs = Math.cos(dir), sn = Math.sin(dir);
        var rx = (ox * cs - oy * sn) * stretch;
        var ry = (ox * sn + oy * cs) / (1 + (stretch - 1) * 0.5);
        ox = rx - (-dx) * s.trail * 0.22;
        oy = ry - (-dy) * s.trail * 0.22;
      }

      s.x = lerp(s.x, cur.dotX + ox, s.k);
      s.y = lerp(s.y, cur.dotY + oy, s.k);
      setStyle(s.el, "transform", "translate3d(" + s.x.toFixed(1) + "px," + s.y.toFixed(1) + "px,0)");
      setStyle(s.el, "opacity", op);
    }
  }

  /* =======================================================================
     10. Мелочи: хедер, меню, spotlight карточек, копирование, печать текста
     ======================================================================= */
  function initHeader() {
    var header = $(".header");
    var burger = $(".burger");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger) {
      burger.addEventListener("click", function () {
        var open = header.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("is-locked", open);
      });
      $$(".nav a").forEach(function (a) {
        a.addEventListener("click", function () {
          header.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("is-locked");
        });
      });
    }
  }

  /* блик под курсором внутри карточек */
  function initSpotlight() {
    if (!finePointer) return;
    $$("[data-spotlight]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(2) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(2) + "%");
      });
    });
  }

  /* «магнит» для кнопок и ссылок */
  function initMagnetic() {
    if (!finePointer || isTouch || !FX.on) return;
    $$("[data-magnetic]").forEach(function (el) {
      var rect = null;
      el.addEventListener("mouseenter", function () { rect = el.getBoundingClientRect(); });
      el.addEventListener("mousemove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = e.clientX - (rect.left + rect.width / 2);
        var my = e.clientY - (rect.top + rect.height / 2);
        el.style.transition = "transform .18s linear";
        el.style.transform = "translate(" + (mx * 0.16).toFixed(2) + "px," + (my * 0.22).toFixed(2) + "px)";
      });
      el.addEventListener("mouseleave", function () {
        rect = null;
        el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
      });
    });
  }

  /* копирование e-mail */
  function initCopy() {
    var btn = $("#copy-mail");
    if (!btn) return;
    var initial = btn.textContent;
    btn.addEventListener("click", function () {
      var text = CONFIG.contacts.email.value;
      var done = function () {
        btn.textContent = "Скопировано ✓";
        setTimeout(function () { btn.textContent = initial; }, 1800);
      };
      var fail = function () {
        btn.textContent = text;
        setTimeout(function () { btn.textContent = initial; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { legacy(); });
      } else { legacy(); }

      function legacy() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          done();
        } catch (err) { fail(); }
      }
    });
  }

  /* печать строк в консольной карточке.
     Печатаем один раз и останавливаемся: бесконечный цикл пересобирал разметку
     по 20 раз в секунду и грел CPU даже когда на карточку никто не смотрит. */
  function initTypewriter() {
    var el = $("[data-typewriter]");
    if (!el || !CONFIG.consoleLines.length) return;

    var lines = CONFIG.consoleLines;

    var printAll = function () {
      el.innerHTML = lines.map(function (l) {
        return '<span class="' + (l.cls || "") + '">' + esc(l.text) + "</span>";
      }).join("\n");
    };

    if (!FX.on) { printAll(); return; }

    var li = 0, ci = 0;

    function build() {
      var out = [];
      for (var i = 0; i < li && i < lines.length; i++) {
        out.push('<span class="' + (lines[i].cls || "") + '">' + esc(lines[i].text) + "</span>");
      }
      if (li < lines.length) {
        out.push('<span class="' + (lines[li].cls || "") + '">' + esc(lines[li].text.slice(0, ci)) + "</span>");
      }
      el.innerHTML = out.join("\n");
    }

    function tick() {
      /* пока вкладка скрыта — не печатаем */
      if (document.hidden) { setTimeout(tick, 400); return; }

      if (li >= lines.length) { printAll(); return; }   // всё напечатано — стоп

      ci++;
      build();
      if (ci > lines[li].text.length) {
        li++;
        ci = 0;
        setTimeout(tick, 240);
        return;
      }
      setTimeout(tick, 34);
    }
    setTimeout(tick, 500);
  }

  /* переключатель эффектов: курсор + стретч + плавный скролл + фон.
     Заодно это «облегчённый режим» для слабых машин. */
  function applyFx() {
    syncScrollMode();
    document.documentElement.classList.toggle("is-calm", !FX.on || liteMode);

    if (!FX.on) {
      if (cur.el && cur.el.root) {
        cur.el.root.classList.remove("is-on", "is-hover", "has-label", "is-down");
      }
      document.documentElement.classList.remove("cursor-custom");
      cur.on = false;
      stretchEls.forEach(function (el) { setStyle(el, "transform", ""); });
      softEls.forEach(function (el) { setStyle(el, "transform", ""); });
      if (bg.el) setStyle(bg.el, "transform", "");
      if (bg.flash) setStyle(bg.flash, "opacity", "0");
    }

    var btn = $("#fx-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", FX.on ? "true" : "false");
      var txt = btn.querySelector(".fx-toggle__text");
      if (txt) txt.textContent = "эффекты: " + (FX.on ? "вкл" : "выкл");
    }
  }

  function initFxToggle() {
    var btn = $("#fx-toggle");
    if (!btn) return;
    if (!finePointer) btn.style.display = "none";   // на тач-устройствах переключать нечего
    btn.addEventListener("click", function () {
      FX.on = !FX.on;
      try { localStorage.setItem("bio:fx", FX.on ? "1" : "0"); } catch (e) {}
      applyFx();
    });
    applyFx();
  }

  /* =======================================================================
     11. Старт
     ======================================================================= */
  function init() {
    document.documentElement.classList.remove("no-js");

    renderContent();
    initReveal();
    initHeader();
    initAnchors();
    initSmoothScroll();
    initFrameParts();
    initBackground();
    initParallax();
    initTilt();
    initCursor();
    initSpotlight();
    initMagnetic();
    initCopy();
    initTypewriter();
    initFxToggle();

    refreshMax();
    window.addEventListener("load", refreshMax);

    /* во вкладке-фоне кадры не крутим */
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        scroll.lastY = window.scrollY;
        requestAnimationFrame(frame);
      }
    });

    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* доступ к настройкам из консоли браузера (удобно править контент) */
  window.BIO = { config: CONFIG };
})();
