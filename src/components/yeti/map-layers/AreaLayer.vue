<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import { areasCartoLayers, areasDataLayers } from '@/components/yeti/map-layers/map-layers';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin],
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    areas() {
      return Yetix.areas;
    },
    showAreas() {
      return Yetix.showAreas;
    },
    visibleCartoLayer() {
      return Yetix.visibleCartoLayer;
    },
    visibleDataLayers() {
      return Yetix.visibleDataLayers;
    },
  },
  watch: {
    showAreas() {
      this.onShowAreas();
    },
    visibleCartoLayer() {
      this.onLayerVisibility();
    },
    visibleDataLayers() {
      this.onLayerVisibility();
    },
  },
  mounted() {
    // layer for outer stroke of areas
    this.areasStrokeLayer = new ol.layer.VectorImage({
      source: new ol.source.Vector(),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: `rgba(0, 0, 0, 0.2)`,
            width: 14,
          }),
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: `rgba(0, 0, 0, 0.75)`,
            width: 1,
          }),
        }),
      ],
    });
    this.map.addLayer(this.areasStrokeLayer);

    // layer for clip
    // should set className, this forces ol to create another canvas
    this.areasLayer = new ol.layer.VectorImage({
      className: Yetix.BLEND_MODES_CLASS_NAME,
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'white',
        }),
      }),
    });
    this.map.addLayer(this.areasLayer);

    // group for c2c layers, clipped
    this.groupLayer = new ol.layer.Group({
      layers: [...areasCartoLayers, ...areasDataLayers],
    });
    this.map.addLayer(this.groupLayer);

    // showAreas checked?
    this.onShowAreas();

    // only in first mount
    if (this.areas.length === 0) {
      // set areas (yeti valid areas)
      Yetix.fetchAreas().then(this.onAreasResult);
      // event
      Yetix.$on('mapMoveEnd', this.onMapMoveEnd);
    }
  },
  methods: {
    onAreasResult(data) {
      let areasFeatures = this.getFeaturesFromData(data);
      let areas = this.getPropertiesFromFeatures(areasFeatures);

      // set areas in state
      Yetix.setAreas(areas);

      // add features
      this.areasLayer.getSource().addFeatures(areasFeatures);
      this.areasStrokeLayer.getSource().addFeatures(areasFeatures);

      // check is area OK
      this.isAreaOK();
    },
    isAreaOK() {
      let mapExtent = this.getExtent('EPSG:3857');

      let areaOk = true;

      for (let area in this.areas) {
        let polygon = this.areas[area].geometry;
        if (polygon.intersectsExtent(mapExtent)) {
          break;
        } else {
          areaOk = false;
        }
      }
      Yetix.setAreaOk(areaOk);
    },
    onShowAreas() {
      this.areasLayer.setVisible(this.showAreas);
      this.groupLayer.setVisible(this.showAreas);
      this.areasStrokeLayer.setVisible(this.showAreas);
      this.onLayerVisibility();
    },
    onMapMoveEnd() {
      // is area OK ?
      this.isAreaOK();
    },
    onLayerVisibility() {
      if (this.showAreas) {
        // toggle visibility based on currently active layers
        // we compare titles
        areasCartoLayers.map((layer) => {
          layer.setVisible(layer.get('title') === this.visibleCartoLayer.title);
        });

        let titles = this.visibleDataLayers.map((layer) => layer.title);
        areasDataLayers.map((layer) => {
          layer.setVisible(titles.includes(layer.get('title')));
        });
      }
    },
  },
  render() {
    return null;
  },
};
</script>
