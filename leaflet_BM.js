;(function (L) {
  L.Control.BMControl = L.Control.extend({
    options: {
      position: 'topright',
      basemaps: [],              // [{ name, layer, icon }]
      defaultBasemap: null,      // Name of the default basemap
      style: 'basic',            // 'basic' or 'icon-only'
      collapsedWidth: 90,
      expandedWidth: 1000
    },

    initialize: function (options) {
      L.setOptions(this, options);

      this._basemaps = this.options.basemaps;

      this._activeName = null;
    },

    onAdd: function (map) {
      this._map = map;

      const container = L.DomUtil.create('div',
        `leaflet-bm-control leaflet-bar style-${this.options.style}`
      );

      if (this.options.style === 'icon-only') {
        container.classList.add('collapsed');
        container.addEventListener('mouseenter', () => container.classList.remove('collapsed'));
       container.addEventListener('mouseleave', () => container.classList.add('collapsed'));
      }

      // Create basemap buttons
      this._basemaps.forEach((bm) => {
        const btn = L.DomUtil.create('div', 'bm-btn', container);
        btn.title = bm.name;

        const img = L.DomUtil.create('img', 'bm-icon', btn);
        img.src = bm.icon;
        img.alt = bm.name;

        if (this.options.style === 'basic') {
          const label = L.DomUtil.create('span', 'bm-label', btn);
          label.innerText = bm.name;
        }

        btn.addEventListener('click', () => this._switchTo(bm.name));
      });

      // Trigger default layer on load if set
      if (this.options.defaultBasemap) {
        setTimeout(() => this._switchTo(this.options.defaultBasemap), 0);
      } else if (this._basemaps.length > 0) {
        setTimeout(() => this._switchTo(this._basemaps[0].name), 0);
      }

      L.DomEvent.disableClickPropagation(container);
      return container;
    },

    _switchTo: function (name) {
      const selected = this._basemaps.find(b => b.name === name);
      if (!selected) return;

      // Remove any active basemap layer
      this._basemaps.forEach(b => {
        if (this._map.hasLayer(b.layer)) {
          this._map.removeLayer(b.layer);
        }
      });

      // Add selected layer
      this._map.addLayer(selected.layer);
      this._activeName = name;

      // Update UI to highlight active
      const container = this.getContainer();
      container.querySelectorAll('.bm-btn').forEach(btn => {
        btn.classList.toggle('active', btn.title === name);
      });
    }
  });

  // Factory method
  L.control.basemapControl = function (opts) {
    return new L.Control.BMControl(opts);
  };
})(L);




// -----

(function (L) {
  L.Control.MouseCoordinate = L.Control.extend({
    options: {
      position: 'bottomleft',
      precision: 5,
      separator: ', ',
      prefix: 'LatLng:'
    },

    onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-mousecoord');
      L.DomEvent.disableClickPropagation(this._container);

      this._container.style.padding = '1px';
      this._container.style.borderRadius = '10px';
      this._container.style.background = 'rgba(255, 255, 255, 0.8)';
      this._container.style.fontFamily = 'monospace';

      this._map = map;

      this._updateText({ lat: 0, lng: 0 });

      this._map.on('mousemove', this._onMouseMove, this);
      return this._container;
    },

    onRemove: function (map) {
      map.off('mousemove', this._onMouseMove, this);
    },

    _onMouseMove: function (e) {
      this._updateText(e.latlng);
    },

    _updateText: function (latlng) {
      const lat = latlng.lat.toFixed(this.options.precision);
      const lng = latlng.lng.toFixed(this.options.precision);
      this._container.innerHTML = `${this.options.prefix} ${lat}${this.options.separator}${lng}`;
    }
  });

  L.control.mouseCoordinate = function (options) {
    return new L.Control.MouseCoordinate(options);
  };
})(L);
