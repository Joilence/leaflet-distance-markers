L.DistanceMarkers = L.LayerGroup.extend({
	initialize: function (line, map, options) {
		options = options || {};
		var offset = options.offset || 1000;
		var showAll = Math.min(map.getMaxZoom(), options.showAll || 12);

		var zoomLayers = {};
		var length = L.GeometryUtil.length(line);
		var count = Math.floor(length / offset);

		for (var i = 1; i <= count; ++i) {
			var distance = offset * i;
			var position = L.GeometryUtil.interpolateOnLine(map, line, distance / length);
			var icon = L.divIcon({ className: 'dist-marker', html: i });
			var marker = L.marker(position.latLng, { title: i, icon: icon });

			// visible only starting at a specific zoom level
			var zoom = this._minimumZoomLevelForItem(i, showAll);
			if (zoomLayers[zoom] === undefined) {
				zoomLayers[zoom] = L.layerGroup();
			}
			zoomLayers[zoom].addLayer(marker);
		}

		var currentZoomLevel = 0;
		var markerLayer = this;
		var updateMarkerVisibility = function() {
			var oldZoom = currentZoomLevel;
			var newZoom = currentZoomLevel = map.getZoom();

			if (newZoom > oldZoom) {
				for (var i = oldZoom + 1; i <= newZoom; ++i) {
					if (zoomLayers[i] !== undefined) {
						markerLayer.addLayer(zoomLayers[i]);
					}
				}
			} else if (newZoom < oldZoom) {
				for (var i = oldZoom; i > newZoom; --i) {
					if (zoomLayers[i] !== undefined) {
						markerLayer.removeLayer(zoomLayers[i]);
					}
				}
			}
		};
		map.on('zoomend', updateMarkerVisibility);

		this._layers = {}; // need to initialize before adding markers to this LayerGroup
		updateMarkerVisibility();
	},

	_minimumZoomLevelForItem: function (item, showAllLevel) {
		var zoom = showAllLevel;
		var i = item;
		while (i > 0 && i % 2 === 0) {
			--zoom;
			i = Math.floor(i / 2);
		}
		return zoom;
	},

});

L.Polyline.include({

	_originalOnAdd: L.Polyline.prototype.onAdd,
	_originalOnRemove: L.Polyline.prototype.onRemove,

	onAdd: function (map) {
		this._originalOnAdd(map);
		this._distanceMarkers = new L.DistanceMarkers(this, map, this.options.distanceMarkers);
		map.addLayer(this._distanceMarkers);
	},

	onRemove: function (map) {
		map.removeLayer(this._distanceMarkers);
		this._originalOnRemove(map);
	}

});
