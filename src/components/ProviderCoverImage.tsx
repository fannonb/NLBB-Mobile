import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryVisual } from '../constants/categoryVisuals';
import { resolveOptionalImageUrl } from '../lib/config';

interface ProviderCoverImageProps {
  uri: string | null | undefined;
  category?: string;
  style: StyleProp<ImageStyle>;
  iconSize?: number;
}

/**
 * Provider cover photo that falls back to a local category tile when the provider has
 * no image or it fails to load, instead of leaving a blank area or relying on a remote
 * placeholder that can fail too.
 */
export default function ProviderCoverImage({ uri, category, style, iconSize = 32 }: ProviderCoverImageProps) {
  const resolvedUri = resolveOptionalImageUrl(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  if (resolvedUri && !failed) {
    return <Image source={{ uri: resolvedUri }} style={style} onError={() => setFailed(true)} />;
  }

  // Categories may be a comma-separated list; the first one picks the visual.
  const visual = getCategoryVisual(category?.split(',')[0]?.trim());
  return (
    <View style={[style, { backgroundColor: visual.bg, alignItems: 'center', justifyContent: 'center' }]}>
      <MaterialCommunityIcons name={visual.icon} size={iconSize} color={visual.color} />
    </View>
  );
}
