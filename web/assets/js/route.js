(function () {
  "use strict";

  function getSlugFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("slug");
  }

  function getRoute(slug) {
    var routes = Site.data.routes || [];
    for (var i = 0; i < routes.length; i++) {
      if (routes[i].slug === slug) return routes[i];
    }
    return null;
  }

  function render(route) {
    var container = document.getElementById("route-container");

    var timelineHtml = route.points.map(function (pt, idx) {
      var resolved = pt.lat !== null && pt.lat !== undefined;
      return (
        '<div class="route-point' + (resolved ? "" : " unresolved") + '">' +
        '<div class="marker">' + (idx + 1) + "</div>" +
        '<div class="connector"></div>' +
        '<div class="point-body">' +
        "<h3>" + Site.escapeHtml(pt.name) + "</h3>" +
        '<div class="point-info">' + Site.nl2br(pt.info) + "</div>" +
        (pt.placeId ? '<p style="margin-top:10px"><a href="place.html?id=' + encodeURIComponent(pt.placeId) + '">Открыть карточку места →</a></p>' : "") +
        "</div>" +
        "</div>"
      );
    }).join("");

    container.innerHTML =
      '<div class="breadcrumbs"><a href="routes.html">Готовые маршруты</a> / ' + Site.escapeHtml(route.name) + "</div>" +
      '<div class="route-header">' +
      "<h1>🗺 " + Site.escapeHtml(route.name) + "</h1>" +
      "<p>" + Site.nl2br(route.description) + "</p>" +
      (route.durationInfo ? '<div class="route-duration">' + Site.nl2br(route.durationInfo) + "</div>" : "") +
      "</div>" +
      '<div class="route-map" id="route-map"></div>' +
      '<div class="route-timeline">' + timelineHtml + "</div>";

    var mapPoints = route.points.map(function (pt) {
      return { lat: pt.lat, lon: pt.lon, label: pt.name };
    });
    window.DostMap.initRouteMap("route-map", mapPoints);
  }

  function renderNotFound() {
    document.getElementById("route-container").innerHTML =
      '<div class="empty-state"><h2>😕 Маршрут не найден</h2><p><a href="routes.html">Вернуться к списку маршрутов</a></p></div>';
  }

  var slug = getSlugFromUrl();
  var route = slug ? getRoute(slug) : null;
  if (route) {
    document.title = route.name + " — По местам Достоевского";
    render(route);
  } else {
    renderNotFound();
  }
})();
