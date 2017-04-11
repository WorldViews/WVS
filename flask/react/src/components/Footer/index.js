import React from 'react';

/* component styles */
import { styles } from './styles.scss';

export default class Footer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            year: 2017
        }
    }

    render() {
        return (
        <footer className={`${styles}`}>
            <div className="container">
                <div className="row">
                    <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                        <p>© WorldViews {this.state.year}</p>
                    </div>
                </div>
            </div>
        </footer>
        );
    }
}