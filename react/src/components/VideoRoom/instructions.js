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
            <h1>Welcome to Cherry Blossom at Memorial Park in Cupertino</h1>
            <hr/>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla non mattis ligula. Nulla facilisi. Pellentesque facilisis ullamcorper sagittis. Praesent tempor ullamcorper dui in ornare. Nulla vitae semper libero, a efficitur purus. Phasellus nec enim tincidunt, iaculis ligula id, dictum justo. Sed id venenatis sem. Suspendisse mollis sapien lacus, vitae lacinia nisl pellentesque at. Morbi a interdum enim. Phasellus mattis felis dolor, sit amet iaculis quam ullamcorper sed. Integer eu vulputate risus. Donec viverra neque eu elit sodales bibendum. Vivamus vel quam ante.</p>

            <p>Fusce suscipit gravida justo sit amet efficitur. Donec ac enim sit amet nisl gravida volutpat. Donec nulla velit, tempor laoreet sodales ut, varius eu lorem. Ut pharetra lorem nec ultricies tristique. Ut viverra nisi quis tellus posuere, a placerat dolor ultricies. Mauris imperdiet mauris turpis, non lobortis neque aliquam aliquet. Cras ullamcorper velit a porta elementum. Curabitur ac ullamcorper leo, congue pulvinar mi. Donec pharetra nisi ac luctus varius. Aenean placerat ornare sagittis. Suspendisse nisi dui, interdum non justo sed, porta venenatis sapien.</p>

            <p>Quisque interdum nisl at eros ultrices, luctus efficitur massa laoreet. Fusce a lectus at tellus semper mattis. Phasellus facilisis suscipit elit ut commodo. Donec convallis odio tincidunt lobortis accumsan. Aenean porta eros sed libero iaculis euismod. Vivamus in suscipit nisi, vitae vehicula lectus. Integer porttitor egestas odio in efficitur. Sed elementum hendrerit dictum. Integer tincidunt, urna id efficitur interdum, diam sapien pretium enim, eget pharetra turpis orci egestas velit.</p>
          </div>
        </div>
        )
  }
}
