import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import './App.css';

function App() {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [climateData, setClimateData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dataLayer, setDataLayer] = useState('temperature'); // Options: temperature, precipitation, etc.

  useEffect(() => {
    // Fetch climate data from our API
    const fetchClimateData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/climate-data`);
        setClimateData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching climate data:', error);
        setLoading(false);
      }
    };

    fetchClimateData();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 5;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;

    // Earth geometry
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);

    // Earth material with texture
    const textureLoader = new THREE.TextureLoader();

    // Load Earth texture (day map) from external URLs
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg'),
      bumpMap: textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png'),
      bumpScale: 0.05,
      specularMap: textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png'),
      specular: new THREE.Color('grey'),
      shininess: 5
    });

    // Create Earth mesh
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Add directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Climate data visualization layer
    let heatmapMesh;

    const updateHeatmap = () => {
      if (climateData && dataLayer) {
        // Remove existing heatmap if it exists
        if (heatmapMesh) {
          scene.remove(heatmapMesh);
        }

        // Create a new heatmap based on the selected data layer
        const heatmapGeometry = new THREE.SphereGeometry(2.01, 64, 64);
        const heatmapMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.6,
          vertexColors: true
        });

        // Apply colors based on climate data
        const colors = [];

        // This is a simplified example - in a real app, you'd map the actual data points
        // to the vertices of the sphere geometry
        for (let i = 0; i < heatmapGeometry.attributes.position.count; i++) {
          // Generate a color based on latitude (for demo purposes)
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(heatmapGeometry.attributes.position, i);
          vertex.normalize();

          // Map y coordinate (-1 to 1) to temperature (blue to red)
          const value = (vertex.y + 1) / 2; // 0 to 1

          if (dataLayer === 'temperature') {
            // Blue (cold) to red (hot)
            colors.push(1 - value, 0, value);
          } else if (dataLayer === 'precipitation') {
            // Yellow (dry) to blue (wet)
            colors.push(value, value, 1);
          }
        }

        heatmapGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
        scene.add(heatmapMesh);
      }
    };

    // Update heatmap when climate data or selected layer changes
    if (climateData) {
      updateHeatmap();
    }

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Slowly rotate the earth
      earth.rotation.y += 0.001;

      // Update controls
      controls.update();

      // Render the scene
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      scene.remove(earth);
      earthGeometry.dispose();
      earthMaterial.dispose();
      renderer.dispose();
    };
  }, [climateData, dataLayer]);

  const handleLayerChange = (e) => {
    setDataLayer(e.target.value);
  };

  return (
    <div className="App">
      {loading ? (
        <div className="loading">Loading climate data...</div>
      ) : (
        <>
          <div className="controls">
            <h3>Data Layer</h3>
            <select value={dataLayer} onChange={handleLayerChange}>
              <option value="temperature">Temperature</option>
              <option value="precipitation">Precipitation</option>
            </select>
          </div>

          {selectedLocation && (
            <div className="info-panel">
              <h3>{selectedLocation.name}</h3>
              <p>Temperature: {selectedLocation.temperature}°C</p>
              <p>Precipitation: {selectedLocation.precipitation} mm</p>
              <p>Climate: {selectedLocation.climate}</p>
              <button onClick={() => setSelectedLocation(null)}>Close</button>
            </div>
          )}

          <div ref={mountRef} className="globe-container" />
        </>
      )}
    </div>
  );
}

export default App;
