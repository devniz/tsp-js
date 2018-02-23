(function() {

  mapboxgl.accessToken = 'pk.eyJ1Ijoibml6YXJic2IiLCJhIjoiY2pkeGtrbnJ1MG4xajJ4bzF2M2tra21meSJ9.PetGbOhE-GcuSh7FlJ98fQ';

  var _MAX_WAYPOINTS_ = 3;

  // Initial location of the map. (London)
  var centerPoint = [-0.127, 51.507];

  // We store the lat/lng of the home location.
  var homeLocationPoint = [];

  // We store the geoJSON of max 8 waypoints.
  var wayPointsLocation = turf.featureCollection([]);

  // Flag to track when the User is clicking for the first time
  // In order to add a home location to the map.
  var isFirstClick = false;

  var permArr = [];
  var usedPerms = [];

  var mergeDistances = [];

  // Initialize a map
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    zoom: 12,
    center: centerPoint
  });

  // Wait for the map to be loaded in order
  // To add some custom layers.
  map.on('load', function() {
    map.addLayer({
      id: 'dropoffs-symbol',
      type: 'symbol',
      source: {
        data: wayPointsLocation,
        type: 'geojson'
      },
      layout: {
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-image': 'marker-15'
      }
    });

  });

  // Create Home icon for the starting point.
  var homeMarker = document.createElement('div');
  homeMarker.classList = 'home';

  // Listen for clicks event on the map.
  map.on('click', function(e) {
    if (isFirstClick === false) {
      isFirstClick = true;
      addHomeLocation(e.lngLat);
    } else {
      // User wants to add a new destination plot.
      addNewDestination(e.lngLat);
    }
  });

  /**
   * Function to add a home departing point.
   * @param coord
   */
  function addHomeLocation(coord) {
    homeLocationPoint = new mapboxgl.Marker(homeMarker)
    .setLngLat(coord)
    .addTo(map);
  }

  /**
   * Function to plot a destination waypoint on the map.
   * @param coord
   */
  function addNewDestination(coords) {
    // We make sure User don't exceed 8 max destinations;
    if (wayPointsLocation.features.length >= _MAX_WAYPOINTS_) {
      // Start to calculate.
      alert('You reached the maximum of 8 waypoints!');
      var allPossibleRoutes = permute(wayPointsLocation.features);
      calculateDistanceBetweenTwoPoints(allPossibleRoutes);
      return false;
    }

    var pt = turf.point([coords.lng, coords.lat]);
    wayPointsLocation.features.push(pt);
    map.getSource('dropoffs-symbol').setData(wayPointsLocation);
  }

  /**
   * Takes two points and save the distance.
   * @param routes
   */
  function calculateDistanceBetweenTwoPoints(routes) {
    console.log(routes);
    return false;

    var homeLng = homeLocationPoint._lngLat.lng;
    var homeLat = homeLocationPoint._lngLat.lat;
    var homeCoords = [ homeLng, homeLat ];

    // Calculate the distance from Home to the first point.
    var hFrom = turf.point(homeCoords);
    var hTo = turf.point(routes[0][0].geometry.coordinates);
    var distanceFromHomeToFirstLocation = turf.distance(hFrom, hTo);

    // Calculate the distance from the last point to home.
    var lastWaypoint = wayPointsLocation.features.slice(-1).pop();
    var finalPoint = turf.point(lastWaypoint.geometry.coordinates);
    var backHome = turf.point(homeCoords);
    var distanceFromLastPointToHome = turf.distance(finalPoint, backHome);

    // Calculate distance of all possible route per 2 points.
    for (var i = 0; i < routes.length; i++) {
      for (var x = 0; x < routes[i].length; x++) {
        var from = turf.point(routes[i][x].geometry.coordinates);
        if (routes[i][x] && typeof routes[i][x + 1] !== 'undefined') {
          var to = turf.point(routes[i][x + 1].geometry.coordinates);
          calculateTotalDistanceForEachRoute(
            distanceFromHomeToFirstLocation,
            distanceFromLastPointToHome,
            turf.distance(from, to)
          );
        }
      }
    }
  }

  /**
   * Do the sum of distances between waypoints.
   * @param home
   * @param backToHome
   * @param distance
   */
  function calculateTotalDistanceForEachRoute(home, backToHome, distance) {
    console.log(distance);
    mergeDistances.push(home, distance, backToHome);

    for (var i = 0; i < mergeDistances.length; i++) {
      var sumOfDistance = mergeDistances[i] + mergeDistances[i + 1];
    }
  }

  /**
   * Find all the routes possible using brute force.
   * @param input
   * @returns {Array}
   */
  function permute(input) {
    var i, pm;

    for (i = 0; i < input.length; i++) {
      pm = input.splice(i, 1)[0];
      usedPerms.push(pm);

      if (input.length === 0) {
        permArr.push(usedPerms.slice());
      }

      permute(input);
      input.splice(i, 0, pm);
      usedPerms.pop();
    }
    return permArr;
  }

})();