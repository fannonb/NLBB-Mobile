import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ColorPalette, Radius } from '../constants/theme';
import { useThemedColors } from '../hooks/useThemedColors';
import { NLBBSkeleton } from './ui';

function createSkeletonStyles(p: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: p.border,
    },
    image: {
      width: 90,
      height: 110,
    },
    info: {
      flex: 1,
      padding: 14,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
  });
}

export default function ExploreCardSkeleton() {
  const palette = useThemedColors();
  const styles = useMemo(() => createSkeletonStyles(palette), [palette]);

  return (
    <View style={styles.card}>
      {/* Pulse image placeholder */}
      <NLBBSkeleton width={90} height={110} borderRadius={0} />

      <View style={styles.info}>
        <View style={styles.row}>
          {/* Name placeholder */}
          <NLBBSkeleton width="60%" height={15} />
          {/* Verified badge placeholder */}
          <NLBBSkeleton width={13} height={13} borderRadius={6.5} />
        </View>

        {/* Category placeholder */}
        <NLBBSkeleton width="35%" height={12} />

        <View style={styles.row}>
          {/* Rating placeholder */}
          <NLBBSkeleton width="25%" height={12} />
          {/* Dot */}
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: palette.border }} />
          {/* Location placeholder */}
          <NLBBSkeleton width="30%" height={12} />
        </View>

        <View style={styles.footer}>
          {/* Price placeholder */}
          <NLBBSkeleton width="50%" height={13} />
          {/* Open/closed badge placeholder */}
          <NLBBSkeleton width={50} height={18} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
