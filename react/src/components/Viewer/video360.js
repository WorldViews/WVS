import React from 'react'

import VideoView from './video'
import styles from './styles.scss'
import { Renderer, Scene, PerspectiveCamera, Object3D, Mesh } from 'react-three'
import * as THREE from 'three';
// let OrbitControls = require('three-orbit-controls')(THREE)
import OrbitControls from 'three-orbit-controls';

import Resizable from 'react-component-resizable'

export default class Video360View extends VideoView {

    constructor(props) {
        super(props);

        this.state = {
            width: 640,
            height: 480,
            material: new THREE.MeshBasicMaterial()
        };
    }

    onResize(resizeAttributes) {
        var width = resizeAttributes.width,
        height = resizeAttributes.height;

        this.setState({width: width, height: height});
    }

    componentDidMount() {
        let videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;

        let material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            overdraw: true
        });
        this.setState({material});
    }

    render() {
        var aspectratio = this.state.width / this.state.height;
        var cameraprops = {
            fov:75,
            aspect:aspectratio,
            near:1,
            far:1100,
            position:new THREE.Vector3(0,0,1),
            lookat:new THREE.Vector3(0,0,0)
        };

        var geometry = new THREE.SphereGeometry( 500, 60, 40 );
        geometry.scale( - 1, 1, 1 );


        return (
            <Resizable className={styles.mainview} onResize={this.onResize.bind(this)}>
                <div className="info360">360 &deg; Video</div>
                <video ref={(v) => { this.video = v; }} className="hidden" />
                <Renderer width={this.state.width} height={this.state.height}>
                    <Scene width={this.state.width} height={this.state.height} camera="maincamera" orbitControls={OrbitControls(THREE)}>
                        <Object3D>
                            <Mesh position={new THREE.Vector3(0, 0, 0)} geometry={geometry} material={this.state.material} />
                        </Object3D>
                        <PerspectiveCamera name="maincamera" {...cameraprops} />
                    </Scene>
                </Renderer>
            </Resizable>

        )
    }
}