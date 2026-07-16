import React, { forwardRef, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  type ScrollViewProps,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

type Props = ScrollViewProps & {
  /** Extra space under content when the keyboard is closed */
  bottomPadding?: number;
  /** Include safe-area bottom inset in content padding (default true) */
  includeSafeArea?: boolean;
  /** Wrap with KeyboardAvoidingView (default true) */
  avoidKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Full-screen / in-page form scroll container that keeps focused inputs visible
 * above the keyboard on iOS and Android.
 */
const KeyboardAwareScrollView = forwardRef<ScrollView, Props>(function KeyboardAwareScrollView(
  {
    children,
    bottomPadding = 24,
    includeSafeArea = true,
    avoidKeyboard = true,
    style,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = 'on-drag',
    showsVerticalScrollIndicator = false,
    ...rest
  },
  ref
) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const contentPad = useMemo(() => {
    const safeBottom = includeSafeArea ? insets.bottom : 0;
    // On Android, add live keyboard height so lower fields remain reachable.
    const keyboardPad = Platform.OS === 'android' ? keyboardHeight : 0;
    return bottomPadding + safeBottom + keyboardPad;
  }, [bottomPadding, includeSafeArea, insets.bottom, keyboardHeight]);

  const scrollView = (
    <ScrollView
      ref={ref}
      style={style}
      contentContainerStyle={[{ paddingBottom: contentPad }, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      {...rest}
    >
      {children}
    </ScrollView>
  );

  if (!avoidKeyboard) {
    return scrollView;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {scrollView}
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default KeyboardAwareScrollView;
