/**
 * data.js - Data Loading & Processing
 * Fortune Echoes 財運迴響
 */

const DataModule = (() => {
  let fortuneData = [];
  let monthlyData = {};
  let allMonths = [];
  let districtStats = {};

  // [H07] Taiwan coordinate bounds
  const TAIWAN_BOUNDS = {
    LAT_MIN: 21.5,
    LAT_MAX: 26.5,
    LNG_MIN: 118,
    LNG_MAX: 123
  };

  /**
   * [H07] Validate a single fortune item
   * @param {Object} item
   * @returns {boolean}
   */
  function validateFortuneItem(item) {
    // Check required fields
    if (!item || typeof item !== 'object') return false;

    const required = ['date', 'month', 'lottery', 'district', 'lat', 'lng', 'store'];
    for (const field of required) {
      if (!(field in item)) {
        console.warn('[DataModule] Missing field:', field, item);
        return false;
      }
    }

    // Validate coordinates
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('[DataModule] Invalid coordinates:', item);
      return false;
    }

    // Check Taiwan bounds
    if (lat < TAIWAN_BOUNDS.LAT_MIN || lat > TAIWAN_BOUNDS.LAT_MAX ||
        lng < TAIWAN_BOUNDS.LNG_MIN || lng > TAIWAN_BOUNDS.LNG_MAX) {
      console.warn('[DataModule] Coordinates out of Taiwan bounds:', item);
      return false;
    }

    // Validate date format (YYYY/MM/DD)
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(item.date)) {
      console.warn('[DataModule] Invalid date format:', item.date);
      return false;
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(item.month)) {
      console.warn('[DataModule] Invalid month format:', item.month);
      return false;
    }

    return true;
  }

  /**
   * Load fortune data from JSON
   * [H07] Includes data validation
   */
  async function load() {
    try {
      const response = await fetch('data/fortune.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const rawData = await response.json();

      // [H07] Validate data format
      if (!Array.isArray(rawData)) {
        throw new Error('Invalid data format: expected array');
      }

      // [H07] Filter and validate each item
      fortuneData = rawData.filter(item => validateFortuneItem(item));

      if (fortuneData.length === 0) {
        throw new Error('No valid fortune data after validation');
      }

      const invalidCount = rawData.length - fortuneData.length;
      if (invalidCount > 0) {
        console.warn(`[DataModule] Filtered out ${invalidCount} invalid items`);
      }

      processData();
      console.log('[DataModule] Loaded', fortuneData.length, 'valid records');
      return fortuneData;
    } catch (error) {
      console.error('[DataModule] Failed to load data:', error);
      return [];
    }
  }

  /**
   * Process data into monthly groups
   */
  function processData() {
    monthlyData = {};
    districtStats = {};
    const monthSet = new Set();

    fortuneData.forEach(item => {
      const month = item.month;
      monthSet.add(month);

      // Group by month
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(item);

      // Count by district
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

    // Sort months chronologically
    allMonths = Array.from(monthSet).sort();
    console.log('[DataModule] Months:', allMonths.length, '| Districts:', Object.keys(districtStats).length);
  }

  /**
   * Get data for a specific month
   * @param {string} month - YYYY-MM format
   * @returns {Array}
   */
  function getByMonth(month) {
    return monthlyData[month] || [];
  }

  /**
   * Get cumulative data up to a month
   * @param {string} month - YYYY-MM format
   * @returns {Array}
   */
  function getCumulativeByMonth(month) {
    const result = [];
    for (const m of allMonths) {
      if (m <= month) {
        result.push(...(monthlyData[m] || []));
      }
    }
    return result;
  }

  /**
   * Get all months
   * @returns {Array}
   */
  function getMonths() {
    return allMonths;
  }

  /**
   * Get all data
   * @returns {Array}
   */
  function getAll() {
    return fortuneData;
  }

  /**
   * Get district statistics
   * @returns {Object}
   */
  function getDistrictStats() {
    return districtStats;
  }

  /**
   * Get total count
   * @returns {number}
   */
  function getTotalCount() {
    return fortuneData.length;
  }

  /**
   * Get unique district count
   * @returns {number}
   */
  function getDistrictCount() {
    return Object.keys(districtStats).length;
  }

  // Public API
  return {
    load,
    getByMonth,
    getCumulativeByMonth,
    getMonths,
    getAll,
    getDistrictStats,
    getTotalCount,
    getDistrictCount
  };
})();
