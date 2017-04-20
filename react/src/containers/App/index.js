import React from 'react'
import PropTypes from 'prop-types';

// application components
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Display from '../../components/Display'

// global styles for app
import styles from './styles/app.scss'

export default class App extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    children: PropTypes.node
  };

  render () {
    return (
            <section className={styles.box}>
                <Header />
                <Display />
                <Footer />
            </section>
    )
  }
}
