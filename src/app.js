const map = L.map('map', { zoomControl: true }).setView([45.4642, 9.19], 11.4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let boundaryLayer, stationLayer, serviceLayer, thiessenLayer;
let currentIndicator = 'population_coverage_ratio';
let currentCity = 'milan';
let requestToken = 0;
let summaries = {};

const indicatorMeta = {
  population_coverage_ratio: { label: 'Population coverage', format: v => `${(v * 100).toFixed(1)}%`, breaks: [0.5, 0.75, 0.9, 0.99] },
  area_coverage_ratio: { label: 'Area coverage', format: v => `${(v * 100).toFixed(1)}%`, breaks: [0.5, 0.75, 0.9, 0.99] },
  population_total: { label: 'Population in zone', format: v => Math.round(v).toLocaleString(), breaks: [1000, 3000, 7000, 12000] }
};
const palette = ['#eff3f5','#c9dde3','#8fb9c5','#4b8ca0','#165d73'];

function colorFor(value, breaks) {
  if (value <= breaks[0]) return palette[0];
  if (value <= breaks[1]) return palette[1];
  if (value <= breaks[2]) return palette[2];
  if (value <= breaks[3]) return palette[3];
  return palette[4];
}

function polygonStyle(feature) {
  const meta = indicatorMeta[currentIndicator];
  return {
    color: '#58646f', weight: 0.7, opacity: 0.7,
    fillColor: colorFor(Number(feature.properties[currentIndicator] || 0), meta.breaks),
    fillOpacity: 0.68
  };
}

function selectFeature(feature, layer) {
  if (thiessenLayer) thiessenLayer.resetStyle();
  layer.setStyle({ weight: 2.4, color: '#111820', fillOpacity: 0.82 });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) layer.bringToFront();
  const p = feature.properties;
  document.getElementById('selection').innerHTML = `
    <h3>Service zone ${p.service_id}</h3>
    <dl>
      <dt>Population</dt><dd>${Math.round(p.population_total || 0).toLocaleString()}</dd>
      <dt>Population covered</dt><dd>${Math.round(p.population_covered || 0).toLocaleString()}</dd>
      <dt>Population coverage</dt><dd>${((p.population_coverage_ratio || 0) * 100).toFixed(1)}%</dd>
      <dt>Zone area</dt><dd>${Number(p.thiessen_area_km2 || 0).toFixed(2)} km²</dd>
      <dt>Area covered</dt><dd>${Number(p.area_covered_km2 || 0).toFixed(2)} km²</dd>
      <dt>Area coverage</dt><dd>${((p.area_coverage_ratio || 0) * 100).toFixed(1)}%</dd>
    </dl>`;
}

function addLegend() {
  const meta = indicatorMeta[currentIndicator];
  const b = meta.breaks;
  const labels = currentIndicator.includes('ratio')
    ? [`≤ ${b[0]*100}%`, `${b[0]*100}–${b[1]*100}%`, `${b[1]*100}–${b[2]*100}%`, `${b[2]*100}–${b[3]*100}%`, `> ${b[3]*100}%`]
    : [`≤ ${b[0].toLocaleString()}`, `${b[0].toLocaleString()}–${b[1].toLocaleString()}`, `${b[1].toLocaleString()}–${b[2].toLocaleString()}`, `${b[2].toLocaleString()}–${b[3].toLocaleString()}`, `> ${b[3].toLocaleString()}`];
  document.getElementById('legend').innerHTML = `<div class="legend-title">${meta.label}</div>` + labels.map((x,i)=>`<div class="legend-row"><span class="legend-swatch" style="background:${palette[i]}"></span>${x}</div>`).join('');
}

function removeCurrentLayers() {
  [boundaryLayer, stationLayer, serviceLayer, thiessenLayer].forEach(layer => {
    if (layer && map.hasLayer(layer)) map.removeLayer(layer);
  });
  boundaryLayer = stationLayer = serviceLayer = thiessenLayer = null;
}

function setDashboard(cityKey) {
  const s = summaries[cityKey];
  if (!s) return;
  document.getElementById('cityName').textContent = s.name;
  document.getElementById('stationCount').textContent = s.stations.toLocaleString();
  document.getElementById('zoneCount').textContent = s.service_zones.toLocaleString();
  document.getElementById('populationGini').textContent = Number(s.population_gini).toFixed(2);
  document.getElementById('areaGini').textContent = Number(s.area_gini).toFixed(2);
  document.getElementById('interpretation').textContent = s.interpretation;
  document.getElementById('selection').innerHTML = '<h3>Explore a service zone</h3><p>Turn on Thiessen zones and click a polygon to inspect its population and coverage statistics.</p>';
}

