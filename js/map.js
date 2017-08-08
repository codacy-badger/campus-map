$(function() {
	// defaults
	var GeoJSONFile = "https://york.funnelback.co.uk//s/search.html?collection=york-uni-campusmap&form=geojson&query=!padrenullquery&num_ranks=5000";
	var cachedGeoJson;
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
	var infowindow = new google.maps.InfoWindow();

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
					disableDefaultUI: true
			});
	}

	// load UoY tiles
	function loadYorkTiles() {
			return new google.maps.ImageMapType({
					getTileUrl: function(coord, zoom) {
							return "https://www.york.ac.uk/about/maps/campus/data/tiles/" +
									zoom + "/" + coord.x + "/" + coord.y + ".png";
					},
					tileSize: new google.maps.Size(256, 256),
					isPng: true,
					zoom: defaultZoom,
					maxZoom: maxZoom,
					minZoom: minZoom,
					name: 'Map'
			});
	}


	// enable toggling of markers
	function toggleMarkers(map) {

			map.data.forEach(function(feature) {
			map.data.remove(feature);
					var category = feature.getProperty('category');
					$(".c-btn--selectable").each(function() {
							//map.data.remove(feature)
							var GeoJSONCategory = $(this).attr("id");

							document.getElementById(GeoJSONCategory).addEventListener("click", function() {
									if ($(this).is(':checked')) {
											if (category === GeoJSONCategory) {
													map.data.add(feature);
													map.data.addListener('click', function(event) {
															var title = event.feature.getProperty("title");
															var category = event.feature.getProperty("category");
															var subCategory = event.feature.getProperty("subcategory");
															var mapContainer = document.getElementById('mapContainer');
															var infoPanel = document.getElementById('infoPanel');
															var html = '<h4>' + title + '</h4><p>' + subCategory + '</p><p>' + category + '</p>';
															document.getElementById('infoPanel__content').innerHTML = html;
															infoPanel.style.display = 'block';
															infoPanel.style.width = '20%';

															$(".closeInfoPanel").click(function() {
																	infoPanel.style.display = 'none';
																	infoPanel.style.width = '0%';
															});
													});
													map.data.setStyle(function(feature) {
															return {
																	icon: 'images/markers/' + feature.getProperty("category") + '.png'
															};
													});
											}
									} else {
											if (category === GeoJSONCategory) {
													map.data.remove(feature);
											}
									}
							});


					});
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
					if (infoPanel) {
							infoPanel.style.display = 'none';
							infoPanel.style.width = '0%';
					}
			});
	}

	function showPosition(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		return	new google.maps.LatLng(lat, lng);
	}

	function searchCampus(map) {
			var $search = $('#search-query');
			$($search).change(function() {
					for (var i = 0; i < markers.length; i++)
							markers[i].setMap(null);
					markers = [];
					//Reading the value in text boxes on HTML form
					var sourceLocation = ($($search).val());
					//Remove any spaces from between coordinates
					var parts = sourceLocation.split(",");
					var newLocation = new google.maps.LatLng(parseFloat(parts[1]), parseFloat(parts[0]));
					var title = parts[2];
					var subCategory = parts[3];
					var category = parts[4];
					var marker = new google.maps.Marker({
							position: newLocation,
							map: map,
							title: title,
							subCategory: subCategory,
							category: category
					});
					map.setZoom(16);
					map.panTo(marker.position);
					google.maps.event.addListener(marker, 'click', function(event) {
							var mapContainer = document.getElementById('mapContainer');
							var infoPanel = document.getElementById('infoPanel');
							var html = '<h4>' + title + '</h4><p>' + subCategory + '</p><p>' + category + '</p>';
							document.getElementById('infoPanel__content').innerHTML = html;
							infoPanel.style.display = 'block';
							infoPanel.style.width = '20%';

							$(".closeInfoPanel").click(function() {
									infoPanel.style.display = 'none';
									infoPanel.style.width = '0%';
							});
					});
					markers.push(marker);
			});
	}

	//populate search / dropdown
	// $.getJSON(GeoJSONFile, function(data) {
	//		 var $search = $('#search-query');
	//		 var groupedData = _.groupBy(data.features, function(d) {
	//				 return d.properties.category
	//		 });
	//		 $.each(groupedData, function(index, item) {
	//				 var group = $('<optgroup label="' + index + '" />');
	//				 $.each(item, function() {
	//						 $("<option></option>").text(this.properties.title).val(this.geometry.coordinates + ',' + this.properties.title + ',' + this.properties.subCategory + ',' + this.properties.category).appendTo(group);
	//				 });
	//				 group.appendTo($search);
	//		 });
	//		 $($search).select2({
	//				 placeholder: 'Search the campus'
	//		 });
	// });

	// initialise the map
	function initMap() {
			// load the map
			var map = loadMap();
			// load the tiles
			var yorkTiles = loadYorkTiles();
			map.mapTypes.set('campus', yorkTiles);
			map.setMapTypeId('campus');
			// add custom controls
			customControls(map);
			// search the campus
			searchCampus(map);
			//close infoPanel by clicking anywhere
			clickAnywherePanelClose(map);
			// load the geojson
			// map.data.loadGeoJson(GeoJSONFile);
			// setTimeout(function() {
			//		 toggleMarkers(map);
			// }, 500);

			// Load GeoJSON.
		var promise = $.getJSON(GeoJSONFile); //same as map.data.loadGeoJson();
		promise.then(function(data){
			cachedGeoJson = data; //save the geojson in case we want to update its values
			map.data.addGeoJson(cachedGeoJson,{idPropertyName:"id"});
							setTimeout(function() {
									toggleMarkers(map);
							}, 500);
			initSearch();
		});


	} // end initialise

	//load
	google.maps.event.addDomListener(window, 'load', initMap);

	// == Search functionality =================================================

	function initSearch() {		

		var $searchForm = $('#map-search-form');
		var $searchQuery = $('#map-search-query');
		var $autocompleteList = $('.c-autocomplete__list', $searchForm);
	
		console.log(cachedGeoJson);
	
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

		// Update autosuggest on keyup
		$searchQuery.on('keyup', function(e) {
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			// Check if it's up, down, left, right, enter or tab
			var keyCode = e.keyCode;
			var rStop = false;
			// console.log(keyCode);
			switch (keyCode) {
				// Return
				// This never gets fired - the submit seems to occur first
				case 13:
					// If there's a selected option, update value
					var selectedItem = $autocompleteItems.filter('.is-selected');
					if (selectedItem.length > 0) {
						var selectedValue = selectedItem.text();
						console.log('Selected value is '+selectedValue);
						$searchQuery.value(selectedValue);
					}
					rStop = true;
					$searchForm.submit();
					break;
				case 38:
					selectItem('up');
					rStop = true;
					break;
				case 40:
					selectItem('down');
					rStop = true;
					break;
			}
			if (rStop === true) return false;

			$autocompleteList.empty();
			var searchTerm = $searchQuery.val();
	
			var fuseResult = fuse.search(searchTerm);
	
			if (fuseResult.length === 0) return false;

			$.each(fuseResult, function(i, feature) {
				if (i > 9) return false;
				console.log(feature);
				var featureTitle = feature.item.properties.title;
				var featureSubtitle = feature.item.properties.subtitle;
				var featureItem = $('<li>').addClass("c-autocomplete__item");
				var featureLink = $('<a>').addClass("c-autocomplete__link")
					.attr("href", '#'+featureTitle)
					.appendTo(featureItem);
				var featureSpan = $('<span>')
					.text(featureTitle)
					.appendTo(featureLink);
				if (featureSubtitle !== 'null') {
					var featureSmall = $('<small>').addClass("c-autocomplete__subtitle")
						.text(featureSubtitle)
						.appendTo(featureLink);
				}
				$.each(feature.matches, function(j, match) {
					var newText = pathIndex(feature.item, match.key);
					console.log("=========================================")
					console.log(newText)
					var l = match.indices.length-1;
					// Start from the end so you don't disrupt indices
					for (;l > -1; l--) {
						var startText = newText.slice(0, match.indices[l][0]);
						var midText = newText.slice(match.indices[l][0], match.indices[l][1]+1);
						var endText = newText.slice(match.indices[l][1]+1);
						newText = startText+'<b>'+midText+'</b>'+endText;
						console.log(startText, midText, endText, newText);
					}
					if (match.key === "properties.title") {
						featureSpan.html(newText);
					} else if (match.key === "properties.subtitle") {
						featureSmall.html(newText);
					}
				});
				
				
				$autocompleteList.append(featureItem);
				featureLink.on('hover', function(e) {
					console.log(e.target);
					// Mark hovered item as is-selected
					var $thisItem = $(this);
					$thisItem.siblings().removeClass('is-selected');
					$thisItem.addClass('is-selected');
				});
			
			});

		});

		// Form submit
		$searchForm.on('submit', function(e) {
			e.preventDefault();
			// Add selected item to value
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			var selectedItem = $autocompleteItems.filter('.is-selected');
			if (selectedItem.length > 0) {
				var selectedValue = selectedItem.text();
				console.log('Selected value is '+selectedValue);
				$searchQuery.val(selectedValue);
			}
			var searchTerm = $searchQuery.val();
			// Clean up search
			searchTerm = searchTerm.trim();
			if (searchTerm === '') return false;
			encodedSearchTerm = encodeURIComponent(searchTerm).replace(/%20/g, '+');
			var searchURL = 'https://york.funnelback.co.uk/s/search.html?collection=york-uni-campusmap&form=geojson&query=';
			$.getJSON(searchURL+encodedSearchTerm+'&callback=?', function(data) {
				console.log(data);
				if (typeof data.error !== 'undefined') {
					console.log('Error!');
					return false;
				}
				var $searchResults = $('#search-results');
				var resultCount = data.features.length;
				$searchResults.empty().append($('<h3>').html('Your search for <em>'+searchTerm+'</em> returned '+resultCount+' result(s).'));
				if (resultCount > 0) {
					var $ul = $('<ul>');
					$.each(data.features, function(i, result) {
						console.log(result);
						var resultText = result.properties.title+' ('+result.geometry.coordinates[0]+', '+result.geometry.coordinates[1]+')';
						$ul.append($('<li>').text(resultText));
					});
					$searchResults.append($ul);
					$autocompleteList.empty();
				}
			});
	
		});

	}
	
	// Function to get property from dot notation
	// e.g. foo["bar.baz"] -> foo.bar.baz
	// Because of the way fuse.js returns matches
	function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
		return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
	}
	function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
		return multiIndex(obj,is.split('.'))
	}

/* ========================================================================== */

});
