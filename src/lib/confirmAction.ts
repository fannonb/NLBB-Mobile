import { Alert, Platform } from 'react-native';

interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export const confirmAction = ({
  title,
  message,
  confirmText,
  onConfirm,
  destructive = false,
}: ConfirmActionOptions) => {
  if (Platform.OS === 'web') {
    const confirmFn = (globalThis as typeof globalThis & {
      confirm?: (value?: string) => boolean;
    }).confirm;

    if (!confirmFn || confirmFn(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
};
