import {
  MapPin, Utensils, Fuel, ParkingSquare, AlertTriangle, Camera,
  Coffee, Tent, Home, ShowerHead, Palmtree, Bed,
  Flag, Hotel, Umbrella, Mountain, Landmark, Target,
} from 'lucide-react'

// Waypoints store an `icon` id; the map/panels resolve it here.
// Unknown ids (including legacy emoji strings) fall back to MapPin.
export const WAYPOINT_ICONS = {
  mark:     MapPin,
  food:     Utensils,
  fuel:     Fuel,
  parking:  ParkingSquare,
  danger:   AlertTriangle,
  photo:    Camera,

  break:    Coffee,
  camp:     Tent,
  shelter:  Home,
  toilet:   ShowerHead,
  shade:    Palmtree,
  rest:     Bed,

  finish:   Flag,
  hotel:    Hotel,
  beach:    Umbrella,
  summit:   Mountain,
  landmark: Landmark,
  target:   Target,
}

export function getWaypointIcon(id) {
  return WAYPOINT_ICONS[id] ?? MapPin
}
