/**
 * map.js - Leaflet Map Initialization
 * Fortune Echoes 財運迴響
 */

const MapModule = (() => {
  let map = null;
  let tileLayer = null;
  let currentTheme = 'dark';

  // Taiwan bounds
  const TAIWAN_CENTER = [23.7, 120.9];
  const TAIWAN_ZOOM = 8;

  // [M09] NLSC 國土測繪中心圖磚（台灣政府官方，無商用限制）
  const TILE_URL = 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}';
  const TILE_ATTRIBUTION = '&copy; <a href="https://maps.nlsc.gov.tw/">國土測繪中心</a>';

  /**
   * Initialize the map
   */
  function init() {
    map = L.map('map', {
      center: TAIWAN_CENTER,
      zoom: TAIWAN_ZOOM,
      minZoom: 7,
      maxZoom: 16,
      zoomControl: true,
      attributionControl: true
    });

    // Add tile layer
    tileLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19
    }).addTo(map);

    // Position zoom control
    map.zoomControl.setPosition('bottomright');

    // Restrict to Taiwan area (roughly)
    const southWest = L.latLng(21.5, 118);
    const northEast = L.latLng(26.5, 123);
    map.setMaxBounds(L.latLngBounds(southWest, northEast));

    // Apply initial dark theme
    setTheme('dark');

    console.log('[MapModule] Initialized');

    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('map:ready', { detail: { map } }));

    return map;
  }

  /**
   * Set map theme (light or dark)
   * @param {string} theme - 'light' or 'dark'
   */
  function setTheme(theme) {
    const mapContainer = document.getElementById('map');
    if (theme === 'dark') {
      mapContainer.classList.add('dark-mode');
    } else {
      mapContainer.classList.remove('dark-mode');
    }
    currentTheme = theme;

    // Dispatch theme change event
    document.dispatchEvent(new CustomEvent('map:themechange', { detail: { theme } }));
    console.log('[MapModule] Theme set to:', theme);
  }

  /**
   * Toggle between light and dark themes
   * @returns {string} new theme
   */
  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme
   * @returns {string}
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Get map instance
   * @returns {L.Map}
   */
  function getMap() {
    return map;
  }

  /**
   * Convert lat/lng to pixel position
   * @param {number} lat
   * @param {number} lng
   * @returns {{x: number, y: number}}
   */
  function latLngToPixel(lat, lng) {
    const point = map.latLngToContainerPoint([lat, lng]);
    return { x: point.x, y: point.y };
  }

  /**
   * Get map container size
   * @returns {{width: number, height: number}}
   */
  function getSize() {
    const size = map.getSize();
    return { width: size.x, height: size.y };
  }

  /**
   * Add move/zoom event listener
   * @param {Function} callback
   */
  function onViewChange(callback) {
    map.on('moveend', callback);
    map.on('zoomend', callback);
  }

  // Public API
  return {
    init,
    getMap,
    getTheme,
    setTheme,
    toggleTheme,
    latLngToPixel,
    getSize,
    onViewChange
  };
})();
