(function () {
  "use strict";

  var MIN_PLACES = 2;
  var MAX_PLACES = 5;
  var CATEGORIES = ["life", "works", "monuments"];

  var state = {
    category: null,
    theme: null, // "__all__" или конкретная тема; null пока не выбрано
    selected: [], // массив place.id в порядке выбора
  };

  function pool() {
    if (!state.category) return [];
    if (state.theme && state.theme !== "__all__") {
      return Site.placesInTheme(state.category, state.theme);
    }
    return Site.placesInCategory(state.category);
  }

  function renderCategoryChips() {
    var box = document.getElementById("builder-category-chips");
    box.innerHTML = CATEGORIES.map(function (catKey) {
      var meta = Site.categoryMeta(catKey);
      var active = state.category === catKey ? " active" : "";
      return '<button type="button" class="chip' + active + '" data-category="' + catKey + '">' +
        meta.icon + " " + Site.escapeHtml(meta.label) + "</button>";
    }).join("");

    Array.prototype.forEach.call(box.querySelectorAll(".chip"), function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.getAttribute("data-category");
        var themes = Site.themesInCategory(state.category);
        state.theme = themes.length ? null : "__all__";
        state.selected = [];
        renderAll();
      });
    });
  }

  function renderThemeStep() {
    var step = document.getElementById("step-theme");
    var select = document.getElementById("builder-theme-select");

    if (!state.category) {
      step.classList.add("disabled");
      return;
    }

    var themes = Site.themesInCategory(state.category);
    if (!themes.length) {
      step.classList.add("disabled");
      return;
    }

    step.classList.remove("disabled");
    var options = ['<option value="__all__">Все темы</option>'].concat(
      themes.map(function (t) {
        return '<option value="' + Site.escapeHtml(t) + '">' + Site.escapeHtml(t) + "</option>";
      })
    );
    select.innerHTML = options.join("");
    select.value = state.theme || "__all__";

    select.onchange = function () {
      state.theme = select.value;
      state.selected = [];
      renderPlacesStep();
    };
  }

  function toggleSelect(placeId) {
    var idx = state.selected.indexOf(placeId);
    if (idx !== -1) {
      state.selected.splice(idx, 1);
    } else {
      if (state.selected.length >= MAX_PLACES) return;
      state.selected.push(placeId);
    }
    renderPlacesStep();
  }

  function renderPlacesStep() {
    var step = document.getElementById("step-places");
    var grid = document.getElementById("builder-pick-grid");
    var progress = document.getElementById("builder-progress");
    var buildBtn = document.getElementById("build-route-btn");

    var canShowPlaces = state.category && (state.theme !== null);
    if (!canShowPlaces) {
      step.classList.add("disabled");
      return;
    }
    step.classList.remove("disabled");

    var places = pool();
    if (!places.length) {
      grid.innerHTML = '<div class="empty-state">😕 В этой подборке пока нет мест.</div>';
      buildBtn.disabled = true;
      return;
    }

    grid.innerHTML = places.map(function (p) {
      var selectedIdx = state.selected.indexOf(p.id);
      var isSelected = selectedIdx !== -1;
      return (
        '<div class="pick-card' + (isSelected ? " selected" : "") + '" data-id="' + p.id + '">' +
        '<span class="pick-index">' + (isSelected ? (selectedIdx + 1) : "") + "</span>" +
        "<span>" + Site.escapeHtml(p.name) + "</span>" +
        "</div>"
      );
    }).join("");

    Array.prototype.forEach.call(grid.querySelectorAll(".pick-card"), function (card) {
      card.addEventListener("click", function () {
        toggleSelect(card.getAttribute("data-id"));
      });
    });

    progress.textContent = "Выбрано: " + state.selected.length + " / " + MAX_PLACES +
      (state.selected.length < MIN_PLACES ? " (нужно минимум " + MIN_PLACES + ")" : "");

    buildBtn.disabled = state.selected.length < MIN_PLACES;
  }

  function buildResult() {
    var places = state.selected.map(Site.getPlace).filter(Boolean);
    var step = document.getElementById("step-result");
    step.classList.remove("hidden");

    var list = document.getElementById("builder-selected-list");
    list.innerHTML = places.map(function (p, idx) {
      return (
        '<li><span class="marker-sm">' + (idx + 1) + "</span>" +
        '<a href="place.html?id=' + encodeURIComponent(p.id) + '">' + Site.escapeHtml(p.name) + "</a></li>"
      );
    }).join("");

    var mapPoints = places.map(function (p) {
      return { lat: p.lat, lon: p.lon, label: p.name };
    });

    destroyBuilderMap();
    window._builderMap = window.DostMap.initRouteMap("builder-map", mapPoints);

    step.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function destroyBuilderMap() {
    if (window._builderMap && typeof window._builderMap.destroy === "function") {
      window._builderMap.destroy();
    }
    window._builderMap = null;
    document.getElementById("builder-map").innerHTML = "";
  }

  function resetBuilder() {
    state.category = null;
    state.theme = null;
    state.selected = [];
    document.getElementById("step-result").classList.add("hidden");
    destroyBuilderMap();
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAll() {
    renderCategoryChips();
    renderThemeStep();
    renderPlacesStep();
  }

  document.getElementById("build-route-btn").addEventListener("click", buildResult);
  document.getElementById("reset-builder-btn").addEventListener("click", resetBuilder);

  renderAll();
})();
