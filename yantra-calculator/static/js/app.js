/**
 * Yantra Calculator - JavaScript Application
 * Handles UI interactions, API calls, and visualizations
 */

class YantraCalculatorApp {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentResults = null;
        this.comparisonChart = null;
        
        this.initializeApp();
    }
    
    initializeApp() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        // Calculator form
        const calculateBtn = document.getElementById('calculate-btn');
        const getLocationBtn = document.getElementById('get-location-btn');
        
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateYantras());
        }
        
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        }
        
        // Site selection buttons
        const siteButtons = document.querySelectorAll('.site-button');
        siteButtons.forEach(button => {
            button.addEventListener('click', () => this.selectHistoricalSite(button));
        });
        
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });
        
        // Visualization tabs
        const vizTabs = document.querySelectorAll('.viz-tab');
        vizTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchVisualization(tab));
        });
        
        // Export buttons
        const exportButtons = document.querySelectorAll('.export-button');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => this.exportResults(button.id));
        });
        
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal());
        }
        
        // Initialize map
        this.initializeMap();
        
        // Load comparison chart
        this.loadComparisonChart();
        
        // Set up input validation
        this.setupInputValidation();
    }
    
    initializeMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement || !window.L) return;
        
        // Initialize Leaflet map centered on India
        this.map = L.map('map').setView([23.5937, 78.9629], 5);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add historical site markers
        if (window.historicalSites) {
            Object.entries(window.historicalSites).forEach(([name, data]) => {
                const marker = L.marker([data.latitude, data.longitude])
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="map-popup">
                            <h4>${name.replace('_', ' ')}</h4>
                            <p>${data.description}</p>
                            <small>Lat: ${data.latitude.toFixed(4)}°, Lng: ${data.longitude.toFixed(4)}°</small>
                            <br><br>
                            <button onclick="app.selectSiteFromMap('${name}')" class="popup-button">
                                Select This Site
                            </button>
                        </div>
                    `);
                
                this.markers.push({ name, marker, data });
            });
        }
        
        // Add click handler for custom location selection
        this.map.on('click', (e) => {
            this.selectCustomLocation(e.latlng.lat, e.latlng.lng);
        });
    }
    
    selectSiteFromMap(siteName) {
        if (window.historicalSites && window.historicalSites[siteName]) {
            const site = window.historicalSites[siteName];
            this.updateInputs(site.latitude, site.longitude);
        }
    }
    
    selectCustomLocation(lat, lng) {
        this.updateInputs(lat, lng);
        
        // Clear existing custom markers
        this.markers.forEach(marker => {
            if (marker.name === 'custom') {
                this.map.removeLayer(marker.marker);
            }
        });
        
        // Add new custom marker
        const customMarker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(`
                <div class="map-popup">
                    <h4>Custom Location</h4>
                    <p>Lat: ${lat.toFixed(4)}°, Lng: ${lng.toFixed(4)}°</p>
                </div>
            `);
        
        this.markers.push({ name: 'custom', marker: customMarker });
    }
    
    selectHistoricalSite(button) {
        const lat = parseFloat(button.dataset.lat);
        const lng = parseFloat(button.dataset.lng);
        const name = button.dataset.name;
        
        this.updateInputs(lat, lng);
        
        // Pan map to selected site
        if (this.map) {
            this.map.setView([lat, lng], 10);
            
            // Find and open popup for this site
            const siteMarker = this.markers.find(m => m.name === name);
            if (siteMarker) {
                siteMarker.marker.openPopup();
            }
        }
        
        // Update button states
        document.querySelectorAll('.site-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    updateInputs(lat, lng) {
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        
        if (latInput) latInput.value = lat.toFixed(4);
        if (lngInput) lngInput.value = lng.toFixed(4);
    }
    
    setupInputValidation() {
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        const scaleInput = document.getElementById('scale');
        
        [latInput, lngInput, scaleInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.validateInput(input));
            }
        });
    }
    
    validateInput(input) {
        const value = parseFloat(input.value);
        let isValid = true;
        
        switch (input.id) {
            case 'latitude':
                isValid = value >= -90 && value <= 90;
                break;
            case 'longitude':
                isValid = value >= -180 && value <= 180;
                break;
            case 'scale':
                isValid = value >= 0.1 && value <= 10.0;
                break;
        }
        
        if (isValid) {
            input.style.borderColor = '';
        } else {
            input.style.borderColor = '#ff4444';
        }
        
        return isValid;
    }
    
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser.');
            return;
        }
        
        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Update inputs with user's coordinates
                this.updateInputs(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                // Update map view
                if (this.map) {
                    this.map.setView([position.coords.latitude, position.coords.longitude], 12);
                    
                    // Add marker for user location
                    this.selectCustomLocation(position.coords.latitude, position.coords.longitude);
                }
                
                // Automatically calculate yantras for user's location
                setTimeout(() => {
                    this.calculateYantras();
                }, 500); // Small delay to ensure inputs are updated
            },
            (error) => {
                this.hideLoading();
                let errorMessage = 'Unable to get your location: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += error.message;
                        break;
                }
                this.showError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }
    
    async calculateYantras() {
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        const scaleInput = document.getElementById('scale');
        
        if (!latInput || !lngInput || !scaleInput) {
            this.showError('Input fields not found');
            return;
        }
        
        const latitude = parseFloat(latInput.value);
        const longitude = parseFloat(lngInput.value);
        const scale = parseFloat(scaleInput.value) || 1.0;
        
        // Validate inputs
        if (isNaN(latitude) || isNaN(longitude)) {
            this.showError('Please enter valid latitude and longitude values');
            return;
        }
        
        if (!this.validateInput(latInput) || !this.validateInput(lngInput) || !this.validateInput(scaleInput)) {
            this.showError('Please check your input values');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude,
                    scale: scale
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Calculation failed');
            }
            
            this.currentResults = data;
            this.displayResults(data);
            
        } catch (error) {
            this.showError(`Calculation error: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }
    
    displayResults(results) {
        // Show results section
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Update location details
        this.displayLocationInfo(results.location, results.site_analysis);
        
        // Display yantra specifications
        this.displayYantraSpecs(results.yantras);
        
        // Update visualizations
        this.updateVisualizations(results);
        
        // Update navigation
        const resultsLink = document.querySelector('a[href="#results"]');
        if (resultsLink) {
            resultsLink.style.display = 'inline-block';
        }
    }
    
    displayLocationInfo(location, siteAnalysis) {
        const locationDetails = document.getElementById('location-details');
        if (!locationDetails) return;
        
        const dmsCoords = siteAnalysis?.location?.coordinates_dms;
        
        locationDetails.innerHTML = `
            <div class="location-grid">
                <div class="location-item">
                    <div class="location-label">Latitude</div>
                    <div class="location-value">${location.latitude.toFixed(4)}°</div>
                    ${dmsCoords ? `<div class="location-dms">${dmsCoords.latitude_dms}</div>` : ''}
                </div>
                <div class="location-item">
                    <div class="location-label">Longitude</div>
                    <div class="location-value">${location.longitude.toFixed(4)}°</div>
                    ${dmsCoords ? `<div class="location-dms">${dmsCoords.longitude_dms}</div>` : ''}
                </div>
                <div class="location-item">
                    <div class="location-label">Scale Factor</div>
                    <div class="location-value">${location.scale}x</div>
                </div>
            </div>
            
            ${siteAnalysis?.astronomical_data ? `
                <div class="astronomical-summary">
                    <h4>Astronomical Data</h4>
                    <div class="astro-grid">
                        <div class="astro-item">
                            <span class="astro-label">Max Sun Elevation:</span>
                            <span class="astro-value">${siteAnalysis.astronomical_data.max_sun_elevation.toFixed(1)}°</span>
                        </div>
                        <div class="astro-item">
                            <span class="astro-label">Min Sun Elevation:</span>
                            <span class="astro-value">${siteAnalysis.astronomical_data.min_sun_elevation.toFixed(1)}°</span>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    displayYantraSpecs(yantras) {
        const tabContent = document.querySelector('.yantra-tabs .tab-content');
        if (!tabContent) return;
        
        // Clear existing content
        tabContent.innerHTML = '';
        
        // Display first yantra by default
        const firstYantra = Object.keys(yantras)[0];
        if (firstYantra) {
            this.displayYantraDetails(yantras[firstYantra]);
        }
    }
    
    displayYantraDetails(yantraSpec) {
        const tabContent = document.querySelector('.yantra-tabs .tab-content');
        if (!tabContent) return;
        
        tabContent.innerHTML = `
            <div class="yantra-card">
                <div class="yantra-title">${yantraSpec.name}</div>
                <div class="yantra-description">${yantraSpec.description}</div>
                
                <h4>Dimensions</h4>
                <div class="dimensions-grid">
                    ${Object.entries(yantraSpec.dimensions).map(([key, value]) => `
                        <div class="dimension-item">
                            <div class="dimension-label">${this.formatDimensionLabel(key)}</div>
                            <div class="dimension-value">${this.formatDimensionValue(value, key)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Key Angles</h4>
                <div class="dimensions-grid">
                    ${Object.entries(yantraSpec.angles).map(([key, value]) => `
                        <div class="dimension-item">
                            <div class="dimension-label">${this.formatDimensionLabel(key)}</div>
                            <div class="dimension-value">${value.toFixed(2)}°</div>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Materials</h4>
                <div class="materials-list">
                    ${yantraSpec.materials.map(material => `
                        <span class="material-tag">${material}</span>
                    `).join('')}
                </div>
                
                <h4>Construction Notes</h4>
                <div class="construction-notes">
                    ${yantraSpec.construction_notes}
                </div>
            </div>
        `;
    }
    
    formatDimensionLabel(key) {
        return key.replace(/_/g, ' ')
                 .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    formatDimensionValue(value, key) {
        if (typeof value !== 'number') return value;
        
        const unit = this.getDimensionUnit(key);
        const precision = value < 1 ? 3 : value < 10 ? 2 : 1;
        
        return `${value.toFixed(precision)} ${unit}`;
    }
    
    getDimensionUnit(key) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('angle') || lowerKey.includes('inclination')) return '°';
        if (lowerKey.includes('count') || lowerKey.includes('divisions')) return '';
        if (lowerKey.includes('precision') && lowerKey.includes('angle')) return '°';
        return 'm';
    }
    
    switchTab(button) {
        const yantraType = button.dataset.yantra;
        
        // Update button states
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Display yantra details
        if (this.currentResults && this.currentResults.yantras[yantraType]) {
            this.displayYantraDetails(this.currentResults.yantras[yantraType]);
        }
    }
    
    switchVisualization(tab) {
        const vizType = tab.dataset.viz;
        
        // Update tab states
        document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update visualization content
        document.querySelectorAll('.viz-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${vizType === '2d' ? 'blueprint' : vizType === '3d' ? 'model' : 'solar'}-view`);
        if (targetContent) {
            targetContent.classList.add('active');
            
            // Load visualization content based on type
            this.loadVisualization(vizType, targetContent);
        }
    }
    
    loadVisualization(type, container) {
        if (!this.currentResults) return;
        
        switch (type) {
            case '2d':
                this.load2DBlueprint(container);
                break;
                
            case '3d':
                this.load3DVisualization(container);
                break;
                
            case 'solar':
                this.loadSolarChart(container);
                break;
        }
    }
    
    load2DBlueprint(container) {
        const activeYantra = document.querySelector('.tab-button.active')?.dataset.yantra || 'samrat';
        const yantraData = this.currentResults.yantras[activeYantra];
        
        container.innerHTML = `
            <div class="blueprint-container">
                <div class="blueprint-header">
                    <h3>2D Technical Blueprint - ${yantraData.name}</h3>
                    <div class="blueprint-controls">
                        <button onclick="app.exportBlueprint()" class="blueprint-btn">📄 Export SVG</button>
                        <select onchange="app.switchBlueprintYantra(this.value)" class="blueprint-select">
                            <option value="samrat" ${activeYantra === 'samrat' ? 'selected' : ''}>Samrat Yantra</option>
                            <option value="rama" ${activeYantra === 'rama' ? 'selected' : ''}>Rama Yantra</option>
                            <option value="digamsa" ${activeYantra === 'digamsa' ? 'selected' : ''}>Digamsa Yantra</option>
                            <option value="dhruva" ${activeYantra === 'dhruva' ? 'selected' : ''}>Dhruva Yantra</option>
                        </select>
                    </div>
                </div>
                <svg id="blueprint-svg" width="100%" height="350" viewBox="0 0 800 350" style="border: 1px solid var(--border-light); background: white; border-radius: 8px;">
                    <!-- Blueprint will be drawn here -->
                </svg>
                <div class="blueprint-dimensions">
                    <h4>Key Dimensions</h4>
                    <div class="dimension-list">
                        ${Object.entries(yantraData.dimensions).slice(0, 6).map(([key, value]) => `
                            <span class="dimension-tag">${this.formatDimensionLabel(key)}: ${this.formatDimensionValue(value, key)}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Draw the blueprint
        this.drawYantraBlueprint(activeYantra, yantraData);
    }
    
    drawYantraBlueprint(yantraType, data) {
        const svg = document.getElementById('blueprint-svg');
        if (!svg) return;
        
        // Clear existing content
        svg.innerHTML = '';
        
        // Set up SVG namespace
        const svgNS = 'http://www.w3.org/2000/svg';
        
        // Add grid background
        this.addGridToSVG(svg, svgNS);
        
        // Draw based on yantra type
        switch (yantraType) {
            case 'samrat':
                this.drawSamratBlueprint(svg, svgNS, data);
                break;
            case 'rama':
                this.drawRamaBlueprint(svg, svgNS, data);
                break;
            case 'digamsa':
                this.drawDigamsaBlueprint(svg, svgNS, data);
                break;
            case 'dhruva':
                this.drawDhruvaBlueprint(svg, svgNS, data);
                break;
        }
    }
    
    addGridToSVG(svg, svgNS) {
        const defs = document.createElementNS(svgNS, 'defs');
        const pattern = document.createElementNS(svgNS, 'pattern');
        pattern.setAttribute('id', 'grid');
        pattern.setAttribute('width', '20');
        pattern.setAttribute('height', '20');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', 'M 20 0 L 0 0 0 20');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#f0f0f0');
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid)');
        svg.appendChild(rect);
    }
    
    drawSamratBlueprint(svg, svgNS, data) {
        const dims = data.dimensions;
        const scale = 800 / (dims.total_length * 1.2); // Fit in viewport
        
        // Center coordinates
        const centerX = 400;
        const centerY = 175;
        
        // Draw gnomon (triangular wall)
        const gnomonGroup = document.createElementNS(svgNS, 'g');
        
        // Gnomon triangle
        const gnomon = document.createElementNS(svgNS, 'polygon');
        const gnomonHeight = dims.gnomon_height * scale;
        const gnomonBase = dims.gnomon_base * scale;
        
        gnomon.setAttribute('points', `
            ${centerX},${centerY} 
            ${centerX - gnomonBase/2},${centerY + gnomonHeight/2} 
            ${centerX + gnomonBase/2},${centerY + gnomonHeight/2}
        `);
        gnomon.setAttribute('fill', 'var(--primary-color)');
        gnomon.setAttribute('fill-opacity', '0.7');
        gnomon.setAttribute('stroke', 'var(--secondary-color)');
        gnomon.setAttribute('stroke-width', '2');
        gnomonGroup.appendChild(gnomon);
        
        // Quadrant scales
        const quadrantRadius = dims.quadrant_radius * scale;
        
        // Left quadrant
        const leftQuadrant = document.createElementNS(svgNS, 'path');
        leftQuadrant.setAttribute('d', `M ${centerX - quadrantRadius} ${centerY} A ${quadrantRadius} ${quadrantRadius} 0 0 1 ${centerX} ${centerY - quadrantRadius}`);
        leftQuadrant.setAttribute('fill', 'none');
        leftQuadrant.setAttribute('stroke', 'var(--primary-color)');
        leftQuadrant.setAttribute('stroke-width', '3');
        gnomonGroup.appendChild(leftQuadrant);
        
        // Right quadrant
        const rightQuadrant = document.createElementNS(svgNS, 'path');
        rightQuadrant.setAttribute('d', `M ${centerX} ${centerY - quadrantRadius} A ${quadrantRadius} ${quadrantRadius} 0 0 1 ${centerX + quadrantRadius} ${centerY}`);
        rightQuadrant.setAttribute('fill', 'none');
        rightQuadrant.setAttribute('stroke', 'var(--primary-color)');
        rightQuadrant.setAttribute('stroke-width', '3');
        gnomonGroup.appendChild(rightQuadrant);
        
        // Hour markings
        for (let i = 6; i <= 18; i++) {
            const angle = (i - 12) * 15 * Math.PI / 180; // Convert to radians
            const startX = centerX + (quadrantRadius - 10) * Math.sin(angle);
            const startY = centerY - (quadrantRadius - 10) * Math.cos(angle);
            const endX = centerX + quadrantRadius * Math.sin(angle);
            const endY = centerY - quadrantRadius * Math.cos(angle);
            
            const hourMark = document.createElementNS(svgNS, 'line');
            hourMark.setAttribute('x1', startX);
            hourMark.setAttribute('y1', startY);
            hourMark.setAttribute('x2', endX);
            hourMark.setAttribute('y2', endY);
            hourMark.setAttribute('stroke', 'var(--secondary-color)');
            hourMark.setAttribute('stroke-width', '2');
            gnomonGroup.appendChild(hourMark);
            
            // Hour labels
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', centerX + (quadrantRadius + 15) * Math.sin(angle));
            label.setAttribute('y', centerY - (quadrantRadius + 15) * Math.cos(angle) + 5);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12');
            label.setAttribute('fill', 'var(--text-dark)');
            label.textContent = i.toString();
            gnomonGroup.appendChild(label);
        }
        
        // Dimension annotations
        this.addDimensionLine(svg, svgNS, centerX - gnomonBase/2, centerY + gnomonHeight/2 + 20, 
                             centerX + gnomonBase/2, centerY + gnomonHeight/2 + 20, 
                             `Base: ${dims.gnomon_base.toFixed(1)}m`);
        
        svg.appendChild(gnomonGroup);
    }
    
    drawRamaBlueprint(svg, svgNS, data) {
        const dims = data.dimensions;
        const scale = 300 / dims.base_radius; // Fit in viewport
        const centerX = 400;
        const centerY = 175;
        
        // Outer circle
        const outerCircle = document.createElementNS(svgNS, 'circle');
        outerCircle.setAttribute('cx', centerX);
        outerCircle.setAttribute('cy', centerY);
        outerCircle.setAttribute('r', dims.base_radius * scale);
        outerCircle.setAttribute('fill', 'none');
        outerCircle.setAttribute('stroke', 'var(--primary-color)');
        outerCircle.setAttribute('stroke-width', '3');
        svg.appendChild(outerCircle);
        
        // Central pillar
        const pillar = document.createElementNS(svgNS, 'circle');
        pillar.setAttribute('cx', centerX);
        pillar.setAttribute('cy', centerY);
        pillar.setAttribute('r', '8');
        pillar.setAttribute('fill', 'var(--secondary-color)');
        svg.appendChild(pillar);
        
        // Radial walls
        const radius = dims.base_radius * scale;
        for (let i = 0; i < dims.radial_divisions; i++) {
            const angle = (i * 360 / dims.radial_divisions) * Math.PI / 180;
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            
            const wall = document.createElementNS(svgNS, 'line');
            wall.setAttribute('x1', centerX);
            wall.setAttribute('y1', centerY);
            wall.setAttribute('x2', x2);
            wall.setAttribute('y2', y2);
            wall.setAttribute('stroke', 'var(--text-light)');
            wall.setAttribute('stroke-width', '1');
            svg.appendChild(wall);
        }
        
        // Labels
        const title = document.createElementNS(svgNS, 'text');
        title.setAttribute('x', centerX);
        title.setAttribute('y', 30);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-size', '16');
        title.setAttribute('font-weight', 'bold');
        title.setAttribute('fill', 'var(--primary-color)');
        title.textContent = 'Rama Yantra - Top View';
        svg.appendChild(title);
    }
    
    drawDigamsaBlueprint(svg, svgNS, data) {
        const dims = data.dimensions;
        const scale = 300 / dims.platform_radius;
        const centerX = 400;
        const centerY = 175;
        
        // Platform circle
        const platform = document.createElementNS(svgNS, 'circle');
        platform.setAttribute('cx', centerX);
        platform.setAttribute('cy', centerY);
        platform.setAttribute('r', dims.platform_radius * scale);
        platform.setAttribute('fill', 'var(--bg-light)');
        platform.setAttribute('stroke', 'var(--primary-color)');
        platform.setAttribute('stroke-width', '3');
        svg.appendChild(platform);
        
        // Central gnomon
        const gnomon = document.createElementNS(svgNS, 'circle');
        gnomon.setAttribute('cx', centerX);
        gnomon.setAttribute('cy', centerY);
        gnomon.setAttribute('r', '6');
        gnomon.setAttribute('fill', 'var(--secondary-color)');
        svg.appendChild(gnomon);
        
        // Direction markers
        const directions = ['N', 'E', 'S', 'W'];
        const radius = dims.platform_radius * scale;
        
        directions.forEach((dir, i) => {
            const angle = i * Math.PI / 2;
            const x = centerX + (radius + 20) * Math.cos(angle - Math.PI/2);
            const y = centerY + (radius + 20) * Math.sin(angle - Math.PI/2);
            
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y + 5);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '14');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', 'var(--accent-color)');
            label.textContent = dir;
            svg.appendChild(label);
        });
    }
    
    drawDhruvaBlueprint(svg, svgNS, data) {
        const dims = data.dimensions;
        const scale = 250 / dims.base_radius;
        const centerX = 400;
        const centerY = 200;
        
        // Base circle
        const base = document.createElementNS(svgNS, 'circle');
        base.setAttribute('cx', centerX);
        base.setAttribute('cy', centerY);
        base.setAttribute('r', dims.base_radius * scale);
        base.setAttribute('fill', 'none');
        base.setAttribute('stroke', 'var(--primary-color)');
        base.setAttribute('stroke-width', '2');
        svg.appendChild(base);
        
        // Polar axis (inclined line)
        const axisLength = dims.polar_axis_length * scale;
        const inclination = data.angles.pole_inclination_angle * Math.PI / 180;
        const axisEndX = centerX + axisLength * Math.cos(inclination);
        const axisEndY = centerY - axisLength * Math.sin(inclination);
        
        const axis = document.createElementNS(svgNS, 'line');
        axis.setAttribute('x1', centerX);
        axis.setAttribute('y1', centerY);
        axis.setAttribute('x2', axisEndX);
        axis.setAttribute('y2', axisEndY);
        axis.setAttribute('stroke', 'var(--accent-color)');
        axis.setAttribute('stroke-width', '4');
        svg.appendChild(axis);
        
        // Rings
        const outerRing = document.createElementNS(svgNS, 'circle');
        outerRing.setAttribute('cx', centerX);
        outerRing.setAttribute('cy', centerY);
        outerRing.setAttribute('r', dims.outer_ring_radius * scale);
        outerRing.setAttribute('fill', 'none');
        outerRing.setAttribute('stroke', 'var(--secondary-color)');
        outerRing.setAttribute('stroke-width', '2');
        svg.appendChild(outerRing);
        
        // Angle annotation
        const angleArc = document.createElementNS(svgNS, 'path');
        const arcRadius = 40;
        angleArc.setAttribute('d', `M ${centerX + arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 0 0 ${centerX + arcRadius * Math.cos(inclination)} ${centerY - arcRadius * Math.sin(inclination)}`);
        angleArc.setAttribute('fill', 'none');
        angleArc.setAttribute('stroke', 'var(--accent-color)');
        angleArc.setAttribute('stroke-width', '2');
        svg.appendChild(angleArc);
        
        // Angle label
        const angleLabel = document.createElementNS(svgNS, 'text');
        angleLabel.setAttribute('x', centerX + 50);
        angleLabel.setAttribute('y', centerY - 10);
        angleLabel.setAttribute('font-size', '12');
        angleLabel.setAttribute('fill', 'var(--accent-color)');
        angleLabel.textContent = `${data.angles.pole_inclination_angle.toFixed(1)}°`;
        svg.appendChild(angleLabel);
    }
    
    addDimensionLine(svg, svgNS, x1, y1, x2, y2, label) {
        // Dimension line
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'var(--text-dark)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
        
        // End markers
        const marker1 = document.createElementNS(svgNS, 'line');
        marker1.setAttribute('x1', x1);
        marker1.setAttribute('y1', y1 - 5);
        marker1.setAttribute('x2', x1);
        marker1.setAttribute('y2', y1 + 5);
        marker1.setAttribute('stroke', 'var(--text-dark)');
        marker1.setAttribute('stroke-width', '1');
        svg.appendChild(marker1);
        
        const marker2 = document.createElementNS(svgNS, 'line');
        marker2.setAttribute('x1', x2);
        marker2.setAttribute('y1', y2 - 5);
        marker2.setAttribute('x2', x2);
        marker2.setAttribute('y2', y2 + 5);
        marker2.setAttribute('stroke', 'var(--text-dark)');
        marker2.setAttribute('stroke-width', '1');
        svg.appendChild(marker2);
        
        // Label
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', (x1 + x2) / 2);
        text.setAttribute('y', y1 - 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', 'var(--text-dark)');
        text.textContent = label;
        svg.appendChild(text);
    }
    
    switchBlueprintYantra(yantraType) {
        // Switch to the selected yantra tab
        const tabButton = document.querySelector(`[data-yantra="${yantraType}"]`);
        if (tabButton) {
            this.switchTab(tabButton);
            // Reload 2D visualization
            const container = document.querySelector('.viz-content.active');
            if (container) {
                this.load2DBlueprint(container);
            }
        }
    }
    
    exportBlueprint() {
        const svg = document.getElementById('blueprint-svg');
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'yantra-blueprint.svg';
        downloadLink.click();
        
        URL.revokeObjectURL(svgUrl);
    }
    
    load3DVisualization(container) {
        const activeYantra = document.querySelector('.tab-button.active')?.dataset.yantra || 'samrat';
        const yantraData = this.currentResults.yantras[activeYantra];
        
        container.innerHTML = `
            <div class="model-container">
                <div class="model-header">
                    <h3>3D Interactive Model - ${yantraData.name}</h3>
                    <div class="model-controls">
                        <button onclick="app.resetCamera()" class="model-btn">🔄 Reset View</button>
                        <button onclick="app.toggleWireframe()" class="model-btn">📐 Wireframe</button>
                        <button onclick="app.toggleShadows()" class="model-btn">☀️ Shadows</button>
                        <button onclick="app.export3DModel()" class="model-btn">💾 Export OBJ</button>
                        <select onchange="app.switch3DYantra(this.value)" class="model-select">
                            <option value="samrat" ${activeYantra === 'samrat' ? 'selected' : ''}>Samrat Yantra</option>
                            <option value="rama" ${activeYantra === 'rama' ? 'selected' : ''}>Rama Yantra</option>
                            <option value="digamsa" ${activeYantra === 'digamsa' ? 'selected' : ''}>Digamsa Yantra</option>
                            <option value="dhruva" ${activeYantra === 'dhruva' ? 'selected' : ''}>Dhruva Yantra</option>
                        </select>
                    </div>
                </div>
                <div id="threejs-container" style="width: 100%; height: 400px; border: 1px solid var(--border-light); border-radius: 8px; background: linear-gradient(to bottom, #87CEEB, #F0F8FF);"></div>
                <div class="model-info">
                    <div class="model-stats">
                        <div class="stat-item">
                            <span class="stat-label">Vertices:</span>
                            <span class="stat-value" id="vertex-count">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Faces:</span>
                            <span class="stat-value" id="face-count">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Scale:</span>
                            <span class="stat-value">${this.currentResults.location.scale}x</span>
                        </div>
                    </div>
                    <div class="model-description">
                        <p><strong>Interactive Controls:</strong> Left click + drag to rotate, scroll to zoom, right click + drag to pan</p>
                        <p><strong>Time Simulation:</strong> Use the time slider to see shadow positions throughout the day</p>
                    </div>
                </div>
                <div class="time-controls">
                    <label for="time-slider">Time of Day:</label>
                    <input type="range" id="time-slider" min="6" max="18" value="12" step="0.5">
                    <span id="time-display">12:00</span>
                </div>
            </div>
        `;
        
        // Initialize 3D visualization if Three.js is available
        if (typeof THREE !== 'undefined') {
            this.init3DScene(activeYantra, yantraData);
        } else {
            document.getElementById('threejs-container').innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <h4>Three.js Required</h4>
                        <p>3D visualization requires Three.js library to be loaded.</p>
                    </div>
                </div>
            `;
        }
    }
    
    loadSolarChart(container) {
        const siteAnalysis = this.currentResults?.site_analysis;
        if (!siteAnalysis) {
            container.innerHTML = '<p>Solar data not available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="solar-chart">
                <h3>Solar Path Analysis</h3>
                <canvas id="solar-path-chart" width="600" height="400"></canvas>
                <div class="solar-info">
                    <p><strong>Summer Solstice:</strong> Max elevation ${siteAnalysis.astronomical_data.max_sun_elevation.toFixed(1)}°</p>
                    <p><strong>Winter Solstice:</strong> Min elevation ${siteAnalysis.astronomical_data.min_sun_elevation.toFixed(1)}°</p>
                    <p><strong>Location:</strong> ${siteAnalysis.location.coordinates_dms.latitude_dms}, ${siteAnalysis.location.coordinates_dms.longitude_dms}</p>
                </div>
            </div>
        `;
        
        // Here you would create a solar path visualization
        // this.drawSolarPath('solar-path-chart', siteAnalysis);
    }
    
    async loadComparisonChart() {
        const canvas = document.getElementById('comparison-chart');
        if (!canvas || !window.Chart) return;
        
        try {
            // Load comparison data for all historical sites
            const response = await fetch('/api/compare-sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sites: Object.keys(window.historicalSites || {})
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.createComparisonChart(canvas, data.comparison);
            }
        } catch (error) {
            console.error('Failed to load comparison chart:', error);
        }
    }
    
    createComparisonChart(canvas, comparisonData) {
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }
        
        const sites = Object.keys(comparisonData);
        const gnomonHeights = sites.map(site => comparisonData[site].samrat_gnomon_height);
        const gnomonAngles = sites.map(site => comparisonData[site].samrat_gnomon_angle);
        
        const ctx = canvas.getContext('2d');
        this.comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sites.map(s => s.replace('_', ' ')),
                datasets: [
                    {
                        label: 'Samrat Yantra Gnomon Height (m)',
                        data: gnomonHeights,
                        backgroundColor: 'rgba(212, 165, 116, 0.8)',
                        borderColor: 'rgb(212, 165, 116)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Gnomon Angle (degrees)',
                        data: gnomonAngles,
                        backgroundColor: 'rgba(139, 90, 43, 0.8)',
                        borderColor: 'rgb(139, 90, 43)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Yantra Dimensions Across Historical Sites'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Height (meters)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Angle (degrees)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
    
    exportResults(exportType) {
        if (!this.currentResults) {
            this.showError('No results to export. Please calculate yantras first.');
            return;
        }
        
        switch (exportType) {
            case 'export-pdf':
                this.exportToPDF();
                break;
            case 'export-json':
                this.exportToJSON();
                break;
        }
    }
    
    exportToJSON() {
        const dataStr = JSON.stringify(this.currentResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `yantra-calculations-${this.currentResults.location.latitude}-${this.currentResults.location.longitude}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    exportToPDF() {
        if (!window.jsPDF) {
            this.showError('PDF library not loaded. Please refresh the page and try again.');
            return;
        }
        
        try {
            this.showLoading();
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Page dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            let yPosition = margin;
            
            // Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Yantra Calculator Report', margin, yPosition);
            yPosition += 15;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
            yPosition += 15;
            
            // Location Information
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Location Details', margin, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const location = this.currentResults.location;
            const siteAnalysis = this.currentResults.site_analysis;
            
            doc.text(`Latitude: ${location.latitude.toFixed(6)}°`, margin, yPosition);
            yPosition += 6;
            doc.text(`Longitude: ${location.longitude.toFixed(6)}°`, margin, yPosition);
            yPosition += 6;
            doc.text(`Scale Factor: ${location.scale}x`, margin, yPosition);
            yPosition += 6;
            
            if (siteAnalysis?.location?.coordinates_dms) {
                const dms = siteAnalysis.location.coordinates_dms;
                doc.text(`Coordinates (DMS): ${dms.latitude_dms}, ${dms.longitude_dms}`, margin, yPosition);
                yPosition += 6;
            }
            
            if (siteAnalysis?.astronomical_data) {
                const astro = siteAnalysis.astronomical_data;
                doc.text(`Max Sun Elevation: ${astro.max_sun_elevation.toFixed(1)}°`, margin, yPosition);
                yPosition += 6;
                doc.text(`Min Sun Elevation: ${astro.min_sun_elevation.toFixed(1)}°`, margin, yPosition);
                yPosition += 6;
            }
            
            yPosition += 10;
            
            // Yantra Specifications
            Object.entries(this.currentResults.yantras).forEach(([yantraKey, yantra], index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 80) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                // Yantra Title
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(yantra.name, margin, yPosition);
                yPosition += 8;
                
                // Description
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const descLines = doc.splitTextToSize(yantra.description, contentWidth);
                doc.text(descLines, margin, yPosition);
                yPosition += descLines.length * 4 + 5;
                
                // Dimensions
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Dimensions:', margin, yPosition);
                yPosition += 6;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                Object.entries(yantra.dimensions).forEach(([key, value]) => {
                    const label = this.formatDimensionLabel(key);
                    const formattedValue = this.formatDimensionValue(value, key);
                    doc.text(`• ${label}: ${formattedValue}`, margin + 5, yPosition);
                    yPosition += 4;
                });
                
                yPosition += 3;
                
                // Angles
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Key Angles:', margin, yPosition);
                yPosition += 6;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                Object.entries(yantra.angles).forEach(([key, value]) => {
                    const label = this.formatDimensionLabel(key);
                    doc.text(`• ${label}: ${value.toFixed(2)}°`, margin + 5, yPosition);
                    yPosition += 4;
                });
                
                yPosition += 3;
                
                // Materials
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Materials:', margin, yPosition);
                yPosition += 6;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const materialsText = yantra.materials.join(', ');
                const materialLines = doc.splitTextToSize(materialsText, contentWidth - 5);
                doc.text(materialLines, margin + 5, yPosition);
                yPosition += materialLines.length * 4 + 3;
                
                // Construction Notes
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Construction Notes:', margin, yPosition);
                yPosition += 6;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const notesLines = doc.splitTextToSize(yantra.construction_notes, contentWidth - 5);
                doc.text(notesLines, margin + 5, yPosition);
                yPosition += notesLines.length * 4 + 10;
            });
            
            // Add footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
                doc.text('Generated by Yantra Calculator - Ancient Indian Astronomical Instruments', margin, pageHeight - 10);
            }
            
            // Save the PDF
            const filename = `yantra-report-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}.pdf`;
            doc.save(filename);
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showError('Failed to generate PDF: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    exportToCAD() {
        // Placeholder for CAD export functionality
        alert('CAD export functionality would be implemented here to generate DXF/DWG files');
    }
    
    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorModal = document.getElementById('error-modal');
        const errorMessage = document.getElementById('error-message');
        
        if (errorModal && errorMessage) {
            errorMessage.textContent = message;
            errorModal.style.display = 'flex';
        } else {
            alert(message); // Fallback
        }
    }
    
    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    updateVisualizations(results) {
        // Update any active visualizations with new data
        const activeVizTab = document.querySelector('.viz-tab.active');
        if (activeVizTab) {
            const vizType = activeVizTab.dataset.viz;
            const container = document.querySelector('.viz-content.active');
            if (container) {
                this.loadVisualization(vizType, container);
            }
        }
    }
    
    // 3D Visualization Methods
    init3DScene(yantraType, yantraData) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        const container = document.getElementById('threejs-container');
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87ceeb, 1);
        
        container.appendChild(this.renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(this.directionalLight);
        
        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Position camera
        this.camera.position.set(15, 15, 15);
        this.controls.update();
        
        // Create yantra model
        this.create3DYantra(yantraType, yantraData);
        
        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Animation loop
        this.animate3D();
        
        // Setup time slider
        const timeSlider = document.getElementById('time-slider');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                this.updateSunPosition(parseFloat(e.target.value));
                const hours = Math.floor(e.target.value);
                const minutes = Math.round((e.target.value % 1) * 60);
                document.getElementById('time-display').textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            });
        }
    }
    
    create3DYantra(yantraType, data) {
        // Remove existing yantra
        if (this.yantraGroup) {
            this.scene.remove(this.yantraGroup);
        }
        
        this.yantraGroup = new THREE.Group();
        
        switch (yantraType) {
            case 'samrat':
                this.create3DSamrat(data);
                break;
            case 'rama':
                this.create3DRama(data);
                break;
            case 'digamsa':
                this.create3DDigamsa(data);
                break;
            case 'dhruva':
                this.create3DDhruva(data);
                break;
        }
        
        this.scene.add(this.yantraGroup);
        
        // Update stats
        this.updateModelStats();
    }
    
    create3DSamrat(data) {
        const dims = data.dimensions;
        
        // Create gnomon (triangular wall)
        const gnomonGeometry = new THREE.ExtrudeGeometry(
            new THREE.Shape([
                new THREE.Vector2(0, 0),
                new THREE.Vector2(-dims.gnomon_base / 2, dims.gnomon_height),
                new THREE.Vector2(dims.gnomon_base / 2, dims.gnomon_height)
            ]),
            { depth: 0.5, bevelEnabled: false }
        );
        
        const gnomonMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        const gnomon = new THREE.Mesh(gnomonGeometry, gnomonMaterial);
        gnomon.castShadow = true;
        gnomon.rotation.x = -Math.PI / 2;
        
        this.yantraGroup.add(gnomon);
        
        // Create quadrant scales
        const scaleGeometry = new THREE.TorusGeometry(dims.quadrant_radius, 0.1, 8, 32, Math.PI);
        const scaleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        
        // Left quadrant
        const leftScale = new THREE.Mesh(scaleGeometry, scaleMaterial);
        leftScale.rotation.y = Math.PI / 2;
        leftScale.castShadow = true;
        this.yantraGroup.add(leftScale);
        
        // Right quadrant
        const rightScale = new THREE.Mesh(scaleGeometry, scaleMaterial);
        rightScale.rotation.y = -Math.PI / 2;
        rightScale.castShadow = true;
        this.yantraGroup.add(rightScale);
    }
    
    create3DRama(data) {
        const dims = data.dimensions;
        
        // Outer cylinder wall
        const wallGeometry = new THREE.CylinderGeometry(dims.base_radius, dims.base_radius, dims.wall_height, 32, 1, true);
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574, side: THREE.DoubleSide });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = dims.wall_height / 2;
        wall.castShadow = true;
        this.yantraGroup.add(wall);
        
        // Central pillar
        const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, dims.pillar_height);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = dims.pillar_height / 2;
        pillar.castShadow = true;
        this.yantraGroup.add(pillar);
        
        // Radial divisions
        for (let i = 0; i < dims.radial_divisions; i++) {
            const angle = (i * 2 * Math.PI) / dims.radial_divisions;
            const divisionGeometry = new THREE.BoxGeometry(0.05, dims.wall_height, dims.base_radius);
            const divisionMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
            const division = new THREE.Mesh(divisionGeometry, divisionMaterial);
            
            division.position.x = Math.cos(angle) * dims.base_radius / 2;
            division.position.z = Math.sin(angle) * dims.base_radius / 2;
            division.position.y = dims.wall_height / 2;
            division.rotation.y = angle;
            division.castShadow = true;
            
            this.yantraGroup.add(division);
        }
    }
    
    create3DDigamsa(data) {
        const dims = data.dimensions;
        
        // Platform
        const platformGeometry = new THREE.CylinderGeometry(dims.platform_radius, dims.platform_radius, 0.2);
        const platformMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 0.1;
        platform.receiveShadow = true;
        this.yantraGroup.add(platform);
        
        // Central gnomon
        const gnomonGeometry = new THREE.CylinderGeometry(0.05, 0.05, dims.gnomon_height);
        const gnomonMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const gnomon = new THREE.Mesh(gnomonGeometry, gnomonMaterial);
        gnomon.position.y = dims.gnomon_height / 2 + 0.2;
        gnomon.castShadow = true;
        this.yantraGroup.add(gnomon);
    }
    
    create3DDhruva(data) {
        const dims = data.dimensions;
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(dims.base_radius, dims.base_radius, 0.3);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.receiveShadow = true;
        this.yantraGroup.add(base);
        
        // Polar axis
        const axisGeometry = new THREE.CylinderGeometry(0.1, 0.1, dims.polar_axis_length);
        const axisMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const axis = new THREE.Mesh(axisGeometry, axisMaterial);
        
        const inclination = data.angles.pole_inclination_angle * Math.PI / 180;
        axis.rotation.z = Math.PI / 2 - inclination;
        axis.position.y = dims.polar_axis_length / 2 * Math.sin(inclination) + 0.3;
        axis.position.x = dims.polar_axis_length / 2 * Math.cos(inclination);
        axis.castShadow = true;
        
        this.yantraGroup.add(axis);
        
        // Rings
        const outerRingGeometry = new THREE.TorusGeometry(dims.outer_ring_radius, 0.05, 8, 32);
        const ringMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const outerRing = new THREE.Mesh(outerRingGeometry, ringMaterial);
        outerRing.position.y = 0.3;
        outerRing.rotation.x = Math.PI / 2;
        outerRing.castShadow = true;
        this.yantraGroup.add(outerRing);
    }
    
    animate3D() {
        if (!this.renderer) return;
        
        requestAnimationFrame(() => this.animate3D());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateSunPosition(timeOfDay) {
        if (!this.directionalLight) return;
        
        // Simple sun position calculation
        const hourAngle = (timeOfDay - 12) * 15 * Math.PI / 180;
        const elevation = Math.PI / 3; // 60 degrees at noon
        
        this.directionalLight.position.set(
            20 * Math.sin(hourAngle),
            20 * Math.sin(elevation),
            20 * Math.cos(hourAngle)
        );
    }
    
    updateModelStats() {
        if (!this.yantraGroup) return;
        
        let vertexCount = 0;
        let faceCount = 0;
        
        this.yantraGroup.traverse((child) => {
            if (child.geometry) {
                const geometry = child.geometry;
                if (geometry.attributes && geometry.attributes.position) {
                    vertexCount += geometry.attributes.position.count;
                }
                if (geometry.index) {
                    faceCount += geometry.index.count / 3;
                }
            }
        });
        
        const vertexElement = document.getElementById('vertex-count');
        const faceElement = document.getElementById('face-count');
        
        if (vertexElement) vertexElement.textContent = vertexCount.toLocaleString();
        if (faceElement) faceElement.textContent = Math.floor(faceCount).toLocaleString();
    }
    
    resetCamera() {
        if (this.controls && this.camera) {
            this.camera.position.set(15, 15, 15);
            this.controls.reset();
        }
    }
    
    toggleWireframe() {
        if (!this.yantraGroup) return;
        
        this.yantraGroup.traverse((child) => {
            if (child.material) {
                child.material.wireframe = !child.material.wireframe;
            }
        });
    }
    
    toggleShadows() {
        if (this.renderer) {
            this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;
        }
    }
    
    switch3DYantra(yantraType) {
        const tabButton = document.querySelector(`[data-yantra="${yantraType}"]`);
        if (tabButton) {
            this.switchTab(tabButton);
            
            if (this.currentResults && this.currentResults.yantras[yantraType]) {
                this.create3DYantra(yantraType, this.currentResults.yantras[yantraType]);
            }
        }
    }
    
    export3DModel() {
        if (!this.yantraGroup) {
            alert('No 3D model to export');
            return;
        }
        
        // This would export the 3D model as OBJ
        alert('3D model export functionality would use THREE.OBJExporter');
    }
}

// Initialize the application
const app = new YantraCalculatorApp();

// Make app globally available for popup buttons and other interactions
window.app = app;
