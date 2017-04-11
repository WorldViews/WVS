import React from 'react';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

/* application components */
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/* global styles for app */
import './styles/app.scss';

export default class App extends React.Component { // eslint-disable-line react/prefer-stateless-function
    static propTypes = {
        children: React.PropTypes.node,
    };

    render() {
        return (
            <section>
                <div>
                    <Header />
                </div>
                <div className="container-fluid">
                    {this.props.children}
                </div>
                <div>
                    <Footer />
                </div>
            </section>
        );
    }
}
