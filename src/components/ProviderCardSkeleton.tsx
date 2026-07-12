import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ColorPalette, Radius } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';
import { NLBBSkeleton } from './ui';

function createSkeletonStyles(p: ColorPalette) {
  return StyleSheet.create({
    card: {
      width: 260,
      backgroundColor: p.card,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: p.borderLight,
      paddingBottom: 16,
    },
    image: {
      height: 160,
      width: '100%',
    },
    info: {
      padding: 16,
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    col: {
      gap: 6,
      flex: 1,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    footer: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: p.borderLight,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
}

export default function ProviderCardSkeleton() {
  const palette = useThemedColors();
  const styles = useMemo(() => createSkeletonStyles(palette), [palette]);

  return (
    <View style={styles.card}>
      {/* Pulse image placeholder */}
      <NLBBSkeleton width="100%" height={160} borderRadius={0} />

      <View style={styles.info}>
        <View style={styles.row}>
          <View style={styles.col}>
            {/* Name placeholder */}
            <NLBBSkeleton width="70%" height={16} />
            {/* Category placeholder */}
            <NLBBSkeleton width="40%" height={12} />
          </View>
          {/* Circular Category icon placeholder */}
          <NLBBSkeleton width={32} height={32} borderRadius={16} />
        </View>

        {/* Location placeholder */}
        <NLBBSkeleton width="50%" height={12} />

        <View style={styles.footer}>
          <View style={{ gap: 4 }}>
            <NLBBSkeleton width={50} height={10} />
            <NLBBSkeleton width={70} height={14} />
          </View>
          {/* Book button placeholder */}
          <NLBBSkeleton width={76} height={32} borderRadius={Radius.md} />
        </View>
      </View>
    </View>
  );
}
