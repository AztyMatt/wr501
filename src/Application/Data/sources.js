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
        path: '/textures/dirt/color.jpg'
    },
    {
        name: 'floorNormalTexture',
        type: 'texture',
        path: '/textures/dirt/normal.jpg'
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