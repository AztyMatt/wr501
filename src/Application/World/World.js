import * as THREE from 'three'
import Application from '../Application.js'
import Environment from './Environment.js'

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

        // Handles
        // this.handlesPosRot = {} // Method 2
        // this.activeHandles = [] // Method 2

        // Materials
        this.allMaterialsRetrieved = new Set()
        this.allMaterials = {}
        this.defaultMaterial = null

        // Kitchen sizes
        this.x = 8
        this.y = 6

        // UVs
        this.uvSize = 0.5

        // Walls
        this.walls = {
            0: {},
            1: {},
            2: {},
            3: {},
        }
        this.wallsHeight = 2.5
        this.wallsRotation = [0.5, 2, -0.5, 1]
        this.wallsAxis = ['x', 'z', 'x', 'z']

        this.resources.on('readyEvent', () =>
        {
            this.setBase()
            this.setGrid()
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
                // Floor
                this.debugFloor = this.debug.ui.addFolder('floor')

                const debugObjectFloor = {
                    scaleX: this.x,
                    scaleY: this.y
                }

                //0.5m = 1
                this.debugFloor.add(debugObjectFloor, 'scaleX', 1, 20, 0.1).name('Scale X').onChange((value) => {
                    this.updateScale('x', value)
                })
                this.debugFloor.add(debugObjectFloor, 'scaleY', 1, 20, 0.1).name('Scale Y').onChange((value) => {
                    this.updateScale('y', value)
                })

                // Fridge
                this.debugFridge = this.debug.ui.addFolder('fridge')

                const debugObjectFridge = {
                    changeToClassic: () => {this.setHandleByVisibility('classic')},
                    changeToCustom: () => {this.setHandleByVisibility('custom')},
                    changeToCustomWhite: () => {this.setHandleByVisibility('custom', 'plastic - black')}
                }

                // // Method 2
                // const debugObjectFridge = {
                //     changeToClassic: () => {this.setHandleByIteration('classicHandle')},
                //     changeToCustom: () => {this.setHandleByIteration('customHandle')},
                //     changeToCustomWhite: () => {this.setHandleByIteration('customHandle', 'plastic - black')}
                // }

                this.debugFridge.add(debugObjectFridge, 'changeToClassic').name('Poignées classique')
                this.debugFridge.add(debugObjectFridge, 'changeToCustom').name('Poignées customisées')
                this.debugFridge.add(debugObjectFridge, 'changeToCustomWhite').name('Poignées customisées noires')
            }
        })
    }

    setBase()
    {  
        // Floor
        this.floor = {}

        // Texture
        // this.textures.floor = {}
        // this.textures.floor.color = this.resources.items.floorColorTexture
        // this.textures.floor.color.colorSpace = THREE.SRGBColorSpace
        // this.textures.floor.height = this.resources.items.floorHeightTexture

        // Material (Le mettre a part)
        const material = new THREE.MeshStandardMaterial({
            color: '#ffffff'
        })
        this.allMaterials['default'] = material

        // Geometry
        const geometry = new THREE.PlaneGeometry(1, 1)

        // Add and options
        this.floor = new THREE.Mesh(geometry, this.allMaterials['default'])
        this.floor.rotation.x = - Math.PI * 0.5
        this.floor.receiveShadow = true
        this.scene.add(this.floor)

        // Walls
        for(const key in this.walls)
        {
            // Geometry
            const geometry = new THREE.PlaneGeometry(1, this.wallsHeight)

            // Add and options
            const wall = new THREE.Mesh(geometry, this.allMaterials['default'])
            wall.rotation.y = this.wallsRotation[key] * Math.PI
            wall.position.y = this.wallsHeight / 2
            wall.receiveShadow = true

            this.scene.add(wall)
            this.walls[key] = wall
        }

        // Update the floor and the walls
        this.updateScale('x', this.x)
        this.updateScale('y', this.y)
    }

    updateScale(axis, value)
    {
        // Floor
        switch (axis)
        {
            case 'x':
                this.x = value
                break
            case 'y':
                this.y = value
                break
        }
        this.floor.scale.set(this.x, this.y, 1)
        this.floor.name = 'floor'

        // for(const key in this.textures.floor)
        // {
        //     const value = this.textures.floor[key]

        //     value.repeat.set(this.x * this.uvSize, this.y * this.uvSize)
        //     value.wrapS = THREE.RepeatWrapping
        //     value.wrapT = THREE.RepeatWrapping
        //     value.offset.x = 0.5 - (this.x * this.uvSize / 2)
        //     value.offset.y = 0.5 - (this.y * this.uvSize / 2)
        //     value.needsUpdate = true
        // }

        // Walls
        this.wallsXY = [-this.x, -this.y, this.x, this.y]
        this.wallsYX = this.wallsXY.slice().reverse()

        for(const key in this.walls)
        {
            const value = this.walls[key]

            value.position[this.wallsAxis[key]] = this.wallsXY[key] / 2
            value.scale.x = Math.abs(this.wallsYX[key])
        }
    }

    setGrid(){
        // Grid
        // const grid = new THREE.GridHelper(8, 8)
        // this.scene.add(grid)

        const highlightGeometry = new THREE.PlaneGeometry(1, 1)
        const highlightMaterial = new THREE.MeshStandardMaterial({ color: '#CCCCCC' })
        const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        highlightMesh.rotation.x = - Math.PI * 0.5
        highlightMesh.position.set(0.5, 0.01, 0.5) // 0.01 to avoid z-fighting
        this.scene.add(highlightMesh)

        const mousePosition = new THREE.Vector2()
        const raycaster = new THREE.Raycaster()
        let intersects

        window.addEventListener('mousemove', (e) => {
            mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
            mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
            raycaster.setFromCamera(mousePosition, this.application.camera.instance)
            intersects = raycaster.intersectObjects(this.scene.children)
            for (const intersect of intersects){
                if(intersect.object.name === 'floor'){
                    const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
                    highlightMesh.position.set(highlightPos.x, 0.01, highlightPos.z) // 0.01 to avoid z-fighting
                }
            }
        })

        // Blocs
        const blocGeometry = new THREE.BoxGeometry(1, 1)
        const blocMesh = new THREE.Mesh(blocGeometry, this.allMaterials['default'])
        console.log(this.scene)

        const blocs = []

        window.addEventListener('mousedown', (e) => {
            const blocExist = blocs.find((object) => {
                return (object.position.x === highlightMesh.position.x)
                && (object.position.z === highlightMesh.position.z)
            })

            let scope = this // meh
            if (!blocExist){
                for (const intersect of intersects){
                    if(intersect.object.name === 'floor'){
                        const blocClone = blocMesh.clone()
                        blocClone.position.copy(highlightMesh.position)
                        blocClone.position.y = 0.5
                        scope.scene.add(blocClone)

                        blocs.push(blocClone)
                    }
                }
            }
            console.log(this.scene.children.length)
        })
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

        // RetrieveElements
        this.retrieveAllMaterials()
        // this.retrieveHandlesPosRot() // Method 2

        // Set to classic
        this.setHandleByVisibility('classic')
        // this.setHandleByIteration('classicHandle', 'chrome') // Method 2

        // Add
        this.scene.add(this.models.fridge.model)
    }

    retrieveAllMaterials()
    {
        this.models.fridge.model.traverse((child) =>
        {
            if(child.isMesh && child.material.isMeshStandardMaterial)
            {
                this.allMaterialsRetrieved.add(child.material)
            }
        })

        this.allMaterialsRetrieved.forEach(material => {
            this.allMaterials[material.name] = material
        })
    }

    //--------------------------------------------------------------------------------//

    /**
     * Method 1
     */

    setHandleByVisibility(asset, material)
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
                if(material){
                    child.material = this.allMaterials[material]
                }else{
                    child.material = this.defaultMaterial
                }
            }
        })
    }

    //--------------------------------------------------------------------------------//

    /**
     * Method 2
     */

    retrieveHandlesPosRot()
    {
        this.models.fridge.model.traverse((child) =>
        {
            if(child.userData['handlePosRot'])
            {
                this.handlesPosRot[child.name] = [child.position, child.rotation]         
            }
        })
    }

    setHandleByIteration(asset, material)
    {
        // Remove
        for (const oldHandle of this.activeHandles) {
            const parent = this.models.fridge.model.children.find(obj => obj.name === 'handlesPositions')
            parent.remove(oldHandle)
            oldHandle.geometry.dispose()
            oldHandle.material.dispose()
        }
        this.activeHandles = []

        this.models[asset] = {}
        this.models[asset].model = this.resources.items[asset+'Model'].scene

        for(const key in this.handlesPosRot)
        {
            const value = this.handlesPosRot[key]

            // Model
            const handle = this.models[asset].model.children[0].clone()
            this.activeHandles.push(handle)

            // Options
            // handle.castShadow = true

            // Material
            if(!this.defaultMaterial)
            {
                this.defaultMaterial = handle.material
            }

            if(material){
                handle.material = this.allMaterials[material]
            }else{
                handle.material = this.defaultMaterial
            }

            handle.position.set(value[0].x, value[0].y, value[0].z)
            handle.rotation.x += value[1].x
            this.models.fridge.model.children.find(obj => obj.name === 'handlesPositions').add(handle)
        }
    }

    update()
    {

    }
} 