<script>
import { icon } from '@fortawesome/fontawesome-svg-core';
import axios from 'axios';

import layerMixin from './layer';

import ol from '@/js/libs/ol';

const YETI_URL_MOUNTAINS = 'https://api.ensg.eu/zonesbra';
const YETI_URL_BULLETINS = 'https://api.ensg.eu/bra';

const mountainsStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0, 0, 0, .85)',
    width: 1,
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, .9)',
  }),
});

const highlightedMountainsStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    width: 3,
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, .9)',
  }),
  zIndex: 1,
});

let mountainsLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: mountainsStyle,
});
let avalancheBulletinsLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
});
let mountainsLayerGroup = new ol.layer.Group({
  layers: [
    mountainsLayer,
    avalancheBulletinsLayer,
  ],
});

export default {
  mixins: [layerMixin],
  inject: ['$yetix'],
  mounted() {
    console.log('layer mounted');
    this.map.on('moveend', this.onMapMoveEnd);

    
    this.map.addLayer(mountainsLayerGroup);
    // layers are visible on load
    mountainsLayerGroup.setVisible(false);

    axios.get(YETI_URL_MOUNTAINS).then(this.onMountainsResult);

    
    //this.map.on('pointermove', this.onPointerMoveMountains);

    this.$yetix.$on('showMountains', this.onShowMountains);
  },
  methods: {
    onPointerMoveMountains(event) {
      let selectedFeature = null;

      this.map.forEachFeatureAtPixel(event.pixel, feature => {
        selectedFeature = feature;
        return true;
      }, {
        layerFilter: layer => {
          return layer === this.mountainsLayer;
        }
      });

      if (this.highlightedFeature) {
        this.highlightedFeature.setStyle(mountainsStyle);
      }

      this.highlightedFeature = selectedFeature;

      if (selectedFeature) {
        // TODO, maybe get this.map.getTargetElement beforehand,
        // or use Vue (style if selectedFeature)
        this.map.getTargetElement().style.cursor = 'pointer';
        this.highlightedFeature.setStyle(highlightedMountainsStyle);
      } else {
        this.map.getTargetElement().style.cursor = '';
      }
    },
    onMountainsResult(data) {
      const features = data.data;
      // TMP: filter only France for now
      features.features = features.features.filter((feature) => {
        return feature.properties.country === "France";
      });

      // read geoJSON, and project to 3857 (geoJSON is 4326 by default)
      const rawFeatures = new ol.format.GeoJSON().readFeatures(features, { featureProjection: 'EPSG:3857' });
      // add to mountains layer
      mountainsLayer.getSource().addFeatures(rawFeatures);

      let mountains = rawFeatures.map((mountain) => {
        return mountain.getProperties();
      });
      this.allMountains = this.sortMountainsByMassif(mountains);
      this.setVisibleMountains();

      axios.get(YETI_URL_BULLETINS).then(this.onAvalancheBulletinsResult);
    },
    sortMountainsByMassif(mountains) {
      // first, order mountains by massifs
      const sortedMountains = {};
      for (let i = 0; i < mountains.length; i++) {
        if (!sortedMountains[mountains[i].mountain]) {
          sortedMountains[mountains[i].mountain] = [];
        }
        sortedMountains[mountains[i].mountain].push(mountains[i]);
      }
      mountains = sortedMountains;

      // then sort mountains inside each massif
      for (const i in mountains) {
        mountains[i].sort((a, b) => {
          if (a.title < b.title) return -1;
          if (b.title > a.title) return 1;
          return 0;
        });
      }

      return mountains;
    },
    setVisibleMountains() {
      // return, if mountains not loaded
      if (!this.allMountains) {
        return;
      }
      const mapExtent = this.getExtent('EPSG:4326');
      // clone this.mountains first, with no reference
      const visibleMountains = Object.assign({}, this.allMountains);
      // then filter if polygon isn’t in view
      for (const massif in visibleMountains) {
        visibleMountains[massif] = visibleMountains[massif].filter((mountain) => {
          const polygon = mountain.geometry;
          return polygon.intersectsExtent(mapExtent);
        });
        // unset massif if empty
        if (visibleMountains[massif].length === 0) {
          delete visibleMountains[massif];
        }
      }
      // set mountains in visibleMountains key
      const mountains = { visibleMountains };
      this.$yetix.$emit('mountains', mountains);
    },
    onMapMoveEnd() {
      // set visible mountains
      this.setVisibleMountains();
    },
    onShowMountains(showMountains) {
      // show mountains layer group if needed
      mountainsLayerGroup.setVisible(showMountains);
      // and make other map layers semi transparent
      this.$emit('showMountains', showMountains);
    },
    onAvalancheBulletinsResult(data) {
      let iconSize = 40;
      let avalancheBulletinIcon = (danger) => {
        let dangerFill = [
          'lightgreen',
          'yellow',
          'orange',
          'orangered',
          'red',
        ];
        let svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 100 100">
            <path d="M5,50L50,5L95,50" fill="white" />
            <path d="M5,50L50,95L95,50" fill="${dangerFill[danger]}" />
            <path d="m50,0l50,50-50,50-50-50zv5L21,33l19-10L50,26l9-8L80,38l2-1L50,5M5,50L50,95L95,50" />
            <text x="50" y ="72" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="40px" font-weight="bold">${danger}</text>
          </svg>
        `;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      };
      
      let features = data.data;
      let mountainsFeatures = mountainsLayer.getSource().getFeatures();

      features.zones.forEach(zone => {
        mountainsFeatures.forEach(mountain => {
          //if (mountain.get('name') === zone.zone) {
            let danger = String(Math.round(Math.random() * 4));
            
            let geometry = mountain.getGeometry();
            let geometryType = geometry.getType();

            let points = null;

            if (geometryType === 'Polygon') {
              points = geometry.getInteriorPoint();
            } else if (geometryType === 'MultiPolygon') {
              points = geometry.getInteriorPoints();
            }

            let icon = new ol.Feature({
              geometry: points,
              avalancheIcon: avalancheBulletinIcon(danger),
            });
            avalancheBulletinsLayer.getSource().addFeature(icon);

            
            
            icon.setStyle(new ol.style.Style({
              image: new ol.style.Icon({
                src: `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100">
            <path d="M5,50L50,5L95,50" fill="white" />
            <path d="M5,50L50,95L95,50" fill="green" />
            <path d="m50,0l50,50-50,50-50-50zv5L21,33l19-10L50,26l9-8L80,38l2-1L50,5M5,50L50,95L95,50" />
            <text x="50" y ="72" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="40px" font-weight="bold">2</text>
          </svg>`,
                size: [iconSize, iconSize],
              }),
            }));
            
            
          //}
        })
      });

      //this.map.on('moveend', this.updateAvalancheBulletinIcon);
      // onmapmove => update icon position (only for visible ones)
    },
    /*
    updateAvalancheBulletinIcon(event) {
      //const mapZoom = Math.floor(event.map.getView().getZoom() * 10) / 10;
      //if (mapZoom > 8) {
        let features = this.avalancheBulletinsLayer.getSource().getFeatures();
        features.forEach(feature => {
          feature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
              src: feature.get('avalancheIcon'),
              size: [40, 40],
            }),
          }));
        });
      //}
    },
    */
  },
  render() {
    return null;
  },
};
</script>
