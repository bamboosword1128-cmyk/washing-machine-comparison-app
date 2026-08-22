(() => {
  "use strict";

  const data = window.APPLIANCE_DATA;
  if (!data?.app || !Array.isArray(data.products) || !Array.isArray(data.makers)) {
    document.body.innerHTML = '<p class="fatal-error">洗濯機データを読み込めませんでした。</p>';
    return;
  }

  const { app, products, makers, washerTypes, capacityGroups, featureGroups, sources } = data;
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
    differenceSummary: document.querySelector("#differenceSummary"),
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
        <p class="talk">${html(product.differenceSummary || product.fit)}</p>
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
      el.differenceSummary.innerHTML = "";
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
    let currentGroup = "";
    const renderedRows = visibleRows.map((row) => {
      const groupRow = row.group !== currentGroup
        ? `<tr class="compare-group-row"><th colspan="${items.length + 1}">${html(row.group)}</th></tr>`
        : "";
      currentGroup = row.group;
      return `${groupRow}<tr class="${row.different ? "has-difference" : "is-same"}"><th scope="row">${html(row.label)}${row.different ? '<span class="difference-mark">差あり</span>' : ""}</th>${row.values.map((value) => `<td>${value}</td>`).join("")}</tr>`;
    }).join("");

    renderDifferenceSummary(items, rows);
    const emptyDifference = !visibleRows.length ? '<tr><td class="no-difference-rows" colspan="99">表示できる差分はありません。</td></tr>' : renderedRows;
    el.compareWrap.innerHTML = `<div class="compare-legend"><span><i aria-hidden="true"></i>値が異なる項目</span><small>機能名を押すと説明を表示（公式カタログ・商品情報の要約）／横にスクロールできます</small></div><table class="compare-table">
      <thead><tr><th scope="col">比較項目</th>${items.map((item) => `<th scope="col"><span>${html(makerMap[item.makerId].name)}</span><strong>${html(item.name)}</strong><small>${html(item.models.join(" / "))}</small><button type="button" data-compare="${attr(item.id)}" aria-label="${attr(item.name)}を比較から外す">×</button></th>`).join("")}</tr></thead>
      <tbody>${emptyDifference}</tbody>
    </table>`;
  }

  function compareRows(items) {
    const includesDryer = items.some(isWasherDryer);
    const additionalLabels = [...new Set(items.flatMap((product) => (product.additionalSpecs || []).map((item) => item.label)))];
    const priority = [
      row("タイプ", "最重要15項目", (p) => html(typeMap[p.type].name)),
      row("洗濯容量", "最重要15項目", washingCapacityDisplay),
      ...(includesDryer ? [row("乾燥容量", "最重要15項目", (p) => dryingApplicable(p, () => unit(p.capacities.dryingKg, "kg")))] : []),
      row("本体サイズ", "最重要15項目", dimensions),
      ...(includesDryer ? [row("乾燥方式", "最重要15項目", dryingDisplay)] : []),
      row("メイン洗浄技術", "最重要15項目", (p) => firstFeatureExplainer(p, "washing")),
      row("温水洗浄", "最重要15項目", (p) => featureExplainerList(p, /温水/, "washing")),
      row("洗剤・柔軟剤自動投入", "最重要15項目", (p) => official(p.specDetails?.autoDosing)),
      row("自動投入タンク数", "最重要15項目", autoDosingTanks),
      ...(includesDryer ? [
        row("乾燥仕上げ・シワ低減", "最重要15項目", (p) => dryingApplicable(p, () => featureExplainerList(p, /風アイロン|ジェット乾燥|ハイブリッド乾燥NEXT|ふんわリッチ速乾/, "drying"))),
        row("乾燥フィルターのお手入れ", "最重要15項目", (p) => dryingApplicable(p, () => featureExplainerList(p, /乾燥フィルター|らくメンテ/, "care"))),
        row("乾燥経路自動洗浄", "最重要15項目", (p) => dryingApplicable(p, () => featureExplainerList(p, /乾燥ダクト|乾燥経路|熱交換器/, "care")))
      ] : []),
      row("槽自動洗浄", "最重要15項目", (p) => featureExplainerList(p, /槽.*(?:洗浄|おそうじ|お掃除)/, "care")),
      ...(includesDryer ? [
        row("洗濯〜乾燥時間", "最重要15項目", (p) => dryingApplicable(p, () => unit(p.performance.washDryTimeMin, "分"))),
        row("洗濯乾燥時消費電力量", "最重要15項目", (p) => dryingApplicable(p, () => unit(p.performance.washDryEnergyWh, "Wh")))
      ] : [])
    ];
    return [
      ...priority,
      row("メーカー", "基本情報・設置", (p) => html(makerMap[p.makerId].name)),
      row("型番", "基本情報・設置", (p) => html(p.models.join(" / "))),
      row("発売時期", "基本情報・設置", (p) => html(p.releaseLabel)),
      row("ボディ幅", "基本情報・設置", (p) => unit(p.dimensions.bodyWidthMm, "mm")),
      row("本体質量", "基本情報・設置", (p) => unit(p.dimensions.massKg, "kg")),
      row("扉・ふた方向", "基本情報・設置", (p) => official(p.dimensions.doorDirection)),
      row("防水パン条件", "基本情報・設置", (p) => official(p.dimensions.pan)),
      row("排水方向", "基本情報・設置", (p) => official(p.specDetails?.drainage)),
      row("洗浄機能", "洗浄・清潔", (p) => groupedFeatureExplainerList(p, "washing")),
      row("清潔・お手入れ機能", "洗浄・清潔", (p) => groupedFeatureExplainerList(p, "care")),
      ...(includesDryer ? [row("乾燥機能", "乾燥", (p) => dryingApplicable(p, () => groupedFeatureExplainerList(p, "drying")))] : []),
      row("標準時間", "運転性能", (p) => performanceLines(p, "time")),
      row("標準使用水量", "運転性能", (p) => performanceLines(p, "water")),
      row("消費電力量", "運転性能", (p) => performanceLines(p, "energy")),
      row("運転音", "運転性能", noise),
      row("スマホ連携", "操作・便利", (p) => official(p.specDetails?.smartphone)),
      row("操作パネル", "操作・便利", (p) => official(p.specDetails?.panel)),
      row("便利機能", "操作・便利", (p) => groupedFeatureExplainerList(p, "convenience")),
      ...additionalLabels.map((label) => row(label, "専用仕様", (p) => official((p.additionalSpecs || []).find((item) => item.label === label)?.value))),
      row("向くお客様", "接客メモ", (p) => html(p.fit)),
      row("注意事項", "接客メモ", (p) => list(p.cautions))
    ];
  }

  function row(label, group, value) {
    return { label, group, value };
  }

  function renderDifferenceSummary(items, rows) {
    if (items.length < 2) {
      el.differenceSummary.innerHTML = '<h3 id="differenceSummaryTitle">主な違い</h3><p>もう1機種追加すると、事実の差分をここに自動表示します。</p>';
      return;
    }
    const differences = rows.filter((row) => row.different).slice(0, 6);
    const sameWashCapacity = items.every((item) => item.capacities.washingKg != null) && new Set(items.map((item) => item.capacities.washingKg)).size === 1
      ? `<li>洗濯容量は全機種 ${number(items[0].capacities.washingKg)}kgです。</li>`
      : "";
    const differenceItems = differences.map((row) => `<li>${differenceSentence(row, items)}</li>`).join("");
    el.differenceSummary.innerHTML = `<h3 id="differenceSummaryTitle">主な違い</h3><ul>${differenceItems || "<li>表示項目では差が確認できません。</li>"}${sameWashCapacity}</ul><p>優劣ではなく、公式情報で確認できた値の違いだけを表示しています。</p>`;
  }

  function differenceSentence(row, items) {
    const groups = new Map();
    row.values.forEach((value, index) => {
      const label = plainComparisonValue(value);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(items[index].name);
    });
    return `<strong>${html(row.label)}</strong>：${[...groups.entries()].map(([value, names]) => `${html(names.join("・"))}「${html(value)}」`).join("／")}`;
  }

  function plainComparisonValue(value) {
    const text = String(value).replace(/<br\s*\/?\s*>/gi, "・").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    return text || "公式情報なし";
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
    return `<ul class="feature-explainer-list">${features.map((feature) => {
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
