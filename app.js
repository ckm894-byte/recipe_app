// ── 상태 ──
let currentCategory = "전체";
let currentSearch = "";
let favorites = JSON.parse(localStorage.getItem("recipe_favs") || "[]");

// ── 초기화 ──
function init() {
  renderCategories();
  renderRecipes();

  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    renderRecipes();
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ── 카테고리 렌더 ──
function renderCategories() {
  const list = document.getElementById("categoryList");
  list.innerHTML = CATEGORIES.map(cat => `
    <button
      class="category-btn ${cat === currentCategory ? "active" : ""}"
      data-cat="${cat}"
    >${cat}</button>
  `).join("");

  list.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.cat;
      renderCategories();
      renderRecipes();
    });
  });
}

// ── 레시피 필터링 ──
function getFilteredRecipes() {
  let result = RECIPES;

  if (currentCategory === "즐겨찾기") {
    result = result.filter(r => favorites.includes(r.id));
  } else if (currentCategory !== "전체") {
    result = result.filter(r => r.category === currentCategory);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    result = result.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(q);
      const ingredientMatch = r.ingredients.some(ing =>
        ing.toLowerCase().includes(q)
      );
      const tagMatch = r.tags.some(t => t.toLowerCase().includes(q));
      return nameMatch || ingredientMatch || tagMatch;
    });
  }

  return result;
}

// ── 재료 표시 (검색어 하이라이트) ──
function highlightIngredients(ingredients, query) {
  const shown = ingredients.slice(0, 5);
  const rest = ingredients.length - 5;
  let text = shown.map(ing => {
    if (query && ing.toLowerCase().includes(query.toLowerCase())) {
      const idx = ing.toLowerCase().indexOf(query.toLowerCase());
      const matched = ing.slice(idx, idx + query.length);
      return ing.replace(matched, `<span class="ingredient-highlight">${matched}</span>`);
    }
    return ing;
  }).join(", ");
  if (rest > 0) text += ` 외 ${rest}가지`;
  return text;
}

// ── 레시피 카드 렌더 ──
function renderRecipes() {
  const filtered = getFilteredRecipes();
  const grid = document.getElementById("recipeGrid");
  const empty = document.getElementById("emptyState");
  const info = document.getElementById("resultInfo");

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
    info.textContent = "";
    return;
  }

  empty.style.display = "none";

  const total = RECIPES.length;
  if (currentSearch || currentCategory !== "전체") {
    info.textContent = `${filtered.length}개 레시피`;
  } else {
    info.textContent = `전체 ${total}개 레시피`;
  }

  grid.innerHTML = filtered.map(recipe => {
    const isFav = favorites.includes(recipe.id);
    return `
      <div class="recipe-card" data-id="${recipe.id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span class="card-category">${recipe.category}</span>
          <button class="fav-btn" data-id="${recipe.id}" title="즐겨찾기">
            ${isFav ? "❤️" : "🤍"}
          </button>
        </div>
        <div class="card-name">${recipe.name}</div>
        <div class="card-ingredients">
          ${highlightIngredients(recipe.ingredients, currentSearch)}
        </div>
        <div class="card-footer">
          <span class="card-step-count">조리 ${recipe.steps.length}단계</span>
          <span class="card-arrow">→</span>
        </div>
      </div>
    `;
  }).join("");

  // 카드 클릭 → 상세
  grid.querySelectorAll(".recipe-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      const id = parseInt(card.dataset.id);
      openModal(id);
    });
  });

  // 즐겨찾기 버튼
  grid.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(parseInt(btn.dataset.id));
    });
  });
}

// ── 즐겨찾기 ──
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("recipe_favs", JSON.stringify(favorites));
  renderRecipes();
}

// ── 모달 ──
function openModal(id) {
  const recipe = RECIPES.find(r => r.id === id);
  if (!recipe) return;

  const isFav = favorites.includes(id);

  document.getElementById("modalContent").innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
      <span class="modal-category">${recipe.category}</span>
      <button class="fav-btn" data-id="${recipe.id}" style="font-size:22px;">${isFav ? "❤️" : "🤍"}</button>
    </div>
    <h2 class="modal-title">${recipe.name}</h2>
    <div class="modal-tags">
      ${recipe.tags.map(t => `<span class="tag">#${t}</span>`).join("")}
    </div>

    <p class="section-title">재료</p>
    <div class="ingredients-list">
      ${recipe.ingredients.map(ing => `<span class="ingredient-chip">${ing}</span>`).join("")}
    </div>

    <p class="section-title">조리 순서</p>
    <ol class="steps-list">
      ${recipe.steps.map((step, i) => `
        <li>
          <span class="step-num">${i + 1}</span>
          <span class="step-text">${step}</span>
        </li>
      `).join("")}
    </ol>

    ${recipe.tip ? `
      <div class="tip-box">
        <strong>💡 팁</strong>
        ${recipe.tip}
      </div>
    ` : ""}
  `;

  // 모달 내 즐겨찾기 버튼
  document.querySelector("#modalContent .fav-btn").addEventListener("click", () => {
    toggleFavorite(id);
    openModal(id); // 다시 렌더
  });

  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

// ── 즐겨찾기 카테고리 추가 ──
if (!CATEGORIES.includes("즐겨찾기")) {
  CATEGORIES.push("즐겨찾기");
}

init();