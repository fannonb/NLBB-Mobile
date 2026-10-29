import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorPalette, Radius } from '../../../constants/theme';
import InputFocusWrap from '../../../components/InputFocusWrap';

export default function FieldRow({
  label, children, icon, noBorder, fStyles, palette, isLocked, isEditable,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ComponentProps<typeof Feather>['name'];
  noBorder?: boolean;
  fStyles: any;
  palette: ColorPalette;
  isLocked?: boolean;
  isEditable?: boolean;
}) {
  const valueStyle = [
    fStyles.valueWrap,
    isEditable && {
      backgroundColor: palette.cardInner,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: -4,
    },
    isLocked && {
      opacity: 0.65,
    },
  ];

  return (
    <View style={[fStyles.row, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={fStyles.label}>{label}</Text>
      {isEditable ? (
        <InputFocusWrap style={valueStyle}>
          {icon ? <Feather name={icon} size={13} color={palette.textMuted} style={{ marginRight: 6 }} /> : null}
          {children}
          <Feather name="edit-2" size={12} color={palette.gold} style={{ marginLeft: 8 }} />
        </InputFocusWrap>
      ) : (
        <View style={valueStyle}>
          {icon ? <Feather name={icon} size={13} color={palette.textMuted} style={{ marginRight: 6 }} /> : null}
          {children}
          {isLocked ? (
            <Feather name="lock" size={12} color={palette.textMuted} style={{ marginLeft: 8 }} />
          ) : null}
        </View>
      )}
    </View>
  );
}
