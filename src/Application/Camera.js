import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Application from './Application.js';

export default class Camera
{
    constructor()
    {
        this.application = new Application()
        this.sizes = this.application.sizes
        this.scene = this.application.scene
        this.canvas = this.application.canvas

        // Discord question
        // this.target = new THREE.Vector3()

        this.setInstance()
        this.setOrbitControls()

        this.controls.mouseButtons = {
            // LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        }
    }

    setInstance()
    {
        this.instance = new THREE.PerspectiveCamera
        (
            35,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        )
        this.instance.position.set(2, 2, 2)
        this.scene.add(this.instance)
    }

    setOrbitControls()
    {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.target = new THREE.Vector3(0, 0.5, 0)

        // this.controls.maxAzimuthAngle = 2.5
        // this.controls.minAzimuthAngle = 0.7
        // this.controls.maxPolarAngle = 1.4
        // this.controls.minPolarAngle = 1.0

        this.controls.enableDamping = true
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update()
    {
        this.controls.update()

        // Discord question
        // if(this.target)
        // {
        //     this.instance.lookAt(this.target)
        // }
    }
}