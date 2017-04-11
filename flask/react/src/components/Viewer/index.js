import React from 'react';
import YouTube from 'react-youtube';

export default class Viewer extends React.Component {
    render() {
        return (
            <YouTube className={this.props.className} 
                videoId="2g811Eo7K8U"
            />
        );
    }
}