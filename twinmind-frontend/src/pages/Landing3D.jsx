import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Float, MeshDistortMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'

// AI Neural Network Node
function NeuralNode({ position, color, delay = 0 }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 + delay
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 + delay
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1 + 1
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.2 : 1))
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <icosahedronGeometry args={[0.4, 1]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            emissive={color}
            emissiveIntensity={hovered ? 1 : 0.5}
          />
        </mesh>
        
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  )
}

// AI Brain Structure
function AIBrain() {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  const nodes = [
    { pos: [-4, 2, 0], color: '#00d4aa' },
    { pos: [-4, 0, 0], color: '#00d4aa' },
    { pos: [-4, -2, 0], color: '#00d4aa' },
    { pos: [-1, 3, 0], color: '#0088ff' },
    { pos: [-1, 1, 0], color: '#0088ff' },
    { pos: [-1, -1, 0], color: '#0088ff' },
    { pos: [-1, -3, 0], color: '#0088ff' },
    { pos: [2, 2, 0], color: '#cc44ff' },
    { pos: [2, 0, 0], color: '#cc44ff' },
    { pos: [2, -2, 0], color: '#cc44ff' },
    { pos: [5, 1, 0], color: '#ff3030' },
    { pos: [5, -1, 0], color: '#ffb800' },
  ]

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <NeuralNode key={i} position={node.pos} color={node.color} delay={i * 0.2} />
      ))}
    </group>
  )
}

// Data Particles
function DataParticles({ count = 50 }) {
  const points = useRef()
  
  const particlesPosition = React.useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [count])

  useFrame((state) => {
    if (points.current) {
      const positions = points.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01
        if (positions[i * 3] > 7.5) positions[i * 3] = -7.5
      }
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#00d4aa" transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

// AI Cube
function AICube() {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -2, -3]}>
      <boxGeometry args={[2, 2, 2]} />
      <MeshDistortMaterial
        color="#0088ff"
        metalness={0.8}
        roughness={0.2}
        distort={0.4}
        speed={2}
        emissive="#0088ff"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// Scene
function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#00d4aa" />
      <pointLight position={[10, 10, 5]} intensity={0.8} color="#0088ff" />
      <Environment preset="night" />
      <AIBrain />
      <DataParticles count={80} />
      <AICube />
      <fog attach="fog" args={['#0a0e14', 8, 25]} />
    </>
  )
}

export default function Landing3D() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    setTimeout(() => setLoaded(true), 500)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', overflow: 'hidden', position: 'relative', fontFamily: '"Space Grotesk", sans-serif' }}>
      <Canvas shadows gl={{ antialias: true, alpha: false }} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', zIndex: 10 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : -50 }} transition={{ duration: 1, delay: 0.5 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '100px', fontWeight: 900, fontFamily: '"Orbitron", sans-serif', background: 'linear-gradient(135deg, #00ffcc 0%, #00d4ff 50%, #ff00ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.15em', marginBottom: '20px', textTransform: 'uppercase', filter: 'drop-shadow(0 0 30px rgba(0, 255, 204, 0.8))', lineHeight: 1 }}>
            TWINMIND
          </h1>
          <p style={{ fontSize: '24px', color: '#ffffff', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
            AI · DIGITAL TWIN · PREDICTIVE INTELLIGENCE
          </p>
        </motion.div>

        {/* Center Content */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.8 }} transition={{ duration: 1, delay: 1 }} style={{ textAlign: 'center', maxWidth: '1000px', width: '100%', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(30px)', border: '4px solid rgba(0, 255, 204, 0.6)', borderRadius: '24px', padding: '40px', boxShadow: '0 0 100px rgba(0, 255, 204, 0.4)' }}>
            <h2 style={{ fontSize: '40px', color: '#ffffff', fontWeight: 900, marginBottom: '20px', letterSpacing: '0.08em', fontFamily: '"Orbitron", sans-serif', textTransform: 'uppercase', textShadow: '0 0 30px rgba(255, 255, 255, 0.8)', lineHeight: 1.2 }}>
              Neural Factory Intelligence
            </h2>
            <p style={{ fontSize: '20px', color: '#e0e0e0', lineHeight: '1.6', marginBottom: '30px', fontWeight: 600, textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
              Real-time ML monitors 14 sensors × 3 machines. XGBoost predicts failures 30-100 cycles ahead. 
              Gemini AI explains anomalies. Blockchain logs every critical event.
            </p>
            
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { value: '91.23%', label: 'ML Accuracy', color: '#00ffcc' },
                { value: '<50ms', label: 'Inference', color: '#00d4ff' },
                { value: '30-100', label: 'Cycle Warning', color: '#ff00ff' }
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }} transition={{ duration: 0.5, delay: 1.5 + i * 0.1 }} style={{ background: `linear-gradient(135deg, ${stat.color}30, ${stat.color}15)`, border: `3px solid ${stat.color}`, borderRadius: '16px', padding: '25px 20px', boxShadow: `0 0 40px ${stat.color}80` }}>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: stat.color, marginBottom: '10px', fontFamily: '"Orbitron", sans-serif', textShadow: `0 0 30px ${stat.color}`, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 50 }} transition={{ duration: 1, delay: 2 }} style={{ textAlign: 'center', pointerEvents: 'auto' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(135deg, #00ffcc, #00d4ff)', border: '4px solid #00ffcc', borderRadius: '60px', padding: '24px 70px', fontSize: '24px', fontWeight: 900, color: '#000000', cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase', boxShadow: '0 0 80px rgba(0, 255, 204, 0.8), 0 20px 50px rgba(0, 0, 0, 0.6)', transition: 'all 0.3s ease', fontFamily: '"Orbitron", sans-serif' }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08) translateY(-6px)'; e.target.style.boxShadow = '0 0 120px rgba(0, 255, 204, 1), 0 25px 60px rgba(0, 0, 0, 0.7)' }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 0 80px rgba(0, 255, 204, 0.8), 0 20px 50px rgba(0, 0, 0, 0.6)' }}>
            ENTER DASHBOARD →
          </button>
          <p style={{ marginTop: '20px', fontSize: '16px', color: '#ffffff', letterSpacing: '0.25em', fontWeight: 700, textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
            DRAG TO ROTATE · CLICK TO INTERACT
          </p>
        </motion.div>
      </div>
    </div>
  )
}
