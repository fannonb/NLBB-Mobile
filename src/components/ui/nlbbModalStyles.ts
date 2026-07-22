import { StyleSheet } from 'react-native';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';

export type NLBBModalTone = 'error' | 'success' | 'info' | 'neutral' | 'danger';

export const getModalToneColors = (p: ColorPalette, tone: NLBBModalTone) => {
  switch (tone) {
    case 'error':
      return {
        iconBg: 'rgba(212,48,48,0.1)',
        iconColor: p.error,
        ring: 'rgba(212,48,48,0.18)',
      };
    case 'danger':
      return {
        iconBg: 'rgba(212,48,48,0.12)',
        iconColor: p.error,
        ring: 'rgba(212,48,48,0.22)',
      };
    case 'success':
      return {
        iconBg: 'rgba(26,158,104,0.12)',
        iconColor: p.success,
        ring: 'rgba(26,158,104,0.2)',
      };
    case 'info':
      return {
        iconBg: p.goldDim,
        iconColor: p.gold,
        ring: p.goldBorder,
      };
    default:
      return {
        iconBg: p.goldDim,
        iconColor: p.gold,
        ring: p.goldBorder,
      };
  }
};

export function createNLBBModalStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlayDark,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    body: {
      paddingHorizontal: 26,
      paddingTop: 32,
      paddingBottom: 26,
      alignItems: 'center',
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1.5,
    },
    title: {
      fontFamily: Fonts.serifMedium,
      fontSize: 21,
      color: p.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: 0.15,
    },
    message: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: p.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 26,
      paddingHorizontal: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    primaryBtn: {
      flex: 1,
      minHeight: 48,
      backgroundColor: p.gold,
      borderRadius: Radius.md,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      ...s.gold,
    },
    primaryBtnFull: {
      flex: 0,
      width: '100%',
      alignSelf: 'stretch',
    },
    primaryBtnDanger: {
      backgroundColor: p.error,
      shadowColor: p.error,
    },
    primaryBtnText: {
      color: p.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    primaryBtnTextDanger: {
      color: '#FFFFFF',
    },
    secondaryBtn: {
      flex: 1,
      backgroundColor: p.bg,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
    },
    secondaryBtnText: {
      color: p.textPrimary,
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
    },
    footer: {
      marginTop: 8,
      width: '100%',
      backgroundColor: p.cardInner,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    footerText: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: p.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    closeBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.cardInner,
      borderWidth: 1,
      borderColor: p.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
  });
}
