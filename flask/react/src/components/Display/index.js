import React from 'react';

/* component styles */
import { styles, left, right } from './styles.scss';

import Viewer from '../Viewer'
import Map from '../Map'

export default class Display extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            year: 2017
        }
    }

    render() {
        return (
        <div className={styles}>
            <Viewer className={left} />
            <Map className={right} />
        </div>
        );
    }
}