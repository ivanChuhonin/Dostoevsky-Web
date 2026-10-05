(function () {
  "use strict";

  function getIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function fact(label, value) {
    if (!value || value === "-" || value === "0") return "";
    return "<li><strong>" + Site.escapeHtml(label) + ":</strong> " + Site.escapeHtml(value) + "</li>";
  }

  function websiteLink(url) {
    if (!url || url === "-") return "";
    var href = url.indexOf("http") === 0 ? url : "https://" + url;
    return '<li><strong>Сайт:</strong> <a href="' + Site.escapeHtml(href) + '" target="_blank" rel="noopener">' + Site.escapeHtml(url) + "</a></li>";
  }

  function buildFacts(place) {
    var items = [];
    if (place.type === "life") {
      items.push(fact("Адрес", place.address));
      items.push(fact("Метро", place.metro));
      items.push(fact("Годы", place.years));
    } else if (place.type === "work") {
      items.push(fact("Адрес", place.address));
      items.push(fact("Метро", place.metro));
      items.push(fact("Произведение", place.work));
    } else {
      items.push(fact("Тип", place.subtype));
      items.push(fact("Адрес", place.address));
      items.push(fact("Метро", place.metro));
      items.push(fact("Режим работы", place.work_hours));
      items.push(fact("Билеты", place.price));
      items.push(websiteLink(place.website));
    }
    return items.filter(Boolean).join("");
  }

  function buildBody(place) {
    var parts = [];
    if (place.type === "life") {
      if (place.event) parts.push('<p><strong>📖 Событие:</strong> ' + Site.nl2br(place.event) + "</p>");
      if (place.description) parts.push('<p class="lead-text">' + Site.nl2br(place.description) + "</p>");
      if (place.quote) parts.push('<blockquote class="quote-block">' + Site.nl2br(place.quote) + "</blockquote>");
    } else if (place.type === "work") {
      if (place.plot_connection) parts.push('<p class="lead-text">' + Site.nl2br(place.plot_connection) + "</p>");
      if (place.quote) parts.push('<blockquote class="quote-block">' + Site.nl2br(place.quote) + "</blockquote>");
      if (place.now_description) parts.push('<p><strong>🏛 Сейчас:</strong> ' + Site.nl2br(place.now_description) + "</p>");
    } else {
      if (place.history) parts.push('<p class="lead-text">' + Site.nl2br(place.history) + "</p>");
      if (place.fact) parts.push('<p><strong>✨ Интересный факт:</strong> ' + Site.nl2br(place.fact) + "</p>");
    }
    return parts.join("");
  }

  function kickerFor(place) {
    var meta = Site.categoryMeta(Site.categoryKeyFromType(place.type));
    return meta.icon + " " + meta.label;
  }

  function render(place) {
    var container = document.getElementById("place-container");

    var breadcrumbCat = Site.categoryKeyFromType(place.type);
    var breadcrumbLabel = Site.categoryMeta(breadcrumbCat).label;

    var photoHtml = place.photo
      ? '<div class="photo-frame"><img src="' + Site.escapeHtml(place.photo) + '" alt="' + Site.escapeHtml(place.name) + '" loading="lazy"></div>'
      : "";

    var mapHtml = place.lat !== null && place.lat !== undefined
      ? '<div class="map-frame"><div class="map-canvas" id="place-map"></div></div>'
      : '<div class="map-frame"><div class="map-canvas" style="display:flex;align-items:center;justify-content:center;color:var(--gray)">Координаты отсутствуют</div></div>';

    var filmHtml = "";
    if (place.type === "work" && place.film_link) {
      filmHtml =
        '<div class="film-link-box">🎬 По этому произведению есть экранизация: ' +
        '<a href="' + Site.escapeHtml(place.film_link) + '" target="_blank" rel="noopener">смотреть</a></div>';
    }

    container.innerHTML =
      '<div class="breadcrumbs">' +
      '<a href="catalog.html?category=' + breadcrumbCat + '">' + Site.escapeHtml(breadcrumbLabel) + "</a> / " + Site.escapeHtml(place.name) +
      "</div>" +
      '<div class="place-detail">' +
      '<div class="main-col">' +
      '<div class="kicker">' + kickerFor(place) + "</div>" +
      "<h1>" + Site.escapeHtml(place.name || "Без названия") + "</h1>" +
      '<ul class="fact-list">' + buildFacts(place) + "</ul>" +
      buildBody(place) +
      filmHtml +
      "</div>" +
      '<div class="side-col">' +
      photoHtml +
      mapHtml +
      "</div>" +
      "</div>";

    if (place.lat !== null && place.lat !== undefined) {
      window.DostMap.initSinglePointMap("place-map", place.lat, place.lon, place.name);
    }
  }

  function renderNotFound() {
    document.getElementById("place-container").innerHTML =
      '<div class="empty-state">' +
      "<h2>😕 Место не найдено</h2>" +
      '<p><a href="catalog.html">Вернуться в каталог</a></p>' +
      "</div>";
  }

  var id = getIdFromUrl();
  var place = id ? Site.getPlace(id) : null;
  if (place) {
    document.title = place.name + " — По местам Достоевского";
    render(place);
  } else {
    renderNotFound();
  }
})();
