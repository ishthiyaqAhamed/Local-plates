import { Platform, ToastAndroid, Alert } from "react-native";
import * as Haptics from "expo-haptics";

export function showToast(message: string, title?: string) {
  if (Platform.OS === "android") {
    try {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } catch {
      // fallback
    }
  } else if (Platform.OS === "ios") {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    if (title) {
      Alert.alert(title, message);
    }
  } else {
    // Web
    console.log(`[Notification] ${message}`);
  }
}
