function showInPanel(layer, fields, title, resetCallback, rename, mediaFields = [], mediaFolder = '') {
  window.currentFeaturePolygon = layer ? layer.toGeoJSON() : null;

  // 1️⃣ Panel creation
  let panel = document.querySelector('.right-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'right-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h5 id="panel-title">Details</h5>
        <button id="right-panel-close">&times;</button>
      </div>
      <div id="right-panel-content" class="panel-content"></div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#right-panel-close').onclick = () => {
      document.body.classList.remove('rb-sidenav-toggled-right');
      updateToggleIcon();
    };
  }

  // 2️⃣ Toggle button creation
  let toggleBtn = document.querySelector('.right-panel-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'right-panel-toggle';
    toggleBtn.innerHTML = '&laquo;';
    toggleBtn.onclick = () => {
      document.body.classList.toggle('rb-sidenav-toggled-right');
      updateToggleIcon();
    };
    document.body.appendChild(toggleBtn);
  }

  // 3️⃣ Toggle icon
  const updateToggleIcon = () => {
    toggleBtn.innerHTML = document.body.classList.contains('rb-sidenav-toggled-right') ? '&raquo;' : '&laquo;';
  };

  if (!layer) {
    updateToggleIcon();
    return;
  }

  // 4️⃣ Fill panel
  const panelContent = panel.querySelector('#right-panel-content');
  const panelTitle = panel.querySelector('#panel-title');
  panelTitle.textContent = title || 'Details';

  const rawProps = layer.feature?.properties || {};
  const properties = rawProps.attributes || rawProps;
  mediaFields = Array.isArray(mediaFields) ? mediaFields : [];

  const mediaItems = mediaFields.map((field, index) => {
    let filename = (properties[field] || '').trim();
    if (!filename) return null;
    if (!filename.includes('.')) {
      filename += field.toLowerCase().startsWith('vid') ? '.mp4' : '.jpg';
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'tif', 'tiff'].includes(ext);
    const isVideo = ['mp4', 'webm'].includes(ext);
    if (!isImage && !isVideo) return null;

    const worldFileName = (properties['lop_coord'] || '').trim();

    return {
      index,
      field,
      type: isImage ? 'image' : 'video',
      filename,
      worldFileName,
      url: `/static/${mediaFolder.replace(/^\/|\/$/g, '')}/${encodeURIComponent(filename)}`
    };
  }).filter(Boolean);

  const firstThree = mediaItems.slice(0, 3);
  const remaining = mediaItems.length - 3;

  const mediaThumbnails = firstThree.map((item, index) => {
    return item.type === 'image'
      ? `<img src="${item.url}" class="img-thumbnail m-1 shadow-sm thumb-hover"
               style="width: 60px; height: 60px; cursor: pointer;"
               data-bs-toggle="modal" data-bs-target="#panelImageModal"
               data-index="${index}">`
      : `<video class="img-thumbnail m-1 shadow-sm thumb-hover"
               style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" muted
               data-bs-toggle="modal" data-bs-target="#panelImageModal"
               data-index="${index}">
            <source src="${item.url}" type="video/mp4">
         </video>`;
  }).join('');

  const plusMore = remaining > 0
    ? `<div class="m-1 d-flex align-items-center justify-content-center"
             style="width: 60px; height: 60px; background: #eee; border-radius: 4px; font-size: 12px;">
        +${remaining}
       </div>`
    : '';

  const bodyHTML = `
    ${mediaItems.length ? `<div class="mb-2 d-flex flex-wrap">${mediaThumbnails}${plusMore}</div>` : ''}
    <ul>
      ${fields.map(field => {
        const displayName = rename?.[field] || field;
        const rawValue = properties[field];
        let formattedValue = 'N/A';
        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
          const num = Number(rawValue);
          formattedValue = !isNaN(num) ? num.toLocaleString('en-US') : rawValue;
        }
        return `<li><strong>${displayName}:</strong> <span class="value">${formattedValue}</span></li>`;
      }).join('')}
    </ul>
  `;

  panelContent.classList.add('content-loading');
  setTimeout(() => {
    panelContent.innerHTML = bodyHTML;
    panelContent.classList.remove('content-loading');
  }, 50);

  document.body.classList.add('rb-sidenav-toggled-right');
  updateToggleIcon();
  if (typeof resetCallback === 'function') resetCallback();

  panelContent.querySelectorAll('li').forEach((li, i) => {
    li.style.transitionDelay = `${0.05 * i}s`;
  });

  // 5️⃣ Modal
  if (mediaItems.length) {
    let modalWrapper = document.getElementById('panel-image-carousel-wrapper');
    if (!modalWrapper) {
      modalWrapper = document.createElement('div');
      modalWrapper.id = 'panel-image-carousel-wrapper';
      document.body.appendChild(modalWrapper);
    }

    modalWrapper.innerHTML = `
      <div id="panelImageModal" class="modal fade custom-fade" tabindex="-1" style="z-index: 999999;">
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content">
            <div class="modal-header border-0">
              <ul class="nav nav-tabs border-0" id="imageModalTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="image-tab" data-bs-toggle="tab" data-bs-target="#image-tab-pane" type="button" role="tab">
                    <i class="fas fa-image"></i> Image View
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="map-tab" data-bs-toggle="tab" data-bs-target="#map-tab-pane" type="button" role="tab">
                    <i class="fas fa-map"></i> Map View
                  </button>
                </li>
              </ul>
              <div class="d-flex gap-2 ms-auto">
                <button type="button" class="btn btn-sm btn-outline-secondary rotate-btn" title="Rotate (R)">⟳</button>
                <button type="button" class="btn-close btn-close-black" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
            </div>
            <div class="modal-body p-2">
              <div class="tab-content" id="imageModalTabsContent">
                <div class="tab-pane fade show active" id="image-tab-pane" role="tabpanel">
                  <div id="imageCarousel" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">
                      ${mediaItems.map((item, index) => `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                          <div class="modal-carousel-img-wrapper">
                            ${item.type === 'image'
                              ? `<img src="${item.url}" class="modal-carousel-img" alt="Image ${index + 1}" 
                                     data-image-url="${item.filename}" 
                                     data-world-file="${item.worldFileName}">`
                              : `<video class="modal-carousel-img" controls><source src="${item.url}" type="video/mp4"></video>`
                            }
                          </div>
                        </div>`).join('')}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#imageCarousel" data-bs-slide="prev">
                      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#imageCarousel" data-bs-slide="next">
                      <span class="carousel-control-next-icon" aria-hidden="true"></span>
                      <span class="visually-hidden">Next</span>
                    </button>
                  </div>
                </div>
                <div class="tab-pane fade" id="map-tab-pane" role="tabpanel">
                  <div id="modalMap" style="height: 500px; width: 100%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const medias = document.querySelectorAll('.modal-carousel-img');
      let activeMedia = null, scale = 1, rotation = 0, isDragging = false;
      let startX, startY, translateX = 0, translateY = 0;

      const applyTransform = () => {
        if (activeMedia) {
          activeMedia.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
        }
      };

      medias.forEach(media => {
        media.addEventListener('mouseenter', () => activeMedia = media);
        media.addEventListener('wheel', e => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          scale = Math.min(Math.max(scale + delta, 0.5), 5);
          applyTransform();
        });
        media.addEventListener('mousedown', e => {
          isDragging = true;
          startX = e.clientX - translateX;
          startY = e.clientY - translateY;
          media.style.cursor = 'grabbing';
        });
        window.addEventListener('mouseup', () => { isDragging = false; media.style.cursor = 'grab'; });
        window.addEventListener('mousemove', e => {
          if (!isDragging) return;
          translateX = e.clientX - startX;
          translateY = e.clientY - startY;
          applyTransform();
        });
        media.addEventListener('dblclick', () => { scale = 1; rotation = 0; translateX = 0; translateY = 0; applyTransform(); });
        media.style.cursor = 'grab';
      });

      window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r') { rotation = (rotation + 90) % 360; applyTransform(); } });
      document.querySelector('.rotate-btn')?.addEventListener('click', () => { rotation = (rotation + 90) % 360; applyTransform(); });

      let modalMap = null;
      let currentImageOverlay = null;

      document.getElementById('map-tab').addEventListener('click', function () {
        if (!modalMap) {
          setTimeout(() => {
            initializeModalMap();
            setTimeout(() => {
              modalMap.invalidateSize();

              // 🟢 Auto-load TIFF from lop_georef
              const lopGeoref = (layer.feature?.properties?.lop_georef || '').trim();
              if (lopGeoref && lopGeoref.toLowerCase().endsWith('.tif')) {
                console.log("Loading parcel GeoTIFF:", lopGeoref);
                loadGeoTiffOnModalMap(lopGeoref, mediaFolder);
              }

              if (window.currentFeaturePolygon) {
                L.geoJSON(window.currentFeaturePolygon, {
                  style: { color: 'red', weight: 3, fillOpacity: 0 }
                }).addTo(modalMap);
              }

            }, 100);
          }, 100);
        } else {
          setTimeout(() => {
            modalMap.invalidateSize();
            const lopGeoref = (layer.feature?.properties?.lop_georef || '').trim();
            if (lopGeoref && lopGeoref.toLowerCase().endsWith('.tif')) {
              loadGeoTiffOnModalMap(lopGeoref, mediaFolder);
            }
          }, 100);
        }
      });

      function initializeModalMap() {
        modalMap = L.map('modalMap', {
          zoomControl: true,
          attributionControl: true,
          renderer: L.canvas()
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 22
        }).addTo(modalMap);

        modalMap.setView([31.52, 74.35], 12);
        L.control.scale().addTo(modalMap);
      }

      function loadGeoTiffOnModalMap(tifFilename, mediaFolder) {
        const basePath = `/static/${mediaFolder.replace(/^\/|\/$/g, '')}/`;
        const tifUrl = basePath + encodeURIComponent(tifFilename);

        if (currentImageOverlay) modalMap.removeLayer(currentImageOverlay);

        fetch(tifUrl)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => parseGeoraster(arrayBuffer))
          .then(georaster => {
            const noDataValue = georaster.noDataValue ?? 0;
            const layer = new GeoRasterLayer({
              georaster,
              projection: 4326, // Force CRS as EPSG:4326
              opacity: 1,
              resolution: 256,
              resampleMethod: "bilinear",
              pixelValuesToColorFn: values => {
                if (!values) return null;
                if (values.length === 1) {
                  const v = values[0];
                  if (v === noDataValue || isNaN(v)) return null;
                  return `rgb(${v},${v},${v})`;
                }
                if (values.length >= 3) {
                  const [r, g, b] = values;
                  if ([r, g, b].some(v => v === noDataValue || isNaN(v))) return null;
                  return `rgb(${r},${g},${b})`;
                }
                return null;
              },
            });

            currentImageOverlay = layer.addTo(modalMap);
            modalMap.fitBounds(layer.getBounds());
            console.log("✅ GeoTIFF placed successfully");
          })
          .catch(err => {
            console.error("❌ Failed to load GeoTIFF:", err);
            alert(`Error loading GeoTIFF: ${tifFilename}`);
          });
      }
    }, 300);
  }
}
