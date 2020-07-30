<template>
  <map-view show-recenter-on />
</template>

<script>
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

const normalLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'yellow',
    width: 3,
  }),
});

const highlightedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 255, 0, .5)',
      width: 8,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 3,
    }),
  }),
];

export default {
  props: {
    activeTab: {
      type: Number,
      required: true,
    },
    validMinZoom: {
      type: Number,
      required: true,
    },
    gpx: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      mapView: null,
      map: null,
      features: [],
      promiseDocument: null,
    };
  },
  computed: {
    documentGeometry() {
      return this.promiseDocument && this.promiseDocument.data
        ? JSON.parse(this.promiseDocument.data.geometry.geom_detail)
        : null;
    },
  },
  watch: {
    gpx() {
      if (this.gpx) {
        this.addFeaturesFromGpx(this.gpx);
      }
    },
    documentGeometry() {
      console.log(this.documentGeometry);
      if (this.documentGeometry) {
        const feature = new ol.format.GeoJSON().readFeature(this.documentGeometry);
        this.features.push(feature);
        //this.addFeature(feature);
        //this.onDocument();
        //this.mapView.fitMapToDocuments();
      }
    },
    features() {
      // when features mutate: add feature
      //
      this.features.map((feature) => {
        // if that feature is not already in map
        if (!this.getDocumentsLayerSource().hasFeature(feature)) {
          this.addFeature(feature);
        }
      });
      this.onDocument();
      this.mapView.fitMapToDocuments();
    },
    activeTab() {
      if (this.activeTab === 0) {
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
        this.snapInteraction.setActive(false);
      } else {
        this.drawInteraction.setActive(true);
        this.modifyInteraction.setActive(true);
        this.snapInteraction.setActive(true);
      }
    },
  },
  mounted() {
    this.mapView = this.$children[0];
    this.map = this.$children[0].map;

    // document
    const doc = this.$route.params.document_id;
    const lang = this.$language.current;
    if (doc) {
      this.promiseDocument = c2c['route'].getCooked(doc, lang).then(this.setDocumentTitle).then(this.onDocument);
    }

    this.addInteractions();
  },
  methods: {
    getExtent(projection) {
      return this.mapView.getExtent(projection);
    },

    getDocumentsLayerSource() {
      return this.mapView.documentsLayer.getSource();
    },

    getWaypointsLayerSource() {
      return this.mapView.waypointsLayer.getSource();
    },

    getDocumentsLayerFeatures() {
      return this.getDocumentsLayerSource().getFeatures();
    },

    addFeaturesFromGpx(gpx) {
      // first, remove camptocamp document
      this.promiseDocument = null;
      // and clear geometry
      this.getDocumentsLayerSource().clear();

      const gpxFormat = new ol.format.GPX();
      const features = gpxFormat.readFeatures(gpx, { featureProjection: 'EPSG:3857' });
      features.map(this.addFeature);
      this.setFeaturesTitle(features);

      // fit map to new features
      this.onDocument();
      this.mapView.fitMapToDocuments();
    },

    addFeature(feature) {
      // split multilinestrings into linestrings
      if (feature.getGeometry().getType() === 'MultiLineString') {
        const lines = feature.getGeometry().getLineStrings();
        lines.map((line) => new ol.Feature({ geometry: line })).map(this.addFeature);
      } else {
        this.getDocumentsLayerSource().addFeature(feature);
      }
    },

    removeFeature(feature) {
      this.getDocumentsLayerSource().removeFeature(feature);
    },

    removeFeatures() {
      this.getDocumentsLayerFeatures().map(this.removeFeature);
      this.getDocumentsLayerSource().clear();
      this.getWaypointsLayerSource().clear();
    },

    updateFeatures() {
      // updates features
      this.features = this.getDocumentsLayerFeatures();
      this.$emit('features', this.features);
    },

    setFeaturesTitle(features) {
      console.log(features.data);
      if (features.length) {
        const properties = features[0].getProperties();
        if (properties.name) {
          this.$emit('featuresTitle', properties.name);
        }
      }
    },

    setDocumentTitle(document) {
      const title = this.$documentUtils.getDocumentTitle(document.data);
      this.$emit('featuresTitle', title);
    },

    onFeature(event) {
      // set features styles
      event.feature.set('normalStyle', normalLineStyle);
      event.feature.set('highlightedStyle', highlightedLineStyle);

      event.feature.setStyle(normalLineStyle);

      this.updateFeatures();
    },

    onModifyEnd(event) {
      this.updateFeatures();
    },

    onDocument() {
      // set min zoom for map
      // (that will be used after document is displayed and map is fitted to extent)
      this.mapView.minZoomLevel = this.validMinZoom;
      // put document layers on top
      ['documentsLayer', 'waypointsLayer'].forEach((layer) => {
        this.mapView[layer].setZIndex(1);
      });
    },

    getDocument() {
      let features = this.mapView.documentsLayer.getSource().getFeatures();
      return features;
    },

    addInteractions() {
      // remove hover/click events on document
      this.map.un('pointermove', this.mapView.onPointerMove);
      this.map.un('click', this.mapView.onClick);

      const source = this.mapView.documentsLayer.getSource();

      // check when a feature will be added/removed
      source.on('addfeature', this.onFeature);
      source.on('removefeature', this.onFeature);

      this.modifyInteraction = new ol.interaction.Modify({ source });
      this.map.addInteraction(this.modifyInteraction);

      this.drawInteraction = new ol.interaction.Draw({
        source,
        type: 'LineString',
      });
      this.map.addInteraction(this.drawInteraction);

      this.snapInteraction = new ol.interaction.Snap({ source });
      this.map.addInteraction(this.snapInteraction);

      this.drawInteraction.on('drawend', this.onDrawEnd);
      this.modifyInteraction.on('modifyend', this.onModifyEnd);

      this.drawInteraction.setActive(false);
      this.modifyInteraction.setActive(false);
      this.snapInteraction.setActive(false);
    },
  },
};
</script>
