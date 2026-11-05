import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function RotatingCube() {
  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          LectureLens FE
        </h1>
        <p className="text-slate-400 max-w-md">
          React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + R3F + Drei
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-72 h-72 rounded-2xl overflow-hidden bg-slate-800/60 border border-slate-700 shadow-2xl relative"
      >
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <RotatingCube />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={3} />
        </Canvas>
        <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
          <span className="text-xs text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-700/50">
            Interactive 3D Canvas
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 max-w-lg text-xs"
      >
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          Tailwind CSS v4 Active
        </span>
        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
          Framer Motion Active
        </span>
        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
          R3F + Drei Canvas Active
        </span>
      </motion.div>
    </div>
  )
}
