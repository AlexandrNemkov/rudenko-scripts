
<style>
/* Styles will be injected once the target record is detected.
   These base classes are inert until a record gets the bs-init class. */
.bs-init .t-container { max-width: 1200px; margin: 0 auto; }

.bs-init .js-store-grid-cont {
  display: flex !important;
  flex-wrap: nowrap !important;
  gap: 24px;
  overflow-x: auto; /* allow user scroll */
  overflow-y: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}
.bs-init .js-store-grid-cont::-webkit-scrollbar { display: none; } /* WebKit */

.bs-init .t-store__grid-cont { padding-left: 0; padding-right: 0; }
.bs-spacer { flex: 0 0 var(--bs-spacer-w,0px); width: var(--bs-spacer-w,0px); height: 1px; visibility: hidden; pointer-events: none; }

.bs-init .js-store-grid-cont > .t-col {
  /* keep natural ST300 card width so initial look matches design */
  flex: 0 0 auto;
  scroll-snap-align: start;
}

.bs-init .t-store__grid-separator { display: none; }

.bs-arrows { position: relative; height: 0; }
.bs-arrows__btn {
  position: absolute;
  top: -60px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform .15s ease;
}
.bs-arrows__btn:hover { transform: translateY(-1px); }
.bs-arrows__btn:disabled { opacity: .4; cursor: default; }
.bs-arrows__btn--prev { right: 56px; }
.bs-arrows__btn--next { right: 12px; }

@media (max-width: 1279px) {
  .bs-init .t-container { max-width: calc(100% - 40px); }
}
</style>

