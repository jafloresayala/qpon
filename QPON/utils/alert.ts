import { Alert, Platform } from "react-native";

/** Shows a simple informational alert on any platform. */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Shows a destructive confirmation dialog.
 * `onConfirm` is called synchronously (web) or when the user taps the confirm button (native).
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel = "Aceptar"
): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
  }
}
