import axios from 'axios';

const baseUrl = 'https://api3.geo.admin.ch/rest/services/api/MapServer/identify';
const layers = 'all:' + ['ch.bafu.wrz-jagdbanngebiete_select', 'ch.bafu.wrz-wildruhezonen_portal'].join(',');

function RespecterCestProtegerService() {
  this.axios = axios.create();
}

RespecterCestProtegerService.prototype.identify = function (position, extent, mapWidth, mapHeight, language) {
  if (!['fr', 'de', 'it'].includes(language)) {
    language = 'en';
  }

  const geometry = `${position[0]},${position[1]}`;
  const geometryType = 'esriGeometryPoint';
  const geometryFormat = 'geojson';
  const mapExtent = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;
  const dpi = window.devicePixelRatio * 96;
  const imageDisplay = `${mapWidth},${mapHeight},${dpi}`;
  const tolerance = 3;

  return axios.get(
    `${baseUrl}` +
      `?geometry=${geometry}` +
      `&geometryType=${geometryType}` +
      `&geometryFormat=${geometryFormat}` +
      `&layers=${layers}` +
      `&mapExtent=${mapExtent}` +
      `&imageDisplay=${imageDisplay}` +
      `&tolerance=${tolerance}` +
      `&lang=${language}`
  );
};

RespecterCestProtegerService.prototype.hasArea = function (extent) {
  const geometry = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;

  return axios
    .get(
      `${baseUrl}` +
        `?geometry=${geometry}` +
        `&geometryType=esriGeometryEnvelope` +
        `&returnGeometry=false` +
        `&layers=${layers}` +
        `&tolerance=0`
    )
    .then((response) => (response?.data?.results?.length ?? 0) > 0);
};

export default RespecterCestProtegerService;
