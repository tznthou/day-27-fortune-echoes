/**
 * ripple.js - D3 Ripple Effects
 * Fortune Echoes 財運迴響
 */

const RippleModule = (() => {
  let svg = null;
  let rippleGroup = null;
  let orbGroup = null;
  let tooltip = null;
  let currentOrbs = [];
  let resizeHandler = null; // [H02] Store handler reference for cleanup

  // Ripple config by lottery type
  const RIPPLE_CONFIG = {
    '威力彩': { baseRadius: 50, rings: 4, color: '#ff6b35', duration: 2500 },
    '大樂透': { baseRadius: 40, rings: 3, color: '#fbbf24', duration: 2000 },
    '今彩539': { baseRadius: 30, rings: 2, color: '#d97706', duration: 1500 }
  };

  const DEFAULT_CONFIG = { baseRadius: 30, rings: 2, color: '#d97706', duration: 1500 };

  /**
   * [H06] Escape HTML to prevent XSS
   * @param {string} text - raw text
   * @returns {string} - escaped HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * [M02] Check if point is within viewport
   * @param {number} x - pixel x
   * @param {number} y - pixel y
   * @param {number} margin - extra margin in pixels
   * @returns {boolean}
   */
  function isInViewport(x, y, margin = 100) {
    const { width, height } = MapModule.getSize();
    return x >= -margin && x <= width + margin &&
           y >= -margin && y <= height + margin;
  }

  /**
   * Initialize SVG layer
   */
  function init() {
    svg = d3.select('#ripple-layer');
    tooltip = d3.select('#tooltip');

    // Create groups for layering
    orbGroup = svg.append('g').attr('class', 'orb-group');
    rippleGroup = svg.append('g').attr('class', 'ripple-group');

    // [H02] Store handler reference for cleanup
    resizeHandler = updateSize;
    updateSize();
    window.addEventListener('resize', resizeHandler);

    console.log('[RippleModule] Initialized');
  }

  /**
   * Update SVG size to match window
   */
  function updateSize() {
    const { width, height } = MapModule.getSize();
    svg.attr('width', width).attr('height', height);
  }

  /**
   * Clear all ripples and orbs
   * [H02] Clear D3 event handlers before removing
   * [M01] Interrupt ongoing transitions
   */
  function clear() {
    // Interrupt transitions and remove ripples
    rippleGroup.selectAll('*').interrupt().remove();

    // Clear all events (including keyboard) and remove orbs
    orbGroup.selectAll('.energy-orb-core')
      .on('mouseenter', null)
      .on('mouseleave', null)
      .on('click', null)
      .on('keydown', null)
      .on('blur', null);
    orbGroup.selectAll('*').remove();

    currentOrbs = [];
    hideTooltip();
  }

  /**
   * [H02] Cleanup resources on destroy
   */
  function destroy() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    clear();
    console.log('[RippleModule] Destroyed');
  }

  /**
   * Draw a single ripple animation
   * @param {number} x - pixel x
   * @param {number} y - pixel y
   * @param {string} lottery - lottery type
   * @param {number} delay - animation delay in ms
   */
  function drawRipple(x, y, lottery, delay = 0) {
    const config = RIPPLE_CONFIG[lottery] || DEFAULT_CONFIG;

    for (let i = 0; i < config.rings; i++) {
      const ringDelay = delay + i * 200;
      const maxRadius = config.baseRadius * (1 + i * 0.5);

      rippleGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', config.color)
        .attr('stroke-width', 2 - i * 0.5)
        .attr('opacity', 0.8)
        .transition()
        .delay(ringDelay)
        .duration(config.duration)
        .ease(d3.easeCubicOut)
        .attr('r', maxRadius)
        .attr('opacity', 0)
        .remove();
    }
  }

  /**
   * Draw multiple ripples for a dataset
   * [M01] Interrupt old transitions before drawing
   * [M02] Filter out-of-viewport elements
   * @param {Array} data - array of fortune items
   * @param {boolean} stagger - stagger animations
   */
  function drawRipples(data, stagger = true) {
    // [M01] Interrupt and clear old ripples
    rippleGroup.selectAll('*').interrupt().remove();

    // [M02] Filter to viewport only (with 200px margin for animation)
    const visibleData = data.filter(item => {
      const { x, y } = MapModule.latLngToPixel(item.lat, item.lng);
      return isInViewport(x, y, 200);
    });

    visibleData.forEach((item, index) => {
      const { x, y } = MapModule.latLngToPixel(item.lat, item.lng);
      const delay = stagger ? index * 80 : 0;
      drawRipple(x, y, item.lottery, delay);
    });
  }

  /**
   * Draw energy orbs (persistent glowing dots)
   * [M02] Filter out-of-viewport elements
   * @param {Object} districtStats - district statistics object
   */
  function drawOrbs(districtStats) {
    // [H02] Clear all events before removing
    orbGroup.selectAll('.energy-orb-core')
      .on('mouseenter', null)
      .on('mouseleave', null)
      .on('click', null)
      .on('keydown', null)
      .on('blur', null);
    orbGroup.selectAll('*').remove();
    currentOrbs = [];

    // [H01] Defensive check for empty stats
    const counts = Object.values(districtStats).map(d => d.count);
    if (counts.length === 0) {
      return;
    }

    const maxCount = Math.max(...counts);
    if (maxCount <= 0) {
      return;
    }

    Object.entries(districtStats).forEach(([district, stats]) => {
      const { x, y } = MapModule.latLngToPixel(stats.lat, stats.lng);

      // [M02] Skip out-of-viewport elements
      if (!isInViewport(x, y)) return;

      const intensity = stats.count / maxCount;
      const radius = 4 + intensity * 12;

      // Determine color based on most recent lottery type
      const lastWin = stats.wins[stats.wins.length - 1];
      const config = RIPPLE_CONFIG[lastWin?.lottery] || DEFAULT_CONFIG;

      // Outer glow
      const glow = orbGroup.append('circle')
        .attr('class', 'energy-orb')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius * 1.5)
        .attr('fill', config.color)
        .attr('opacity', 0.15 + intensity * 0.25)
        .style('filter', 'blur(8px)');

      // Core [H04] Added keyboard navigation
      const core = orbGroup.append('circle')
        .attr('class', 'energy-orb-core')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', config.color)
        .attr('opacity', 0.6 + intensity * 0.3)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', `${district}，頭獎 ${stats.count} 次`)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseenter', (event) => showTooltip(event, district, stats))
        .on('mouseleave', hideTooltip)
        .on('click', (event) => showTooltip(event, district, stats))
        .on('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showTooltip(event, district, stats);
          }
        })
        .on('blur', hideTooltip);

      currentOrbs.push({ district, glow, core, lat: stats.lat, lng: stats.lng });
    });
  }

  /**
   * Update orb positions (on map move/zoom)
   */
  function updateOrbPositions() {
    currentOrbs.forEach(orb => {
      const { x, y } = MapModule.latLngToPixel(orb.lat, orb.lng);
      orb.glow.attr('cx', x).attr('cy', y);
      orb.core.attr('cx', x).attr('cy', y);
    });
  }

  /**
   * Show tooltip
   * [H06] Use escapeHtml to prevent XSS
   * @param {Event} event
   * @param {string} district
   * @param {Object} stats
   */
  function showTooltip(event, district, stats) {
    const lotteryBreakdown = {};
    stats.wins.forEach(w => {
      lotteryBreakdown[w.lottery] = (lotteryBreakdown[w.lottery] || 0) + 1;
    });

    // [H06] Escape all user-derived data
    const breakdownHtml = Object.entries(lotteryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${escapeHtml(type)}: ${count}`)
      .join('<br>');

    tooltip
      .html(`
        <div class="tt-district">${escapeHtml(district)}</div>
        <div class="tt-info">
          頭獎次數: ${stats.count}<br>
          ${breakdownHtml}
        </div>
      `)
      .classed('hidden', false)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  /**
   * Hide tooltip
   */
  function hideTooltip() {
    tooltip.classed('hidden', true);
  }

  // Public API
  return {
    init,
    clear,
    destroy, // [H02] Cleanup method
    updateSize,
    drawRipple,
    drawRipples,
    drawOrbs,
    updateOrbPositions
  };
})();
