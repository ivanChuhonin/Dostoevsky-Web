(function () {
  "use strict";

  var PAGE_SIZE = 12;
  var state = {
    category: "life",
    theme: "__all__",
    visibleCount: PAGE_SIZE,
  };

  var CATEGORIES = ["life", "works", "monuments"];

  function readUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get("category");
    if (CATEGORIES.indexOf(cat) !== -1) state.category = cat;
    var theme = params.get("theme");
    if (theme) state.theme = theme;
  }

  function renderCategoryChips() {
    var box = document.getElementById("category-chips");
    box.innerHTML = CATEGORIES.map(function (catKey) {
      var meta = Site.categoryMeta(catKey);
      var count = Site.placesInCategory(catKey).length;
      var active = state.category === catKey ? " active" : "";
      return (
        '<button type="button" class="chip' + active + '" data-category="' + catKey + '">' +
        meta.icon + " " + Site.escapeHtml(meta.label) + " (" + count + ")" +
        "</button>"
      );
    }).join("");

    Array.prototype.forEach.call(box.querySelectorAll(".chip"), function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.getAttribute("data-category");
        state.theme = "__all__";
        state.visibleCount = PAGE_SIZE;
        renderAll();
      });
    });
  }

  function renderThemeSelect() {
    var select = document.getElementById("theme-select");
    var themes = Site.themesInCategory(state.category);

    if (!themes.length) {
      select.innerHTML = '<option value="__all__">Все темы недоступны</option>';
      select.disabled = true;
      return;
    }

    select.disabled = false;
    var options = ['<option value="__all__">Все темы</option>'];
    themes.forEach(function (t) {
      options.push('<option value="' + Site.escapeHtml(t) + '">' + Site.escapeHtml(t) + "</option>");
    });
    select.innerHTML = options.join("");
    select.value = themes.indexOf(state.theme) !== -1 ? state.theme : "__all__";

    select.onchange = function () {
      state.theme = select.value;
      state.visibleCount = PAGE_SIZE;
      renderGrid();
    };
  }

  function currentPlaces() {
    if (state.theme !== "__all__") {
      return Site.placesInTheme(state.category, state.theme);
    }
    return Site.placesInCategory(state.category);
  }

  function placeMetaLine(place) {
    var bits = [];
    if (place.address) bits.push(place.address);
    if (place.metro) bits.push("🚇 " + place.metro);
    return bits.join(" · ");
  }

  function placeBadge(place) {
    if (place.type === "life" || place.type === "work") return place.theme || "";
    return place.subtype || "";
  }

  function renderCard(place) {
    var thumb = place.photo
      ? '<div class="thumb" style="background-image:url(\'' + place.photo.replace(/'/g, "%27") + '\')"></div>'
      : '<div class="thumb no-photo">' + Site.categoryMeta(Site.categoryKeyFromType(place.type)).icon + "</div>";
    var badge = placeBadge(place);

    return (
      '<div class="place-card">' +
      '<a class="card-link" href="place.html?id=' + encodeURIComponent(place.id) + '">' +
      thumb +
      (badge ? '<span class="badge">' + Site.escapeHtml(badge) + "</span>" : "") +
      '<div class="body">' +
      "<h3>" + Site.escapeHtml(place.name || "Без названия") + "</h3>" +
      '<p class="meta">' + Site.escapeHtml(placeMetaLine(place)) + "</p>" +
      "</div>" +
      "</a>" +
      "</div>"
    );
  }

  function renderGrid() {
    var all = currentPlaces();
    var meta = Site.categoryMeta(state.category);
    var metaBox = document.getElementById("results-meta");
    var grid = document.getElementById("place-grid");

    if (!all.length) {
      metaBox.textContent = "";
      grid.innerHTML = '<div class="empty-state">😕 В этой категории пока нет мест.</div>';
      document.getElementById("load-more-row").classList.add("hidden");
      return;
    }

    var visible = all.slice(0, state.visibleCount);
    metaBox.textContent = meta.label + (state.theme !== "__all__" ? " · " + state.theme : "") +
      " — показано " + visible.length + " из " + all.length;
    grid.innerHTML = visible.map(renderCard).join("");

    var loadMoreRow = document.getElementById("load-more-row");
    if (visible.length < all.length) {
      loadMoreRow.classList.remove("hidden");
    } else {
      loadMoreRow.classList.add("hidden");
    }
  }

  function renderAll() {
    renderCategoryChips();
    renderThemeSelect();
    renderGrid();
  }

  document.getElementById("load-more-btn").addEventListener("click", function () {
    state.visibleCount += PAGE_SIZE;
    renderGrid();
  });

  readUrlParams();
  renderAll();
})();
