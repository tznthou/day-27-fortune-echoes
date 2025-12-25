/**
 * app.js - Application Entry Point
 * Fortune Echoes 財運迴響
 * [H01] Error handling
 * [M08] Loading state management
 */

(async function() {
  'use strict';

  console.log('[FortuneEchoes] Initializing...');

  // [M08] Loading overlay element
  const loadingEl = document.getElementById('loading');

  /**
   * [H01] Show error message to user
   * @param {string} message - Error message
   * @param {string} detail - Optional detail
   */
  function showError(message, detail = '') {
    loadingEl.innerHTML = `
      <div class="error-message">
        <h2>⚠️</h2>
        <p>${message}</p>
        ${detail ? `<p style="font-size: 0.75rem;">${detail}</p>` : ''}
        <button onclick="location.reload()">重新載入</button>
      </div>
    `;
  }

  /**
   * [M08] Hide loading overlay
   */
  function hideLoading() {
    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 300);
  }

  try {
    // DOM elements
    const totalCountEl = document.getElementById('total-count');
    const districtCountEl = document.getElementById('district-count');
    const monthWinsEl = document.getElementById('month-wins');
    const monthlyStatsEl = document.getElementById('monthly-stats');
    const filterCheckboxes = document.querySelectorAll('.lottery-filter');
    const modeBtns = document.querySelectorAll('.mode-btn');

    // State
    let selectedLotteries = new Set(['威力彩', '大樂透', '今彩539']);
    let viewMode = 'cumulative'; // 'cumulative' or 'monthly'

    // [H01][M08] Load data with error handling
    const data = await DataModule.load();
    if (!data.length) {
      throw new Error('無法載入財運資料');
    }

    // Update stats display
    totalCountEl.textContent = DataModule.getTotalCount();
    districtCountEl.textContent = DataModule.getDistrictCount();

    // Initialize map
    MapModule.init();

    // Initialize ripple layer
    RippleModule.init();

    // Initialize timeline
    TimelineModule.init();

    // Draw initial state (first month)
    const firstMonth = DataModule.getMonths()[0];
    renderMonth(firstMonth);

    // Listen for timeline changes
    document.addEventListener('timeline:change', (e) => {
      const { month } = e.detail;
      renderMonth(month);
    });

    // Listen for map view changes
    MapModule.onViewChange(() => {
      RippleModule.updateSize();
      RippleModule.updateOrbPositions();
    });

    // [M07] Theme toggle with persistence
    const themeBtn = document.getElementById('theme-btn');
    const savedTheme = localStorage.getItem('fortune-echoes-theme') || 'dark';
    if (savedTheme === 'light') {
      MapModule.toggleTheme(); // Switch to light
      themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
      const newTheme = MapModule.toggleTheme();
      themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
      localStorage.setItem('fortune-echoes-theme', newTheme);
    });

    // Lottery filter checkboxes
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const lottery = e.target.value;
        if (e.target.checked) {
          selectedLotteries.add(lottery);
        } else {
          selectedLotteries.delete(lottery);
        }
        // Re-render current month
        renderMonth(TimelineModule.getCurrentMonth());
      });
    });

    // View mode toggle
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newMode = e.target.dataset.mode;
        if (newMode === viewMode) return;

        // Update active state
        modeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        viewMode = newMode;
        // Re-render current month
        renderMonth(TimelineModule.getCurrentMonth());
      });
    });

    /**
     * Filter data by selected lotteries
     * @param {Array} data - data array
     * @returns {Array} filtered data
     */
    function filterByLottery(data) {
      if (selectedLotteries.size === 3) return data; // All selected, no filter
      return data.filter(item => selectedLotteries.has(item.lottery));
    }

    /**
     * Render visualization for a specific month
     * @param {string} month - YYYY-MM format
     */
    function renderMonth(month) {
      // Get data based on view mode
      const monthData = filterByLottery(DataModule.getByMonth(month));
      const displayData = viewMode === 'cumulative'
        ? filterByLottery(DataModule.getCumulativeByMonth(month))
        : monthData;

      // Calculate district stats for display data
      const districtStats = {};
      displayData.forEach(item => {
        const district = item.district;
        if (!districtStats[district]) {
          districtStats[district] = {
            count: 0,
            lat: item.lat,
            lng: item.lng,
            wins: []
          };
        }
        districtStats[district].count++;
        districtStats[district].wins.push({
          date: item.date,
          lottery: item.lottery,
          store: item.store
        });
      });

      // Draw energy orbs
      RippleModule.drawOrbs(districtStats);

      // Draw ripples for current month only (in cumulative mode)
      // In monthly mode, orbs already show the month data
      if (viewMode === 'cumulative') {
        RippleModule.drawRipples(monthData, true);
      } else {
        RippleModule.drawRipples([], false); // No extra ripples in monthly mode
      }

      // Update stats display
      totalCountEl.textContent = displayData.length;
      districtCountEl.textContent = Object.keys(districtStats).length;

      // Update monthly stats section
      if (viewMode === 'cumulative') {
        // In cumulative mode: show this month's new wins
        monthlyStatsEl.style.display = 'block';
        monthWinsEl.textContent = monthData.length;
      } else {
        // In monthly mode: hide (redundant with total count)
        monthlyStatsEl.style.display = 'none';
      }
    }

    // [M08] Hide loading overlay on success
    hideLoading();
    console.log('[FortuneEchoes] Ready');

  } catch (error) {
    // [H01] Show error to user
    console.error('[FortuneEchoes] Initialization failed:', error);
    showError('載入失敗', error.message);
  }
})();
