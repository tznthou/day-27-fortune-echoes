/**
 * timeline.js - Timeline Control
 * Fortune Echoes 財運迴響
 */

const TimelineModule = (() => {
  let slider = null;
  let playBtn = null;
  let monthLabel = null;
  let monthWinsEl = null;
  let months = [];
  let currentIndex = 0;
  let isPlaying = false;
  let playInterval = null;
  let isAnimating = false; // [H03] Animation lock to prevent overlap

  const PLAY_SPEED = 2000; // [H03] Increased to allow animations to complete
  const MAX_ANIMATION_DURATION = 2500; // Longest ripple animation duration

  /**
   * Initialize timeline controls
   */
  function init() {
    slider = document.getElementById('timeline-slider');
    playBtn = document.getElementById('play-btn');
    monthLabel = document.getElementById('current-month');
    monthWinsEl = document.getElementById('month-wins');

    // Get months from data
    months = DataModule.getMonths();

    if (months.length === 0) {
      console.warn('[TimelineModule] No months available');
      return;
    }

    // Set slider range
    slider.min = 0;
    slider.max = months.length - 1;
    slider.value = 0;

    // [M06] Update labels dynamically
    const startLabel = document.getElementById('timeline-start');
    const endLabel = document.getElementById('timeline-end');
    if (startLabel) startLabel.textContent = months[0];
    if (endLabel) endLabel.textContent = months[months.length - 1];

    // Event listeners
    slider.addEventListener('input', handleSliderInput);
    playBtn.addEventListener('click', togglePlay);

    // Initialize display
    updateDisplay(0);

    console.log('[TimelineModule] Initialized with', months.length, 'months');
  }

  /**
   * Handle slider input
   */
  function handleSliderInput() {
    const index = parseInt(slider.value, 10);
    setMonth(index);
  }

  /**
   * Set current month by index
   * @param {number} index
   */
  function setMonth(index) {
    if (index < 0 || index >= months.length) return;

    currentIndex = index;
    slider.value = index;
    updateDisplay(index);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('timeline:change', {
      detail: { month: months[index], index }
    }));
  }

  /**
   * Update display for a month
   * [H05] Update aria-valuetext for accessibility
   * @param {number} index
   */
  function updateDisplay(index) {
    const month = months[index];
    monthLabel.textContent = month;

    // [H05] Format for screen readers: "2024年1月"
    const [year, monthNum] = month.split('-');
    const ariaText = `${year}年${parseInt(monthNum, 10)}月`;
    slider.setAttribute('aria-valuetext', ariaText);

    const monthData = DataModule.getByMonth(month);
    monthWinsEl.textContent = monthData.length;
  }

  /**
   * Toggle play/pause
   */
  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  /**
   * Start auto-play
   * [H03] Uses animation lock to prevent overlapping animations
   */
  function play() {
    if (isPlaying) return;

    isPlaying = true;
    playBtn.textContent = '⏸';
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', '暫停時間軸');

    // If at end, restart
    if (currentIndex >= months.length - 1) {
      setMonth(0);
    }

    playInterval = setInterval(() => {
      // [H03] Skip frame if animation still in progress
      if (isAnimating) {
        return;
      }

      if (currentIndex >= months.length - 1) {
        pause();
        return;
      }

      isAnimating = true;
      setMonth(currentIndex + 1);

      // [H03] Unlock after animation completes
      setTimeout(() => {
        isAnimating = false;
      }, MAX_ANIMATION_DURATION);
    }, PLAY_SPEED);

    console.log('[TimelineModule] Playing');
  }

  /**
   * Pause auto-play
   * [H03] Reset animation lock on pause
   */
  function pause() {
    if (!isPlaying) return;

    isPlaying = false;
    isAnimating = false; // [H03] Reset lock
    playBtn.textContent = '▶';
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', '播放時間軸');

    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }

    console.log('[TimelineModule] Paused');
  }

  /**
   * Get current month
   * @returns {string}
   */
  function getCurrentMonth() {
    return months[currentIndex];
  }

  /**
   * Get current index
   * @returns {number}
   */
  function getCurrentIndex() {
    return currentIndex;
  }

  // Public API
  return {
    init,
    setMonth,
    play,
    pause,
    getCurrentMonth,
    getCurrentIndex
  };
})();