<script>
(function () {
  // Find the record immediately below the heading "БЕСТСЕЛЛЕРЫ"
  function findBestsellersRecord() {
    var allRecs = Array.prototype.slice.call(document.querySelectorAll('.r.t-rec'));
    var titleRecIdx = -1;
    for (var i = 0; i < allRecs.length; i++) {
      var rec = allRecs[i];
      // Look for any visible text node that equals the heading
      var txt = (rec.textContent || '').trim().toUpperCase();
      if (txt.indexOf('БЕСТСЕЛЛЕР') !== -1) { // handles БЕСТСЕЛЛЕР/БЕСТСЕЛЛЕРЫ
        titleRecIdx = i;
        break;
      }
    }
    if (titleRecIdx < 0) return null;

    // Scan down to the next record that contains a Tilda store grid (ST300 compatible)
    for (var j = titleRecIdx + 1; j < allRecs.length; j++) {
      var nextRec = allRecs[j];
      if (nextRec.querySelector('.t-store, .js-store, .js-store-grid-cont, [class*="t-store_"]')) {
        return nextRec;
      }
    }
    return null;
  }

  function initOn(rec) {
    if (!rec) return;
    // Skip if already initialized
    if (rec.classList.contains('bs-init')) return;
    rec.classList.add('bs-init');

    var grid = rec.querySelector('.js-store-grid-cont');
    if (!grid || grid.children.length === 0) {
      setTimeout(function(){ initOn(rec); }, 400);
      return;
    }

    // Inject arrows once
    if (!rec.querySelector('.bs-arrows')) {
      var holder = document.createElement('div');
      holder.className = 'bs-arrows';
      holder.innerHTML =
        '<button class="bs-arrows__btn bs-arrows__btn--prev" aria-label="Назад" type="button">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
        '</button>'+
        '<button class="bs-arrows__btn bs-arrows__btn--next" aria-label="Вперёд" type="button">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
        '</button>';
      grid.parentNode.insertBefore(holder, grid);
    }

    var btnPrev = rec.querySelector('.bs-arrows__btn--prev');
    var btnNext = rec.querySelector('.bs-arrows__btn--next');

    function getStep() {
      var cont = rec.querySelector('.t-container');
      var w = cont ? cont.clientWidth : 1200;
      return Math.max(280, w - 100);
    }

    function getCardStep() {
      var firstItem = grid.querySelector('.t-col');
      if (!firstItem) return 300;
      var style = window.getComputedStyle(grid);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      var w = firstItem.getBoundingClientRect().width || firstItem.offsetWidth;
      return w + gap;
    }

    function clampButtons() {
      var maxScroll = grid.scrollWidth - grid.clientWidth - 1;
      btnPrev.disabled = grid.scrollLeft <= 0;
      btnNext.disabled = grid.scrollLeft >= maxScroll;
    }

    btnPrev.addEventListener('click', function () {
      grid.scrollBy({ left: -getStep(), behavior: 'smooth' });
      setTimeout(clampButtons, 350);
    });
    btnNext.addEventListener('click', function () {
      grid.scrollBy({ left: getStep(), behavior: 'smooth' });
      setTimeout(clampButtons, 350);
    });

    grid.addEventListener('scroll', clampButtons);
    // Mouse wheel horizontal scroll (Shift not required)
    grid.addEventListener('wheel', function(e){
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        grid.scrollLeft += e.deltaY; // convert vertical to horizontal
        e.preventDefault();
      }
    }, { passive: false });

    // Drag to scroll
    var isDown = false, startX = 0, startLeft = 0;
    grid.addEventListener('mousedown', function(e){ isDown = true; startX = e.clientX; startLeft = grid.scrollLeft; stopAutoplay(); });
    window.addEventListener('mouseup', function(){ isDown = false; startAutoplay(); });
    window.addEventListener('mousemove', function(e){ if(!isDown) return; grid.scrollLeft = startLeft - (e.clientX - startX); });
    window.addEventListener('resize', clampButtons);
    // Insert leading spacer equal to one card width to match design
    var firstCol = grid.querySelector('.t-col');
    if (firstCol && !grid.querySelector('.bs-spacer')) {
      var spacer = document.createElement('div');
      spacer.className = 'bs-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      var stepPx = getCardStep();
      spacer.style.setProperty('--bs-spacer-w', stepPx + 'px');
      spacer.style.flex = '0 0 ' + stepPx + 'px';
      spacer.style.width = stepPx + 'px';
      grid.insertBefore(spacer, firstCol);
    }
    // keep spacer in sync on resize
    function resizeSpacer(){
      var sp = grid.querySelector('.bs-spacer');
      if (!sp) return;
      var stepPx = getCardStep();
      sp.style.setProperty('--bs-spacer-w', stepPx + 'px');
      sp.style.flex = '0 0 ' + stepPx + 'px';
      sp.style.width = stepPx + 'px';
    }
    grid.scrollLeft = 0; // align with heading initially with spacer padding
    clampButtons();

    // Autoplay: move one card to the left at intervals, pause on hover/focus
    var autoplayTimer = null;
    var autoplayDelayMs = 2600;

    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    function playStep() {
      var step = getCardStep();
      var maxScroll = grid.scrollWidth - grid.clientWidth - 1;
      var nextLeft = grid.scrollLeft + step;
      if (nextLeft >= maxScroll) {
        grid.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        var idx = Math.round(grid.scrollLeft / step) + 1;
        var target = idx * step;
        grid.scrollTo({ left: target, behavior: 'smooth' });
      }
      setTimeout(clampButtons, 350);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(playStep, autoplayDelayMs);
    }

    rec.addEventListener('mouseenter', stopAutoplay);
    rec.addEventListener('mouseleave', startAutoplay);
    rec.addEventListener('touchstart', stopAutoplay, { passive: true });
    rec.addEventListener('touchend', startAutoplay, { passive: true });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    // Autoplay only when record is visible
    var io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) startAutoplay(); else stopAutoplay();
        });
      }, { root: null, threshold: 0.2 });
      io.observe(rec);
    } else {
      startAutoplay();
    }
    window.addEventListener('resize', function(){ clampButtons(); resizeSpacer(); });
  }

  function boot() {
    var rec = findBestsellersRecord();
    if (!rec) { setTimeout(boot, 500); return; }
    initOn(rec);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 1200); // retry after lazy store fill
})();
</script>


