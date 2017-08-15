$(function() {
	// defaults
	var GeoJSONFile = "https://york.funnelback.co.uk//s/search.html?collection=york-uni-campusmap&form=geojson&query=!padrenullquery&num_ranks=5000";
	var cachedGeoJson = {};
	var map;
	var maxZoom = 18,
			minZoom = 8,
			defaultZoom = 14;
	var heslington = {
			lat: 53.9504,
			lng: -1.0660
	};
	var west = {
			lat: 53.9447,
			lng: -1.0501,
	};
	var east = {
			lat: 53.9473,
			lng: -1.0316,
	};
	var kingsmanor = {
			lat: 53.9623,
			lng: -1.0868,
	};
	var markers = [];

	// initialise InfoWindow
	//var infowindow = new google.maps.InfoWindow();

	// load the map
	function loadMap() {
			return new google.maps.Map(document.getElementById('map'), {
					zoom: defaultZoom,
					maxZoom: maxZoom,
					minZoom: minZoom,
					center: heslington,
					zoomControl: true,
					zoomControlOptions: {
							position: google.maps.ControlPosition.LEFT_TOP
					},
					scaleControl: true,
					streetViewControl: true,
					streetViewControlOptions: {
							position: google.maps.ControlPosition.LEFT_TOP
					},
					fullscreenControl: false,
					disableDefaultUI: true,
					gestureHandling: "greedy"
			});
	}

	// load UoY tiles
	function loadYorkTiles() {
			return new google.maps.ImageMapType({
					getTileUrl: function(coord, zoom) {
							return "https://www.york.ac.uk/static/data/maps/tiles/" +
									zoom+"/"+coord.x+"/"+coord.y+".png";
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					zoom: defaultZoom,
					maxZoom: maxZoom,
					minZoom: minZoom,
					name: 'Map'
			});
	}


	// add groups of markers based on selectable categories
	function addMarkers() {
		// Make arrays of markers for each category
		var markerGroups = {};

		$(".c-btn--selectable").each(function(i, selectable) {
			var $selectable = $(this);
			var selectableCategory = $selectable.attr("id");
			markerGroups[selectableCategory] = $.grep(cachedGeoJson.features, function(feature) {
				var featureCategory = feature.properties.category.toLowerCase().replace(/\s/, '-');
				return featureCategory === selectableCategory;
			});
		});
		console.log(markerGroups);
		$(".c-btn--selectable").click(function(e) {
			var $selectable = $(this);
			var selectableCategory = $selectable.attr("id");
			var thisGroup = markerGroups[selectableCategory];
			$.each(thisGroup, function(j, feature) {
				var dataFeature = new google.maps.Data(feature);
				console.log(feature, dataFeature);
				if ($selectable.is(':checked')) {
					// map.data.add(dataFeature);
					// map.data.addListener('click', function(event) {
					// 	var title = event.feature.getProperty("title");
					// 	var category = event.feature.getProperty("category");
					// 	var subCategory = event.feature.getProperty("subcategory");
					// 	var $infoPanel = $('.infoPanel');
					// 	var html = '<h4>'+title+'</h4><p>'+subCategory+'</p><p>'+category+'</p>';
					// 	$('.infoPanel__content').html(html);
					// 	openInfoPanel();
					// 	$(".closeInfoPanel").click(closeInfoPanel);
					// });
					// map.data.setStyle(function(feature) {
					// 	return {
					// 		icon: 'img/markers/'+selectableCategory+'.png'
					// 	};
					// });
				} else {
					// map.data.remove(dataFeature);
				}
			})
		});
	}

	function DeleteMarkers() {
			//Loop through all the markers and remove
			for (var i = 0; i < markers.length; i++) {
					markers[i].setMap(null);
			}

			markers = [];
	};

	function customControls(map) {
			//custom control - reset button
			var controlDiv = $("#control-div");
			var controlUI = $("#control-ui");
			var controlText = $("#control-text");
			controlUI.click(function() {
					map.setCenter(heslington);
					map.setZoom(defaultZoom);
					DeleteMarkers();
			});
			controlDiv.index = 1;
			map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv[0]);
	}

	function clickAnywherePanelClose(map) {
		// click anywhere to close an InfoWindow
		return google.maps.event.addListener(map, 'click', function() {
			closeInfoPanel();
		});
	}

	function closeInfoPanel() {
		var $infoPanel = $('.infoPanel.is-open');
		if ($infoPanel.length > 0) {
			$infoPanel.removeClass('is-open');
		}
	}

	function openInfoPanel() {
		var $infoPanel = $('.infoPanel').not('.is-open');
		if ($infoPanel.length > 0) {
			$infoPanel.addClass('is-open');
		}
	}

	function showPosition(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		return	new google.maps.LatLng(lat, lng);
	}


	function snazzyOptions(opts) {
		return {
			marker: opts.marker,
			content: opts.content,
			placement: 'top',
			showCloseButton: true,
			closeOnMapClick: true,
			padding: '28px',
			backgroundColor: 'rgba(15, 61, 76, 0.9)',
			border: false,
			borderRadius: '12px',
			shadow: false,
			fontColor: '#fff',
			maxWidth: 320,
			closeWhenOthersOpen: true,
			callbacks: {
				afterOpen: function(){
					$("#more").click(function(event) {
						//var mapContainer = document.getElementById('mapContainer');
						var $infoPanel = $('.infoPanel');
						var html = '<h4>'+opts.title+'</h4>';
						if (opts.subCategory) html+= '<p>'+opts.subCategory+'</p>';
						if (opts.category) html+= '<p>'+opts.category+'</p>';
						if (opts.longdesc) html+= '<p>'+opts.longdesc+'</p>';
						$('.infoPanel__content').html(html);
						openInfoPanel();
						$(".closeInfoPanel").click(closeInfoPanel);
					});
				},
				afterClose: function(){
					closeInfoPanel();
				}
			}
	   }
	}

	function createInfoWindow(location) {
			if (location.category != "Room") {
				closeInfoPanel();
			}
			// Everything must have a title!
			if (!location.title) return false;
			var title = location.title;
			var subTitle = location.subtitle || false;
			var subCategory = location.subcategory || false;
			var category = location.category || false;
			var longdesc = location.longdesc || false;
			if (category === "Room") {
				var content = '<h4>'+title+'</h4>';
				content+= '<p>Approximate location only</p>'+'<p>Please allow yourself time to locate the room</p>';
			} else {
				var content = location.content;
			}

			DeleteMarkers();
			var marker = new google.maps.Marker({
					position: location.latlng,
					map: map,
					title: title,
					subtitle: subTitle,
					subCategory: subCategory,
					category: category
			});
			map.setZoom(16);
			map.panTo(marker.position);
			var thisOptions = snazzyOptions({
				title: title,
				subCategory: subCategory,
				category: category,
				marker: marker,
				longdesc: longdesc,
				content: content
			});
			var snazzy = new SnazzyInfoWindow(thisOptions);
			snazzy.open(map, marker);
			markers.push(marker);
	}

	function createInfoPanel(location) {
		var mapContainer = document.getElementById('mapContainer');
		var $infoPanel = $('.infoPanel');
		var html = '<h3>'+location.title+'</h3>';
		if (location.subtitle !== false) html+= '<h4>'+location.subtitle+'</h4>';
		if (location.subcategory !== false) html+= '<p>'+location.subcategory+'</p>';
		//if (location.category !== false) html+= '<p>'+location.category+'</p>';
		if (location.longdesc !== false) html+= '<p>'+location.longdesc+'</p>';
		html+= '<p><a class="locationMarker">Show building on map</a></p>';
		$('.infoPanel__content').html(html);
		openInfoPanel();
		$(".closeInfoPanel").click(closeInfoPanel);
		$(".locationMarker").click(function() {
			 createInfoWindow(location);
		});
	}

	// Check whether there is a location hash,
	// and drop pin/open info panel for relevant location
	function checkHash() {
		var thisHash = document.location.hash.substr(1);
		if (thisHash === '') return false;
		// Search GeoJSON for matching location
		var selectedFeature = $.grep(cachedGeoJson.features, function(feature) {
			return makeHash(feature.properties.title) === thisHash;
		});
		if (selectedFeature.length === 0) return false;
		//return selectedFeature;
		var location = {
			title: selectedFeature[0].properties.title,
			subtitle: selectedFeature[0].properties.subtitle,
			latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
			category: selectedFeature[0].properties.category || false,
			subcategory: selectedFeature[0].properties.subcategory || false,
			longdesc: selectedFeature[0].properties.longdesc || false,
			content: '<h4>'+selectedFeature[0].properties.title+'</h4>'+'<p><a id="more">More Information</a></p>'
		}
		// Drop pin and inforWindow on map
		if (location.category === "Room") {
			createInfoPanel(location);
		} else {
			createInfoWindow(location);
		}
	}

	// make a URL hash-friendly value from str
	function makeHash(str) {
		// Lower case
		// Replace all spaces with '-'
		// Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
		// Encode as URI, just in case
		return encodeURI(str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, ""));
	};

	// initialise the map
	function initMap() {

		// load the map
		map = loadMap();

		// load the tiles
		var yorkTiles = loadYorkTiles();
		map.mapTypes.set('campus', yorkTiles);
		map.setMapTypeId('campus');

		// add custom controls
		customControls(map);

		//close infoPanel by clicking anywhere
		clickAnywherePanelClose(map);

		// Load GeoJSON.
		$.getJSON(GeoJSONFile).then(function(data){
			cachedGeoJson = data; //save the geojson in case we want to update its values
			// Filter features that have contain certain terms
			cachedGeoJson.features = $.grep(data.features, function(feature) {
				var title = feature.properties.title;
				var filterPhrases = [
					'DELETE',
					'REMOVE',
					'DOES NOT EXIST',
					'no longer bookable',
					'NO LONGER BOOKABLE',
					'NOW A KITCHEN'
			  ];
			  var r = -1;
			  $.each(filterPhrases, function(i, phrase) {
					var phraseIndex = title.indexOf(phrase);
					if (phraseIndex > -1) {
			   		r = phraseIndex;
			   		return false;
			   	}
			   	// if (i === filterPhrases.length - 1) return true;
			  });
		   	return r > -1;
			}, true); // Change to false to invert the filter i.e. show 'bad' results
			//console.log(cachedGeoJson);
			map.data.setStyle({'visible': false});
			var features = map.data.addGeoJson(cachedGeoJson, {idPropertyName:"id"});
			addMarkers();
			initSearch();
			checkHash();
		});


	} // end initMap

	//load
	google.maps.event.addDomListener(window, 'load', initMap);

	// Initialise search functionality

	function initSearch() {

		var $searchForm = $('#map-search-form');
		var $searchQuery = $('#map-search-query');
		var $autocompleteList = $('.c-autocomplete__list', $searchForm);
		var fuseOptions = {
			keys: [{
				name: 'properties.title',
				weight: 0.6
			}, {
				name: 'properties.subtitle',
				weight: 0.3
			}, {
				name: 'properties.codes',
				weight: 0.1
			}],
			includeScore: true,
			includeMatches: true,
			minMatchCharLength: 3
		}
		var fuse = new Fuse(cachedGeoJson.features, fuseOptions);

		// Move selected item to next
		var selectItem = function(dir) {
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			var selectedItem = $autocompleteItems.filter('.is-selected');
			var selectedIndex = false;
			if (selectedItem.length === 1) {
				selectedIndex = selectedItem.index();
			}
			if (dir === 'down') {
				if (selectedIndex === false) {
					// Nothing selected yet
					selectedIndex = 0;
				} else {
					selectedIndex++;
					// Loop back round
					if (selectedIndex > $autocompleteItems.length-1) selectedIndex = 0;
				}
			}
			if (dir === 'up') {
				if (selectedIndex === false) {
					// Nothing selected yet
					selectedIndex = -1;
				} else {
					selectedIndex--;
				}
			}
			// Select correct item
			$autocompleteItems.removeClass('is-selected');
			$($autocompleteItems.get(selectedIndex)).addClass('is-selected');
		};

		// Submit the form using the is-selected item
		var submitForm = function() {
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			var selectedItem = $autocompleteItems.filter('.is-selected');
			var selectedLink = selectedItem.children('.c-autocomplete__link');
			var selectedTitle = selectedLink.children('.c-autocomplete__title').text();
			var selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
			var selectedHash = selectedLink.attr("href");

			if (selectedItem.length === 0) return false;

			// Add is-selected value to search query
			$searchQuery.val(selectedTitle);

			// Update hash
			if (history.pushState) {
    		history.pushState(null, null, selectedHash);
			} else {
			  location.hash = selectedHash;
			}

			// Get rest of details from cachedGeoJson
			var selectedFeature = $.grep(cachedGeoJson.features, function(feature) {
			  return feature.properties.title === selectedTitle;
			});

			// Is there more than one with this title? Check against subtitle
			// Should really use a unique ID
			if (selectedFeature.length > 1) {
				selectedFeature = $.grep(selectedFeature, function(feature) {
			  	return feature.properties.subtitle === selectedSubtitle;
				});
			}
			var location = {
				title: selectedTitle,
				subtitle: selectedSubtitle,
				latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
				category: selectedFeature[0].properties.category || false,
				subcategory: selectedFeature[0].properties.subcategory || false,
				longdesc: selectedFeature[0].properties.longdesc || false,
				content: '<h4>'+selectedTitle+'</h4>'+'<p><a id="more">More Information</a></p>'
			}
			// Drop pin and inforWindow on map
			if (location.category === "Room") {
				createInfoPanel(location);
			} else {
				createInfoWindow(location);
			}

			$autocompleteList.empty();

		}

		// Update autosuggest on keyup
		$searchQuery.on('keyup', function(e) {
			e.preventDefault();
			// Check if it's up, down, left, right, enter or tab
			var keyCode = e.keyCode;
			var stopReturn = false;
			// console.log(keyCode);
			switch (keyCode) {
				// Return
				case 13:
					// If there's a selected option, update value
					submitForm();
					stopReturn = true;
					//$searchForm.submit();
					break;
				case 38:
					selectItem('up');
					stopReturn = true;
					break;
				case 40:
					selectItem('down');
					stopReturn = true;
					break;
			}
			if (stopReturn === true) return false;

			$autocompleteList.empty();
			var searchTerm = $searchQuery.val();
			var fuseResult = fuse.search(searchTerm);

			if (fuseResult.length === 0) return false;

			$.each(fuseResult, function(i, feature) {
				if (i > 9) return false;
				var featureTitle = feature.item.properties.title;
				var featureSubtitle = feature.item.properties.subtitle;
				var featureItem = $('<li>').addClass("c-autocomplete__item");
				var featureLink = $('<a>').addClass("c-autocomplete__link")
																	.attr({
																		"href": "#"+makeHash(featureTitle),
																		"data-category": feature.item.properties.category
																	})
																	.appendTo(featureItem);
				var featureSpan = $('<span>').addClass("c-autocomplete__title")
																		 .text(featureTitle)
																		 .appendTo(featureLink);
				if (featureSubtitle !== 'null') {
					var featureSmall = $('<small>').addClass("c-autocomplete__subtitle")
																				 .text(featureSubtitle)
																				 .appendTo(featureLink);
				}
				$.each(feature.matches, function(j, match) {
					var newText = pathIndex(feature.item, match.key);
					var l = match.indices.length-1;
					// Start from the end so you don't disrupt indices
					for (;l > -1; l--) {
						var startText = newText.slice(0, match.indices[l][0]);
						var midText = newText.slice(match.indices[l][0], match.indices[l][1]+1);
						var endText = newText.slice(match.indices[l][1]+1);
						newText = startText+'<b>'+midText+'</b>'+endText;
					}
					if (match.key === "properties.title") {
						featureSpan.html(newText);
					} else if (match.key === "properties.subtitle") {
						featureSmall.html(newText);
					}
				});

				$autocompleteList.append(featureItem);
				featureLink.click(function(e) {
					e.preventDefault();
					// Mark clicked item as is-selected and submit
					var $thisItem = $(this).parent('.c-autocomplete__item');
					$thisItem.siblings().removeClass('is-selected');
					$thisItem.addClass('is-selected');
					submitForm();
				});

			});

		});

		// Prevent form submit
		$searchForm.on('submit', function(e) {
			e.preventDefault();
			return false;
		});

	} // end initSearch

	// Function to get property from dot notation
	// e.g. foo["bar.baz"] -> foo.bar.baz
	// Because of the way fuse.js returns matches
	function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
		return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
	}
	function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
		return multiIndex(obj,is.split('.'))
	}

	// button drawer
	$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
	$("#open").click(function() {
		if ($('#panel').css('display') == 'block') {
			var height = '-='+$('#panel').height();
			$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
		} else {
			var height = '+='+$('#panel').height();
			$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-down"></i> Find Facilities');
		}
		$("#panel").slideToggle("slow");
	});


});
