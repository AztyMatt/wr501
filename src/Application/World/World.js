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

        // Discord question
        // this.camera = this.application.camera

        // Setup
        this.textures = {}
        this.models = {}
        this.animation = {}

        this.allMaterials = new Set()

        this.resources.on('readyEvent', () =>
        {
            this.setFloor()
            this.setFridge()
            this.environment = new Environment()

            // Discord question
            // if(this.models.fridge)
            // {
            //     this.camera.target = this.models.fridge.model.position
            // }

            // Debug
            if(this.debug.active)
            {
                this.debugFridge = this.debug.ui.addFolder('fridge')

                const debugObject = {
                    changeToClassic: () => {this.changeAssets('classic')},
                    changeToCustom: () => {this.changeAssets('custom')}
                }

                this.debugFridge.add(debugObject, 'changeToClassic').name('Poignées classique')
                this.debugFridge.add(debugObject, 'changeToCustom').name('Poignées customisées')
            }
        })
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

        // Options
        this.models.fridge.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
            }
        })

        this.retrieveAllMaterials()

        // Set to classic
        this.changeAssets('classic')

        // Add
        this.scene.add(this.models.fridge.model)
    }

    retrieveAllMaterials()
    {
        this.models.fridge.model.traverse((child) =>
        {
            if(child.isMesh && child.material.isMeshStandardMaterial)
            {
                this.allMaterials.add(child.material)
            }
        })
        
        console.log([...this.allMaterials][4])
    }

    changeAssets(asset)
    {
        this.models.fridge.model.traverse((child) =>
        {
            // Set visibility of all customisable elements to false
            if(child.userData.customisable)
            {
                child.visible = false
            }

            // Set visibility of the customisation we want to true
            if(child.userData[asset])
            {
                child.visible = true
                child.material = [...this.allMaterials][4]
            }
        })
    }

    update()
    {

    }
}