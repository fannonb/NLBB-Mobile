import React, { useRef } from 'react';
import {
  Pressable,
  TextInput,
  StyleProp,
  StyleSheet,
  ViewStyle,
  type TextInputInstance,
} from 'react-native';

type InputFocusWrapProps = {
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  children: React.ReactNode;
};

const isTextInputElement = (child: React.ReactElement) => {
  if (child.type === TextInput) return true;
  const type = child.type as { displayName?: string; name?: string };
  return type?.displayName === 'TextInput' || type?.name === 'TextInput';
};

/**
 * Makes the whole row/field tappable so the keyboard opens even when the
 * native TextInput hit-box only covers the left/text portion (common on Android).
 */
export default function InputFocusWrap({ style, disabled, children }: InputFocusWrapProps) {
  const inputRef = useRef<TextInputInstance | null>(null);
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const isRow = (flatStyle.flexDirection ?? 'column') === 'row';

  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || !isTextInputElement(child)) {
      return child;
    }

    const element = child as React.ReactElement<Record<string, unknown>>;
    const existingRef = (element as React.ReactElement & { ref?: React.Ref<TextInputInstance | null> }).ref;

    return React.cloneElement(element, {
      ref: (node: TextInputInstance | null) => {
        inputRef.current = node;
        if (typeof existingRef === 'function') {
          existingRef(node);
        } else if (existingRef && typeof existingRef === 'object') {
          (existingRef as React.MutableRefObject<TextInputInstance | null>).current = node;
        }
      },
      style: [
        isRow
          ? { flex: 1, minWidth: 0, alignSelf: 'stretch' }
          : { width: '100%', alignSelf: 'stretch' },
        element.props.style,
      ],
    });
  });

  return (
    <Pressable
      style={style}
      disabled={disabled}
      onPress={() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }}
    >
      {content}
    </Pressable>
  );
}
