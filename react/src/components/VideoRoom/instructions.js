import React from 'react'
import PropTypes from 'prop-types';

export default class Instructions extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
  }

  render () {
    return (
        <div className={this.props.className}>
          <div className="instructions">
            <h1>Welcome to the Cherry Blossom Festival at Memorial Park in Cupertino</h1>
            <hr/>
            <p>The Cupertino Toyokawa Sister City program promotes cultural awareness and friendship between the cities of Cupertino and Toyokawa, Japan.  The relationship celebrated its 39th anniversary in 2017. The friendship is built through the annual student exchange program.  The cultural awareness is promoted through the annual Cherry Blossom Festival held every year on the last weekend in April.</p>

          <a href="http://www.cupertinotoyokawa.org/">Cupertino-Toyokawa Sister City Program</a>
          <a href="http://cupertino.org/index.aspx?page=1079"City of Cupertino Cherry Blossom</a>
          </div>
        </div>
        )
  }
}
