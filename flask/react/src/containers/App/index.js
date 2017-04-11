import React from 'react';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

/* application components */
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Display from '../../components/Display';

/* global styles for app */
import styles from  './styles/app.scss';

export default class App extends React.Component { // eslint-disable-line react/prefer-stateless-function
    static propTypes = {
        children: React.PropTypes.node,
    };

    render() {
        return (
            <section className={styles.box}>
                <Header />
                <Display />
                <Footer />
            </section>
        );
    }
}
