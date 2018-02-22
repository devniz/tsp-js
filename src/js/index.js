(function() {
  var salesmanLocation = [-83.093, 42.376];
  var homeLocation = [-83.083, 42.363];
  var lastAtPlace = 0;
  var keepTrack = [];
  var pointHopper = {};

  mapboxgl.accessToken = 'pk.eyJ1Ijoibml6YXJic2IiLCJhIjoiY2pkeGtrbnJ1MG4xajJ4bzF2M2tra21meSJ9.PetGbOhE-GcuSh7FlJ98fQ';

// Initialize a map
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: salesmanLocation,
    zoom: 12
  });

  map.on('load', function() {
    var marker = document.createElement('div');
    marker.classList = 'salesman';

    // Create a new marker
    salesmanMarker = new mapboxgl.Marker(marker)
    .setLngLat(salesmanLocation)
    .addTo(map);

    var home = turf.featureCollection([turf.point(homeLocation)]);

    // Create a circle layer
    map.addLayer({
      id: 'warehouse',
      type: 'circle',
      source: {
        data: home,
        type: 'geojson'
      },
      paint: {
        'circle-radius': 20,
        'circle-color': 'white',
        'circle-stroke-color': '#3887be',
        'circle-stroke-width': 3
      }
    });

// Create a symbol layer on top of circle layer
    map.addLayer({
      id: 'house-symbol',
      type: 'symbol',
      source: {
        data: home,
        type: 'geojson'
      },
      layout: {
        'icon-image': 'star-15',
        'icon-size': 1
      },
      paint: {
        'text-color': '#3887be'
      }
    });

    map.addLayer({
      id: 'dropoffs-symbol',
      type: 'symbol',
      source: {
        data: dropoffs,
        type: 'geojson'
      },
      layout: {
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-image': 'marker-15'
      }
    });

    map.addSource('route', {
      type: 'geojson',
      data: nothing
    });

    map.addLayer({
      id: 'routeline-active',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': {
          base: 1,
          stops: [[12, 3], [22, 12]]
        }
      }
    }, 'waterway-label');
  });

  var dropoffs = turf.featureCollection([]);

  // Listen for a click on the map
  map.on('click', function(e) {
    // When the map is clicked, add a new drop-off point
    // and update the `dropoffs-symbol` layer
    newDropoff(map.unproject(e.point));
    updateDropoffs(dropoffs);
  });

  function newDropoff(coords) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    var pt = turf.point(
      [coords.lng, coords.lat],
      {
        orderTime: Date.now(),
        key: Math.random()
      }
    );
    dropoffs.features.push(pt);
    pointHopper[pt.properties.key] = pt;

    // Make a request to the Optimization API
    $.ajax({
      method: 'GET',
      url: assembleQueryURL()
    }).done(function(data) {
      // Create a GeoJSON feature collection
      var routeGeoJSON = turf.featureCollection([turf.feature(data.trips[0].geometry)]);

      // If there is no route provided, reset
      if (!data.trips[0]) {
        routeGeoJSON = nothing;
      } else {
        // Update the `route` source by getting the route source
        // and setting the data equal to routeGeoJSON
        map.getSource('route')
        .setData(routeGeoJSON);
      }

      if (data.waypoints.length === 12) {
        window.alert('Maximum number of points reached!');
      }
    });
  }

  function updateDropoffs(geojson) {
    map.getSource('dropoffs-symbol')
    .setData(geojson);
  }

  // Here you'll specify all the parameters necessary for requesting a response from the Optimization API
  function assembleQueryURL() {

    // Store the location of the truck in a variable called coordinates
    var coordinates = [homeLocation];
    var distributions = [];
    keepTrack = [salesmanLocation];

    // Create an array of GeoJSON feature collections for each point
    var placeJobs = objectToArray(pointHopper);

    // If there are actually orders from this place
    if (placeJobs.length > 0) {

      // Check to see if the request was made after visiting the place
      var needToPickUp = placeJobs.filter(function(d, i) {
        return d.properties.orderTime > lastAtPlace;
      }).length > 0;

      // If the request was made after picking up from the place,
      // Add the place as an additional stop
      if (needToPickUp) {
        var placeIndex = coordinates.length;
        // Add the place as a coordinate
        coordinates.push(homeLocation);
        // push the place itself into the array
        keepTrack.push(pointHopper.warehouse);
      }

      placeJobs.forEach(function(d, i) {
        // Add dropoff to list
        keepTrack.push(d);
        coordinates.push(d.geometry.coordinates);
        // if order not yet picked up, add a reroute
        if (needToPickUp && d.properties.orderTime > lastAtPlace) {
          distributions.push(placeIndex + ',' + (coordinates.length - 1));
        }
      });
    }

    // Set the profile to `driving`
    // Coordinates will include the current location of the truck,
    return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' +
      coordinates.join(';') +
      '?distributions=' +
      distributions.join(';') +
      '&overview=full&steps=true&geometries=geojson&source=first&access_token=' +
      mapboxgl.accessToken;
  }

  function objectToArray(obj) {
    var keys = Object.keys(obj);
    var routeGeoJSON = keys.map(function(key) {
      return obj[key];
    });
    return routeGeoJSON;
  }

  // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
  var nothing = turf.featureCollection([]);

})();