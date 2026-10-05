/* Общий слой: шапка/подвал, глобальный поиск, утилиты для работы с SITE_DATA.
   Подключается на каждой странице перед её собственным JS-файлом. */

(function () {
  "use strict";

  var DATA = window.SITE_DATA || { places: [], byCategory: {}, byTheme: {}, routes: [], stats: {} };

  var CATEGORY_META = {
    life: { label: "Места из жизни", icon: "🏠", emptyIcon: "🏠" },
    works: { label: "Места из произведений", icon: "📚", emptyIcon: "📚" },
    monuments: { label: "Музеи и памятники", icon: "🏛", emptyIcon: "🏛" },
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, "<br>");
  }

  function getPlace(id) {
    for (var i = 0; i < DATA.places.length; i++) {
      if (DATA.places[i].id === id) return DATA.places[i];
    }
    return null;
  }

  function placesInCategory(categoryKey) {
    var ids = DATA.byCategory[categoryKey] || [];
    var byId = {};
    DATA.places.forEach(function (p) {
      byId[p.id] = p;
    });
    return ids.map(function (id) {
      return byId[id];
    }).filter(Boolean);
  }

  function themesInCategory(categoryKey) {
    var map = DATA.byTheme[categoryKey] || {};
    return Object.keys(map);
  }

  function placesInTheme(categoryKey, theme) {
    var ids = (DATA.byTheme[categoryKey] || {})[theme] || [];
    var set = {};
    ids.forEach(function (id) {
      set[id] = true;
    });
    return placesInCategory(categoryKey).filter(function (p) {
      return set[p.id];
    });
  }

  function randomPlace() {
    var all = DATA.places;
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }

  /* 4-уровневый поиск по названию, как в search_place_by_name бота:
     1) точное совпадение, 2) начало названия, 3) название содержит запрос, 4) по адресу */
  function searchPlaces(query, limit) {
    query = (query || "").trim().toLowerCase();
    if (query.length < 2) return [];
    var all = DATA.places;
    var tiers = [[], [], [], []];
    all.forEach(function (p) {
      var name = (p.name || "").toLowerCase();
      var addr = (p.address || "").toLowerCase();
      if (name === query) {
        tiers[0].push(p);
      } else if (name.indexOf(query) === 0) {
        tiers[1].push(p);
      } else if (name.indexOf(query) !== -1) {
        tiers[2].push(p);
      } else if (addr && addr.indexOf(query) !== -1) {
        tiers[3].push(p);
      }
    });
    var result = tiers[0].concat(tiers[1], tiers[2], tiers[3]);
    if (limit) result = result.slice(0, limit);
    return result;
  }

  function categoryKeyFromType(type) {
    if (type === "life") return "life";
    if (type === "work") return "works";
    return "monuments";
  }

  function categoryMeta(categoryKey) {
    return CATEGORY_META[categoryKey] || { label: categoryKey, icon: "📍" };
  }

  window.Site = {
    data: DATA,
    categoryMeta: categoryMeta,
    categoryKeyFromType: categoryKeyFromType,
    escapeHtml: escapeHtml,
    nl2br: nl2br,
    getPlace: getPlace,
    placesInCategory: placesInCategory,
    themesInCategory: themesInCategory,
    placesInTheme: placesInTheme,
    randomPlace: randomPlace,
    searchPlaces: searchPlaces,
  };

  /* ==================== ШАПКА / ПОДВАЛ ==================== */
  function currentPage() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    return file;
  }

  var NAV_LINKS = [
    { href: "index.html", label: "Главная" },
    { href: "catalog.html", label: "Каталог мест" },
    { href: "routes.html", label: "Готовые маршруты" },
    { href: "builder.html", label: "Конструктор маршрута" },
  ];

  function renderHeader() {
    var page = currentPage();
    var navHtml = NAV_LINKS.map(function (link) {
      var isActive = page === link.href;
      return (
        '<a href="' + link.href + '"' + (isActive ? ' class="active"' : "") + ">" +
        escapeHtml(link.label) +
        "</a>"
      );
    }).join("");

    var html =
      '<div class="header-inner container">' +
      '<a class="brand" href="index.html">По местам Достоевского</a>' +
      '<nav class="site-nav">' + navHtml + "</nav>" +
      '<div class="header-actions">' +
      '<div class="search-box">' +
      '<input type="text" id="global-search-input" placeholder="Поиск места или адреса…" autocomplete="off">' +
      '<div class="search-results" id="global-search-results"></div>' +
      "</div>" +
      '<button class="btn-random" id="random-place-btn" type="button">🎲 Случайное место</button>' +
      "</div>" +
      "</div>";

    var header = document.getElementById("site-header");
    if (header) header.innerHTML = html;
  }

  function renderFooter() {
    var stats = DATA.stats || {};
    var html =
      '<div class="container">' +
      "Данные собраны из открытых источников, музейных материалов и литературоведческих работ. " +
      "В базе: мест из жизни — " + (stats.life || 0) + "; из произведений — " + (stats.works || 0) +
      "; музеев и памятников — " + (stats.monuments || 0) + "; всего — " + (stats.total || 0) + "." +
      "</div>";
    var footer = document.getElementById("site-footer");
    if (footer) footer.innerHTML = html;
  }

  function wireRandomButton() {
    var btn = document.getElementById("random-place-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var p = randomPlace();
      if (p) window.location.href = "place.html?id=" + encodeURIComponent(p.id);
    });
  }

  function wireGlobalSearch() {
    var input = document.getElementById("global-search-input");
    var resultsBox = document.getElementById("global-search-results");
    if (!input || !resultsBox) return;

    function render(query) {
      var matches = searchPlaces(query, 8);
      if (!query || query.trim().length < 2) {
        resultsBox.classList.remove("open");
        resultsBox.innerHTML = "";
        return;
      }
      if (!matches.length) {
        resultsBox.innerHTML = '<div class="no-results">Ничего не найдено по запросу «' + escapeHtml(query) + '»</div>';
        resultsBox.classList.add("open");
        return;
      }
      resultsBox.innerHTML = matches.map(function (p) {
        var catKey = categoryKeyFromType(p.type);
        var meta = categoryMeta(catKey);
        return (
          '<a href="place.html?id=' + encodeURIComponent(p.id) + '">' +
          escapeHtml(p.name) +
          '<div class="result-category">' + meta.icon + " " + escapeHtml(meta.label) + "</div>" +
          "</a>"
        );
      }).join("");
      resultsBox.classList.add("open");
    }

    input.addEventListener("input", function () {
      render(input.value);
    });
    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2) render(input.value);
    });
    document.addEventListener("click", function (e) {
      if (!resultsBox.contains(e.target) && e.target !== input) {
        resultsBox.classList.remove("open");
      }
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = resultsBox.querySelector("a");
        if (first) window.location.href = first.getAttribute("href");
      }
    });
  }

  function init() {
    renderHeader();
    renderFooter();
    wireRandomButton();
    wireGlobalSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
