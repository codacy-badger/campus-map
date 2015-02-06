$(function() {

  // Variables for use throughout
  // Declare them at the top so jQuery only has to process them once
  var $window = $(window);
  var $document = $(document);
  var $mapNavigation = $('#mapnavigation');
  var $mapDiv = $('#mapdiv');
  var $tab1 = $('#tab-1');

  // create the core map variables
  var map, mapMarker, mapBounds, infobox, $loadingIndicator, markersArray = [],
    isFullScreen = false;
  // Set up locations for hash checking
  // col1 is false so we can check if the hash location needs a marker adding
  var locations = {
    'heslington-west': {
      col0: 'Heslington West',
      col1: false,
      col2: 53.947007,
      col3: -1.052949,
      col4: 16
    },
    'heslington-east': {
      col0: 'Heslington East',
      col1: false,
      col2: 53.947449,
      col3: -1.030397,
      col4: 16
    },
    'kings-manor': {
      col0: 'King\'s Manor',
      col1: false,
      col2: 53.96224,
      col3: -1.086445,
      col4: 17
    },
    // Might be better to get the centre from the bounds?
    'default': {
      col0: 'Default Centre',
      col1: false,
      col2: 53.947007,
      col3: -1.052949,
      col4: 16
    }
  }
  var isLive = window.location.hostname === "www.york.ac.uk";

  // set the map type to use cloudmade tiles, have name 'Campus map' and not allow zoom beyond level 18
  var cloudMadeMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      return "http://www.york.ac.uk/about/maps/campus/data/tiles/" +
        zoom + "/" + coord.x + "/" + coord.y + ".png";
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true,
    alt: "Campus map",
    name: "Campus map",
    maxZoom: 18
  });

  var init = function() {

    addFullScreenLink();

    // Loading Indicator
    $loadingIndicator = $('<img/>').attr({
      'src': 'images/loading.gif',
      'alt': 'Loading...'
    }).addClass('loading').appendTo($tab1);

    //resize the map when window resizes
    $window.resize(function() {
      if (isFullScreen === true) {
        windowWidth = parseInt($window.width());
        height = parseInt($window.height());
        mapWidth = windowWidth - ($mapNavigation.width());
        $mapDiv.width(mapWidth).height(height);
        // console.log("resizing!");
        google.maps.event.trigger(map, 'resize');
      };
    });

    // call the map initialisation function on page load
    //google.maps.event.addDomListener(window, 'load', initialiseMap);
    // load list of points for display as markers  and call function to create the list
    var jsonURL = makeDataURL();
    $.getJSON(jsonURL, function(data) {
      createLocationsList(data);
    });
    $(window).hashchange(function() {
      hashChangeCentreMap();
    });
  };

  var addFullScreenLink = function() {

    var $html = $('html');
    var $contentContainer = $('#content-container');
    var $mapContainer = $('#mapcontainer');
    var $mapBoxes = $('#mapnavigation, #maptabs');

    $fullscreenLink = $('<a>').attr({
      'id': 'fullscreen_link',
      'href': '#',
      'title': 'Full screen'
    }).text('Full screen').click(function(e) {
      //Bind function to clicks on full screen link
      e.preventDefault();
      if (isFullScreen === false) {
        windowHeight = parseInt($window.height());
        windowWidth = parseInt($window.width());
        mapheight = windowHeight - ($('#mapcentre').outerHeight()) - ($('#mapfooter').outerHeight());
        mapwidth = windowWidth - ($mapNavigation.width());
        $mapDiv.width(mapwidth).height(mapheight);
        $html.css({
          position: 'relative',
          overflow: 'hidden'
        });
        $contentContainer.css({
          position: 'static'
        });
        $fullscreenLink.css({
          backgroundPosition: '0 -14px'
        }).attr('title', 'Exit full screen').text('Exit full screen');
        $mapContainer.css({
          position: 'absolute',
          top: '0',
          left: '0',
          margin: '0'
        });
        $mapBoxes.height(mapheight);
        $tab1.height(mapheight - 10).css('max-height', 'none');
        google.maps.event.trigger(map, 'resize');
        isFullScreen = true;
        $window.resize(); //Fake a resize so that missing scrollbar space accounted for
        pageTracker._trackEvent('Map', 'Full screen', 'Enter full screen');
      } else {
        $mapDiv.width(500).height(500);
        $html.css({
          overflow: 'auto'
        });
        $contentContainer.css({
          position: 'relative'
        });
        $fullscreenLink.css({
          backgroundPosition: '0 0'
        }).attr('title', 'Full screen').text('Full screen');
        $mapContainer.css({
          position: 'relative'
        });
        $mapBoxes.height(500);
        $tab1.height(490).css('max-height', '490px');
        google.maps.event.trigger(map, 'resize');
        isFullScreen = false;
        pageTracker._trackEvent('Map', 'Full screen', 'Exit full screen');
      }
      return false;
    });
    //Exit full screen when esc key pressed
    $document.keyup(function(e) {
      if ((e.keyCode == 27) && (isFullScreen === true)) {
        fullscreenLink.click();
      }
    });
    //Insert full screen link
    $fullscreenDiv = $('<div>').attr({ 'id': 'fullscreen' }).append($fullscreenLink);
    $mapContainer.prepend($fullscreenDiv);

  };

  // centre the map on a given pair of coordinates and optional zoom level
  function centreMap(mapLat, mapLong, mapZoom) {
    mapZoom = parseInt(mapZoom,10) || 16;
    map.setCenter(new google.maps.LatLng(mapLat, mapLong));
    map.setZoom(mapZoom);
    return false;
  }

  function hashChangeCentreMap() {
    // fetch the location based on the hash
    var location = lookupHashCoords();

    // if a zoom level is set the use that, otherwise set a default of 16
    var zoomLevel = location.col4 ? location.col4 : 16;

    // remove street view overlay, if any
    clearStreetView();

    // centre the map on the new location
    centreMap(location.col2, location.col3, zoomLevel);

    clearOverlays();
    // show the marker if needed
    if (location.col1 !== false) {
      $('a[href=#'+makeID(location.col0)+']').click();
    }
  }

  function lookupHashCoords() {

    // If the hash exists as a key in the locations object, return it
    var hash = window.location.hash.substring(1);
    return (typeof locations[hash] === 'object') ? locations[hash] : locations['default'];

  }

  function initialiseMap() {

      // fetch some coordinates and optional zoom level to centre the initial view on
      var location = lookupHashCoords();

      // if a zoom level is set the use that, otherwise set a default of 16
      var zoomLevel = parseInt(location.col4,10) || 16;

      var myOptions = {
        maxZoom: 18,
        minZoom: 13,
        zoom: zoomLevel,
        center: new google.maps.LatLng(location.col2, location.col3),
        mapTypeControlOptions: {
          mapTypeIds: ['cloudMade', google.maps.MapTypeId.SATELLITE]
        },
        mapTypeId: 'cloudMade'
      };
      map = new google.maps.Map(document.getElementById('mapdiv'), myOptions);
      map.mapTypes.set('cloudMade', cloudMadeMapType);
      map.setMapTypeId('cloudMade');

      // if location is not one of the defaults, trigger a click on the marker
      if (location.col1 !== false) {
        $('a[href=#'+makeID(location.col0)+']').click();
      }

      // track StreetView being activated with Analytics
      var theStreetView = map.getStreetView();

      google.maps.event.addListener(theStreetView, 'visible_changed', function() {
        if (theStreetView.getVisible() && (isLive === true)) {
          pageTracker._trackEvent('Map', 'Show StreetView');
        }
      });
    }
    // create the locations list
  function createLocationsList(locationsObj) {

      var locationRows = locationsObj.query.results.row;
      // Remove first row (headers)
      locationRows.shift();

      // remove the loaading indicator
      $loadingIndicator.remove();

      var locationCategory = ''; // is the location a bus stop, college, building etc.
      var categoryID = ''; // storage for a version of the category suitable for use as an ID
      $.each(locationRows, function(key, location) { // for every row in the data
        // check if category is empty or doesn't match current one, and start new group if so
        if (locationCategory == '' || locationCategory != location.col1) {
          // get the name of the category
          locationCategory = location.col1;
          // create a version of the category suitable for use in an ID
          categoryID = makeID(locationCategory);
          // take a copy of the #templateFAQ div, set the ID, replace the H3 text with the category name and append to the #tab-1 element
          var clonedFAQ = $('#templateFAQ').clone(true);
          clonedFAQ.attr('id', categoryID + '-links');
          clonedFAQ.find('h3').text(locationCategory);
          clonedFAQ.find('a').text('Show all ' + locationCategory.substring(0, 1).toLowerCase() + locationCategory.substring(1));
          clonedFAQ.find('a').attr('id', categoryID + '-show-all');
          var currentCategory = locationCategory.toLowerCase();
          // set the first of many onclick events to be triggered when a 'show all' is triggered (the others being one per pin added outside of this if statement)
          clonedFAQ.find('a').click(function() {
            $('body').trigger('map:click');
            //clear any existing markers
            clearOverlays();
            // clear the mapBounds object, ready for all the points for this group to be added
            mapBounds = new google.maps.LatLngBounds();
            // track the click to Analytics
            if (isLive === true) {
              pageTracker._trackEvent('Map', 'Drop pin', 'Show all ' + currentCategory);
            }
          });
          // add the FAQ object to the tab container
          $tab1.append(clonedFAQ);
        }
        // get the location name
        var locationName = location.col0;
        // get the list matching the current element and append a list item
        var currentList = $('#' + categoryID + '-links ul');
        currentList.append(createMapLink(location));
        // add to locations object
        locations[makeID(locationName)] = location;
        // get the 'show all' link and add an event handler to drop a pin
        var showAllLink = $('#' + categoryID + '-show-all');
        showAllLink.click(function() {
          //  remove any other markers
          clearOverlays();

          // create marker and infobox
          var myMarker = createMapMarker(location);

          // store the current marker so that we can clear it later
          markersArray.push(myMarker.marker);
          // add the current location to the boundaries so we can scale the viewport
          mapBounds.extend(myMarker.location);
          // remove street view overlay, if any, and set null position to put pegman back on his perch
          clearStreetView();

          // Add the marker to the map
          var myTimeout = 200 + (Math.random() * 800);
          setTimeout(function() {
            myMarker.marker.setMap(map);
            // scale the viewport to fit all the points
            map.fitBounds(mapBounds);
          }, myTimeout);
          return false; // stop default link behaviour
        });
        if(key === locationRows.length-1) {
          //console.log(locations);
          initialiseMap();
        }
      });
    }
    // create a marker. returns and object with a marker, a location and an infobox property
  function createMapMarker(location) {

    // add the current location as a pin to be dropped when the 'show all' link is clicked
    // create a location object
    var markerLocation = new google.maps.LatLng(location.col2, location.col3);
    // create a map marker
    var myMarker = new google.maps.Marker({
      clickable: true,
      position: markerLocation,
      title: location.col0,
      animation: google.maps.Animation.DROP
    });

    var boxText = $("<div>").addClass('infobox-content');
    boxText.append($('<h4>').text(location.col0));
    // boxText.append($('<p>').text('You can add text here'));
    // boxText.append($('<p>').text('And other information'));
    // boxText.append($('<img>').attr({
    //   'src': 'http://placehold.it/200x100&text=Or+even+an+image',
    //   'alt': 'Or even an image'
    // }));

    var myOptions = {
      alignBottom: true,
      boxClass: "infobox",
      content: boxText.get(0), // has to be text or a dom node, not a jQuery object
      maxWidth: 250,
      pixelOffset: new google.maps.Size(-125, -42),
      zIndex: null,
      closeBoxMargin: "4px 2px",
      closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
      infoBoxClearance: new google.maps.Size(12, 12)
    };

    google.maps.event.addListener(myMarker, "click", function(e) {
      $('body').trigger('map:click');
      infobox.open(map, this);
    });

    $('body').bind('map:click', function(e) {
      infobox.close();
    });

    var infobox = new InfoBox(myOptions);

    return {
      marker: myMarker,
      location: markerLocation,
      infobox: infobox
    };
  }

  // create a link and add it to list
  function createMapLink(locationValues) {
    // create a new list item
    var listItem = document.createElement('li');
    // create a link element with no href
    var link = document.createElement('a');
    link.href = '#'+makeID(locationValues.col0);
    // set the link text to the location name
    link.innerHTML = locationValues.col0;
    // add onclick behaviour to drop a pin
    link.onclick = function() {

      $('body').trigger('map:click');

      var myMarker = createMapMarker(locationValues);

      google.maps.event.addListener(myMarker.marker, 'click', function() {
        if (isLive === true) {
          pageTracker._trackEvent('Map', 'Click pin', locationValues.col1 + ' - ' + locationValues.col0);
        }
      });
      //  remove any other markers
      clearOverlays();
      // store this marker so we can remove it later
      markersArray.push(myMarker.marker);
      // remove street view overlay, if any, and set null position to put pegman back on his perch
      clearStreetView();
      // centre on location
      map.panTo(myMarker.location);
      // drop the pin
      myMarker.marker.setMap(map);
      // track the action in Analytics if running on live site
      if (isLive === true) {
        pageTracker._trackEvent('Map', 'Drop pin', locationValues.col1 + ' - ' + locationValues.col0);
      }
    };
    // add the link to the list item
    listItem.appendChild(link);
    // return the list item to be added to the list
    return listItem;
  }
  // remove any existing overlay markers
  function clearOverlays() {
    if (markersArray) {
      for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
      }
    }
  }
  // remove street view overlay, if any
  function clearStreetView() {
    if (map.getStreetView().getVisible()) {
      map.getStreetView().setVisible(false);
      map.streetView.setPosition(new google.maps.LatLng(0, 0));
    }
  }
  // make id-friendly-name (N.B. number can't be first character)
  function makeID(str) {
    return str.replace(/[^A-Za-z]+/g, '-').toLowerCase();
  }

  function makeDataURL() {
    var jsonURL;
    if (isLive === true) {
      var protocol = (("https:" == document.location.protocol) ? "https://" : "http://");
      jsonURL = protocol + "www.york.ac.uk/about/maps/campus/data/locations.json";
    } else {
      // jsonURL = 'locations.json';
      jsonURL = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20csv%20where%20url%3D%22https%3A%2F%2Fdocs.google.com%2Fspreadsheet%2Fpub%3Fhl%3Den_GB%26hl%3Den_GB%26key%3D0AumxFaPyjySpdERqbE1KNXpDd1NkMzd1NVdUaEplWHc%26single%3Dtrue%26gid%3D0%26output%3Dcsv%22&format=json&diagnostics=true'
    }
    return jsonURL;
  }

  init();

});
