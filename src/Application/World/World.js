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

        this.allMaterialsRetrieved = new Set()
        this.allMaterials = {}
        this.defaultMaterial = null

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

            this.allMaterialsRetrieved.forEach(material => {
                console.log(material.name)
            })

            console.log([...this.allMaterialsRetrieved])

            // Debug
            if(this.debug.active)
            {
                this.debugFridge = this.debug.ui.addFolder('fridge')

                const debugObject = {
                    changeToClassic: () => {this.changeAssets('classic')},
                    changeToCustom: () => {this.changeAssets('custom')},
                    changeToCustomWhite: () => {this.changeAssets('custom', 4)}
                }

                this.debugFridge.add(debugObject, 'changeToClassic').name('Poignées classique')
                this.debugFridge.add(debugObject, 'changeToCustom').name('Poignées customisées')
                this.debugFridge.add(debugObject, 'changeToCustomWhite').name('Poignées customisées blanche')
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

        this.retrieveallMaterialsRetrieved()

        // Set to classic
        this.changeAssets('classic')

        // Add
        this.scene.add(this.models.fridge.model)
    }

    retrieveallMaterialsRetrieved()
    {
        this.models.fridge.model.traverse((child) =>
        {
            if(child.isMesh && child.material.isMeshStandardMaterial)
            {
                this.allMaterialsRetrieved.add(child.material)
            }
        })
    }

    changeAssets(asset, material)
    {
        this.models.fridge.model.traverse((child) =>
        {
            // Set visibility of all customisable elements to false
            if(child.userData.customisable)
            {
                child.visible = false
            }

            // Set visibility of the customisation we want to true and change the material if it's specified
            if(child.userData[asset])
            {
                if(!this.defaultMaterial)
                {
                    this.defaultMaterial = child.material
                }

                child.visible = true
                child.material = this.defaultMaterial
                 if(material){
                    child.material = [...this.allMaterialsRetrieved][material]
                }
            }
        })
    }

    update()
    {

    }
} 