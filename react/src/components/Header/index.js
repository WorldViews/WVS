import React from 'react'

/* component styles */
import { styles } from './styles.scss'

export default class Header extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  render () {
    return (
            <header className={`${styles}`}>
                <h1>WorldView Tours</h1>
            </header>
    )
  }
}
