// Shared Google Maps script-loader options. ConvoyMap (LoadScript) and
// CreateTripPage (useJsApiLoader) must use identical options or the
// @react-google-maps/api loader throws on the second mount.
export const MAPS_LOADER_ID = 'script-loader'
export const MAPS_LIBRARIES = ['places']
