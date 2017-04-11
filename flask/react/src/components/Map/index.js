import React from 'react';

export default class Map extends React.Component {

    render() {
        return (
            <section>
                <div className={this.props.className + " container text-center"}>
                    <h1>Map</h1>
                </div>
            </section>
        );
    }
}