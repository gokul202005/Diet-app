import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Check if running on Android / iOS native Capacitor container
export const isNativePlatform = () => {
  try {
    return Boolean(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  } catch (e) {
    return false;
  }
};

// Open native device camera on Android / iOS APK
export async function openNativeCamera() {
  try {
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    return image?.dataUrl || null;
  } catch (err) {
    if (err.message && (err.message.includes('cancel') || err.message.includes('User cancelled') || err.message.includes('cancelled'))) {
      return null;
    }
    console.error('Native camera capture error:', err);
    throw err;
  }
}
