import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import mockData from '../../data/providerRequests';
import { getMatchingServiceRequests } from '../../services/providers.service';

const brandIcon = require('../../../assets/icon.png');

const TAB_CONFIG = {
  nuevas: {
    label: 'Nuevas',
    dataKey: null,
    emptyMessage: 'Sin solicitudes nuevas por ahora',
  },
  presupuestos: {
    label: 'Presupuestos',
    dataKey: 'chats',
    emptyMessage: 'Aún no tenés presupuestos activos',
  },
};

const DEFAULT_ADDRESS_LABEL = 'Ubicación a coordinar';
const DEFAULT_DATE_LABEL = 'Fecha a coordinar';

function formatDateTimeLabel(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} hs`;
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  try {
    return numeric.toLocaleString('es-AR', {
      minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    });
  } catch (error) {
    return `${numeric.toFixed(0)}`;
  }
}

function buildTitleFromRequest(rawTitle, rawDescription) {
  const title = (rawTitle || '').trim();
  if (title) {
    return title;
  }
  const description = (rawDescription || '').trim();
  if (!description) {
    return 'Solicitud sin título';
  }
  if (description.length <= 60) {
    return description;
  }
  return `${description.slice(0, 57).trimEnd()}...`;
}

function extractBudgetValue(proposals) {
  if (!Array.isArray(proposals) || proposals.length === 0) {
    return null;
  }
  const numericValues = proposals
    .map((proposal) => {
      if (!proposal || proposal.quoted_price === undefined || proposal.quoted_price === null) {
        return null;
      }
      const numeric = Number(proposal.quoted_price);
      return Number.isNaN(numeric) ? null : numeric;
    })
    .filter((value) => value !== null);
  if (!numericValues.length) {
    return null;
  }
  return Math.min(...numericValues);
}

function mapServiceRequestToCard(request) {
  if (!request || request.id === undefined || request.id === null) {
    return null;
  }
  const budgetValue = extractBudgetValue(request.proposals);
  const dateLabel =
    formatDateTimeLabel(request.preferred_start_at || request.created_at) ||
    DEFAULT_DATE_LABEL;

  return {
    id: String(request.id),
    title: buildTitleFromRequest(request.title, request.description),
    date: dateLabel,
    address: request.city_snapshot || DEFAULT_ADDRESS_LABEL,
    budget: budgetValue !== null ? formatCurrencyValue(budgetValue) : null,
    fast: request.request_type === 'FAST',
  };
}

export default function ProviderRequestsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('nuevas');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [matchingRequests, setMatchingRequests] = useState([]);

  const loadMatchingRequests = useCallback(
    async ({ useRefreshIndicator = false } = {}) => {
      if (useRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getMatchingServiceRequests();
        const normalized = Array.isArray(response)
          ? response
              .map((request) => mapServiceRequestToCard(request))
              .filter((item) => item !== null)
          : [];
        setMatchingRequests(normalized);
      } catch (error) {
        console.error('❌ Error sincronizando solicitudes del proveedor:', error.message || error);
      } finally {
        if (useRefreshIndicator) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadMatchingRequests();
  }, [loadMatchingRequests]);

  const handleRefresh = useCallback(() => {
    loadMatchingRequests({ useRefreshIndicator: true });
  }, [loadMatchingRequests]);

  const filteredRequests = useMemo(() => {
    const tabSettings = TAB_CONFIG[activeTab] ?? TAB_CONFIG.nuevas;
    const query = search.trim().toLowerCase();

    const source =
      activeTab === 'nuevas'
        ? matchingRequests
        : mockData[tabSettings.dataKey] ?? [];

    if (!query) {
      return source;
    }

    return source.filter((item) => {
      const fields = [item.title, item.address, item.client];
      return fields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(query),
      );
    });
  }, [activeTab, search, matchingRequests]);

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
                  <Text style={styles.badgeText}>{matchingRequests.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredRequests}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `item-${index}`)}
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