async function loadCity(cityKey) {
  currentCity = cityKey;
  const token = ++requestToken;
  const loading = document.getElementById('loading');
  loading.classList.add('visible');
  setDashboard(cityKey);
  try {
    const [boundary, stations, service, thiessen] = await Promise.all([
      fetch(`data/boundary_${cityKey}.geojson`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`data/evcs_${cityKey}.geojson`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`data/service_area_${cityKey}.geojson`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`data/thiessen_${cityKey}.geojson`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
    ]);
    if (token !== requestToken) return;
    removeCurrentLayers();
    boundaryLayer = L.geoJSON(boundary, { style: { color:'#17212b', weight:2, fillOpacity:0 } }).addTo(map);
    serviceLayer = L.geoJSON(service, { style: { color:'#165d73', weight:0.7, fillColor:'#8fb9c5', fillOpacity:0.28 } });
    stationLayer = L.geoJSON(stations, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius:3.2, color:'#fff', weight:1, fillColor:'#17212b', fillOpacity:.95 }),
      onEachFeature: (feature, layer) => {
        const p=feature.properties;
        const extra = p.power_kw ? `<br>Max recorded power: ${p.power_kw} kW` : '';
        layer.bindPopup(`<div class="popup-title">${p.title || 'Charging station'}</div>${p.address || ''}${p.postcode ? `<br>${p.postcode}`:''}${p.number_of_points ? `<br>Charging points: ${p.number_of_points}`:''}${extra}`);
      }
    });
    thiessenLayer = L.geoJSON(thiessen, {
      style: polygonStyle,
      onEachFeature: (feature, layer) => {
        layer.on({ click: () => selectFeature(feature, layer), mouseover: () => layer.setStyle({weight:1.8,color:'#17212b'}), mouseout: () => thiessenLayer && thiessenLayer.resetStyle(layer) });
        const p=feature.properties;
        layer.bindTooltip(`Zone ${p.service_id}: ${((p.population_coverage_ratio || 0)*100).toFixed(1)}% population coverage`);
      }
    });
    if (document.getElementById('toggleService').checked) serviceLayer.addTo(map);
    if (document.getElementById('toggleStations').checked) stationLayer.addTo(map);
    if (document.getElementById('toggleThiessen').checked) thiessenLayer.addTo(map);
    map.fitBounds(boundaryLayer.getBounds(), { padding:[18,18] });
    addLegend();
  } catch (err) {
    console.error(err);
    document.getElementById('selection').innerHTML = '<h3>Data loading error</h3><p>The selected city data could not be loaded. Please refresh the page.</p>';
  } finally {
    if (token === requestToken) loading.classList.remove('visible');
  }
}

fetch('data/summary.json').then(r => r.json()).then(data => {
  summaries = data;
  loadCity('milan');
}).catch(err => {
  console.error(err);
  document.getElementById('loading').textContent = 'Summary data could not be loaded.';
  document.getElementById('loading').classList.add('visible');
});

document.getElementById('city').addEventListener('change', e => loadCity(e.target.value));
document.getElementById('toggleStations').addEventListener('change', e => {
  if (!stationLayer) return;
  e.target.checked ? stationLayer.addTo(map) : map.removeLayer(stationLayer);
});
document.getElementById('toggleService').addEventListener('change', e => {
  if (!serviceLayer) return;
  e.target.checked ? serviceLayer.addTo(map) : map.removeLayer(serviceLayer);
});
document.getElementById('toggleThiessen').addEventListener('change', e => {
  if (!thiessenLayer) return;
  e.target.checked ? thiessenLayer.addTo(map) : map.removeLayer(thiessenLayer);
});
document.getElementById('indicator').addEventListener('change', e => {
  currentIndicator = e.target.value;
  if (!thiessenLayer) return;
  if (!map.hasLayer(thiessenLayer)) {
    thiessenLayer.addTo(map);
    document.getElementById('toggleThiessen').checked = true;
  }
  thiessenLayer.setStyle(polygonStyle);
  addLegend();
});
