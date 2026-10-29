import * as ImagePicker from 'expo-image-picker';

export type ImageSource = 'camera' | 'gallery';

export type PickImageResult =
  | { status: 'picked'; dataUri: string }
  | { status: 'cancelled' }
  | { status: 'permission-denied' }
  | { status: 'unreadable' };

interface PickImageOptions {
  aspect?: [number, number];
  allowsEditing?: boolean;
  quality?: number;
}

/**
 * Asks for camera/gallery permission, lets the user pick or take a photo, and returns it
 * as a data URI ready for the upload endpoints. Callers decide the messages and upload.
 */
export const pickImageAsDataUri = async (
  source: ImageSource,
  { aspect, allowsEditing = true, quality = 0.8 }: PickImageOptions = {}
): Promise<PickImageResult> => {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'permission-denied' };
  }

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing,
    quality,
    base64: true,
    ...(aspect ? { aspect } : {}),
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || result.assets.length === 0) {
    return { status: 'cancelled' };
  }

  const asset = result.assets[0];
  if (!asset.base64) {
    return { status: 'unreadable' };
  }

  const mimeType =
    asset.mimeType && asset.mimeType.startsWith('image/')
      ? asset.mimeType
      : asset.uri.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

  return { status: 'picked', dataUri: `data:${mimeType};base64,${asset.base64}` };
};
