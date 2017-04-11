import React from 'react';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

export default class MapView extends React.Component {

    resize() {
        this.refs.map.leafletElement.invalidateSize();
    }

    render() {
        const position = [51.505, -0.09];
        return (
            <Map ref="map" center={position} zoom={13} className={this.props.className}>
                <TileLayer
                url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position}>
                <Popup>
                    <span>A pretty CSS3 popup.<br/>Easily customizable.</span>
                </Popup>
                </Marker>
            </Map>
        );
    }
}