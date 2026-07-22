import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import GoldButton from '../../components/GoldButton';
import ConfirmModal from '../../components/ConfirmModal';
import ErrorModal from '../../components/ErrorModal';
import InputFocusWrap from '../../components/InputFocusWrap';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import KeyboardAwareSheet, { useScrollFieldIntoView } from '../../components/KeyboardAwareSheet';
import { providerManagementApi, ProviderService } from '../../lib/api/providerManagement';
import { providerApi } from '../../lib/api/providers';
import { useProviderAddStore } from '../../store/providerAddStore';
import { Category } from '../../types';
import { getCategoryVisual } from '../../constants/categoryVisuals';

function createServicesStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    mainScroll: { flex: 1 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: p.cardInner, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: p.border,
    },
    heading: { fontFamily: Fonts.serifMedium, fontSize: 24, color: p.textPrimary },
    subheading: { color: p.textSecondary, fontSize: 12, marginTop: 4 },
    addBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: p.gold,
      alignItems: 'center', justifyContent: 'center', ...s.gold,
    },
    statsBar: {
      flexDirection: 'row', backgroundColor: p.card, marginHorizontal: 24,
      borderRadius: Radius.lg, padding: 16, marginBottom: 20,
      borderWidth: 1, borderColor: p.border,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: p.textPrimary, fontFamily: Fonts.serifMedium, fontSize: 18, marginBottom: 3 },
    statLabel: { color: p.textMuted, fontSize: 11 },
    statDivider: { width: 1, backgroundColor: p.border },
    catsContainer: {
      height: 38,
      flexGrow: 0,
      flexShrink: 0,
      marginBottom: 16,
    },
    catsScroll: {
      paddingHorizontal: 24,
      gap: 10,
      alignItems: 'center',
    },
    catChip: {
      paddingHorizontal: 18, paddingVertical: 9, borderRadius: Radius.full,
      backgroundColor: p.card, borderWidth: 1, borderColor: p.border,
    },
    catChipActive: { backgroundColor: p.gold, borderColor: p.gold },
    catText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 },
    catTextActive: { color: p.bg, fontWeight: '700' },
    scroll: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    serviceCard: {
      flexDirection: 'row', justifyContent: 'space-between', backgroundColor: p.card,
      borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: p.border, ...s.soft,
    },
    serviceCardInactive: { opacity: 0.6 },
    serviceLeft: { flex: 1, flexDirection: 'row', gap: 12 },
    serviceIconWrap: {
      width: 44, height: 44, borderRadius: Radius.md, backgroundColor: p.goldDim,
      borderWidth: 1, borderColor: p.goldBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    serviceInfo: { flex: 1 },
    serviceName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 15, marginBottom: 3 },
    serviceMeta: { color: p.textMuted, fontSize: 12, marginBottom: 2 },
    serviceCategory: { color: p.textSecondary, fontSize: 11 },
    inactiveText: { color: p.textMuted },
    serviceRight: { alignItems: 'flex-end', gap: 8 },
    servicePrice: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 15 },
    serviceActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    editBtn: {
      width: 30, height: 30, borderRadius: 15, backgroundColor: p.cardInner,
      borderWidth: 1, borderColor: p.border, alignItems: 'center', justifyContent: 'center',
    },
    deleteBtn: {
      width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239,68,68,0.08)',
      borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center',
    },
    addServiceBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1,
      borderColor: p.goldBorder, borderStyle: 'dashed',
    },
    addServiceText: { color: p.gold, fontFamily: Fonts.sansMedium, fontSize: 14 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: p.card,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: 24,
      paddingTop: 24,
      maxHeight: '92%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontFamily: Fonts.serifMedium, fontSize: 20, color: p.textPrimary },
    modalScroll: { flexGrow: 0 },
    modalField: { gap: 6, marginBottom: 16 },
    modalLabel: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    modalInputWrap: {
      backgroundColor: p.cardInner, borderRadius: Radius.md,
      borderWidth: 1, borderColor: p.border, paddingHorizontal: 14, paddingVertical: 12,
    },
    modalInput: {
      color: p.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
      padding: 0,
      width: '100%',
      minWidth: 0,
    },
    modalTextArea: {
      color: p.textPrimary, fontFamily: Fonts.sans, fontSize: 14, padding: 0,
      minHeight: 72, textAlignVertical: 'top', width: '100%',
    },
    rowFields: { flexDirection: 'row', gap: 12 },
    catPickerRow: { gap: 8, paddingBottom: 4 },
    catPickerChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
      backgroundColor: p.bg, borderWidth: 1, borderColor: p.border,
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    catPickerChipActive: { backgroundColor: p.gold, borderColor: p.gold },
    catPickerText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
    catPickerTextActive: { color: p.bg, fontWeight: '700' },
    modalBtn: { width: '100%', marginTop: 8, marginBottom: 8 },
  });
}

