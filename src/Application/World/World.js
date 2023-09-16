import * as THREE from 'three'
import Application from '../Application.js';
import Environment from './Environment.js';

export default class World
{
    constructor()
    {
        this.application = new Application()
        this.scene = this.application.scene
        this.resources = this.application.resources
        this.time = this.application.time
        this.debug = this.application.debug

        // Setup
        this.textures = {}
        this.models = {}
        this.animation = {}

        this.resources.on('readyEvent', () =>
        {
            this.setFloor()
            this.setFridge()
            this.environment = new Environment()
        })

        // Debug
        if(this.debug.active)
        {
            this.debugFridge = this.debug.ui.addFolder('fridge')

            const debugObject = {
                changeToClassic: () => {
                    this.models.fridge.model.traverse((child) =>
                    {
                        if(child instanceof THREE.Mesh)
                        {  
                            if(child.name.includes("Classic"))
                            {
                                child.visible = true
                            }
                            else if(child.name.includes("Custom"))
                            {
                                child.visible = false
                            }
                        }
                    })
                },
                changeToCustom: () => {
                    this.models.fridge.model.traverse((child) =>
                    {
                        if(child instanceof THREE.Mesh)
                        {  
                            if(child.name.includes("Classic"))
                            {
                                child.visible = false
                            }
                            else if(child.name.includes("Custom"))
                            {
                                child.visible = true
                            }
                        }
                    })
                }
            }
            this.debugFridge.add(debugObject, 'changeToClassic')
            this.debugFridge.add(debugObject, 'changeToCustom')
        }
    }

    setFloor()
    {
        // Texture
        this.textures.floor = {}
        this.textures.floor.color = this.resources.items.floorColorTexture
        this.textures.floor.color.colorSpace = THREE.SRGBColorSpace
        this.textures.floor.normal = this.resources.items.floorNormalTexture

        Object.values(this.textures.floor).forEach(texture => 
        {
            texture.repeat.set(1.5, 1.5)
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
        })

        // Model
        const floorGeometry = new THREE.CircleGeometry(5, 64)
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.floor.color,
            normalMap: this.textures.floor.normal
        })
        
        // Add and options
        const floor = new THREE.Mesh(floorGeometry, floorMaterial)
        floor.rotation.x = - Math.PI * 0.5
        floor.receiveShadow = true
        this.scene.add(floor)
    }

    setFridge()
    {
        // Model
        this.models.fridge = {}
        this.models.fridge.model = this.resources.items.fridgeModel.scene

        // Add and options
        // this.models.fridge.model.scale.set(0.02, 0.02, 0.02)
        this.models.fridge.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
                
                if(child.name.includes("Custom"))
                {
                    child.visible = false
                }
            }
        })
        this.scene.add(this.models.fridge.model)
    }

    update()
    {

    }
}