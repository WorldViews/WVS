import React from 'react';
// import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import WVL from 'Leaflet/WVLeaflet';

export default class MapView extends React.Component {

    componentDidMount() {
        var latlng = { lat:37.324684179870715, lng:-122.0436295866966 }
        var xbounds = [ [ 37.3265995227329,  -122.04150527715686 ],
            [ 37.32308873451525, -122.04593628644945 ] ]
        var bounds = [
        [ 37.0,  -123.04150527715686 ],
        [ 38, -120.04593628644945 ]
        ];

        WVL.initmap(latlng, bounds);
    }

    resize() {
        //this.refs.map.leafletElement.invalidateSize();
        WVL.map.invalidateSize();
    }

    render() {
        const position = [51.505, -0.09];
        return (
            <div id="map" className={this.props.className}></div>
            /*<Map ref="map" center={position} zoom={13} className={this.props.className}>
                <TileLayer
                url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position}>
                <Popup>
                    <span>A pretty CSS3 popup.<br/>Easily customizable.</span>
                </Popup>
                </Marker>
            </Map>*/
        );
    }
}