interface ServiceForm {
  id?: string;
  name: string;
  price: string;
  duration: string;
  description: string;
  category: string;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  price: '',
  duration: '',
  description: '',
  category: '',
};

export default function ServicesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createServicesStyles(palette, shadow), [palette, shadow]);
  const consumeAddService = useProviderAddStore((s) => s.consumeAddService);
  const canGoBack = navigation.canGoBack?.() ?? false;
  const modalScrollRef = useRef<ScrollView>(null);
  const scrollFormFieldIntoView = useScrollFieldIntoView(modalScrollRef);

  const [services, setServices] = useState<ProviderService[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      setLoading(true);
      try {
        const [response, categoryResponse] = await Promise.all([
          providerManagementApi.listMyServices(),
          providerApi.listCategories().catch(() => []),
        ]);
        if (!active) return;
        setServices(response);
        setAvailableCategories(categoryResponse);
      } catch {
        if (!active) return;
        setServices([]);
        setToast({
          visible: true,
          message: 'Could not load services from backend.',
          type: 'error',
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => ['All', ...new Set(services.map((service) => service.category))], [services]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, categories]);

  const filtered = useMemo(
    () => (activeCategory === 'All' ? services : services.filter((service) => service.category === activeCategory)),
    [activeCategory, services]
  );

  const openAdd = () => {
    if (availableCategories.length === 0) {
      showError('Categories Unavailable', 'No active service categories are available. Please contact the administrator.');
      return;
    }
    setForm({ ...EMPTY_FORM, category: availableCategories[0].name });
    setIsEditing(false);
    setShowModal(true);
  };

  useEffect(() => {
    if (consumeAddService()) {
      openAdd();
    }
  }, [consumeAddService]);

  const openEdit = (service: ProviderService) => {
    setForm({
      id: service.id,
      name: service.name,
      price: String(service.price),
      duration: String(service.duration),
      description: service.description,
      category: service.category,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !availableCategories.some((category) => category.name === form.category)) {
      showToast('Please fill in name, price, and select an active category.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      duration: form.duration ? Number(form.duration) || 60 : undefined,
      description: form.description.trim(),
      category: form.category,
    };
    const editingId = form.id;
    const wasEditing = isEditing && Boolean(editingId);
    const previousServices = services;

    if (wasEditing && editingId) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingId
            ? {
                ...service,
                name: payload.name,
                price: payload.price,
                duration: payload.duration ?? service.duration,
                description: payload.description,
                category: payload.category,
              }
            : service
        )
      );
    }

    setShowModal(false);
    setForm(EMPTY_FORM);

    try {
      if (wasEditing && editingId) {
        const updated = await providerManagementApi.updateMyService(editingId, payload);
        setServices((current) => current.map((service) => (service.id === updated.id ? updated : service)));
        showToast('Service updated successfully.');
      } else {
        const created = await providerManagementApi.createMyService(payload);
        setServices((current) => [created, ...current]);
        showToast('Service added successfully.');
      }
    } catch (error: any) {
      setServices(previousServices);
      showError('Could Not Save Service', error?.message ?? 'Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    const previousServices = services;
    setDeleteConfirm(null);
    setServices((current) => current.filter((service) => service.id !== id));

    try {
      await providerManagementApi.deleteMyService(id);
      showToast('Service deleted.', 'info');
    } catch (error: any) {
      setServices(previousServices);
      showError('Could Not Delete Service', error?.message ?? 'Please try again.');
    }
  };

  const handleToggle = async (service: ProviderService) => {
    const nextActive = !service.isActive;
    setServices((current) =>
      current.map((item) => (item.id === service.id ? { ...item, isActive: nextActive } : item))
    );

    try {
      const updated = await providerManagementApi.setMyServiceActive(service.id, nextActive);
      setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast(updated.isActive ? 'Service activated.' : 'Service paused.', 'info');
    } catch (error: any) {
      setServices((current) =>
        current.map((item) => (item.id === service.id ? { ...item, isActive: service.isActive } : item))
      );
      showError('Could Not Update Service', error?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((current) => ({ ...current, visible: false }))}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canGoBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={18} color={palette.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <View>
            <Text style={styles.heading}>My Services</Text>
            <Text style={styles.subheading}>Manage what customers can book</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Feather name="plus" size={18} color={palette.bg} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{services.length}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {services.length > 0 ? `Ksh ${Math.min(...services.map((service) => service.price)).toLocaleString()}` : '-'}
          </Text>
          <Text style={styles.statLabel}>Starting from</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{services.filter((service) => service.isActive).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catsScroll}
        style={styles.catsContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.mainScroll}
        contentContainerStyle={[styles.scroll, filtered.length === 0 && !loading && { flex: 1 }]}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={palette.gold} />
            <Text style={styles.loadingText}>Loading your services...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="scissors"
            title="No services yet"
            message="Add your first service to start receiving bookings from customers."
            ctaLabel="Add a Service"
            onCta={openAdd}
          />
        ) : (
          <>
            {filtered.map((service) => {
              const serviceCategory = availableCategories.find((category) => category.name === service.category);
              const serviceVisual = getCategoryVisual(
                serviceCategory?.slug ?? service.category,
                serviceCategory?.icon
              );
              return (
              <View key={service.id} style={[styles.serviceCard, !service.isActive && styles.serviceCardInactive]}>
                <View style={styles.serviceLeft}>
                  <View style={[styles.serviceIconWrap, !service.isActive && { opacity: 0.5 }]}>
                    <MaterialCommunityIcons name={serviceVisual.icon} size={18} color={palette.gold} />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, !service.isActive && styles.inactiveText]}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>
                      {[`${service.duration} min`, service.description?.trim()].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.serviceCategory}>{service.category}</Text>
                  </View>
                </View>
                <View style={styles.serviceRight}>
                  <Text style={[styles.servicePrice, !service.isActive && { color: palette.textMuted }]}>
                    Ksh {service.price.toLocaleString()}
                  </Text>
                  <View style={styles.serviceActions}>
                    <Switch
                      value={service.isActive}
                      onValueChange={() => handleToggle(service)}
                      trackColor={{ false: palette.border, true: palette.goldBorder }}
                      thumbColor={service.isActive ? palette.gold : palette.textMuted}
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(service)}>
                      <Feather name="edit-2" size={14} color={palette.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteConfirm(service.id)}>
                      <Feather name="trash-2" size={14} color={palette.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              );
            })}

            <TouchableOpacity onPress={openAdd} style={styles.addServiceBtn}>
              <Feather name="plus-circle" size={20} color={palette.gold} />
              <Text style={styles.addServiceText}>Add New Service</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <KeyboardAwareSheet
        ref={modalScrollRef}
        visible={showModal}
        onClose={() => setShowModal(false)}
        sheetStyle={styles.modal}
        overlayStyle={styles.modalOverlay}
        bottomPadding={16}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Service' : 'Add Service'}</Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Feather name="x" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Service Name *</Text>
          <InputFocusWrap style={styles.modalInputWrap}>
            <TextInput
              placeholder="e.g. Silk Press & Trim"
              placeholderTextColor={palette.textMuted}
              style={styles.modalInput}
              value={form.name}
              onChangeText={(v) => setForm((current) => ({ ...current, name: v }))}
              onFocus={scrollFormFieldIntoView}
              returnKeyType="next"
            />
          </InputFocusWrap>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catPickerRow}>
            {availableCategories.map((category) => {
              const visual = getCategoryVisual(category.slug ?? category.name, category.icon);
              return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setForm((current) => ({ ...current, category: category.name }))}
                style={[styles.catPickerChip, form.category === category.name && styles.catPickerChipActive]}
              >
                <MaterialCommunityIcons
                  name={visual.icon}
                  size={14}
                  color={form.category === category.name ? palette.bg : palette.textSecondary}
                />
                <Text style={[styles.catPickerText, form.category === category.name && styles.catPickerTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.modalField, { flex: 1 }]}>
            <Text style={styles.modalLabel}>Price (Ksh) *</Text>
            <InputFocusWrap style={styles.modalInputWrap}>
              <TextInput
                placeholder="0"
                placeholderTextColor={palette.textMuted}
                style={styles.modalInput}
                value={form.price}
                onChangeText={(v) => setForm((current) => ({ ...current, price: v.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
                onFocus={scrollFormFieldIntoView}
              />
            </InputFocusWrap>
          </View>
          <View style={[styles.modalField, { flex: 1 }]}>
            <Text style={styles.modalLabel}>Duration (min)</Text>
            <InputFocusWrap style={styles.modalInputWrap}>
              <TextInput
                placeholder="60"
                placeholderTextColor={palette.textMuted}
                style={styles.modalInput}
                value={form.duration}
                onChangeText={(v) => setForm((current) => ({ ...current, duration: v.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
                onFocus={scrollFormFieldIntoView}
              />
            </InputFocusWrap>
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Short Description (optional)</Text>
          <InputFocusWrap style={styles.modalInputWrap}>
            <TextInput
              placeholder="e.g. Includes wash and blow-dry"
              placeholderTextColor={palette.textMuted}
              style={styles.modalTextArea}
              value={form.description}
              onChangeText={(v) => setForm((current) => ({ ...current, description: v }))}
              onFocus={scrollFormFieldIntoView}
              multiline
              blurOnSubmit
            />
          </InputFocusWrap>
        </View>

        <GoldButton
          label={isEditing ? 'Save Changes' : 'Add Service'}
          onPress={handleSave}
          style={styles.modalBtn}
          size="lg"
        />
      </KeyboardAwareSheet>

      <ConfirmModal
        visible={!!deleteConfirm}
        title="Delete Service?"
        message="This service will be removed from your listing. Existing bookings will not be affected."
        isDanger
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onDismiss={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
