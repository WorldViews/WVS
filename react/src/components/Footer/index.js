import React from 'react'

/* component styles */
import { styles } from './styles.scss'

export default class Footer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      year: 2017
    }
  }

  render () {
    return (
        <footer className={`${styles}`}>
            <p>© WorldViews {this.state.year}</p>
        </footer>
    )
  }
}
