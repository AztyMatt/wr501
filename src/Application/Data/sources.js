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
        name: 'fridgeModel',
        type: 'gltfModel',
        path: 'models/fridge/fridge.gltf'
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