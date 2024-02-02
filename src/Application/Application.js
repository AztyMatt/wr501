import * as THREE from 'three'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Resources from './Utils/Resources.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import Debug from './Utils/Debug.js'

// Stats.JS
// import Stats from 'stats.js'

let instance = null

export default class Application
{
    constructor(canvas)
    {
        if(instance)
        {
            return instance
        }
        instance = this

        // Stats.JS
        // this.stats = new Stats()
        // this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        // document.body.appendChild(this.stats.dom)

        // Global access
        window.application = this

        // Options
        this.canvas = canvas

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources()
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.debug = new Debug()
        this.world = new World()

        // Sizes resize event
        this.sizes.on('resizeEvent', () =>
        {
            this.resize()
        })

        // Time tick event
        this.time.on('tickEvent', () =>
        {
            this.update()
        })
    }

    resize()
    {
        this.camera.resize()
        this.renderer.resize()
    }

    update()
    {
        // this.stats.begin() // Stats.JS

        this.camera.update()
        if(this.world)
        {
            this.world.update()
        }
        this.renderer.update()

        // this.stats.end() // Stats.JS
    }

    destroy()
    {
        this.sizes.off('resizeEvent')
        this.time.off('tickEvent')

        // Traverse the whole scene
        this.scene.traverse((child) => 
        {
            if(child instanceof THREE.Mesh)
            {
                child.geometry.dispose()

                // Loop through the material properties
                for(const key in child.material)
                {
                    const value = child.material[key]

                    // Test if there is a dispose function
                    if(value && typeof value.dispose === 'function')
                    {
                        value.dispose()
                    }
                }
            }
        })

        this.camera.controls.dispose()
        this.renderer.instance.dispose() //Ici 'instance' fait reférence au fait que dans this.renderer, on cherche le renderer qu'on a créé / son instance dans Renderer.js

        if(this.debug.active)
        {
            this.debug.ui.destroy()
        }
    }
}