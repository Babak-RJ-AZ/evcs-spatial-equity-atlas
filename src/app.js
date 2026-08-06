const map = L.map('map', { zoomControl: true }).setView([45.4642, 9.19], 11.4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let boundaryLayer, stationLayer, serviceLayer, thiessenLayer;
let thiessenData;
let currentIndicator = 'population_coverage_ratio';

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
      <dt>Population</dt><dd>${Math.round(p.population_total).toLocaleString()}</dd>
      <dt>Population covered</dt><dd>${Math.round(p.population_covered).toLocaleString()}</dd>
      <dt>Population coverage</dt><dd>${(p.population_coverage_ratio * 100).toFixed(1)}%</dd>
      <dt>Zone area</dt><dd>${p.thiessen_area_km2.toFixed(2)} km²</dd>
      <dt>Area covered</dt><dd>${p.area_covered_km2.toFixed(2)} km²</dd>
      <dt>Area coverage</dt><dd>${(p.area_coverage_ratio * 100).toFixed(1)}%</dd>
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

Promise.all([
  fetch('data/boundary_milan.geojson').then(r => r.json()),
  fetch('data/evcs_milan.geojson').then(r => r.json()),
  fetch('data/service_area_milan.geojson').then(r => r.json()),
  fetch('data/thiessen_milan.geojson').then(r => r.json())
]).then(([boundary, stations, service, thiessen]) => {
  thiessenData = thiessen;
  boundaryLayer = L.geoJSON(boundary, { style: { color:'#17212b', weight:2, fillOpacity:0 } }).addTo(map);
  serviceLayer = L.geoJSON(service, { style: { color:'#165d73', weight:0.7, fillColor:'#8fb9c5', fillOpacity:0.28 } }).addTo(map);
  stationLayer = L.geoJSON(stations, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius:3.2, color:'#fff', weight:1, fillColor:'#17212b', fillOpacity:.95 }),
    onEachFeature: (feature, layer) => {
      const p=feature.properties;
      layer.bindPopup(`<div class="popup-title">${p.title || 'Charging station'}</div>${p.address || ''}${p.postcode ? `<br>${p.postcode}`:''}${p.number_of_points ? `<br>Charging points: ${p.number_of_points}`:''}`);
    }
  }).addTo(map);
  thiessenLayer = L.geoJSON(thiessen, {
    style: polygonStyle,
    onEachFeature: (feature, layer) => {
      layer.on({ click: () => selectFeature(feature, layer), mouseover: () => layer.setStyle({weight:1.8,color:'#17212b'}), mouseout: () => thiessenLayer.resetStyle(layer) });
      const p=feature.properties;
      layer.bindTooltip(`Zone ${p.service_id}: ${(p.population_coverage_ratio*100).toFixed(1)}% population coverage`);
    }
  });
  map.fitBounds(boundaryLayer.getBounds(), { padding:[12,12] });
  addLegend();
}).catch(err => {
  console.error(err);
  document.getElementById('map').innerHTML = '<p style="padding:2rem">Map data could not be loaded. Run the project through a local web server or GitHub Pages.</p>';
});

document.getElementById('toggleStations').addEventListener('change', e => e.target.checked ? stationLayer.addTo(map) : map.removeLayer(stationLayer));
document.getElementById('toggleService').addEventListener('change', e => e.target.checked ? serviceLayer.addTo(map) : map.removeLayer(serviceLayer));
document.getElementById('toggleThiessen').addEventListener('change', e => e.target.checked ? thiessenLayer.addTo(map) : map.removeLayer(thiessenLayer));
document.getElementById('indicator').addEventListener('change', e => {
  currentIndicator = e.target.value;
  if (!map.hasLayer(thiessenLayer)) { thiessenLayer.addTo(map); document.getElementById('toggleThiessen').checked = true; }
  thiessenLayer.setStyle(polygonStyle);
  addLegend();
});
