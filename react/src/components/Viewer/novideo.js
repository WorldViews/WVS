import React from 'react';
import Icon from 'react-icons-kit';
import PropTypes from 'prop-types';
import { ic_face } from 'react-icons-kit/md/ic_face';
// import styles from './styles.scss'

export default class NoVideo extends React.Component {
  static propTypes = {
    className: PropTypes.string,
  }

  render() {
    return <Icon size="100%" icon={ic_face} style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ccc'
        }}/>
    }
}