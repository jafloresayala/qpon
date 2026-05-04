import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { redeem } from "@/api/inventory";
import type { RedeemResponse } from "@/api/types";
import { Colors, Spacing } from "@/constants/theme";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [lastResult, setLastResult] = useState<RedeemResponse | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanning(false);

    try {
      const result = await redeem(data.trim());
      setLastResult(result);
      Alert.alert(
        "¡Recompensa canjeada!",
        result.reward_type === "discount"
          ? `Descuento del ${result.discount?.discount_percentage}% guardado en tu inventario.`
          : `Mascota "${result.pet?.pet_name}" agregada a tu inventario.`,
        [{ text: "Aceptar", onPress: resetScanner }]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      Alert.alert("No se pudo canjear", msg, [
        { text: "Reintentar", onPress: resetScanner },
      ]);
    }
  }

  function resetScanner() {
    processingRef.current = false;
    setScanning(true);
    setLastResult(null);
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-off-outline" size={60} color={Colors.textMuted} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la camara para escanear QR.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir camara</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webNotice}>
          <Ionicons name="qr-code-outline" size={60} color={Colors.primary} />
          <Text style={styles.webNoticeText}>
            El escaner de camara no esta disponible en web.{"\n"}
            Usa la aplicacion movil para escanear QR.
          </Text>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.hint}>
              {scanning ? "Apunta al codigo QR" : "Procesando..."}
            </Text>
          </View>
        </CameraView>
      )}

      {!scanning && (
        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={resetScanner}>
            <Text style={styles.buttonText}>Escanear otro</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.bg,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,16,19,0.55)",
    gap: Spacing.lg,
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
  },
  hint: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "#000",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  permissionText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: Spacing.md,
    alignItems: "center",
  },
  buttonText: { color: Colors.bg, fontWeight: "700", fontSize: 16 },
  webNotice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  webNoticeText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});
