const axios = require("axios");

/**
 * Routing Service to interact with the Valhalla routing engine.
 * Default local URL: http://localhost:8002
 */
class RoutingService {
    constructor() {
        this.baseUrl = process.env.VALHALLA_URL || "http://localhost:8002";
    }

    /**
     * Get a route between two points.
     * @param {Object} start {lat, lng}
     * @param {Object} end {lat, lng}
     * @returns {Promise<Object>} The route data including polyline and metadata.
     */
    async getRoute(start, end) {
        try {
            const json = {
                locations: [
                    { lat: start.lat, lon: start.lng },
                    { lat: end.lat, lon: end.lng }
                ],
                costing: "auto",
                units: "kilometers"
            };

            const response = await axios.get(`${this.baseUrl}/route`, {
                params: {
                    json: JSON.stringify(json)
                }
            });

            return response.data;
        } catch (error) {
            console.error("Valhalla Route Error:", error.message);
            // Return null instead of throwing to allow the app to function without routing
            return null;
        }
    }

    /**
     * Map Match a series of coordinates to the road network.
     * @param {Array} coordinates Array of {lat, lng}
     * @returns {Promise<Object>} Map-matched path.
     */
    async mapMatch(coordinates) {
        try {
            const json = {
                trace: coordinates.map(c => ({ lat: c.lat, lon: c.lng })),
                costing: "auto",
                shape_format: "polyline6"
            };

            const response = await axios.get(`${this.baseUrl}/trace_route`, {
                params: {
                    json: JSON.stringify(json)
                }
            });

            return response.data;
        } catch (error) {
            console.error("Valhalla Map Match Error:", error.message);
            // Fallback to raw coordinates if map matching fails
            return null;
        }
    }

    /**
     * Decode Valhalla's polyline6 format.
     * Valhalla uses 6 decimal places for its polyline.
     * @param {string} str Encoded polyline string
     * @returns {Array} Array of [lat, lng] coordinates
     */
    decodePolyline(str) {
        let index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, 6);

        while (index < str.length) {
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }

        return coordinates;
    }
}

module.exports = new RoutingService();
