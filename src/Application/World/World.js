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

        // Setup
        this.textures = {}
        this.models = {
            blocs: {},
            handles: {}
        }
        this.animation = {}

        // Materials
        this.materialsRetrieved = new Set()
        this.materials = {}
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
        this.wallsHeight = 2.4
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

        // Bloc
        this.bloc = null
        this.blocScale = new THREE.Vector3(1, 1, 1)
        this.blocScaleRef = new THREE.Vector3()
        this.blocPreviousScale = new THREE.Vector3()
        this.blocRotation = 0

        this.blocs = [
            {
                name: 'lateralDoor'
            },
            {
                name: 'drawerX4'
            },
            {
                name: 'drawerX3'
            },
            {
                name: 'drawerX2'
            },
        ]
        this.blocsPlaced = []

        // Handle
        this.handles = [
            {
                name: 'mimosa',
                position: 'right',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            {
                name: 'cosmosSmall',
                position: 'top',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            {
                name: 'cosmosLarge',
                position: 'top',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            {
                name: 'anemone',
                position: 'right', // !!! Set handles on drawers to the middle instead of the right side
                materialsNames: ['silver', 'blackMat', 'brassBrushed']
            },
            // {
            //     name: 'dahliaSmall', // !!!
            //     position: 'edge top',
            //     materialsNames: ['silver', 'blackMat', 'brass']
            // },
            // {
            //     name: 'dahliaMedium', // !!!
            //     position: 'edge top',
            //     materialsNames: ['silver', 'blackMat', 'brass']
            // },
            {
                name: 'dahliaLarge',
                position: 'edge top',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            {
                name: 'freesia',
                position: 'top',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            {
                name: 'lila',
                position: 'top',
                materialsNames: ['silver', 'blackMat', 'brass']
            },
            // {
            //     name: 'irisSmall', // !!!
            //     position: 'edge top',
            //     materialsNames: ['silver', 'blackBrushed']
            // },
            {
                name: 'irisMedium',
                position: 'edge top',
                materialsNames: ['silver', 'blackBrushed']
            },
            {
                name: 'irisLarge',
                position: 'edge top',
                materialsNames: ['silver', 'blackBrushed']
            },
            {
                name: 'irisXL',
                position: 'edge right',
                materialsNames: ['silver', 'blackBrushed']
            },
        ]
        this.handle = {}

        this.resources.on('readyEvent', () =>
        {
            this.setMaterials()
            this.setBase()
            this.loadBlocs()
            this.loadHandles()
            this.setMatrix()
            this.setGrid()
            this.setCurrentBloc(this.blocs[0].name)
            this.setCurrentHandle(this.handles[0].name, this.handles[0].position, this.handles[0].materialsNames[0])
            this.setBloc(1, 1, 1)
            this.environment = new Environment()

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
                this.debugBlocs = this.debug.ui.addFolder('blocs') //  !!! create a const instead of a this.
                const debugObjectBlocs = {}

                this.debugBlocs.blocLateralDoor = this.debugBlocs.addFolder('lateralDoor')
                debugObjectBlocs.heights = [40, 60, 80, 100, 120, 140, 160, 180, 200]  // !!! function(name of the bloc, values used, (width or depth) -> if) ?
                for (const height of debugObjectBlocs.heights) {
                    debugObjectBlocs[`lateralDoor40x${height}`] = () => {
                        this.setCurrentBloc('lateralDoor')

                        const conversion = ((height / 100) / this.blocPreviousScale.y)
                        this.setBloc(1, conversion, 1)
                    }
                    this.debugBlocs.blocLateralDoor.add(debugObjectBlocs, `lateralDoor40x${height}`).name(`Bloc 40x${height}`)
                }

                this.debugBlocs.blocDrawerX4 = this.debugBlocs.addFolder('drawerX4') // !!! same function for X4, X3, X2 ?
                debugObjectBlocs.widths = [40, 60, 80]  // !!! function ?
                for (const width of debugObjectBlocs.widths) {
                    debugObjectBlocs[`drawerX4${width}x60`] = () => {
                        this.setCurrentBloc('drawerX4')

                        const conversion = ((width / 100) / this.blocPreviousScale.z)
                        this.setBloc(1, 1, conversion)
                    }
                    this.debugBlocs.blocDrawerX4.add(debugObjectBlocs, `drawerX4${width}x60`).name(`Bloc ${width}x60`)
                }

                this.debugBlocs.blocDrawerX3 = this.debugBlocs.addFolder('drawerX3')
                debugObjectBlocs.widths = [40, 60, 80]
                for (const width of debugObjectBlocs.widths) {
                    debugObjectBlocs[`drawerX3${width}x60`] = () => {
                        this.setCurrentBloc('drawerX3')

                        const conversion = ((width / 100) / this.blocPreviousScale.z)
                        this.setBloc(1, 1, conversion)
                    }
                    this.debugBlocs.blocDrawerX3.add(debugObjectBlocs, `drawerX3${width}x60`).name(`Bloc ${width}x60`)
                }

                this.debugBlocs.blocDrawerX2 = this.debugBlocs.addFolder('drawerX2')
                debugObjectBlocs.widths = [40, 60, 80]
                for (const width of debugObjectBlocs.widths) {
                    debugObjectBlocs[`drawerX2${width}x60`] = () => {
                        this.setCurrentBloc('drawerX2')

                        const conversion = ((width / 100) / this.blocPreviousScale.z)
                        this.setBloc(1, 1, conversion)
                    }
                    this.debugBlocs.blocDrawerX2.add(debugObjectBlocs, `drawerX2${width}x60`).name(`Bloc ${width}x60`)
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
                        this.materials.blocs['matteLacquer'].color.set(value)
                    }

                    this.debugBlocs.matteLacquerColors.add(debugObjectBlocs, `${key}`).name(`${key}`)
                }



                // Handles

                // Exception: 
                // Iris = blackBrushed / no brass
                // Anemone = brassBrushed

                this.debugHandles = this.debug.ui.addFolder('handles')
                const debugObjectHandles = {}

                for (const handle of this.handles) {
                    this.debugHandles[handle.name] = this.debugHandles.addFolder(handle.name)

                    for (const materialName of handle.materialsNames) {
                        debugObjectHandles[`changeTo${handle.name}-${materialName}`] = () => {
                            this.setCurrentHandle(handle.name, handle.position, materialName)
                            this.removeHandles()
                            this.placeHandles()
                        }
                        this.debugHandles[handle.name].add(debugObjectHandles, `changeTo${handle.name}-${materialName}`).name(`${handle.name} color ${materialName}`)
                    }
                }
            }
        })
    }

    /**
     * First step
     */

    // Materials
    setMaterials() // !!! Make function for the imported and the procedural ? / To put in Resources.js ?
    {
        /**
         * Imported
         */
        this.textures.floor = {
            color: this.resources.items.floorColorTexture,
            height: this.resources.items.floorHeightTexture,
            normal: this.resources.items.floorNormalTexture,
            roughness: this.resources.items.floorRoughnessTexture,
            ambientOcclusion: this.resources.items.floorAmbientOcclusionTexture
        }
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

        this.textures.walls = {
            color: this.resources.items.wallsColorTexture,
            height: this.resources.items.wallsHeightTexture,
            normal: this.resources.items.wallsNormalTexture,
            roughness: this.resources.items.wallsRoughnessTexture,
            ambientOcclusion: this.resources.items.wallsAmbientOcclusionTexture
        }
        this.textures.walls.color.colorSpace = THREE.SRGBColorSpace

        for(const key in this.textures.walls)
        {
            const value = this.textures.walls[key]

            value.repeat.set(this.x * this.uvSize, this.z * this.uvSize)
            value.wrapS = THREE.RepeatWrapping
            value.wrapT = THREE.RepeatWrapping
            value.offset.x = (this.x * this.uvSize / 2)
            value.offset.z = (this.z * this.uvSize / 2)
            value.needsUpdate = true
        }

        const wallsMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.walls.color,
            // displacementMap: this.textures.walls.height,
            normalMap: this.textures.walls.normal,
            roughnessMap:  this.textures.walls.roughness,
            aoMap: this.textures.walls.ambientOcclusion
        })
        this.materials.room = {
            'floor': floorMaterial,
            'walls': wallsMaterial
        }

        /**
         * Procedural
         */
        // Setup
        const defaultMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF
        })

        const highlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xBBBBBB,
            opacity: 0.75,
            transparent: true
        })
        this.materials.setup = {
            'default': defaultMaterial,
            'highlight': highlightMaterial
        }

        // Blocs
        this.textures.blocs = {
            color: this.resources.items.oakColorTexture
        }
        this.textures.blocs.color.colorSpace = THREE.SRGBColorSpace

        // !!! Temp
        const size = 25
        for(const key in this.textures.blocs)
        {
            const value = this.textures.blocs[key]

            const repeatX = (size / 2)
            const repeatY = (size / 2) / 3

            const offsetX = - 0.75
            const offsetY = -0.05

            value.repeat.set(repeatX, repeatY)
            value.wrapS = THREE.RepeatWrapping
            value.wrapT = THREE.RepeatWrapping
            value.offset.x = offsetX
            value.offset.y = offsetY
            value.needsUpdate = true
        }

        const matteLacquerMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.blocs.color, // To remove
            color: 0x555555,
        })

        const paintedOakMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.blocs.color,
            color: 0x555555,
        })

        this.materials.blocs = {
            'matteLacquer': matteLacquerMaterial,
            'paintedOak': paintedOakMaterial
        }

        // Handles
        const silverMaterial = new THREE.MeshStandardMaterial({
            name: 'silver',
            color: 0xC0C0C0,
            metalness: 1,
            roughness: 0.2
        })
        
        const blackMatMaterial = new THREE.MeshStandardMaterial({
            name: 'blackMat',
            color: 0x000000,
            roughness: 0.8
        })

        const blackBrushedMaterial = new THREE.MeshStandardMaterial({
            name: 'blackBrushed',
            color: 0x000000,
            roughness: 0.5,
            metalness: 0.8
        })

        const brassMaterial = new THREE.MeshStandardMaterial({
            name: 'brass',
            color: 0xC7A357,
            metalness: 1,
            roughness: 0.2
        })

        const brassBrushedMaterial = new THREE.MeshStandardMaterial({
            name: 'brassBrushed',
            color: 0xC7A357,
            metalness: 1,
            roughness: 0.4
        })

        this.materials.handles = {
            'silver': silverMaterial,
            'blackMat': blackMatMaterial,
            'blackBrushed': blackBrushedMaterial,
            'brass': brassMaterial,
            'brassBrushed': brassBrushedMaterial
        }
    }

    setBase()
    {  
        // Floor
        this.floor = {}

        // Geometry
        const geometry = new THREE.PlaneGeometry(1, 1)

        // Add and options
        this.floor = new THREE.Mesh(geometry, this.materials.setup['default'])
        this.floor.rotation.x = - Math.PI * 0.5
        this.floor.receiveShadow = true
        this.scene.add(this.floor)

        // Walls
        for(const key in this.walls)
        {
            // Geometry
            const geometry = new THREE.PlaneGeometry(1, this.wallsHeight)

            // Add and options
            const wall = new THREE.Mesh(geometry, this.materials.setup['default'])
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
        this.floor.material = this.materials.room['floor']

        // Walls
        for(const key in this.walls)
        {
            const value = this.walls[key]

            value.material = this.materials.room['walls']
        }

        // this.setMatrix()
        // this.setGrid()
        // this.setBloc(0.4, 0.8, 0.5)
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
        const loadBloc = (bloc, needShadow) =>
        {
            // Object
            this.models.blocs[bloc] = {
                model: this.resources.items[`${bloc}Model`].scene,
            }

            const blocModel = this.models.blocs[bloc].model
            blocModel.userData.initialScale = blocModel.children[0].scale.clone()
        
            // Options
            blocModel.traverse((child) =>
            {
                if(child.isMesh) // child instanceof THREE.Mesh
                {
                    child.castShadow = needShadow
                    child.receiveShadow = needShadow

                    const handleMaterial = this.materials.blocs['matteLacquer']
                    const bodyMaterial = this.materials.setup['default']

                    child.userData.customisable ? child.material = handleMaterial : child.material = bodyMaterial
                }
            })
        }

        for (const bloc of this.blocs) {
            loadBloc(bloc.name, true)
        }
    }

    setCurrentBloc(type)
    {
        this.bloc = this.models.blocs[type].model
        this.blocScaleRef = this.bloc.children[0].scale
        this.blocPreviousScale = this.blocScaleRef.clone()
        this.blocInitialScale = this.models.blocs[type].model.userData.initialScale
    }

    setBloc(width = 1, height = 1, depth = 1)
    {
        // Set sizes of the bloc
        this.blocScale.x = Number((this.blocPreviousScale.x * width).toFixed(2))
        this.blocScale.y =  Number((this.blocPreviousScale.y * height).toFixed(2))
        this.blocScale.z = Number((this.blocPreviousScale.z * depth).toFixed(2))

        // Update the scale of the bloc
        this.blocScaleRef.set(this.blocScale.x, this.blocScale.y, this.blocScale.z)

        // Update the scale of the highlight
        this.highlightMesh.scale.set(this.blocScale.x + this.zFightingAvoider, this.blocScale.y + this.zFightingAvoider, this.blocScale.z + this.zFightingAvoider)
        this.highlightMesh.position.y = this.blocScale.y / 2
    }

    placeBloc()
    {
        this.isOccupied = this.isHighlightOnOccupiedMatrixPos()

        if (!this.isOccupied){
            for (const intersect of this.intersects){
                if(intersect.object.name === 'floor'){
                    const blocClone = this.bloc.clone()
                    blocClone.position.set(this.highlightMesh.position.x, 0, this.highlightMesh.position.z)
                    blocClone.rotation.y = this.highlightMesh.rotation.y
                    // blocClone.position.y = this.blocScale.y / 2
                    this.scene.add(blocClone)
                    this.blocsPlaced.push(blocClone)

                    // Add a default handle
                    this.placeHandle(blocClone)

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

    // Handles
    setCurrentHandle(type, position, material)
    {
        this.handle = {
            model: this.models.handles[type].model,
            position: position,
            material: this.materials.handles[material]
        }
    }

    loadHandles()
    {
        const loadHandle = (handle, needShadow) =>
        {
            // Object
            this.models.handles[handle] = {
                model: this.resources.items[`${handle}Model`].scene
            }
        
            // Options
            this.models.handles[handle].model.traverse((child) =>
            {
                if(child.isMesh) // child instanceof THREE.Mesh
                {
                    child.castShadow = needShadow
                }
            })
        }

        for (const handle of this.handles) {
            loadHandle(handle.name, true)
        }
    }

    placeHandle(bloc)
    {
        bloc.traverse((child) =>
        {
            if(child.userData.handle) // handle here refer to the empty to position the handle
            {
                const handleClone = this.handle.model.clone()
                handleClone.children[0].material = this.handle.material

                // Avoid handle being stretched
                handleClone.scale.y = ((this.handle.model.scale.y / bloc.children[0].scale.y) / (this.handle.model.scale.y / bloc.userData.initialScale.y))
                handleClone.scale.z = ((this.handle.model.scale.z / bloc.children[0].scale.z) / (this.handle.model.scale.z / bloc.userData.initialScale.z))

                const positionMap = {
                    'edge top': { axis: 'y', operator: 1, offset: 0 },
                    'top': { axis: 'y', operator: 1, offset: - 0.025 },
                    'edge right': { axis: 'z', operator: -1, offset: 0 },
                    'right': { axis: 'z', operator: -1, offset: 0.02 }
                }
                child.add(handleClone)

                const positionInfo = positionMap[this.handle.position]
                const calcul = (
                    (
                        [positionInfo.operator] // To decide the side

                        *

                        ((bloc.userData.initialScale[positionInfo.axis] * child.parent.scale[positionInfo.axis]) / 2) // To get the middle of the drawer
                    )

                    + [positionInfo.offset] / bloc.children[0].scale[positionInfo.axis] // to set the offset
                )

                handleClone.position[positionInfo.axis] = calcul
            }
        })
    }

    placeHandles()
    {
        for (const bloc of this.blocsPlaced)
        {
            this.placeHandle(bloc)
        }
    }

    removeHandles()
    {
        for (const bloc of this.blocsPlaced)
        {
            bloc.traverse((child) =>
            {
                if(child.userData.handle) // handle here refer to the empty to position the handle
                {
                    const handle = child.children[0]
                    child.remove(handle)
        
                    // Dispose of the geometry and materials of the handle to free up memory, although their strangely still be visible in a console.log
                    handle.traverse((child) => 
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
                }
            })
        }
    }

    // Updates
    updateMatrixSpace()
    {
        this.matrixHalfWidth = (this.x / (2 * this.cellSize))
        this.matrixHalfDepth = (this.z / (2 * this.cellSize))

        this.matrixPosX = Number(((this.highlightMesh.position.x / this.cellSize) + this.matrixHalfWidth).toFixed(2)) // 36 a -36, 40
        this.matrixPosZ = Number(((this.highlightMesh.position.z / this.cellSize) + this.matrixHalfDepth).toFixed(2))

        this.matrixBlocWidth = ((this.blocScale.x / this.cellSize) / 2) // 4
        this.matrixBlocDepth = ((this.blocScale.z / this.cellSize) / 2)
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
                    this.highlightMesh.position.set(cellX, this.blocScale.y / 2, cellZ)

                    this.isOccupied = this.isHighlightOnOccupiedMatrixPos()
                    if (this.isOccupied){
                        this.materials.setup['highlight'].color.setHex(0xFF5555)
                    } else {
                        this.materials.setup['highlight'].color.setHex(0xBBBBBB)
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

        this.highlightMesh = new THREE.Mesh(highlightGeometry, this.materials.setup['highlight'])

        // this.highlightMesh.rotation.x = -Math.PI * 0.5
        this.highlightMesh.position.set(0, this.blocScale.y / 2, 0) // To avoid clipping at launch
        this.scene.add(this.highlightMesh)

        // Mouse
        this.mousePosition = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster()

        window.addEventListener('mouseup', (e) => (e.button === 0) && this.placeBloc(e))
        window.addEventListener('mousemove', (e) => { this.moveHighlight(e) })
        window.addEventListener('keydown', (e) =>
        {
            if (e.key === 'r' || e.key === 'R') {
                this.blocRotation = (this.blocRotation + 1) % 4
                this.highlightMesh.rotation.y = this.blocRotation * (Math.PI / 2)
            }

            // !!! to finish
            // const isZPressed = (e.key === 'z' || e.key === 'Z')
            // const isCtrlPressed = (e.ctrlKey || e.metaKey)
            // if (isZPressed && isCtrlPressed) {
            //     const keys = Object.keys(this.blocsPlaced)
            //     const lastKey = keys[keys.length - 1];
            //     this.scene.remove(this.blocsPlaced[lastKey])
            //     delete this.blocsPlaced[lastKey]

            //     this.updateBlocPosOnMatrix()
            //         for (let columns = this.matrixBlocPosXStart; columns < this.matrixBlocPosXEnd; columns++) {
            //             for (let rows = this.matrixBlocPosZStart; rows < this.matrixBlocPosZEnd; rows++) {
            //                 this.matrix[columns][rows] = false
            //             }
            //         }
            //     console.log(this.matrix)
            //     console.log(this.blocsPlaced)
            // }
        })
    }

    update()
    {

    }
} 