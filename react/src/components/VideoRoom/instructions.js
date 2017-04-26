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
            <div className="text-center">
              <h1>Welcome to the Cherry Blossom Festival at Memorial Park in Cupertino</h1>
            </div>
            <hr/>
            <div className="lead">
              <p>The Cupertino Toyokawa Sister City program promotes cultural awareness
                and friendship between the cities of Cupertino and Toyokawa, Japan.
                The relationship celebrated its 39th anniversary in 2017. The friendship
                is built through the annual student exchange program.  The cultural awareness
                is promoted through the annual Cherry Blossom Festival held every year on the
                last weekend in April.</p>

              <h3>Instructions</h3>

              <p>Click anywhere on a trail on the map on the right to see video from that trail displayed
                in the left.  Additional layers can be selected by clicking the layers icon in the top 
                right.</p>
              <h3>Links</h3> 
              <ul>
                <li><a href="http://www.cupertinotoyokawa.org/">Cupertino-Toyokawa Sister City Program</a></li>
                <li><a href="http://cupertino.org/index.aspx?page=1079">City of Cupertino Cherry Blossom</a></li>
              </ul>
            </div>
          </div>
        </div>
        )
  }
}
