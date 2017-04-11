import React from 'react';

export default class Viewer extends React.Component {

    render() {
        return (
            <section>
                <div className={this.props.className + " container text-center"}>
                    <h1>Viewer</h1>
                </div>
            </section>
        );
    }
}