import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NewRequestCard from '../../components/ProviderRequestCards/NewRequestCard';
import ChatRequestCard from '../../components/ProviderRequestCards/ChatRequestCard';
import Spinner from '../../components/Spinner/Spinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ProviderRequestsScreen.styles';
import data from '../../data/providerRequests';

const brandIcon = require('../../../assets/icon.png');

const TAB_CONFIG = {
  nuevas: {
    label: 'Nuevas',
    dataKey: 'nuevas',
    emptyMessage: 'Sin solicitudes nuevas por ahora',
  },
  presupuestos: {
    label: 'Presupuestos',
    dataKey: 'chats',
    emptyMessage: 'Aún no tenés presupuestos activos',
  },
};

export default function ProviderRequestsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('nuevas');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1000);
  };

  const filteredRequests = useMemo(() => {
    const tabSettings = TAB_CONFIG[activeTab] ?? TAB_CONFIG.nuevas;
    const source = data[tabSettings.dataKey] ?? [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((item) => {
      const fields = [item.title, item.address, item.client];
      return fields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(query),
      );
    });
  }, [activeTab, search]);

  const renderItem = ({ item }) => {
    if (activeTab === 'nuevas') {
      return (
        <NewRequestCard
          item={item}
          onPress={() =>
            navigation.navigate('RequestDetail', {
              requestId: item.id,
              showButton: false,
            })
          }
          onAccept={() => { }}
          onReject={() => { }}
        />
      );
    }
    return (
      <ChatRequestCard
        item={item}
        onPress={() => navigation.navigate('Chat', { isProvider: true, request: item })}
        detail={() => navigation.navigate('RequestDetail', { requestId: item.id, showButton: false })}
      />
    );
  };


  if (loading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <View>
                <Text style={styles.brandTitle}>Fast Services</Text>
                <Text style={styles.brandSubtitle}>Solicitudes</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowSearch((value) => !value)}
              >
                <Ionicons
                  name={showSearch ? 'close' : 'search'}
                  size={20}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSpacing]}
                onPress={() => setFilterModal(true)}
              >
                <Ionicons name="options-outline" size={20} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </View>
          {showSearch ? (
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar solicitudes"
                placeholderTextColor={styles.placeholderColor.color}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.tabContainer}>
          {Object.entries(TAB_CONFIG).map(([tabKey, config]) => (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabButton, activeTab === tabKey && styles.tabButtonActive]}
              onPress={() => setActiveTab(tabKey)}
            >
              <Text
                style={[styles.tabText, activeTab === tabKey && styles.tabTextActive]}
              >
                {config.label}
              </Text>
              {tabKey === 'nuevas' ? (
                <View style={[styles.badge, activeTab === tabKey && styles.badgeActive]}>
                  <Text style={styles.badgeText}>{data.nuevas.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[styles.refreshColor.color]}
              tintColor={styles.refreshColor.color}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={20} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                {(TAB_CONFIG[activeTab] ?? TAB_CONFIG.nuevas).emptyMessage}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <Modal transparent visible={filterModal} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterModal(false)}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalOption} onPress={() => setFilterModal(false)}>
                <Text style={styles.modalOptionText}>Ordenar por fecha</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalOption, styles.modalOptionLast]}
                onPress={() => setFilterModal(false)}
              >
                <Text style={styles.modalOptionText}>Ordenar por presupuesto</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}