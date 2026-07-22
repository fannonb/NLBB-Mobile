import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/theme';
import InputFocusWrap from './InputFocusWrap';

export type PickedProviderLocation = {
  label: string;
  address: string;
  coordinates: { lat: number; lng: number };
  source: 'suggestion' | 'device' | 'geocode';
};

type LocationSuggestion = {
  id: string;
  label: string;
  address: string;
  coordinates: { lat: number; lng: number };
  keywords: string[];
};

const KENYA_LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  {
    id: 'westlands',
    label: 'Westlands, Nairobi',
    address: 'Westlands, Nairobi, Kenya',
    coordinates: { lat: -1.2675, lng: 36.8108 },
    keywords: ['westlands', 'nairobi'],
  },
  {
    id: 'kilimani',
    label: 'Kilimani, Nairobi',
    address: 'Kilimani, Nairobi, Kenya',
    coordinates: { lat: -1.2925, lng: 36.7872 },
    keywords: ['kilimani', 'nairobi'],
  },
  {
    id: 'kileleshwa',
    label: 'Kileleshwa, Nairobi',
    address: 'Kileleshwa, Nairobi, Kenya',
    coordinates: { lat: -1.2802, lng: 36.7831 },
    keywords: ['kileleshwa', 'nairobi'],
  },
  {
    id: 'lavington',
    label: 'Lavington, Nairobi',
    address: 'Lavington, Nairobi, Kenya',
    coordinates: { lat: -1.2833, lng: 36.7617 },
    keywords: ['lavington', 'nairobi'],
  },
  {
    id: 'parklands',
    label: 'Parklands, Nairobi',
    address: 'Parklands, Nairobi, Kenya',
    coordinates: { lat: -1.2615, lng: 36.8242 },
    keywords: ['parklands', 'nairobi'],
  },
  {
    id: 'upperhill',
    label: 'Upper Hill, Nairobi',
    address: 'Upper Hill, Nairobi, Kenya',
    coordinates: { lat: -1.3003, lng: 36.8154 },
    keywords: ['upper hill', 'upperhill', 'nairobi'],
  },
  {
    id: 'cbd',
    label: 'Nairobi CBD',
    address: 'Central Business District, Nairobi, Kenya',
    coordinates: { lat: -1.2864, lng: 36.8172 },
    keywords: ['cbd', 'city centre', 'city center', 'nairobi cbd', 'central business district'],
  },
  {
    id: 'southb',
    label: 'South B, Nairobi',
    address: 'South B, Nairobi, Kenya',
    coordinates: { lat: -1.3085, lng: 36.8422 },
    keywords: ['south b', 'southb', 'nairobi'],
  },
  {
    id: 'southc',
    label: 'South C, Nairobi',
    address: 'South C, Nairobi, Kenya',
    coordinates: { lat: -1.3203, lng: 36.8209 },
    keywords: ['south c', 'southc', 'nairobi'],
  },
  {
    id: 'langata',
    label: 'Langata, Nairobi',
    address: 'Langata, Nairobi, Kenya',
    coordinates: { lat: -1.3499, lng: 36.7641 },
    keywords: ['langata', 'nairobi'],
  },
  {
    id: 'karen',
    label: 'Karen, Nairobi',
    address: 'Karen, Nairobi, Kenya',
    coordinates: { lat: -1.3194, lng: 36.7076 },
    keywords: ['karen', 'nairobi'],
  },
  {
    id: 'ngongroad',
    label: 'Ngong Road, Nairobi',
    address: 'Ngong Road, Nairobi, Kenya',
    coordinates: { lat: -1.3009, lng: 36.7852 },
    keywords: ['ngong road', 'ngong', 'nairobi'],
  },
  {
    id: 'ruaka',
    label: 'Ruaka, Kiambu',
    address: 'Ruaka, Kiambu, Kenya',
    coordinates: { lat: -1.2102, lng: 36.7756 },
    keywords: ['ruaka', 'kiambu'],
  },
  {
    id: 'runda',
    label: 'Runda, Nairobi',
    address: 'Runda, Nairobi, Kenya',
    coordinates: { lat: -1.2241, lng: 36.8019 },
    keywords: ['runda', 'nairobi'],
  },
  {
    id: 'kasarani',
    label: 'Kasarani, Nairobi',
    address: 'Kasarani, Nairobi, Kenya',
    coordinates: { lat: -1.2234, lng: 36.8981 },
    keywords: ['kasarani', 'nairobi'],
  },
  {
    id: 'embakasi',
    label: 'Embakasi, Nairobi',
    address: 'Embakasi, Nairobi, Kenya',
    coordinates: { lat: -1.3156, lng: 36.9182 },
    keywords: ['embakasi', 'nairobi'],
  },
  {
    id: 'donholm',
    label: 'Donholm, Nairobi',
    address: 'Donholm, Nairobi, Kenya',
    coordinates: { lat: -1.2998, lng: 36.8886 },
    keywords: ['donholm', 'nairobi'],
  },
  {
    id: 'thikaroad',
    label: 'Thika Road, Nairobi',
    address: 'Thika Road, Nairobi, Kenya',
    coordinates: { lat: -1.2338, lng: 36.8777 },
    keywords: ['thika road', 'thika', 'nairobi'],
  },
  {
    id: 'mombasaroad',
    label: 'Mombasa Road, Nairobi',
    address: 'Mombasa Road, Nairobi, Kenya',
    coordinates: { lat: -1.3305, lng: 36.879 },
    keywords: ['mombasa road', 'mombasa', 'nairobi'],
  },
  {
    id: 'kisumu',
    label: 'Kisumu City',
    address: 'Kisumu, Kenya',
    coordinates: { lat: -0.0917, lng: 34.768 },
    keywords: ['kisumu'],
  },
  {
    id: 'nakuru',
    label: 'Nakuru City',
    address: 'Nakuru, Kenya',
    coordinates: { lat: -0.3031, lng: 36.08 },
    keywords: ['nakuru'],
  },
  {
    id: 'eldoret',
    label: 'Eldoret Town',
    address: 'Eldoret, Kenya',
    coordinates: { lat: 0.5143, lng: 35.2698 },
    keywords: ['eldoret'],
  },
  {
    id: 'mombasa',
    label: 'Mombasa City',
    address: 'Mombasa, Kenya',
    coordinates: { lat: -4.0435, lng: 39.6682 },
    keywords: ['mombasa'],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

const formatGeocodedLabel = (parts: Array<string | null | undefined>, fallback: string) => {
  const unique = parts.filter((part, index, array): part is string => {
    if (!part?.trim()) {
      return false;
    }

    return array.findIndex((entry) => normalize(entry ?? '')) === index;
  });

  return unique.length > 0 ? unique.join(', ') : fallback;
};

const buildSearchQuery = (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.toLowerCase().includes('kenya')) {
    return trimmed;
  }

  if (trimmed.includes(',')) {
    return `${trimmed}, Kenya`;
  }

  return `${trimmed}, Nairobi, Kenya`;
};

