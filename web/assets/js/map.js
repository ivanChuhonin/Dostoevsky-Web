/* Тонкая обёртка над 2GIS MapGL JS API: карта одной точки и карта маршрута с линией.
   Требует подключённый <script src="https://mapgl.2gis.com/api/js/v1"></script>
   и window.MAPGL_API_KEY (см. assets/js/config.js). Координаты 2GIS — [долгота, широта]. */

(function () {
  "use strict";

  var SPB_CENTER = [30.3351, 59.9343]; // [lon, lat]

  function markerHtml(num, variant) {
    var bg = variant === "unresolved" ? "#b9b2a5" : "#5c1a24";
    var border = variant === "unresolved" ? "#b9b2a5" : "#c9a227";
    var textColor = variant === "unresolved" ? "#716c63" : "#e8d18f";
    return (
      '<div style="' +
      "width:30px;height:30px;border-radius:50%;background:" + bg + ";" +
      "border:2px solid " + border + ";display:flex;align-items:center;justify-content:center;" +
      "font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:13px;color:" + textColor + ";" +
      'box-shadow:0 2px 5px rgba(0,0,0,0.35);">' + num + "</div>"
    );
  }

  function showMapUnavailable(containerId, reason) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.textAlign = "center";
    el.style.padding = "16px";
    el.style.color = "var(--gray)";
    el.innerHTML = "🗺 Карта недоступна.<br>" + reason;
  }

  function keyConfigured() {
    return !!(window.MAPGL_API_KEY && window.MAPGL_API_KEY.indexOf("ВСТАВЬТЕ") !== 0);
  }

  function apiReady() {
    return typeof window.mapgl !== "undefined";
  }

  function initSinglePointMap(containerId, lat, lon, label) {
    var el = document.getElementById(containerId);
    if (!el) return null;

    if (!apiReady()) {
      showMapUnavailable(containerId, "Не загрузился скрипт 2GIS MapGL (нет интернета или заблокирован домен mapgl.2gis.com).");
      return null;
    }
    if (!keyConfigured()) {
      showMapUnavailable(containerId, "Не указан ключ MAPGL_API_KEY — впишите его в assets/js/config.js.");
      return null;
    }

    var map = new mapgl.Map(containerId, {
      center: [lon, lat],
      zoom: 16,
      key: window.MAPGL_API_KEY,
    });

    new mapgl.HtmlMarker(map, {
      coordinates: [lon, lat],
      html: markerHtml("•"),
      anchor: [15, 15],
    });

    return map;
  }

  /**
   * points: [{ lat, lon, label }] — точки без lat/lon пропускаются на карте,
   * но нумерация маркеров сохраняется по исходному порядку списка.
   */
  function initRouteMap(containerId, points) {
    var el = document.getElementById(containerId);
    if (!el) return null;

    if (!apiReady()) {
      showMapUnavailable(containerId, "Не загрузился скрипт 2GIS MapGL (нет интернета или заблокирован домен mapgl.2gis.com).");
      return null;
    }
    if (!keyConfigured()) {
      showMapUnavailable(containerId, "Не указан ключ MAPGL_API_KEY — впишите его в assets/js/config.js.");
      return null;
    }

    var valid = [];
    points.forEach(function (pt, idx) {
      if (pt.lat === null || pt.lat === undefined || pt.lon === null || pt.lon === undefined) return;
      valid.push({ coord: [pt.lon, pt.lat], num: idx + 1, label: pt.label });
    });

    var startCenter = valid.length ? valid[0].coord : SPB_CENTER;
    var map = new mapgl.Map(containerId, {
      center: startCenter,
      zoom: 13,
      key: window.MAPGL_API_KEY,
    });

    valid.forEach(function (v) {
      new mapgl.HtmlMarker(map, {
        coordinates: v.coord,
        html: markerHtml(v.num),
        anchor: [15, 15],
      });
    });

    if (valid.length >= 2) {
      new mapgl.Polyline(map, {
        coordinates: valid.map(function (v) {
          return v.coord;
        }),
        width: 3,
        color: "#5c1a24",
      });

      var lons = valid.map(function (v) { return v.coord[0]; });
      var lats = valid.map(function (v) { return v.coord[1]; });
      map.fitBounds(
        [
          [Math.min.apply(null, lons), Math.min.apply(null, lats)],
          [Math.max.apply(null, lons), Math.max.apply(null, lats)],
        ],
        { padding: { top: 40, bottom: 40, left: 40, right: 40 } }
      );
    } else if (valid.length === 1) {
      map.setCenter(valid[0].coord);
      map.setZoom(15);
    }

    return map;
  }

  window.DostMap = {
    initSinglePointMap: initSinglePointMap,
    initRouteMap: initRouteMap,
  };
})();
