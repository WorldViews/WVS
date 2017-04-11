import React from 'react';
import Map from '../Map'
import Viewer from '../Viewer'

import { styles, viewer, map } from './styles.scss';

export default class Home extends React.Component {

    render() {
        return (
            <section className={`${styles}`}>
                <div className="row">
                    <div className="col-xs-6 col-sm-6 col-md-6 col-lg-6 nopadding">
                        <Viewer className={`${viewer}`} />
                    </div>
                    <div className="col-xs-6 col-sm-6 col-md-6 col-lg-6 nopadding">
                        <Map className={`${map}`} />
                    </div>
                </div>
            </section>
        );
    }
}