const searchSuggestions = (query: string) => {
  const q = normalize(query);
  if (q.length < 2) {
    return [];
  }

  return KENYA_LOCATION_SUGGESTIONS
    .map((item) => {
      const haystack = [item.label, item.address, ...item.keywords].join(' ').toLowerCase();
      const starts = item.label.toLowerCase().startsWith(q) || item.keywords.some((keyword) => keyword.startsWith(q));
      const includes = haystack.includes(q);

      if (!starts && !includes) {
        return null;
      }

      return {
        item,
        score: starts ? 0 : 1,
      };
    })
    .filter((entry): entry is { item: LocationSuggestion; score: number } => !!entry)
    .sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label))
    .slice(0, 6)
    .map((entry) => entry.item);
};

type Props = {
  label: string;
  value: string;
  selectedLocation: PickedProviderLocation | null;
  onChangeText: (value: string) => void;
  onLocationSelected: (location: PickedProviderLocation | null) => void;
  placeholder?: string;
  editable?: boolean;
};

export default function ProviderLocationPicker({
  label,
  value,
  selectedLocation,
  onChangeText,
  onLocationSelected,
  placeholder = 'Search area, estate, or exact business location',
  editable = true,
}: Props) {
  const [resolving, setResolving] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const suggestions = useMemo(() => searchSuggestions(value), [value]);
  const hasMatchingSelection =
    !!selectedLocation && normalize(selectedLocation.label) === normalize(value);

  const handleTextChange = (nextValue: string) => {
    onChangeText(nextValue);
    if (selectedLocation && normalize(nextValue) !== normalize(selectedLocation.label)) {
      onLocationSelected(null);
    }
    setStatus(null);
  };

  const ensureForegroundPermission = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    return permission.status === 'granted';
  };

  const resolveTypedLocation = async () => {
    const rawValue = value.trim();
    if (!rawValue) {
      setStatus({ type: 'error', message: 'Enter a location to search first.' });
      return;
    }

    setResolving(true);
    try {
      const results = await Location.geocodeAsync(buildSearchQuery(rawValue));
      const first = results[0];

      if (!first) {
        setStatus({ type: 'error', message: 'No matching location was found. Try a more specific area or landmark.' });
        return;
      }

      let firstReverse:
        | Location.LocationGeocodedAddress
        | undefined;
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: first.latitude,
          longitude: first.longitude,
        });
        firstReverse = reverse[0];
      } catch {
        firstReverse = undefined;
      }
      const labelText = formatGeocodedLabel(
        [
          firstReverse?.name,
          firstReverse?.street,
          firstReverse?.district,
          firstReverse?.subregion,
          firstReverse?.city,
          firstReverse?.region,
          firstReverse?.country,
        ],
        rawValue,
      );

      const picked: PickedProviderLocation = {
        label: labelText,
        address: labelText,
        coordinates: {
          lat: first.latitude,
          lng: first.longitude,
        },
        source: 'geocode',
      };

      onChangeText(picked.label);
      onLocationSelected(picked);
      setStatus({
        type: 'success',
        message: `Location pinned at ${picked.coordinates.lat.toFixed(5)}, ${picked.coordinates.lng.toFixed(5)}.`,
      });
    } catch {
      setStatus({ type: 'error', message: 'Could not resolve that location right now. Please try again.' });
    } finally {
      setResolving(false);
    }
  };

  const useCurrentLocation = async () => {
    setResolving(true);
    try {
      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        setStatus({ type: 'error', message: 'Location permission is required to use your current position.' });
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      const first = reverse[0];
      const labelText = formatGeocodedLabel(
        [
          first?.name,
          first?.street,
          first?.district,
          first?.subregion,
          first?.city,
          first?.region,
          first?.country,
        ],
        'Current location',
      );

      const picked: PickedProviderLocation = {
        label: labelText,
        address: labelText,
        coordinates: {
          lat: current.coords.latitude,
          lng: current.coords.longitude,
        },
        source: 'device',
      };

      onChangeText(picked.label);
      onLocationSelected(picked);
      setStatus({
        type: 'success',
        message: `Current location pinned at ${picked.coordinates.lat.toFixed(5)}, ${picked.coordinates.lng.toFixed(5)}.`,
      });
    } catch {
      setStatus({ type: 'error', message: 'Could not read your current location. Check GPS and try again.' });
    } finally {
      setResolving(false);
    }
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const picked: PickedProviderLocation = {
      label: suggestion.label,
      address: suggestion.address,
      coordinates: suggestion.coordinates,
      source: 'suggestion',
    };
    onChangeText(picked.label);
    onLocationSelected(picked);
    setStatus({
      type: 'success',
      message: `Location pinned at ${picked.coordinates.lat.toFixed(5)}, ${picked.coordinates.lng.toFixed(5)}.`,
    });
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <InputFocusWrap style={styles.inputWrap} disabled={!editable || resolving}>
        <Feather name="map-pin" size={16} color={Colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          editable={editable && !resolving}
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={useCurrentLocation}
          disabled={!editable || resolving}
          style={styles.locateBtn}
          activeOpacity={0.8}
        >
          {resolving ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Feather name="navigation" size={15} color={Colors.gold} />
          )}
        </TouchableOpacity>
      </InputFocusWrap>

      {editable && (
        <TouchableOpacity
          onPress={useCurrentLocation}
          disabled={resolving}
          style={styles.currentLocationBtn}
          activeOpacity={0.8}
        >
          {resolving ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Feather name="navigation" size={14} color={Colors.gold} />
          )}
          <Text style={styles.currentLocationText}>Use current location</Text>
        </TouchableOpacity>
      )}

      {editable && suggestions.length > 0 && !hasMatchingSelection ? (
        <View style={styles.suggestionsCard}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionRow}
              onPress={() => selectSuggestion(suggestion)}
              activeOpacity={0.82}
            >
              <View style={styles.suggestionIcon}>
                <Feather name="map-pin" size={14} color={Colors.gold} />
              </View>
              <View style={styles.suggestionTextWrap}>
                <Text style={styles.suggestionTitle}>{suggestion.label}</Text>
                <Text style={styles.suggestionMeta}>{suggestion.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {editable && value.trim().length >= 3 && !hasMatchingSelection ? (
        <TouchableOpacity
          onPress={resolveTypedLocation}
          disabled={resolving}
          style={styles.resolveBtn}
          activeOpacity={0.85}
        >
          <Feather name="search" size={14} color={Colors.gold} />
          <Text style={styles.resolveText}>Use "{value.trim()}" and resolve coordinates</Text>
        </TouchableOpacity>
      ) : null}

      {hasMatchingSelection ? (
        <View style={styles.selectedBadge}>
          <Feather name="check-circle" size={14} color="#15803D" />
          <Text style={styles.selectedText}>
            {selectedLocation.label} • {selectedLocation.coordinates.lat.toFixed(5)}, {selectedLocation.coordinates.lng.toFixed(5)}
          </Text>
        </View>
      ) : null}

      {status ? (
        <Text style={[styles.statusText, status.type === 'error' ? styles.statusError : styles.statusSuccess]}>
          {status.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    color: Colors.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    padding: 0,
  },
  locateBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldDim,
  },
  suggestionsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldDim,
  },
  suggestionTextWrap: { flex: 1 },
  suggestionTitle: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13 },
  suggestionMeta: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldDim,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resolveText: { color: Colors.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldDim,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  currentLocationText: { color: Colors.gold, fontFamily: Fonts.sansMedium, fontSize: 12 },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedText: {
    flex: 1,
    color: '#166534',
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  statusText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  statusError: { color: '#B91C1C' },
  statusSuccess: { color: '#166534' },
});
