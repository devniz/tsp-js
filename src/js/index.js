(function() {
  var salemanLocation = [-83.093, 42.376];
  var houseLocation = [-83.083, 42.363];
  var lastQueryTime = 0;
  var keepTrack = [];
  var currentSchedule = [];
  var currentRoute = null;
  var pointHopper = {};
  var pause = true;
  var speedFactor = 50;

  mapboxgl.accessToken = 'pk.eyJ1Ijoibml6YXJic2IiLCJhIjoiY2pkeGtrbnJ1MG4xajJ4bzF2M2tra21meSJ9.PetGbOhE-GcuSh7FlJ98fQ';

// Initialize a map
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: salemanLocation,
    zoom: 12
  });

})();