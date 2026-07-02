// "Printed touring map" style — warm paper land, white roads, soft green
// parks. Keeps the map quiet so pins and the route are the loudest elements.
const mapStyle = [
  { elementType: 'geometry',           stylers: [{ color: '#EDEAE0' }] },
  { elementType: 'labels.icon',        stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8A917F' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FAF9F5' }] },

  { featureType: 'poi',            elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'poi',            elementType: 'geometry',          stylers: [{ color: '#E7E4D8' }] },
  { featureType: 'poi.park',       elementType: 'geometry',          stylers: [{ color: '#E2EAD9' }] },

  { featureType: 'road',           elementType: 'geometry',          stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road',           elementType: 'geometry.stroke',   stylers: [{ color: '#DEDACE' }] },
  { featureType: 'road',           elementType: 'labels.text.fill',  stylers: [{ color: '#9AA292' }] },
  { featureType: 'road.highway',   elementType: 'geometry',          stylers: [{ color: '#F6EFDD' }] },
  { featureType: 'road.highway',   elementType: 'geometry.stroke',   stylers: [{ color: '#E4D9BC' }] },
  { featureType: 'road.arterial',  elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local',     elementType: 'labels',            stylers: [{ visibility: 'off' }] },

  { featureType: 'transit',                                          stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry',      stylers: [{ color: '#EDEAE0' }] },
  { featureType: 'landscape.natural',  elementType: 'geometry',      stylers: [{ color: '#E9E6D9' }] },

  { featureType: 'water',          elementType: 'geometry',          stylers: [{ color: '#CBDDE3' }] },
  { featureType: 'water',          elementType: 'labels.text.fill',  stylers: [{ color: '#7E99A3' }] },

  { featureType: 'administrative', elementType: 'geometry.stroke',   stylers: [{ color: '#D8D4C6' }] },
  { featureType: 'administrative.land_parcel',                       stylers: [{ visibility: 'off' }] },
]

export default mapStyle
