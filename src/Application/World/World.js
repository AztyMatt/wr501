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
        this.x = 4
        this.z = 3

        // UVs
        this.uvSize = 0.25

        // Walls
        this.walls = {
            0: {},
            1: {},
            2: {},
            3: {},
        }
        this.wallsHeight = 2
        this.wallsRotation = [0.5, 2, -0.5, 1]
        this.wallsAxis = ['x', 'z', 'x', 'z']

        // Grid and highlight
        this.zFightingAvoider = 0.001 // 0.001 to avoid z-fighting
        this.cellSize = 0.05
        this.highlightMesh = {}
        this.intersects = {}

        this.matrix = []
        this.blocRotation = 0 // !!!

        // Blocs
        this.blocs = []
        this.blocWidth = 1
        this.blocDepth = 1
        this.blocHeight = 1

        this.isOccupied = false
        this.clicRotation = 0

        this.resources.on('readyEvent', () =>
        {
            this.setBase()
            this.loadBlocs()
            // this.setFridge()
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
                    scaleZ: this.z,
                    applyScale: () => {this.applyScale()}
                }

                this.debugFloor.add(debugObjectFloor, 'scaleX', 0.5, 10, 0.1).name('Scale X').onChange((value) => {
                    this.updateScale('x', value)
                })
                this.debugFloor.add(debugObjectFloor, 'scaleZ', 0.5, 10, 0.1).name('Scale Z').onChange((value) => {
                    this.updateScale('z', value)
                })
                this.debugFloor.add(debugObjectFloor, 'applyScale').name('Appliquer la taille')



                // Blocs
                this.debugBlocs = this.debug.ui.addFolder('blocs')

                const debugObjectBlocs = {
                    blocLateralDoor40x40: () => {this.setBlocs(0.4, 0.4, 0.4)},
                    blocLateralDoor40x60: () => {this.setBlocs(0.4, 0.6, 0.4)},
                    blocLateralDoor40x80: () => {this.setBlocs(0.4, 0.8, 0.4)},
                    blocLateralDoor40x100: () => {this.setBlocs(0.4, 1.0, 0.4)},
                    blocLateralDoor40x120: () => {this.setBlocs(0.4, 1.2, 0.4)},
                    blocLateralDoor40x140: () => {this.setBlocs(0.4, 1.4, 0.4)},
                    blocLateralDoor40x160: () => {this.setBlocs(0.4, 1.6, 0.4)},
                    blocLateralDoor40x180: () => {this.setBlocs(0.4, 1.8, 0.4)},
                    blocLateralDoor40x200: () => {this.setBlocs(0.4, 2.0, 0.4)},
                }
                
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x40').name('Bloc 40x40')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x60').name('Bloc 40x60')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x80').name('Bloc 40x80')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x100').name('Bloc 40x100')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x120').name('Bloc 40x120')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x140').name('Bloc 40x140')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x160').name('Bloc 40x160')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x180').name('Bloc 40x180')
                this.debugBlocs.add(debugObjectBlocs, 'blocLateralDoor40x200').name('Bloc 40x200')
                // !!! -> Use a function with a parameter like start:40 and end:200
                



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

        // Material
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF
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
        this.updateScale('z', this.z)
    }

    updateScale(axis, value)
    {
        // Floor
        switch (axis)
        {
            case 'x':
                this.x = value
                break
            case 'z':
                this.z = value
                break
        }
        this.floor.scale.set(this.x, this.z, 1)
        this.floor.name = 'floor'

        // Walls
        this.wallsXZ = [-this.x, -this.z, this.x, this.z]
        this.wallsZX = this.wallsXZ.slice().reverse()

        for(const key in this.walls)
        {
            const value = this.walls[key]

            value.position[this.wallsAxis[key]] = this.wallsXZ[key] / 2
            value.scale.x = Math.abs(this.wallsZX[key])
        }
    }

    applyScale()
    {
        // Floor
        this.textures.floor = {}
        this.textures.floor.color = this.resources.items.floorColorTexture
        this.textures.floor.height = this.resources.items.floorHeightTexture
        this.textures.floor.normal = this.resources.items.floorNormalTexture
        this.textures.floor.roughness = this.resources.items.floorRoughnessTexture
        this.textures.floor.ambientOcclusion = this.resources.items.floorAmbientOcclusionTexture

        this.textures.floor.color.colorSpace = THREE.SRGBColorSpace

        // for(const key in this.textures.floor)
        // {
        //     const value = this.textures.floor[key]

        //     value.repeat.set(this.x * this.uvSize, this.z * this.uvSize)
        //     value.wrapS = THREE.RepeatWrapping
        //     value.wrapT = THREE.RepeatWrapping
        //     value.offset.x = 0.5 - (this.x * this.uvSize / 2)
        //     value.offset.z = 0.5 - (this.z * this.uvSize / 2)
        //     value.needsUpdate = true
        // }

        // const floorMaterial = new THREE.MeshStandardMaterial({
        //     map: this.textures.floor.color,
        //     // displacementMap: this.textures.floor.height,
        //     normalMap: this.textures.floor.normal,
        //     roughnessMap:  this.textures.floor.roughness,
        //     aoMap: this.textures.floor.ambientOcclusion,
        // })
        // this.floor.material = floorMaterial

        this.initializeKitchenMatrix()
        this.setGrid()
        this.setBlocs(0.4, 0.8, 0.5)
    }




    initializeKitchenMatrix() {
        const numberOfColumns = Number((this.x / this.cellSize).toFixed(2))
        const numberOfRows = Number((this.x / this.cellSize).toFixed(2))

        for (let columns = 0; columns < numberOfColumns; columns++) {
            const row = new Array(numberOfRows).fill(false)
            this.matrix.push(row)
        }
    }

    loadBlocs()
    {
        // Bloc with lateral door model
        this.models.blocLateralDoor = {}
        this.models.blocLateralDoor.model = this.resources.items.blocLateralDoorModel.scene

        // Options
        this.models.blocLateralDoor.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
            }
        })
    }

    setBlocs(width, height, depth) // ! -> Add type after
    {
        if(width && height && depth)
        {
            this.blocWidth = width
            this.blocHeight = height
            this.blocDepth = depth

            // Update the scale of the bloc
            this.models.blocLateralDoor.model.scale.set(this.blocWidth, this.blocHeight, this.blocDepth)

            // Update the scale of the highlight
            this.highlightMesh.scale.set(this.blocWidth + this.zFightingAvoider, this.blocHeight + this.zFightingAvoider, this.blocDepth + this.zFightingAvoider)
        }
    }

    calculMatrixSpace(){
        const matrixPosX = Number(((this.highlightMesh.position.x / this.cellSize) + (this.x / (2 * this.cellSize))).toFixed(2))
        const matrixBlocDepth = ((this.blocDepth / this.cellSize) / 2)

        const matrixPosZ = Number(((this.highlightMesh.position.z / this.cellSize) + (this.z / (2 * this.cellSize))).toFixed(2))
        const matrixBlocWidth = ((this.blocWidth / this.cellSize) / 2)

        if (this.clicRotation == 0 || this.clicRotation == 2)
        {
            this.matrixPosXStart = matrixPosX - matrixBlocWidth
            this.matrixPosXEnd = matrixPosX + matrixBlocWidth

            this.matrixPosZStart = matrixPosZ - matrixBlocDepth
            this.matrixPosZEnd = matrixPosZ + matrixBlocDepth
        } else {
            this.matrixPosXStart = matrixPosX - matrixBlocDepth
            this.matrixPosXEnd = matrixPosX + matrixBlocDepth

            this.matrixPosZStart = matrixPosZ - matrixBlocWidth
            this.matrixPosZEnd = matrixPosZ + matrixBlocWidth
        }
    }

    isHighlightOnBloc()
    {
        let isOccupied = false
        for (let columns = this.matrixPosXStart; columns < this.matrixPosXEnd; columns++) {
            for (let rows = this.matrixPosZStart; rows < this.matrixPosZEnd; rows++) {
                if (this.matrix[columns][rows]) {
                    isOccupied = true
                    break
                }
            }
            if (isOccupied) {
                break
            }
        }

        return isOccupied
    }

    setGrid()
    {
        // Help grid
        const grid = new THREE.GridHelper(this.x, this.x / this.cellSize)
        this.scene.add(grid)

        // Highlight
        const highlightGeometry = new THREE.BoxGeometry(1, 1, 1)
        const highlightMaterial = new THREE.MeshStandardMaterial({color: 0xBBBBBB, opacity: 0.75, transparent: true})
        this.highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        console.log(this.highlightMesh)

        // this.highlightMesh.rotation.x = -Math.PI * 0.5
        this.highlightMesh.position.set(0, this.blocHeight / 2, 0) // To avoid clipping at launch
        this.scene.add(this.highlightMesh)

        // Mouse
        const mousePosition = new THREE.Vector2()
        const raycaster = new THREE.Raycaster()

        // Avoid placing bloc when rotating around the kitchen (! -> To replace by a test if the orbits controls rotate or not)
        let mouseDownTime
        let mouseUpTime

        window.addEventListener('mousedown', (e) =>
        {
            mouseDownTime = new Date().getTime()
        })

        window.addEventListener('mouseup', (e) =>
        {
            // Get the duration of the click
            mouseUpTime = new Date().getTime()
            const clickDuration = mouseUpTime - mouseDownTime

            if (clickDuration < 100) {
                let scope = this // to keep the scope

                if (!this.isOccupied){
                    for (const intersect of this.intersects){
                        if(intersect.object.name === 'floor'){
                            const blocClone = this.models.blocLateralDoor.model.clone()
                            blocClone.position.set(this.highlightMesh.position.x, 0, this.highlightMesh.position.z)
                            blocClone.rotation.y = this.highlightMesh.rotation.y
                            // blocClone.position.y = this.blocHeight / 2
                            scope.scene.add(blocClone)
                            this.blocs.push(blocClone)

                            // Assign the width and depth of the bloc to the matrix
                            for (let columns = this.matrixPosXStart; columns < this.matrixPosXEnd; columns++) {
                                for (let rows = this.matrixPosZStart; rows < this.matrixPosZEnd; rows++) {
                                    this.matrix[columns][rows] = true
                                }
                            }
                        }
                    }
                }
            }
        })

        window.addEventListener('mousemove', (e) => 
        {
            // Mouse
            mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
            mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1

            // Raycaster
            raycaster.setFromCamera(mousePosition, this.application.camera.instance)
            this.intersects = raycaster.intersectObjects(this.scene.children)

            // Highlight restriction
            const highlightPosXMax = Number((((this.x / this.cellSize) / 2) - ((this.blocWidth / this.cellSize) / 2)).toFixed(2)) // Math.round 'cause JS is weird (!!!)
            const highlightPosZMax = Number((((this.z / this.cellSize) / 2) - ((this.blocDepth / this.cellSize) / 2)).toFixed(2))
            // Size of the kitchen divided by the size of one cell, divided by 2 'cause of the two sides, minus the number of cell for the highlight divided by 2 for his middle

            for (const intersect of this.intersects) {
                if (intersect.object.name === 'floor') {
                    const highlightPosX = Math.floor(intersect.point.x / this.cellSize + (0.5 / 2)) // + (0.5 / 2) to place the cursor exactly on the middle of the highlight
                    const highlightPosZ = Math.floor(intersect.point.z / this.cellSize + (0.5 / 2))

                    const cellX = highlightPosX * this.cellSize
                    const cellZ = highlightPosZ * this.cellSize
                
                    if (((highlightPosX <= highlightPosXMax && highlightPosX >= -highlightPosXMax) && (highlightPosZ <= highlightPosZMax && highlightPosZ >= -highlightPosZMax))) {
                        this.highlightMesh.position.set(cellX, this.blocHeight / 2, cellZ)
                        
                        this.calculMatrixSpace()
                        this.isOccupied = this.isHighlightOnBloc()
                        if (this.isOccupied){
                            highlightMaterial.color.setHex(0xFF5555)
                        } else {
                            highlightMaterial.color.setHex(0xBBBBBB)
                        }
                    }
                }
            }
        })

        window.addEventListener('keydown', (e) =>
        {
            if (e.key === 'r') {
                if(this.clicRotation < 3) {
                    this.clicRotation += 1
                    console.log(this.clicRotation)
                } else {
                    this.clicRotation = 0
                }
                this.calculMatrixSpace()
                this.highlightMesh.rotation.y = this.clicRotation * (Math.PI / 2)
            }
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