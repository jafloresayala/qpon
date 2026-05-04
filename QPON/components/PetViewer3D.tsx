import { useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Colors, Spacing } from "@/constants/theme";

/** Lazy-import expo-three / expo-gl only on native (avoids Metro bundler issues on web) */
let ExpoGLComponent: any = null;
let THREE: any = null;
let ExpoTHREE: any = null;

if (Platform.OS !== "web") {
  try {
    ExpoGLComponent = require("expo-gl").GLView;
    THREE = require("three");
    ExpoTHREE = require("expo-three");
  } catch {
    // optional dependency not installed, fallback rendered
  }
}

interface Props {
  assetUrl?: string | null;
  rarity: string;
  petName: string;
}

const RARITY_HEX: Record<string, number> = {
  common: 0x23d18b,
  rare: 0x4a9eff,
  epic: 0xb673ff,
  legendary: 0xf4b942,
};

/** Native 3D viewer using expo-gl + three.js */
function NativePetViewer({ assetUrl, rarity, petName }: Props) {
  const animFrameRef = useRef<number | null>(null);

  async function onContextCreate(gl: any) {
    if (!THREE || !ExpoTHREE) return;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x071013, 1);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const rarityColor = RARITY_HEX[rarity] ?? RARITY_HEX.common;

    let petMesh: any;

    if (assetUrl) {
      try {
        const { GLTFLoader } = require("three/examples/jsm/loaders/GLTFLoader");
        const loader = new GLTFLoader();
        await new Promise<void>((resolve) => {
          loader.load(
            assetUrl,
            (gltf: any) => {
              petMesh = gltf.scene;
              scene.add(petMesh);
              resolve();
            },
            undefined,
            () => resolve() // on error fall through to placeholder
          );
        });
      } catch {
        // fall through to placeholder geometry
      }
    }

    // Placeholder geometry if no model loaded
    if (!petMesh) {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 32, 32),
        new THREE.MeshStandardMaterial({
          color: rarityColor,
          roughness: 0.3,
          metalness: 0.5,
        })
      );
      const earGeom = new THREE.ConeGeometry(0.25, 0.55, 8);
      const earMat = new THREE.MeshStandardMaterial({ color: rarityColor });
      const earL = new THREE.Mesh(earGeom, earMat);
      earL.position.set(-0.55, 1.0, 0);
      earL.rotation.z = -0.3;
      const earR = earL.clone();
      earR.position.set(0.55, 1.0, 0);
      earR.rotation.z = 0.3;
      const group = new THREE.Group();
      group.add(body, earL, earR);
      scene.add(group);
      petMesh = group;
    }

    // Render loop
    let t = 0;
    const render = () => {
      t += 0.016;
      if (petMesh) {
        petMesh.rotation.y = t * 0.6;
        petMesh.position.y = Math.sin(t) * 0.12;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!ExpoGLComponent) {
    return <PlaceholderViewer rarity={rarity} petName={petName} />;
  }

  return (
    <ExpoGLComponent style={styles.glView} onContextCreate={onContextCreate} />
  );
}

/** Web fallback — no WebGL canvas to avoid bundle issues */
function PlaceholderViewer({ rarity, petName }: Pick<Props, "rarity" | "petName">) {
  const color = (Colors.rarity as Record<string, string>)[rarity] ?? Colors.primary;
  return (
    <View style={styles.placeholder}>
      <View style={[styles.placeholderOrb, { borderColor: color }]}>
        <Text style={[styles.placeholderInitial, { color }]}>
          {petName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.placeholderText}>
        Vista 3D disponible en la app movil
      </Text>
    </View>
  );
}

export default function PetViewer3D(props: Props) {
  if (Platform.OS === "web") {
    return <PlaceholderViewer rarity={props.rarity} petName={props.petName} />;
  }
  return <NativePetViewer {...props} />;
}

const styles = StyleSheet.create({
  glView: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.bg,
  },
  placeholderOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderInitial: { fontSize: 64, fontWeight: "900" },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
