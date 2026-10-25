/* Buildless local preview. All content comes from the adjacent data.js. */
(() => {
  'use strict';
  const data = window.CATALOGUE;
  const main = document.querySelector('#main');
  if (!main) return;
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
    main.innerHTML = '<div class="container startup"><div class="empty-state"><h1>الكتالوج قيد الإعداد</h1><p>تعذّر تحميل بيانات المعاينة. تأكد من وجود ملف data.js بجوار الصفحة.</p></div></div>';
    return;
  }
  const categories = data.categories, products = data.products;
  const dialog = document.querySelector('#product-dialog');
  const content = document.querySelector('#dialog-content');
  let routeKey = '', currentCategory = 'all', query = '', subcategory = '', returnHash = '#home', dialogTrigger = null, suppressClose = false;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ـ/g,'').replace(/\s+/g,' ').trim();
  const categoryById = id => categories.find(category => category.id === id);
  const count = id => products.filter(product => product.categoryId === id).length;
  const image = (src, alt, eager = false) => `<img src="${escape(src || 'assets/missing-image.svg')}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
  const icon = (name = 'arrow') => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${name === 'external' ? 'M7 17 17 7M7 7h10v10' : 'M20 12H4m6-6-6 6 6 6'}"/></svg>`;
  const categoryLink = category => `#category/${encodeURIComponent(category.id)}`;
  function prepareImages(root = document) {
    root.querySelectorAll('img').forEach(img => {
      const fail = () => { img.parentElement.dataset.imageState='error';img.hidden = true; img.parentElement.classList.add('image-missing'); img.parentElement.setAttribute('role','img'); img.parentElement.setAttribute('aria-label',`صورة غير متاحة: ${img.alt}`); };
      img.parentElement.dataset.imageState = img.complete && img.naturalWidth ? 'loaded' : 'loading';
      img.addEventListener('load',() => {img.parentElement.dataset.imageState='loaded';},{once:true});
      img.addEventListener('error', fail, {once:true});
      if (img.complete && !img.naturalWidth) fail();
    });
  }
  function productCard(product, eager = false) {
    const category = categoryById(product.categoryId);
    return `<article class="product-card"><a href="#product/${encodeURIComponent(product.id)}" data-product="${escape(product.id)}" aria-label="تفاصيل ${escape(product.nameAr)}"><div class="product-image">${image(product.image,product.nameAr,eager)}<span class="product-open">${icon()}</span></div><div class="product-label">${escape(category?.nameAr || '')}</div><h3>${escape(product.nameAr)}</h3><span class="latin" lang="fr">${escape(product.nameFr)}</span></a></article>`;
  }
  function home() {
    const shelf = ['p379','p192','p299'].map(id => products.find(product => product.id === id)).filter(Boolean);
    const featured = products.filter(product => product.featured).slice(0,4);
    if (featured.length < 4) products.forEach(product => {if (featured.length < 4 && !featured.includes(product)) featured.push(product);});
    main.innerHTML = `<section class="hero container" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title">زيوت، عناية وأعشاب.</h1><p>تصفّح المنتوجات حسب الفئة، وتعرّف إلى أسمائها وتفاصيلها.</p><a class="button" href="#catalogue/all">تصفّح الكتالوج ${icon()}</a><form class="home-search" role="search"><label for="home-search">ابحث عن منتوج</label><div class="home-search-control"><input id="home-search" type="search" placeholder="الاسم بالعربية أو بالفرنسية" autocomplete="off"><button class="icon-button" type="submit" aria-label="ابحث في الكتالوج"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button></div></form></div><div class="product-shelf" aria-label="أمثلة من الكتالوج">${shelf.map(product => productCard(product,true)).join('')}</div></section><section id="categories" class="section category-section container" aria-labelledby="category-title"><div class="section-heading"><h2 id="category-title">تصفّح حسب الفئة</h2><a class="text-link" href="#catalogue/all">جميع المنتوجات ${icon()}</a></div><div class="category-grid">${categories.map(category => `<a class="category-tile" href="${categoryLink(category)}"><div class="category-image">${image(category.image,'')}</div><div class="category-title"><h3>${escape(category.nameAr)}</h3>${icon()}</div></a>`).join('')}</div></section><section class="section featured-section" aria-labelledby="featured-title"><div class="container"><div class="section-heading"><h2 id="featured-title">من الكتالوج</h2><a class="text-link" href="#catalogue/all">عرض الكل ${icon()}</a></div><div class="product-grid">${featured.map(product => productCard(product)).join('')}</div></div></section>`;
    document.querySelector('.home-search').addEventListener('submit',event => {
      event.preventDefault();
      const value = document.querySelector('#home-search').value;
      location.hash = '#catalogue/all';
      setTimeout(() => {query = value;const input = document.querySelector('#catalogue-search');if(input){input.value=query;renderProducts();input.focus();}},0);
    });
    prepareImages(main);
  }
  function catalogue(id) {
    currentCategory = categoryById(id) ? id : 'all';
    const category = categoryById(currentCategory);
    const relevant = category ? products.filter(product => product.categoryId === category.id) : products;
    const subs = category ? [...new Set([...(category.subcategories || []),...relevant.map(product => product.subcategory).filter(Boolean)])] : [];
    main.innerHTML = `<div class="container"><nav class="breadcrumb" aria-label="مسار الصفحة"><a href="#home">الرئيسية</a><span aria-hidden="true">/</span>${category ? `<a href="#catalogue/all">الكتالوج</a><span aria-hidden="true">/</span><span>${escape(category.nameAr)}</span>` : '<span>الكتالوج</span>'}</nav><header class="catalogue-heading"><div><h1>${escape(category?.nameAr || 'جميع المنتوجات')}</h1><div class="latin" lang="fr">${escape(category?.nameFr || '')}</div><p>${escape(category?.description || 'تصفّح أمثلة من الفئات الثماني، وابحث بالاسم العربي أو الفرنسي لتكتشف تفاصيل كل منتوج.')}</p></div><div class="catalogue-count">${relevant.length}<small>منتوجات للمعاينة</small></div></header><div class="catalogue-layout"><aside><div class="mobile-category-field"><label for="mobile-category">اختر الفئة</label><select id="mobile-category"><option value="all" ${!category ? 'selected' : ''}>جميع الفئات</option>${categories.map(item => `<option value="${escape(item.id)}" ${item.id === currentCategory ? 'selected' : ''}>${escape(item.nameAr)}</option>`).join('')}</select></div><nav class="category-sidebar" aria-label="تصفية حسب الفئة"><div class="sidebar-label">الفئات</div><a href="#catalogue/all" ${!category ? 'aria-current="page"' : ''}><span>جميع الفئات</span><small>${products.length}</small></a>${categories.map(item => `<a href="${categoryLink(item)}" ${item.id === currentCategory ? 'aria-current="page"' : ''}><span>${escape(item.nameAr)}</span><small>${count(item.id)}</small></a>`).join('')}</nav></aside><div class="catalogue-content"><form class="catalogue-toolbar" role="search"><div class="search-field"><label for="catalogue-search">ابحث في ${category ? escape(category.nameAr) : 'جميع المنتوجات'}</label><input id="catalogue-search" type="search" placeholder="اسم المنتوج بالعربية أو بالفرنسية…" autocomplete="off" value="${escape(query)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></div><button class="button secondary reset-filters" type="button">مسح البحث</button></form>${subs.length ? `<div class="filter-chips" role="group" aria-label="الفئات الفرعية"><button class="chip" data-sub="" aria-pressed="true">الكل</button>${subs.map(sub => `<button class="chip" data-sub="${escape(sub)}" aria-pressed="false">${escape(sub)}</button>`).join('')}</div>` : ''}<div class="results-line"><span id="result-count" role="status" aria-live="polite"></span><span>الترتيب حسب الكتالوج</span></div><div id="catalogue-results"></div></div></div></div>`;
    document.querySelector('.catalogue-toolbar').addEventListener('submit',event => event.preventDefault());
    document.querySelector('#catalogue-search').addEventListener('input',event => {query = event.target.value; renderProducts();});
    document.querySelector('.reset-filters').addEventListener('click',clearSearch);
    document.querySelector('#mobile-category').addEventListener('change',event => {location.hash = event.target.value === 'all' ? '#catalogue/all' : categoryLink(categoryById(event.target.value));});
    document.querySelectorAll('[data-sub]').forEach(button => button.addEventListener('click',() => {subcategory = button.dataset.sub;renderProducts();}));
    renderProducts();
  }
  function clearSearch() { query = '';document.querySelector('#catalogue-search').value = '';renderProducts();document.querySelector('#catalogue-search').focus(); }
  function resetFilters() { query = '';subcategory = '';document.querySelector('#catalogue-search').value = '';renderProducts();document.querySelector('#catalogue-search').focus(); }
  function renderProducts() {
    document.querySelector('.reset-filters').disabled = !query;
    const normalizedQuery = normalize(query);
    const results = products.filter(product => (currentCategory === 'all' || product.categoryId === currentCategory) && (!subcategory || product.subcategory === subcategory) && normalize(`${product.nameAr} ${product.nameFr} ${product.subcategory || ''}`).includes(normalizedQuery));
    document.querySelector('#result-count').textContent = `${results.length} من ${currentCategory === 'all' ? products.length : count(currentCategory)} منتوجات`;
    document.querySelectorAll('[data-sub]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.sub === subcategory)));
    const host = document.querySelector('#catalogue-results');
    host.innerHTML = results.length ? `<div class="product-grid catalogue-products">${results.map(product => productCard(product)).join('')}</div>` : '<div class="empty-state"><h2>لم نجد منتوجاً بهذا الاسم.</h2><p>جرّب كلمة أخرى بالعربية أو بالفرنسية، أو امسح عوامل التصفية لرؤية المنتوجات المقترحة.</p><button class="button reset-empty" type="button">عرض المنتوجات</button></div>';
    host.querySelector('.reset-empty')?.addEventListener('click',resetFilters);
    prepareImages(host);
  }
  function closeProduct() {
    if (!location.hash.startsWith('#product/')) return;
    location.hash = returnHash;
  }
  function showProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) { location.replace('#catalogue/all');return; }
    const category = categoryById(product.categoryId);
    content.innerHTML = `<div class="dialog-grid"><div class="dialog-image">${image(product.image,product.nameAr,true)}</div><div class="dialog-copy"><p class="dialog-category-name">${escape(category?.nameAr || '')}</p><h2 id="dialog-title">${escape(product.nameAr)}</h2><span class="latin" lang="fr">${escape(product.nameFr)}</span><p>${escape(product.description || 'منتوج معروض هنا كمثال لمراجعة التشكيلة المقترحة.')}</p><div class="detail-rule"><span>الفئة الفرعية</span><span>${escape(product.subcategory || category?.nameAr || '—')}</span></div><a class="button secondary dialog-category" href="${category ? categoryLink(category) : '#catalogue/all'}">اكتشف الفئة ${icon()}</a></div></div>`;
    prepareImages(content);
    if (!dialog.open) {dialog.showModal();document.body.style.overflow='hidden';}
    document.querySelector('.dialog-close').focus();
  }
  function navigate() {
    const hash = location.hash || '#home';
    const segments = hash.slice(1).split('/');
    let id;
    try {id = decodeURIComponent(segments[1] || '');} catch {id = '';}
    if (segments[0] === 'product') {
      if (!routeKey) {const product = products.find(item => item.id === id);returnHash = product ? `#category/${product.categoryId}` : '#catalogue/all';catalogue(product?.categoryId || 'all');routeKey = returnHash;}
      showProduct(id);return;
    }
    const wasDialogOpen = dialog.open;
    if (dialog.open) {suppressClose=true;dialog.close();suppressClose=false;document.body.style.overflow='';}
    const nextKey = segments[0] === 'category' ? `#category/${id}` : segments[0] === 'catalogue' ? '#catalogue/all' : '#home';
    const unchanged = routeKey === nextKey;
    if (!unchanged) {
      query = '';subcategory = '';
      if (nextKey === '#home') home(); else catalogue(segments[0] === 'category' ? id : 'all');
      routeKey = nextKey;
      window.scrollTo({top:0,behavior:'instant'});
      main.focus({preventScroll:true});
    }
    returnHash = hash;
    document.querySelectorAll('[data-nav]').forEach(link => {if (link.dataset.nav === (nextKey === '#home' ? 'home' : 'catalogue')) link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if (hash === '#home/categories') requestAnimationFrame(() => document.querySelector('#categories')?.scrollIntoView());
    if (unchanged && dialogTrigger?.isConnected) dialogTrigger.focus({preventScroll:true});
    else if (unchanged && wasDialogOpen) main.focus({preventScroll:true});
  }
  document.addEventListener('click',event => {
    const card = event.target.closest('[data-product]');
    if (card) {dialogTrigger=card;if (!location.hash.startsWith('#product/')) returnHash=location.hash || '#home';}
    const navigation = event.target.closest('a[href^="#"]');
    if (navigation?.getAttribute('href') === '#main') {
      event.preventDefault();
      main.focus({preventScroll:true});
      main.scrollIntoView({block:'start'});
      return;
    }
    if (navigation && navigation.getAttribute('href') !== '#main') {
      document.querySelector('#mobile-nav').hidden=true;
      document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');
      if (navigation.hash === location.hash && !navigation.hash.startsWith('#product/')) navigate();
    }
  });
  document.querySelector('.dialog-close').addEventListener('click',closeProduct);
  dialog.addEventListener('cancel',event => {event.preventDefault();closeProduct();});
  dialog.addEventListener('close',() => {document.body.style.overflow='';if (!suppressClose && location.hash.startsWith('#product/')) closeProduct();});
  dialog.addEventListener('click',event => {if (event.target === dialog) {const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom) closeProduct();}});
  document.querySelector('.menu-toggle').addEventListener('click',event => {const button=event.currentTarget;const expanded=button.getAttribute('aria-expanded') === 'true';button.setAttribute('aria-expanded',String(!expanded));document.querySelector('#mobile-nav').hidden=expanded;});
  document.querySelector('.search-trigger').addEventListener('click',() => {const focusSearch=() => document.querySelector('#catalogue-search')?.focus();if (location.hash === '#catalogue/all') focusSearch();else {location.hash='#catalogue/all';setTimeout(focusSearch,0);}});
  document.addEventListener('keydown',event => {if (event.key === 'Escape' && !dialog.open) {const toggle=document.querySelector('.menu-toggle');const wasExpanded=toggle.getAttribute('aria-expanded') === 'true';document.querySelector('#mobile-nav').hidden=true;toggle.setAttribute('aria-expanded','false');if(wasExpanded)toggle.focus();}});
  document.querySelector('#reference-links').innerHTML = [['facebook','فيسبوك'],['maps','موقع المتجر']].filter(([key]) => data.links?.[key]).map(([key,label]) => `<a href="${escape(data.links[key])}" target="_blank" rel="noopener noreferrer">${label} ${icon('external')}</a>`).join('');
  document.addEventListener('keydown',() => document.body.classList.add('keyboard-input'));
  document.addEventListener('pointerdown',() => document.body.classList.remove('keyboard-input'));
  window.addEventListener('hashchange',navigate);
  navigate();
})();
