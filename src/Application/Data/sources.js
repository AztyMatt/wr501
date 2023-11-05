export default[
    {
        name: 'environmentMapTexture',
        type: 'cubeTexture',
        path:
        [
            '/textures/environmentMap/px.jpg',
            '/textures/environmentMap/nx.jpg',
            '/textures/environmentMap/py.jpg',
            '/textures/environmentMap/ny.jpg',
            '/textures/environmentMap/pz.jpg',
            '/textures/environmentMap/nz.jpg'
        ]
    },


    {
        name: 'floorColorTexture',
        type: 'texture',
        path: '/textures/floor/color.jpg'
    },
    {
        name: 'floorHeightTexture',
        type: 'texture',
        path: '/textures/floor/height.png'
    },
    {
        name: 'floorNormalTexture',
        type: 'texture',
        path: '/textures/floor/normal.jpg'
    },
    {
        name: 'floorRoughnessTexture',
        type: 'texture',
        path: '/textures/floor/roughness.jpg'
    },
    {
        name: 'floorAmbientOcclusionTexture',
        type: 'texture',
        path: '/textures/floor/ambientOcclusion.jpg'
    },


    {
        name: 'wallsColorTexture',
        type: 'texture',
        path: '/textures/walls/color.jpg'
    },
    {
        name: 'wallsHeightTexture',
        type: 'texture',
        path: '/textures/walls/height.png'
    },
    {
        name: 'wallsNormalTexture',
        type: 'texture',
        path: '/textures/walls/normal.jpg'
    },
    {
        name: 'wallsRoughnessTexture',
        type: 'texture',
        path: '/textures/walls/roughness.jpg'
    },
    {
        name: 'wallsAmbientOcclusionTexture',
        type: 'texture',
        path: '/textures/walls/ambientOcclusion.jpg'
    },


    {
        name: 'fridgeModel',
        type: 'gltfModel',
        path: 'models/fridge/fridge.gltf'
    },


    {
        name: 'blocLateralDoorModel',
        type: 'gltfModel',
        path: 'models/blocs/blocLateralDoor.gltf'
    },


    // Method 2
    // {
    //     name: 'fridgeForHandleModel',
    //     type: 'gltfModel',
    //     path: 'models/fridge/fridgeForHandle.gltf'
    // },
    // {
    //     name: 'classicHandleModel',
    //     type: 'gltfModel',
    //     path: 'models/fridge/classicHandle.gltf'
    // },
    // {
    //     name: 'customHandleModel',
    //     type: 'gltfModel',
    //     path: 'models/fridge/customHandle.gltf'
    // }
]