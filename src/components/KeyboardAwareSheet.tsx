import React, { forwardRef, useCallback, type RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet container style (background, radius, etc.) */
  sheetStyle?: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
  /** Extra padding under sheet content when keyboard is closed */
  bottomPadding?: number;
  /** Max height of the sheet (default 92%) */
  maxHeight?: ViewStyle['maxHeight'];
  /** Show dismiss overlay behind the sheet (default true) */
  dismissOnBackdropPress?: boolean;
  /** Wrap children in a ScrollView (default true) */
  scrollable?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
  statusBarTranslucent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
};

/**
 * Bottom-sheet Modal that lifts above the keyboard on iOS and Android.
 * Use for add/edit forms, auth gate, password change, etc.
 */
const KeyboardAwareSheet = forwardRef<ScrollView, Props>(function KeyboardAwareSheet(
  {
    visible,
    onClose,
    children,
    sheetStyle,
    overlayStyle,
    bottomPadding = 16,
    maxHeight = '92%',
    dismissOnBackdropPress = true,
    scrollable = true,
    scrollProps,
    statusBarTranslucent = true,
    animationType = 'slide',
  },
  ref
) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(visible);

  const scrollFocusedFieldIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      if (typeof ref === 'object' && ref?.current) {
        ref.current.scrollToEnd({ animated: true });
      }
    });
  }, [ref]);

  const sheetPaddingBottom =
    Math.max(insets.bottom, bottomPadding) + (Platform.OS === 'android' ? keyboardHeight : 0);

  const body = scrollable ? (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={{ paddingBottom: 8 }}
      onFocus={scrollFocusedFieldIntoView}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, overlayStyle]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {dismissOnBackdropPress ? (
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.sheet, { maxHeight, paddingBottom: sheetPaddingBottom }, sheetStyle]}>
          {body}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
  },
});

export default KeyboardAwareSheet;

/** Call from TextInput onFocus to keep the focused field above the keyboard. */
export function useScrollFieldIntoView(scrollRef: RefObject<ScrollView | null>) {
  return useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [scrollRef]);
}
