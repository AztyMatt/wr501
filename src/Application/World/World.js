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
        this.camera = this.application.camera

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
        this.uvSize = 0.5

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

        // Matrix
        this.matrix = []
        this.isOccupied = false

        // Blocs
        this.blocs = []
        this.blocWidth = 1
        this.blocDepth = 1
        this.blocHeight = 1
        this.blocRotation = 0

        this.resources.on('readyEvent', () =>
        {
            this.setMaterials()
            this.setBase()
            this.loadBlocs() // !!! Needs to be renamed ?
            this.setMatrix()
            this.setGrid()
            this.setBlocs(0.4, 0.8, 0.5)
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
                const debugObjectBlocs = {}

  
                this.debugBlocs.height = this.debugBlocs.addFolder('height')
                debugObjectBlocs.heights = [40, 60, 80, 100, 120, 140, 160, 180, 200]  // !!! function ?
                for (const height of debugObjectBlocs.heights) {
                    debugObjectBlocs[`blocLateralDoor40x${height}`] = () => {
                        this.setBlocs(0.4, height / 100, 0.4)
                    }
                    this.debugBlocs.height.add(debugObjectBlocs, `blocLateralDoor40x${height}`).name(`Bloc 40x${height}`)
                }

                this.debugBlocs.matteLacquerColors = this.debugBlocs.addFolder('matte lacquer colors')
                debugObjectBlocs.matteLacquerColors = {
                    'Terracota': 0xD1654E,
                    'Ivoire': 0xF0EDE1,
                    'Biege Poudré': 0xE3D3B5,
                    'Argile': 0xECECE7,
                    'Bleu Gris': 0x6792AC,
                    'Grège': 0xB4B0A1,
                    'Sable': 0xCDAA6D,
                    'Bleu Marine': 0x263855,
                    'Vert Forêt': 0x00414B,
                    'Océan': 0x2E88B6,
                    'Sauge': 0x879A77,
                    'Abricot': 0xE69D51,
                    'Charbon': 0x2B2B2C,
                    'Expresso': 0x4B2B20,
                    'Acajou': 0x7D4031,
                    'Gris': 0x858583
                }
                for(const key in debugObjectBlocs.matteLacquerColors)
                {
                    const value = debugObjectBlocs.matteLacquerColors[key]
                    debugObjectBlocs[`${key}`] = () => {
                        this.allMaterials['matteLacquer'].color.set(value)
                    }

                    this.debugBlocs.matteLacquerColors.add(debugObjectBlocs, `${key}`).name(`${key}`)
                }




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

    /**
     * First step
     */

    // Materials
    setMaterials() // !!! Make function for the imported and the procedural ? / To put in Resources.js ?
    {
        // Imported
        this.textures.floor = {}
        this.textures.floor.color = this.resources.items.floorColorTexture
        this.textures.floor.height = this.resources.items.floorHeightTexture
        this.textures.floor.normal = this.resources.items.floorNormalTexture
        this.textures.floor.roughness = this.resources.items.floorRoughnessTexture
        this.textures.floor.ambientOcclusion = this.resources.items.floorAmbientOcclusionTexture

        this.textures.floor.color.colorSpace = THREE.SRGBColorSpace

        for(const key in this.textures.floor)
        {
            const value = this.textures.floor[key]

            value.repeat.set(this.x * this.uvSize, this.z * this.uvSize)
            value.wrapS = THREE.RepeatWrapping
            value.wrapT = THREE.RepeatWrapping
            value.offset.x = 0.5 - (this.x * this.uvSize / 2)
            value.offset.z = 0.5 - (this.z * this.uvSize / 2)
            value.needsUpdate = true
        }

        const floorMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.floor.color,
            // displacementMap: this.textures.floor.height,
            normalMap: this.textures.floor.normal,
            roughnessMap:  this.textures.floor.roughness,
            aoMap: this.textures.floor.ambientOcclusion,
        })
        this.allMaterials['floor'] = floorMaterial

        // Procedural
        const defaultMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF
        })
        this.allMaterials['default'] = defaultMaterial

        const highlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xBBBBBB,
            opacity: 0.75,
            transparent: true
        })
        this.allMaterials['highlight'] = highlightMaterial

        const matteLacquerMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
        })
        this.allMaterials['matteLacquer'] = matteLacquerMaterial
    }

    setBase()
    {  
        // Floor
        this.floor = {}

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
        this.floor.material = this.allMaterials['floor']

        // this.setMatrix()
        // this.setGrid()
        // this.setBlocs(0.4, 0.8, 0.5)
    }

    /**
     * Second step
     */

    // Matrix
    setMatrix()
    {
        const numberOfColumns = Number((this.x / this.cellSize).toFixed(2))
        const numberOfRows = Number((this.x / this.cellSize).toFixed(2))

        for (let columns = 0; columns < numberOfColumns; columns++) {
            const row = new Array(numberOfRows).fill(false)
            this.matrix.push(row)
        }
    }

    // Blocs
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

                if(child.name === 'door'){
                    child.material = this.allMaterials['matteLacquer']
                }
            }
        })
    }

    setBlocs(width = 1, height = 1, depth = 1) // ! -> Add type after
    {
        this.blocWidth = width
        this.blocHeight = height
        this.blocDepth = depth

        // Update the scale of the bloc
        this.models.blocLateralDoor.model.scale.set(this.blocWidth, this.blocHeight, this.blocDepth)

        // Update the scale of the highlight
        this.highlightMesh.scale.set(this.blocWidth + this.zFightingAvoider, this.blocHeight + this.zFightingAvoider, this.blocDepth + this.zFightingAvoider)
        this.highlightMesh.position.y = this.blocHeight / 2
    }

    placeBloc()
    {
        if (!this.isOccupied && !this.camera.orbitControlMove){
            for (const intersect of this.intersects){
                if(intersect.object.name === 'floor'){
                    const blocClone = this.models.blocLateralDoor.model.clone()
                    blocClone.position.set(this.highlightMesh.position.x, 0, this.highlightMesh.position.z)
                    blocClone.rotation.y = this.highlightMesh.rotation.y
                    // blocClone.position.y = this.blocHeight / 2
                    this.scene.add(blocClone)
                    this.blocs.push(blocClone)

                    // !!! temp
                    // blocClone.traverse((child) =>
                    // {
                    //     if(child.name === 'Empty'){
                    //         const geometry = new THREE.BoxGeometry(0.025, 0.1, 0.025); 
                    //         const material = new THREE.MeshBasicMaterial( {color: 0xFFFFFF} ); 
                    //         const cube = new THREE.Mesh( geometry, material ); 
                    //         this.scene.add( cube );

                    //         cube.position.set(blocClone.position.x + (child.position.x * this.blocWidth), blocClone.position.y + (child.position.y * this.blocHeight), blocClone.position.z + (child.position.z * this.blocDepth))
                    //     }
                    // })

                    // Assign the width and depth of the bloc to the matrix
                    this.updateBlocPosOnMatrix()
                    for (let columns = this.matrixBlocPosXStart; columns < this.matrixBlocPosXEnd; columns++) {
                        for (let rows = this.matrixBlocPosZStart; rows < this.matrixBlocPosZEnd; rows++) {
                            this.matrix[columns][rows] = true
                        }
                    }
                }
            }
        }
    }

    // Updates
    updateMatrixSpace()
    {
        this.matrixHalfWidth = (this.x / (2 * this.cellSize))
        this.matrixHalfDepth = (this.z / (2 * this.cellSize))

        this.matrixPosX = Number(((this.highlightMesh.position.x / this.cellSize) + this.matrixHalfWidth).toFixed(2)) // 36 a -36, 40
        this.matrixPosZ = Number(((this.highlightMesh.position.z / this.cellSize) + this.matrixHalfDepth).toFixed(2))

        this.matrixBlocWidth = ((this.blocWidth / this.cellSize) / 2) // 4
        this.matrixBlocDepth = ((this.blocDepth / this.cellSize) / 2)
    }

    updateBlocPosOnMatrix()
    {
        this.updateMatrixSpace()

        if (this.blocRotation % 2 === 0)
        {
            this.matrixBlocPosXStart = this.matrixPosX - this.matrixBlocWidth // 0 a 72
            this.matrixBlocPosXEnd = this.matrixPosX + this.matrixBlocWidth // 8 a 80

            this.matrixBlocPosZStart = this.matrixPosZ - this.matrixBlocDepth
            this.matrixBlocPosZEnd = this.matrixPosZ + this.matrixBlocDepth
        } else {
            this.matrixBlocPosXStart = this.matrixPosX - this.matrixBlocDepth
            this.matrixBlocPosXEnd = this.matrixPosX + this.matrixBlocDepth

            this.matrixBlocPosZStart = this.matrixPosZ - this.matrixBlocWidth
            this.matrixBlocPosZEnd = this.matrixPosZ + this.matrixBlocWidth
        }
    }

    updateHighlightRestriction()
    {
        this.updateMatrixSpace()
        
        if (this.blocRotation % 2 === 0)
        {
            this.highlightPosXMax = this.matrixHalfWidth - this.matrixBlocWidth
            this.highlightPosZMax = this.matrixHalfDepth - this.matrixBlocDepth
        } else {
            this.highlightPosXMax = this.matrixHalfWidth - this.matrixBlocDepth
            this.highlightPosZMax = this.matrixHalfDepth - this.matrixBlocWidth
        }
    }

    // Highlight
    moveHighlight(e)
    {
        // Mouse
        this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1

        // Raycaster
        this.raycaster.setFromCamera(this.mousePosition, this.application.camera.instance)
        this.intersects = this.raycaster.intersectObjects(this.scene.children)

        for (const intersect of this.intersects) {
            if (intersect.object.name === 'floor') { // !!! Avoid placing bloc when aiming the wall -> problem
                this.updateHighlightRestriction()

                const highlightPosX = Math.floor(intersect.point.x / this.cellSize + (0.5 / 2)) // -40 a 40
                const highlightPosZ = Math.floor(intersect.point.z / this.cellSize + (0.5 / 2))
                 // + (0.5 / 2) to place the cursor exactly on the middle of the highlight

                const cellX = highlightPosX * this.cellSize
                const cellZ = highlightPosZ * this.cellSize
            
                if (((highlightPosX <= this.highlightPosXMax && highlightPosX >= -this.highlightPosXMax) && (highlightPosZ <= this.highlightPosZMax && highlightPosZ >= -this.highlightPosZMax))) {
                    this.highlightMesh.position.set(cellX, this.blocHeight / 2, cellZ)

                    this.isOccupied = this.isHighlightOnOccupiedMatrixPos()
                    if (this.isOccupied){
                        this.allMaterials['highlight'].color.setHex(0xFF5555)
                    } else {
                        this.allMaterials['highlight'].color.setHex(0xBBBBBB)
                    }
                }
            }
        }
    }

    isHighlightOnOccupiedMatrixPos()
    {
        this.updateBlocPosOnMatrix()

        let isOccupied = false
        for (let columns = this.matrixBlocPosXStart; columns < this.matrixBlocPosXEnd; columns++) {
            for (let rows = this.matrixBlocPosZStart; rows < this.matrixBlocPosZEnd; rows++) {
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

    // Grid
    setGrid()
    {
        // Help grid
        // const grid = new THREE.GridHelper(this.x, this.x / this.cellSize)
        // this.scene.add(grid)

        // Highlight
        const highlightGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 2)

        // Know the orientation of the bloc
        const position = highlightGeometry.getAttribute("position")
        if (position !== undefined) {
            const array = position.array;

            array[3] += 0.125
            array[12] += 0.125

            highlightGeometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
        }

        this.highlightMesh = new THREE.Mesh(highlightGeometry, this.allMaterials['highlight'])

        // this.highlightMesh.rotation.x = -Math.PI * 0.5
        this.highlightMesh.position.set(0, this.blocHeight / 2, 0) // To avoid clipping at launch
        this.scene.add(this.highlightMesh)

        // Mouse
        this.mousePosition = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster()

        window.addEventListener('mouseup', (e) => { this.placeBloc(e) })
        window.addEventListener('mousemove', (e) => { this.moveHighlight(e) })
        window.addEventListener('keydown', (e) =>
        {
            if (e.key === 'r' || e.key === 'R') {
                this.blocRotation = (this.blocRotation + 1) % 4
                this.highlightMesh.rotation.y = this.blocRotation * (Math.PI / 2)
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
        // console.log(this.camera.orbitControlMove)
    }
} 
