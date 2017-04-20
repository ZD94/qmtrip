"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstance = function (opts, element, cb) {
    // create map instance
    var map = new BMap.Map(element[0], { enableMapClick: opts.enableMapClick });
    map.addEventListener('load', function () {
        if (opts.navCtrl) {
            // add navigation control
            map.addControl(new BMap.NavigationControl());
        }
        if (opts.scaleCtrl) {
            // add scale control
            map.addControl(new BMap.ScaleControl());
        }
        if (opts.overviewCtrl) {
            //add overview map control
            map.addControl(new BMap.OverviewMapControl());
        }
        if (opts.enableScrollWheelZoom) {
            //enable scroll wheel zoom
            map.enableScrollWheelZoom();
        }
        cb(map);
    });
    // init map, set central location and zoom level
    if (typeof opts.center == 'string') {
        if (opts.zoom == undefined)
            map.centerAndZoom(opts.center, opts.zoom);
        else
            map.centerAndZoom(opts.center);
    }
    else {
        map.centerAndZoom(new BMap.Point(opts.center.longitude, opts.center.latitude), opts.zoom);
    }
    // set the city name
    // map.setCurrentCity(opts.city);
    map.setCurrentCity(new BMap.Point(opts.center.longitude, opts.center.latitude));
};
exports.createMarker = function (marker, pt) {
    if (marker.icon) {
        var icon = new BMap.Icon(marker.icon, new BMap.Size(marker.width, marker.height));
        return new BMap.Marker(pt, { icon: icon });
    }
    return new BMap.Marker(pt);
};
exports.redrawMarkers = function (map, previousMarkers, opts) {
    previousMarkers.forEach(function (_a) {
        var marker = _a.marker, listener = _a.listener;
        marker.removeEventListener('click', listener);
        map.removeOverlay(marker);
    });
    previousMarkers.length = 0;
    if (!opts.markers) {
        return;
    }
    opts.markers.forEach(function (marker) {
        var marker2 = exports.createMarker(marker, new BMap.Point(marker.longitude, marker.latitude));
        // add marker to the map
        map.addOverlay(marker2);
        var previousMarker = { marker: marker2, listener: null };
        previousMarkers.push(previousMarker);
        if (!marker.title && !marker.content) {
            return;
        }
        var msg = "<p>" + (marker.title || '') + "</p><p>" + (marker.content || '') + "</p>";
        var infoWindow2 = new BMap.InfoWindow(msg, {
            enableMessage: !!marker.enableMessage
        });
        previousMarker.listener = function () {
            this.openInfoWindow(infoWindow2);
        };
        marker2.addEventListener('click', previousMarker.listener);
    });
};
