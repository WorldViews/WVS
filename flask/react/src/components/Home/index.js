import React from 'react';
import Map from '../Map'
import Viewer from '../Viewer'

export default class Home extends React.Component {

    render() {
        return (
            <section>
                <div className="container text-center">
                    <h1>React View</h1>
                    <Viewer/>
                    <Map/>
                </div>
            </section>
        );
    }
}