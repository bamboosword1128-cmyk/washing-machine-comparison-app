(() => {
  "use strict";

  const data = window.APPLIANCE_DATA;
  if (!data?.app || !Array.isArray(data.products) || !Array.isArray(data.makers)) {
    document.body.innerHTML = '<p class="fatal-error">洗濯機データを読み込めませんでした。</p>';
    return;
  }

  const { app, products, makers, washerTypes, capacityGroups, featureGroups, featureExplainerParts = {}, sources } = data;
  const compareLimit = app.compareLimit || 7;
  const makerMap = Object.fromEntries(makers.map((item) => [item.id, item]));
  const typeMap = Object.fromEntries(washerTypes.map((item) => [item.id, item]));
  const productMap = Object.fromEntries(products.map((item) => [item.id, item]));
  const sourceMap = Object.fromEntries(sources.map((item) => [item.id, item]));

  const state = {
    makers: new Set(),
    years: new Set(),
    types: new Set(),
    capacities: new Set(),
    dryCapacities: new Set(),
    dryingMethods: new Set(),
    quick: new Set(),
    search: "",
    compare: [],
    differenceOnly: false
  };

  let lastDetailTrigger = null;
  const el = {
    makerFilters: document.querySelector("#makerFilters"),
    yearFilters: document.querySelector("#yearFilters"),
    typeFilters: document.querySelector("#typeFilters"),
    capacityFilters: document.querySelector("#capacityFilters"),
    dryCapacityFilters: document.querySelector("#dryCapacityFilters"),
    dryingMethodFilters: document.querySelector("#dryingMethodFilters"),
    quickFilters: document.querySelector("#quickFilters"),
    search: document.querySelector("#searchInput"),
    grid: document.querySelector("#productGrid"),
    resultTitle: document.querySelector("#resultTitle"),
    summary: document.querySelector("#activeFilterSummary"),
    visible: document.querySelector("#visibleCount"),
    mobileVisible: document.querySelector("#mobileVisible"),
    status: document.querySelector("#resultsStatus"),
    compareEmpty: document.querySelector("#compareEmpty"),
    compareContent: document.querySelector("#compareContent"),
    compareWrap: document.querySelector("#compareWrap"),
    compareStatus: document.querySelector("#compareStatus"),
    differenceOnly: document.querySelector("#differenceOnly"),
    differenceModeHint: document.querySelector("#differenceModeHint"),
    guide: document.querySelector("#makerGuide"),
    dialog: document.querySelector("#detailDialog"),
    detail: document.querySelector("#detailContent")
  };

  init();

  function init() {
    document.title = app.title;
    document.querySelector("#appTitle").textContent = app.title;
    document.querySelector("#appKicker").textContent = app.kicker;
    document.querySelector("#updatedAt").textContent = app.updatedAt;
    document.querySelector("#makerCount").textContent = makers.length;
    document.querySelector("#productCount").textContent = products.length;
    document.querySelector("#salesNote").textContent = app.salesNote;
    el.search.placeholder = app.searchPlaceholder;
    bindEvents();
    renderGuide();
    renderAll();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const filter = event.target.closest("[data-filter]");
      if (filter) {
        toggleFilter(filter.dataset.filter, filter.dataset.value);
        return;
      }

      const compare = event.target.closest("[data-compare]");
      if (compare) {
        toggleCompare(compare.dataset.compare);
        return;
      }

      const detail = event.target.closest("[data-detail]");
      if (detail) {
        lastDetailTrigger = detail;
        openDetail(detail.dataset.detail);
        return;
      }

      const preset = event.target.closest("[data-preset]");
      if (preset) {
        applyPreset(preset.dataset.preset);
        return;
      }

      const makerGuide = event.target.closest("[data-guide-maker]");
      if (makerGuide) {
        state.makers = new Set([makerGuide.dataset.guideMaker]);
        state.years.clear();
        state.types.clear();
        state.capacities.clear();
        state.dryCapacities.clear();
        state.dryingMethods.clear();
        state.quick.clear();
        state.search = "";
        el.search.value = "";
        renderAll();
        document.querySelector("#results").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
        return;
      }

      if (event.target.closest("[data-close-dialog]")) closeDialog();
    });

    el.search.addEventListener("input", () => {
      state.search = el.search.value;
      renderAll();
    });

    el.differenceOnly.addEventListener("change", () => {
      state.differenceOnly = el.differenceOnly.checked;
      renderCompare();
    });

    document.querySelector("#clearFilters").addEventListener("click", () => {
      state.makers.clear();
      state.years.clear();
      state.types.clear();
      state.capacities.clear();
      state.dryCapacities.clear();
      state.dryingMethods.clear();
      state.quick.clear();
      state.search = "";
      el.search.value = "";
      renderAll();
      el.search.focus();
    });

    document.querySelector("#clearCompare").addEventListener("click", () => {
      state.compare = [];
      el.compareStatus.textContent = "比較リストを空にしました。";
      renderAll();
    });

    document.querySelector("#compareFab").addEventListener("click", () => {
      document.querySelector("#compare").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
    });

    el.dialog.addEventListener("click", (event) => {
      if (event.target === el.dialog) closeDialog();
    });

    el.dialog.addEventListener("close", () => {
      if (lastDetailTrigger && document.contains(lastDetailTrigger)) lastDetailTrigger.focus();
      lastDetailTrigger = null;
    });

    document.addEventListener("error", (event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      event.target.hidden = true;
      const fallback = event.target.parentElement?.querySelector(".logo-fallback");
      if (fallback) fallback.hidden = false;
    }, true);
  }

  function toggleFilter(group, value) {
    const target = state[group];
    if (!(target instanceof Set)) return;
    target.has(value) ? target.delete(value) : target.add(value);
    renderAll();
  }

  function renderAll() {
    renderFilters();
    renderProducts();
    renderCompare();
    document.querySelectorAll("[data-compare-count]").forEach((node) => { node.textContent = state.compare.length; });
  }

  function renderFilters() {
    el.makerFilters.innerHTML = makers.map((item) => chip("makers", item.id, item.name, state.makers.has(item.id))).join("");
    const years = [...new Set(products.map((product) => product.modelYear))].sort((a, b) => b - a);
    el.yearFilters.innerHTML = years.map((year) => chip("years", String(year), `${year}年`, state.years.has(String(year)))).join("");
    el.typeFilters.innerHTML = washerTypes.map((item) => chip("types", item.id, item.name, state.types.has(item.id))).join("");
    el.capacityFilters.innerHTML = capacityGroups.map((item) => chip("capacities", item.id, item.name, state.capacities.has(item.id))).join("");
    el.dryCapacityFilters.innerHTML = [
      { id: "under-4", name: "4kg以下" },
      { id: "4-5", name: "4.5–5.5kg" },
      { id: "6", name: "6kg" },
      { id: "over-7", name: "7kg以上" }
    ].map((item) => chip("dryCapacities", item.id, item.name, state.dryCapacities.has(item.id))).join("");
    el.dryingMethodFilters.innerHTML = [
      { id: "heat-pump", name: "ヒートポンプ式" },
      { id: "heater", name: "ヒーター式" },
      { id: "other", name: "その他・方式非掲載" }
    ].map((item) => chip("dryingMethods", item.id, item.name, state.dryingMethods.has(item.id))).join("");
    el.quickFilters.innerHTML = [
      { id: "heat-pump", name: "ヒートポンプ式のみ" },
      { id: "auto-dosing", name: "自動投入あり" },
      { id: "warm-water", name: "温水洗浄あり" },
      { id: "easy-dry-filter", name: "乾燥フィルター毎回掃除不要" }
    ].map((item) => chip("quick", item.id, item.name, state.quick.has(item.id))).join("");
  }

  function chip(group, value, label, active) {
    return `<button type="button" class="filter-chip${active ? " active" : ""}" data-filter="${group}" data-value="${attr(value)}" aria-pressed="${active}"><span aria-hidden="true">${active ? "✓" : ""}</span>${html(label)}</button>`;
  }

  function filteredProducts() {
    const query = normalize(state.search);
    return [...products]
      .filter((product) => {
        if (state.makers.size && !state.makers.has(product.makerId)) return false;
        if (state.years.size && !state.years.has(String(product.modelYear))) return false;
        if (state.types.size && !state.types.has(product.type)) return false;
        if (state.capacities.size && ![...state.capacities].some((id) => inCapacity(product.capacities.washingKg, id))) return false;
        if (state.dryCapacities.size && ![...state.dryCapacities].some((id) => inDryCapacity(product.capacities.dryingKg, id))) return false;
        if (state.dryingMethods.size && !state.dryingMethods.has(dryingCategory(product))) return false;
        if (state.quick.size && ![...state.quick].every((id) => matchesQuickFilter(product, id))) return false;
        if (!query) return true;
        const featureText = product.features.flatMap((feature) => [feature.name, feature.description]);
        return normalize([
          makerMap[product.makerId]?.name,
          product.name,
          ...(product.models || []),
          product.modelYear,
          typeMap[product.type]?.name,
          product.headline,
          product.fit,
          product.capacityNote,
          product.drying.method,
          ...(product.additionalSpecs || []).flatMap((item) => [item.label, item.value]),
          ...featureText
        ].join(" ")).includes(query);
      })
      .sort((a, b) => b.modelYear - a.modelYear || makers.findIndex((m) => m.id === a.makerId) - makers.findIndex((m) => m.id === b.makerId) || (b.capacities.washingKg ?? -1) - (a.capacities.washingKg ?? -1) || a.name.localeCompare(b.name, "ja"));
  }

  function inCapacity(value, groupId) {
    const group = capacityGroups.find((item) => item.id === groupId);
    if (!group || value == null) return false;
    return value >= group.min && (group.max == null || value <= group.max);
  }

  function inDryCapacity(value, groupId) {
    if (value == null) return false;
    if (groupId === "under-4") return value <= 4;
    if (groupId === "4-5") return value >= 4.5 && value <= 5.5;
    if (groupId === "6") return value === 6;
    if (groupId === "over-7") return value >= 7;
    return false;
  }

  function dryingCategory(product) {
    if (product.capacities.dryingKg == null) return "none";
    const method = normalize(product.drying.method);
    if (/ヒートポンプ/.test(method)) return "heat-pump";
    if (/ヒーター|低温ヒート|速乾ビート|風アイロン/.test(method)) return "heater";
    return "other";
  }

  function matchesQuickFilter(product, id) {
    if (id === "heat-pump") return dryingCategory(product) === "heat-pump";
    if (id === "auto-dosing") return Boolean(product.specDetails?.autoDosing);
    if (id === "warm-water") return hasFeature(product, /温水/, "washing");
    if (id === "easy-dry-filter") return hasFeature(product, /乾燥フィルター自動|らくメンテ/, "care");
    return true;
  }

  function renderProducts() {
    const visible = filteredProducts();
    const filterCount = state.makers.size + state.years.size + state.types.size + state.capacities.size + state.dryCapacities.size + state.dryingMethods.size + state.quick.size + (state.search.trim() ? 1 : 0);
    el.visible.textContent = visible.length;
    el.mobileVisible.textContent = visible.length;
    el.resultTitle.textContent = filterCount ? `${visible.length}機種を表示` : `全${products.length}機種`;
    el.summary.textContent = filterCount ? `${filterCount}条件を適用中` : "条件なし";
    el.status.textContent = `${visible.length}機種を表示しています。`;
    el.grid.innerHTML = visible.length ? visible.map(productCard).join("") : '<div class="no-results"><strong>該当する機種がありません</strong><p>条件を減らすか、型番の一部で検索してください。</p></div>';
  }

  function productCard(product) {
    const maker = makerMap[product.makerId];
    const selected = state.compare.includes(product.id);
    const disabled = !selected && state.compare.length >= compareLimit;
    const capacity = product.capacities.washingKg == null
      ? product.capacityNote || "容量設定なし"
      : `洗濯 ${number(product.capacities.washingKg)}kg${product.capacities.dryingKg != null ? ` / 乾燥 ${number(product.capacities.dryingKg)}kg` : ""}`;
    const tags = [
      typeMap[product.type].name,
      capacity,
      ...product.features.slice(0, 3).map((feature) => feature.name)
    ].map((label) => `<span>${html(label)}</span>`).join("");
    return `<article class="product-card" style="--accent:${color(maker.accent)}">
      <div class="card-media">
        ${logoMarkup(maker)}
      </div>
      <div class="card-body">
        <div class="maker-label"><span>${html(maker.name)}</span><span>${product.modelYear}年</span></div>
        <div class="series-title"><h3>${html(product.name)}</h3><span>${html(product.releaseLabel)}</span></div>
        <p class="headline">${html(product.headline || product.differenceSummary)}</p>
        <p class="talk">${html(product.fit || product.differenceSummary)}</p>
        <div class="tag-list">${tags}</div>
        <div class="card-actions">
          <button type="button" class="compare-button${selected ? " selected" : ""}" data-compare="${attr(product.id)}" aria-label="${attr(`${maker.name} ${product.name}を${selected ? "比較から外す" : "比較に追加"}`)}" aria-pressed="${selected}" ${disabled ? "disabled" : ""}>${selected ? "比較から外す" : "比較に追加"}</button>
          <button type="button" class="detail-button" data-detail="${attr(product.id)}" aria-label="${attr(`${maker.name} ${product.name}のDB詳細を開く`)}">DB詳細</button>
        </div>
      </div>
    </article>`;
  }

  function logoMarkup(maker) {
    return `<div class="maker-logo">${maker.logo ? `<img src="${attr(maker.logo)}" alt="${attr(maker.name)}" />` : ""}<span class="logo-fallback"${maker.logo ? " hidden" : ""}>${html(maker.shortName || maker.name)}</span></div>`;
  }

  function toggleCompare(productId) {
    const product = productMap[productId];
    if (!product) return;
    if (state.compare.includes(productId)) {
      state.compare = state.compare.filter((id) => id !== productId);
      el.compareStatus.textContent = `${product.name}を比較から外しました。`;
    } else if (state.compare.length < compareLimit) {
      state.compare.push(productId);
      el.compareStatus.textContent = `${product.name}を比較に追加しました（${state.compare.length}/${compareLimit}）。`;
    } else {
      el.compareStatus.textContent = `比較できるのは最大${compareLimit}機種です。いずれかを外してください。`;
    }
    renderAll();
  }

  function applyPreset(group) {
    const preset = makers.map((maker) => products.find((product) => product.makerId === maker.id && product.presetGroups.includes(group))).filter(Boolean);
    state.compare = preset.slice(0, compareLimit).map((product) => product.id);
    const label = group === "drum-representatives" ? "ドラム代表4機" : "縦型代表4機";
    el.compareStatus.textContent = `${label}の${state.compare.length}機種へ比較リストを置き換えました。`;
    renderAll();
    document.querySelector("#compare").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
  }

  function renderCompare() {
    const items = state.compare.map((id) => productMap[id]).filter(Boolean);
    el.compareEmpty.hidden = items.length > 0;
    el.compareContent.hidden = items.length === 0;
    if (!items.length) {
      el.compareWrap.innerHTML = "";
      return;
    }

    el.differenceOnly.checked = state.differenceOnly;
    el.differenceOnly.disabled = items.length < 2;
    el.differenceModeHint.textContent = items.length < 2
      ? "2機種以上を選ぶと差分を判定できます。"
      : state.differenceOnly ? "同じ値の項目を非表示にしています。" : "同じ値は薄く、異なる値は強調します。";

    const rows = compareRows(items).map((row) => {
      const values = items.map((item) => row.value(item));
      const different = items.length > 1 && new Set(values.map(comparisonSignature)).size > 1;
      return { ...row, values, different };
    });
    const visibleRows = state.differenceOnly && items.length > 1 ? rows.filter((row) => row.different) : rows;
    let currentSection = "";
    let currentGroup = "";
    const renderedRows = visibleRows.map((row) => {
      const sectionRow = row.section !== currentSection
        ? `<tr class="compare-section-row"><th colspan="${items.length + 1}" scope="colgroup">${html(row.section)}</th></tr>`
        : "";
      const groupRow = row.group !== currentGroup || sectionRow
        ? `<tr class="compare-group-row"><th colspan="${items.length + 1}" scope="colgroup">${html(row.group)}</th></tr>`
        : "";
      currentSection = row.section;
      currentGroup = row.group;
      return `${sectionRow}${groupRow}<tr class="${row.different ? "has-difference" : "is-same"}"><th scope="row">${html(row.label)}${row.different ? '<span class="difference-mark">差あり</span>' : ""}</th>${row.values.map((value) => `<td>${value}</td>`).join("")}</tr>`;
    }).join("");

    const emptyDifference = !visibleRows.length ? '<tr><td class="no-difference-rows" colspan="99">表示できる差分はありません。</td></tr>' : renderedRows;
    el.compareWrap.innerHTML = `<div class="compare-legend"><span><i aria-hidden="true"></i>値が異なる項目</span><small>「公式情報なし」は未確認、「該当なし」は製品タイプ上の非該当です。横にスクロールできます。</small></div><table class="compare-table">
      <caption>カテゴリー別詳細比較</caption>
      <thead><tr><th scope="col">比較項目</th>${items.map((item) => `<th scope="col"><span>${html(makerMap[item.makerId].name)}</span><strong>${html(item.name)}</strong><small>${html(item.models.join(" / "))}</small><button type="button" data-compare="${attr(item.id)}" aria-label="${attr(item.name)}を比較から外す">×</button></th>`).join("")}</tr></thead>
      <tbody>${emptyDifference}</tbody>
    </table>`;
  }

  function compareRows(items) {
    return [
      row("1. 基本情報・サイズ", "1.1 基本情報", "型番", (p) => html(p.models.join(" / "))),
      row("1. 基本情報・サイズ", "1.1 基本情報", "駆動方式（インバーター方式）", inverterDisplay),
      row("1. 基本情報・サイズ", "1.1 基本情報", "容量（洗濯・乾燥）", compareCapacityDisplay),
      row("1. 基本情報・サイズ", "1.2 本体サイズ", "本体幅", (p) => unit(p.dimensions.bodyWidthMm, "mm")),
      row("1. 基本情報・サイズ", "1.2 本体サイズ", "外形寸法（幅・奥行・高さ）", dimensions),

      row("2. 洗濯機能", "2.1 洗浄性能・技術", "固有洗浄機能", (p) => comparisonFeatureList(p, (f) => f.groupId === "washing" && !isCourse(f.name) && !isAiFeature(f.name))),
      row("2. 洗濯機能", "2.1 洗浄性能・技術", "AI運転", (p) => comparisonFeatureList(p, (f) => isAiFeature(f.name))),
      row("2. 洗濯機能", "2.1 洗浄性能・技術", "黄ばみとり", (p) => comparisonFeatureList(p, (f) => f.groupId === "washing" && /黄ばみ|温水.*洗浄|汚れはがし|つけおき 高濃度洗浄/.test(f.name))),
      row("2. 洗濯機能", "2.2 洗剤投入", "自動投入", (p) => laundryApplicable(p, () => official(p.specDetails?.autoDosing))),
      row("2. 洗濯機能", "2.3 給水・節水機能", "節水", (p) => comparisonFeatureList(p, (f) => /節水|穴なし槽/.test(f.name))),
      row("2. 洗濯機能", "2.3 給水・節水機能", "お湯取機能", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => /お湯取|ふろ水/.test(f.name)))),

      row("3. 乾燥機能", "3.1 乾燥技術", "乾燥方式", dryingDisplay),
      row("3. 乾燥機能", "3.1 乾燥技術", "除湿方式", dehumidificationDisplay),

      row("4. 運転コース・衣類対応", "4.1 特殊運転コース", "時短運転", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => isQuickCourse(f.name)))),
      row("4. 運転コース・衣類対応", "4.1 特殊運転コース", "衣類保護コース", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => isClothingCareCourse(f.name)))),
      row("4. 運転コース・衣類対応", "4.1 特殊運転コース", "その他", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => isCourse(f.name) && !isQuickCourse(f.name) && !isClothingCareCourse(f.name) && !isTubCare(f.name) && !isHygieneFeature(f.name)))),
      row("4. 運転コース・衣類対応", "4.2 対応衣類", "毛布・掛け布団容量", blanketCapacityDisplay),

      row("5. 清潔・メンテナンス", "5.1 自動お手入れ・メンテナンス", "清潔_メンテナンス", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => f.groupId === "care" && isMaintenance(f.name) && !isTubCare(f.name)))),
      row("5. 清潔・メンテナンス", "5.2 槽の清潔機能", "清潔_樽洗浄", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => f.groupId === "care" && isTubCare(f.name)))),
      row("5. 清潔・メンテナンス", "5.3 衣類・庫内の衛生機能", "清潔_除菌", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => isHygieneFeature(f.name)))),
      row("5. 清潔・メンテナンス", "5.4 その他", "清潔_その他清潔機能", (p) => laundryApplicable(p, () => comparisonFeatureList(p, (f) => f.groupId === "care" && !isMaintenance(f.name) && !isTubCare(f.name) && !isHygieneFeature(f.name)))),

      row("6. 操作性・利便機能", "6.1 操作インターフェース", "タッチパネル", touchPanelDisplay),
      row("6. 操作性・利便機能", "6.2 スマート・自動化機能", "スマホ連携", (p) => laundryApplicable(p, () => official(p.specDetails?.smartphone))),
      row("6. 操作性・利便機能", "6.2 スマート・自動化機能", "予約機能（時間も）", reservationDisplay),
      row("6. 操作性・利便機能", "6.3 その他の利便機能", "その他嬉しい機能", (p) => comparisonFeatureList(p, (f) => f.groupId === "convenience" && !/自動投入|スマホ|スマートフォン|COCORO WASH|ハピネスアップ|タッチ|操作パネル|予約|インバーター|モーター|お湯取|ふろ水/.test(f.name) && !isAiFeature(f.name))),

      row("7. 運転時間・省エネ性能", "7.1 運転時間", "洗濯時間（標：洗濯）", (p) => laundryApplicable(p, () => unit(p.performance.washTimeMin, "分"))),
      row("7. 運転時間・省エネ性能", "7.1 運転時間", "洗濯時間（標：洗濯・乾燥）", (p) => dryingApplicable(p, () => unit(p.performance.washDryTimeMin, "分"))),
      row("7. 運転時間・省エネ性能", "7.1 運転時間", "洗濯時間（省エネ：洗濯・乾燥）", (p) => dryingApplicable(p, () => unit(p.performance.washDryEcoTimeMin, "分"))),
      row("7. 運転時間・省エネ性能", "7.2 消費電力量", "消費電力量（標：洗濯）", washEnergyDisplay),
      row("7. 運転時間・省エネ性能", "7.2 消費電力量", "消費電力量（標：洗濯・乾燥）", (p) => dryingApplicable(p, () => unit(p.performance.washDryEnergyWh, "Wh"))),
      row("7. 運転時間・省エネ性能", "7.2 消費電力量", "消費電力量（省エネ：洗濯・乾燥）", (p) => dryingApplicable(p, () => unit(p.performance.washDryEcoEnergyWh, "Wh"))),
      row("7. 運転時間・省エネ性能", "7.3 使用水量", "標準使用水量（洗濯）", (p) => laundryApplicable(p, () => unit(p.performance.waterL, "L"))),
      row("7. 運転時間・省エネ性能", "7.3 使用水量", "標準使用水量（洗濯・乾燥）", (p) => dryingApplicable(p, () => unit(p.performance.washDryWaterL, "L")))
    ];
  }

  function row(section, group, label, value) {
    return { section, group, label, value };
  }

  function laundryApplicable(product, render) {
    return product.type === "ultrasonic-washer"
      ? '<span class="not-applicable">該当なし（衣類全体を洗う洗濯機ではありません）</span>'
      : render();
  }

  function comparisonFeatureList(product, predicate) {
    return explainerList(product.features.filter(predicate));
  }

  function isAiFeature(name) {
    return /AI[ 　]?(?:お洗濯|エコナビ|標準)/i.test(name);
  }

  function isCourse(name) {
    return /コース|モード/.test(name);
  }

  function isQuickCourse(name) {
    return /時短|おいそぎ|化繊60分|洗乾\d+分/.test(name);
  }

  function isClothingCareCourse(name) {
    return isCourse(name) && /おしゃれ着|ドライ|衣類長もち|ダウンジャケット|シワとり|しわケア|はっ水回復|タオル/.test(name);
  }

  function isTubCare(name) {
    return /槽.*(?:洗浄|洗い|おそうじ|お掃除|乾燥|クリーン)|洗濯槽|カビクリーン/.test(name);
  }

  function isHygieneFeature(name) {
    return /除菌|抗菌|消臭|UV|ナノイー|プラズマ|Ag\+/.test(name);
  }

  function isMaintenance(name) {
    return /フィルター|乾燥ダクト|乾燥経路|熱交換器|パッキン|らくメンテ|自動おそうじ機能/.test(name);
  }

  function compareCapacityDisplay(product) {
    if (product.capacities.washingKg == null) return laundryApplicable(product, () => unit(null, "kg"));
    const washing = `洗濯 ${number(product.capacities.washingKg)}kg`;
    const drying = product.capacities.dryingKg == null
      ? '<span class="not-applicable">乾燥非搭載</span>'
      : `乾燥 ${number(product.capacities.dryingKg)}kg`;
    return `${washing}<br>${drying}`;
  }

  function inverterDisplay(product) {
    return laundryApplicable(product, () => {
      if (product.comparisonFacts?.inverter) return official(product.comparisonFacts.inverter);
      const feature = product.features.find((item) => /インバーター/.test(item.name));
      return feature ? html(feature.name) : official(null);
    });
  }

  function dehumidificationDisplay(product) {
    return dryingApplicable(product, () => {
      if (product.comparisonFacts?.dehumidification) return official(product.comparisonFacts.dehumidification);
      const method = product.drying.method || "";
      if (/水冷除湿/.test(method)) return "水冷除湿";
      if (/ヒートポンプ/.test(method) && !/ハイブリッド/.test(method)) return "ヒートポンプ式";
      if (/排気式/.test(method)) return "排気式";
      return official(null);
    });
  }

  function blanketCapacityDisplay(product) {
    return laundryApplicable(product, () => {
      if (product.comparisonFacts?.blanketCapacity) return official(product.comparisonFacts.blanketCapacity);
      return product.features.some((feature) => /毛布/.test(feature.name))
        ? '毛布コースあり<br><span class="muted">対応容量は公式情報なし</span>'
        : official(null);
    });
  }

  function touchPanelDisplay(product) {
    return laundryApplicable(product, () => {
      const panel = product.specDetails?.panel || "";
      if (/タッチ/.test(panel)) return official(panel);
      const feature = product.features.find((item) => /タッチパネル|タッチナビ/.test(item.name));
      return feature ? html(feature.name) : official(null);
    });
  }

  function reservationDisplay(product) {
    return laundryApplicable(product, () => {
      if (product.comparisonFacts?.reservation) return official(product.comparisonFacts.reservation);
      return product.features.some((feature) => /予約/.test(feature.name))
        ? '予約機能あり<br><span class="muted">設定時間は公式情報なし</span>'
        : official(null);
    });
  }

  function washEnergyDisplay(product) {
    return laundryApplicable(product, () => {
      const { energyWh50Hz, energyWh60Hz, energyWh } = product.performance;
      if (energyWh50Hz != null || energyWh60Hz != null) {
        return `50Hz ${energyWh50Hz == null ? "—" : `${number(energyWh50Hz)}Wh`}<br>60Hz ${energyWh60Hz == null ? "—" : `${number(energyWh60Hz)}Wh`}`;
      }
      return unit(energyWh, "Wh");
    });
  }

  function openDetail(productId) {
    const product = productMap[productId];
    if (!product) return;
    const maker = makerMap[product.makerId];
    const selected = state.compare.includes(product.id);
    el.detail.innerHTML = `<article class="detail-article" style="--accent:${color(maker.accent)}">
      <header class="detail-head">${logoMarkup(maker)}<div><p>${html(typeMap[product.type].name)}・${product.modelYear}年</p><h2 id="detailTitle">${html(product.name)}</h2><span>${html(product.models.join(" / "))}</span></div></header>
      <div class="detail-actions"><button type="button" class="compare-button${selected ? " selected" : ""}" data-compare="${attr(product.id)}" aria-pressed="${selected}">${selected ? "比較から外す" : "比較に追加"}</button></div>
      <section class="detail-difference"><span>この機種の違い</span><strong>${html(product.differenceSummary)}</strong><p>${html(product.fit)}</p></section>
      <section><h3>基本仕様</h3><div class="spec-grid">
        ${specCard("発売時期", html(product.releaseLabel))}
        ${specCard(product.capacities.washingKg == null ? "用途" : "容量", capacityDetail(product))}
        ${specCard("乾燥方式", dryingDisplay(product))}
        ${specCard("メイン洗浄技術", firstFeature(product, "washing"))}
        ${product.type !== "ultrasonic-washer" ? specCard("温水洗浄", featureList(product, /温水/, "washing")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("自動投入", official(product.specDetails?.autoDosing)) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("自動投入タンク数", autoDosingTanks(product)) : ""}
        ${isWasherDryer(product) ? specCard("乾燥フィルター", featureList(product, /乾燥フィルター|らくメンテ/, "care")) : ""}
        ${isWasherDryer(product) ? specCard("乾燥経路のお手入れ", featureList(product, /乾燥ダクト|乾燥経路|熱交換器/, "care")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("槽自動洗浄", featureList(product, /槽.*(?:洗浄|おそうじ|お掃除)/, "care")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("標準時間", performanceLines(product, "time")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("標準使用水量", performanceLines(product, "water")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("消費電力量", performanceLines(product, "energy")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("運転音", noise(product)) : ""}
        ${specCard("外形寸法", dimensions(product))}
        ${product.type !== "ultrasonic-washer" ? specCard("ボディ幅", unit(product.dimensions.bodyWidthMm, "mm")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("質量", unit(product.dimensions.massKg, "kg")) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("防水パン条件", official(product.dimensions.pan)) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("排水方向", official(product.specDetails?.drainage)) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("扉・ふた方向", official(product.dimensions.doorDirection)) : ""}
        ${product.type !== "ultrasonic-washer" ? specCard("スマホ連携", official(product.specDetails?.smartphone)) : ""}
        ${(product.additionalSpecs || []).map((item) => specCard(item.label, html(item.value))).join("")}
      </div></section>
      <section><h3>機能</h3>${featureDetails(product)}</section>
      <section class="sales-talk"><h3>接客用の説明</h3><strong>${html(product.headline)}</strong><p>${html(product.fit)}</p></section>
      <section><h3>設置・案内上の注意</h3>${list(product.cautions)}</section>
      <section><h3>出典</h3>${sourceDetails(product)}</section>
    </article>`;
    if (typeof el.dialog.showModal === "function") el.dialog.showModal();
    else el.dialog.setAttribute("open", "");
    el.dialog.querySelector("[data-close-dialog]").focus();
  }

  function featureDetails(product) {
    const groups = featureGroups.map((group) => {
      const features = product.features.filter((feature) => feature.groupId === group.id);
      if (!features.length) return "";
      return `<div class="feature-group"><h4>${html(group.name)}</h4>${features.map((feature) => `<div><strong>${html(feature.name)}</strong><p>${html(feature.description)}</p></div>`).join("")}</div>`;
    }).join("");
    return groups ? `<div class="feature-groups">${groups}</div>` : '<p class="muted">公式情報なし</p>';
  }

  function closeDialog() {
    if (typeof el.dialog.close === "function") el.dialog.close();
    else el.dialog.removeAttribute("open");
  }

  function renderGuide() {
    el.guide.innerHTML = makers.map((maker) => `<article style="--accent:${color(maker.accent)}">${logoMarkup(maker)}<h3>${html(maker.name)}</h3><p>${html(maker.guide)}</p><button type="button" data-guide-maker="${attr(maker.id)}">${html(maker.name)}の機種を見る</button></article>`).join("");
  }

  function specCard(label, value) {
    return `<div><span>${html(label)}</span><strong>${value}</strong></div>`;
  }

  function quickSpec(label, value, suffix) {
    return `<div><span>${html(label)}</span><strong>${value == null || value === "" ? "—" : `${number(value)}${html(suffix)}`}</strong></div>`;
  }

  function list(values) {
    return values.length ? `<ul class="plain-list">${values.map((value) => `<li>${html(value)}</li>`).join("")}</ul>` : '<span class="muted">公式情報なし</span>';
  }

  function hasFeature(product, pattern, groupId) {
    return product.features.some((feature) => (!groupId || feature.groupId === groupId) && pattern.test(feature.name));
  }

  function matchingFeatures(product, pattern, groupId) {
    return matchingFeatureItems(product, pattern, groupId).map((feature) => feature.name);
  }

  function matchingFeatureItems(product, pattern, groupId) {
    return product.features.filter((feature) => (!groupId || feature.groupId === groupId) && (!pattern || pattern.test(feature.name)));
  }

  function featureList(product, pattern, groupId) {
    return list(matchingFeatures(product, pattern, groupId));
  }

  function featureExplainerList(product, pattern, groupId) {
    return explainerList(matchingFeatureItems(product, pattern, groupId));
  }

  function groupedFeatureExplainerList(product, groupId) {
    return featureExplainerList(product, null, groupId);
  }

  function explainerList(features) {
    if (!features.length) return '<span class="muted">公式情報なし</span>';
    const seen = new Set();
    const individualFeatures = features.flatMap((feature) => featureExplainerParts[feature.name] || [feature])
      .filter((feature) => {
        if (seen.has(feature.name)) return false;
        seen.add(feature.name);
        return true;
      });
    return `<ul class="feature-explainer-list">${individualFeatures.map((feature) => {
      const description = String(feature.description || "").trim();
      if (!description) return `<li><span class="feature-name-only">${html(feature.name)}</span></li>`;
      return `<li><details class="feature-explainer"><summary>${html(feature.name)}</summary><p class="feature-explainer-copy">${html(description)}</p></details></li>`;
    }).join("")}</ul>`;
  }

  function firstFeature(product, groupId) {
    const candidates = product.features.filter((item) => item.groupId === groupId);
    const feature = candidates.find((item) => !/温水|黄ばみ|汚れはがし|すすぎ|AI/.test(item.name)) || candidates[0];
    return feature ? html(feature.name) : '<span class="muted">公式情報なし</span>';
  }

  function firstFeatureExplainer(product, groupId) {
    const candidates = product.features.filter((item) => item.groupId === groupId);
    const feature = candidates.find((item) => !/温水|黄ばみ|汚れはがし|すすぎ|AI/.test(item.name)) || candidates[0];
    return feature ? explainerList([feature]) : '<span class="muted">公式情報なし</span>';
  }

  function autoDosingTanks(product) {
    const value = product.specDetails?.autoDosing || "";
    if (/トリプル/.test(value)) return "3タンク";
    if (/洗剤.*柔軟剤|柔軟剤.*洗剤/.test(value)) return "2タンク";
    if (/大容量タンク液体洗剤/.test(value)) return "1タンク";
    return '<span class="muted">公式情報なし</span>';
  }

  function dryingApplicable(product, render) {
    return isWasherDryer(product) ? render() : '<span class="not-applicable">該当なし（乾燥非搭載）</span>';
  }

  function sourceDetails(product) {
    const sourceItems = [...new Set(product.sourceIds)]
      .map((sourceId) => sourceMap[sourceId])
      .filter(Boolean);
    if (!sourceItems.length) return '<span class="muted">出典情報なし</span>';
    return `<details class="source-details"><summary>出典を見る（${sourceItems.length}件）</summary><ul>${sourceItems.map((source) => `<li><a href="${attr(source.url)}" target="_blank" rel="noreferrer">${html(source.title)}</a><span>確認日 ${html(source.checkedAt)}</span></li>`).join("")}</ul></details>`;
  }

  function unit(value, suffix) {
    return value == null || value === "" ? '<span class="muted">公式情報なし</span>' : `${number(value)}${html(suffix)}`;
  }

  function official(value) {
    return value == null || value === "" ? '<span class="muted">公式情報なし</span>' : html(String(value));
  }

  function dryingDisplay(product) {
    if (!isWasherDryer(product)) return `<span class="not-applicable">該当なし（${html(typeMap[product.type]?.name || "乾燥非搭載")}）</span>`;
    if (product.drying.method) return html(product.drying.method);
    return '<span class="muted">公式情報なし</span>';
  }

  function specPair(labelA, valueA, unitA, labelB, valueB, unitB) {
    const values = [];
    if (valueA != null) values.push(`${html(labelA)} ${number(valueA)}${html(unitA)}`);
    if (valueB != null) values.push(`${html(labelB)} ${number(valueB)}${html(unitB)}`);
    return values.length ? values.join("<br>") : '<span class="muted">公式情報なし</span>';
  }

  function performanceLines(product, kind) {
    const p = product.performance;
    const washEnergy = p.energyWh50Hz != null || p.energyWh60Hz != null
      ? [["洗濯 50Hz", p.energyWh50Hz, "Wh"], ["洗濯 60Hz", p.energyWh60Hz, "Wh"]]
      : [["洗濯", p.energyWh, "Wh"]];
    const definitions = {
      time: [["洗濯", p.washTimeMin, "分"], ["洗乾", p.washDryTimeMin, "分"], ["洗乾 省エネ", p.washDryEcoTimeMin, "分"]],
      water: [["洗濯", p.waterL, "L"], ["洗乾", p.washDryWaterL, "L"]],
      energy: [...washEnergy, ["洗乾", p.washDryEnergyWh, "Wh"], ["洗乾 省エネ", p.washDryEcoEnergyWh, "Wh"]]
    };
    const values = definitions[kind].filter(([, value]) => value != null).map(([label, value, suffix]) => `${html(label)} ${number(value)}${html(suffix)}`);
    return values.length ? values.join("<br>") : '<span class="muted">公式情報なし</span>';
  }

  function comparisonSignature(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value);
    template.content.querySelectorAll(".feature-explainer-copy").forEach((node) => node.remove());
    return (template.content.textContent || "").replace(/公式情報なし/g, "—").replace(/\s+/g, "").trim();
  }

  function noise(product) {
    const { washDb, spinDb, dryDb } = product.performance.noise;
    const values = [];
    if (washDb != null) values.push(`洗い ${number(washDb)}dB`);
    if (spinDb != null) values.push(`脱水 ${number(spinDb)}dB`);
    if (dryDb != null) values.push(`乾燥 ${number(dryDb)}dB`);
    return values.length ? values.join("<br>") : '<span class="muted">公式情報なし</span>';
  }

  function dimensions(product) {
    const { widthMm, depthMm, heightMm } = product.dimensions;
    return [widthMm, depthMm, heightMm].every((value) => value != null)
      ? `${number(widthMm)} × ${number(depthMm)} × ${number(heightMm)}mm<br><small>幅 × 奥行 × 高さ</small>`
      : '<span class="muted">公式情報なし</span>';
  }

  function isWasherDryer(product) {
    return product.type.includes("washer-dryer");
  }

  function washingCapacityDisplay(product) {
    return product.capacities.washingKg == null
      ? `<span class="not-applicable">該当なし（${html(product.capacityNote || typeMap[product.type]?.name || "容量設定なし")}）</span>`
      : unit(product.capacities.washingKg, "kg");
  }

  function capacityDetail(product) {
    if (product.capacities.washingKg == null) return html(product.capacityNote || "洗濯容量の設定なし");
    return `洗濯 ${number(product.capacities.washingKg)}kg${product.capacities.dryingKg != null ? ` / 乾燥 ${number(product.capacities.dryingKg)}kg` : ""}`;
  }

  function capacityLine(product) {
    if (product.capacities.washingKg == null) return `<strong>${html(product.capacityNote || typeMap[product.type]?.name || "容量設定なし")}</strong>`;
    return `<strong>洗濯 ${number(product.capacities.washingKg)}kg</strong>${product.capacities.dryingKg != null ? `<span>乾燥 ${number(product.capacities.dryingKg)}kg</span>` : ""}`;
  }

  function normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/[\s\u002d\u2010-\u2015\u2212]+/g, "");
  }

  function number(value) {
    return Number(value).toLocaleString("ja-JP", { maximumFractionDigits: 1 });
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function color(value) {
    return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#0f766e";
  }

  function html(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function attr(value) {
    return html(value).replace(/`/g, "&#96;");
  }
})();
