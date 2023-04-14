import { cartoLayers, dataLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';

let c2c_cartoLayers = cartoLayers();
let c2c_dataLayers = dataLayers();

// filter UK (remove)
c2c_cartoLayers = c2c_cartoLayers.filter((layer) => {
  return layer.get('country') !== 'gb';
});

// set blend modes for data layers (slopes)
c2c_dataLayers = c2c_dataLayers.map((layer) => {
  return setDataLayerBlendModes(layer);
});

// for areas
let areasCartoLayers = cartoLayers();
let areasDataLayers = dataLayers();

// override default values for each layer:
// className = allow for compositiing between layers
// prerender/postrender = set bend modes to create clipping
areasCartoLayers = areasCartoLayers.map((layer) => {
  layer.className_ = Yetix.BLEND_MODES_CLASS_NAME;
  layer.on('prerender', (evt) => {
    // source-atop: means the source (this layer) will only be drawn on actual pixels (area layer)
    // but only when MAX_ZOOM
    if (Yetix.mapZoom <= Yetix.BLEND_MODES_MAX_ZOOM) {
      evt.context.globalCompositeOperation = 'source-atop';
    }
  });
  layer.on('postrender', (evt) => {
    // source-over: returns to default
    evt.context.globalCompositeOperation = 'source-over';
  });
  return layer;
});

areasDataLayers = areasDataLayers.map((layer) => {
  layer.className_ = Yetix.BLEND_MODES_CLASS_NAME;
  return setDataLayerBlendModes(layer);
});

function setDataLayerBlendModes(layer) {
  layer.setOpacity(0.9);
  layer.on('prerender', (evt) => {
    evt.context.globalCompositeOperation = 'multiply';
  });
  layer.on('postrender', (evt) => {
    evt.context.globalCompositeOperation = 'source-over';
  });
  return layer;
}

export { c2c_cartoLayers as cartoLayers, c2c_dataLayers as dataLayers, areasCartoLayers, areasDataLayers };
