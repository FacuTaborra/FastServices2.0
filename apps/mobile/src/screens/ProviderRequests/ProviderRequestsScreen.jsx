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
import ProviderProposalCard from '../../components/ProviderRequestCards/ProviderProposalCard';
import Spinner from '../../components/Spinner/Spinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ProviderRequestsScreen.styles';
import { getMatchingServiceRequests, getProviderProposals } from '../../services/providers.service';
import { useAuth } from '../../hooks/useAuth';

const brandIcon = require('../../../assets/icon.png');

const TAB_CONFIG = {
  nuevas: {
    label: 'Nuevas',
    emptyMessage: 'Sin solicitudes nuevas por ahora',
  },
  presupuestos: {
    label: 'Presupuestos',
    emptyMessage: 'Aún no tenés presupuestos activos',
  },
};

const PROPOSAL_STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  withdrawn: 'Retirado',
  expired: 'Expirado',
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

function formatCurrencyValue(value, currencyCode) {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  try {
    const formatted = numeric.toLocaleString('es-AR', {
      minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    });
    return currencyCode ? `${currencyCode} ${formatted}` : formatted;
  } catch (error) {
    const fallback = `${numeric.toFixed(0)}`;
    return currencyCode ? `${currencyCode} ${fallback}` : fallback;
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

function buildProposalSummary(request) {
  if (!request) {
    return null;
  }

  return {
    id: request.id ?? null,
    title: request.title ?? 'Solicitud sin título',
    address: request.city_snapshot ?? DEFAULT_ADDRESS_LABEL,
    request_type: request.request_type ?? null,
    preferred_start_at: request.preferred_start_at ?? null,
    preferred_end_at: request.preferred_end_at ?? null,
  };
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
    preferred_start_at: request.preferred_start_at,
    preferred_end_at: request.preferred_end_at,
    rawRequest: request,
    proposalSummary: buildProposalSummary(request),
  };
}

export default function ProviderRequestsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('nuevas');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [matchingRequests, setMatchingRequests] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [hasFetchedProposals, setHasFetchedProposals] = useState(false);

  const providerProfileId = user?.provider_profile?.id ?? null;

  const loadMatchingRequests = useCallback(async () => {
    setLoadingMatching(true);

    try {
      const response = await getMatchingServiceRequests();
      const normalized = Array.isArray(response)
        ? response
          .map((request) => mapServiceRequestToCard(request))
          .filter((item) => item !== null)
        : [];
      const filtered = normalized.filter((item) => {
        if (!providerProfileId) {
          return true;
        }
        const proposalsForRequest = item.rawRequest?.proposals;
        if (!Array.isArray(proposalsForRequest)) {
          return true;
        }
        return !proposalsForRequest.some(
          (proposal) => proposal?.provider_profile_id === providerProfileId,
        );
      });
      setMatchingRequests(filtered);
    } catch (error) {
      console.error('❌ Error sincronizando solicitudes del proveedor:', error.message || error);
    } finally {
      setLoadingMatching(false);
    }
  }, [providerProfileId]);

  const loadProposals = useCallback(async () => {
    setLoadingProposals(true);

    try {
      const response = await getProviderProposals();
      const normalized = Array.isArray(response)
        ? response
          .map((proposal) => mapProposalToCard(proposal))
          .filter((item) => item !== null)
        : [];
      setProposals(normalized);
    } catch (error) {
      console.error('❌ Error obteniendo presupuestos del proveedor:', error.message || error);
    } finally {
      setLoadingProposals(false);
      setHasFetchedProposals(true);
    }
  }, []);

  useEffect(() => {
    loadMatchingRequests();
    loadProposals();
  }, [loadMatchingRequests, loadProposals]);

  useEffect(() => {
    if (
      activeTab === 'presupuestos'
      && !loadingProposals
      && !hasFetchedProposals
    ) {
      loadProposals();
    }
  }, [activeTab, hasFetchedProposals, loadingProposals, loadProposals]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadMatchingRequests(), loadProposals()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadMatchingRequests, loadProposals]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    const source = activeTab === 'nuevas' ? matchingRequests : proposals;

    if (!query) {
      return source;
    }

    return source.filter((item) => {
      const fields = activeTab === 'nuevas'
        ? [item.title, item.address]
        : [item.title, item.address, item.clientName, item.statusLabel];
      return fields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(query),
      );
    });
  }, [activeTab, search, matchingRequests, proposals]);

  const renderItem = ({ item }) => {
    if (activeTab === 'nuevas') {
      const rawRequest = item.rawRequest;
      const proposalSummary = item.proposalSummary;

      return (
        <NewRequestCard
          item={item}
          onPress={() =>
            navigation.navigate('ProviderRequestDetail', {
              request: rawRequest,
              requestId: rawRequest?.id ?? item.id,
            })
          }
          onAccept={() => navigation.navigate('CreateProposal', {
            requestSummary: proposalSummary || {
              id: item.id,
              title: item.title,
              address: item.address,
              request_type: item.fast ? 'FAST' : 'LICITACION',
              preferred_start_at: item.preferred_start_at,
              preferred_end_at: item.preferred_end_at,
            },
          })}
          onReject={() => { }}
        />
      );
    }
    return (
      <ProviderProposalCard
        item={item}
        onPress={() => {
          navigation.navigate('ProviderRequestDetail', {
            requestId: item.requestId,
            proposal: item.rawProposal,
            requestPreview: item.requestPreview,
          });
        }}
      />
    );
  };


  const loading = loadingMatching || loadingProposals;

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

function mapProposalToCard(proposal) {
  if (!proposal || proposal.id === undefined || proposal.id === null) {
    return null;
  }

  const normalizedStatus = typeof proposal.status === 'string'
    ? proposal.status.toLowerCase()
    : null;

  const statusLabel = normalizedStatus
    ? PROPOSAL_STATUS_LABELS[normalizedStatus] || proposal.status
    : 'Sin estado';

  const createdLabel = formatDateTimeLabel(proposal.created_at) || DEFAULT_DATE_LABEL;
  const validUntilLabel = proposal.valid_until
    ? formatDateTimeLabel(proposal.valid_until)
    : null;

  const requestPreview = {
    id: proposal.request_id ?? null,
    title: proposal.request_title ?? 'Solicitud sin título',
    request_type: proposal.request_type ?? null,
    status: proposal.request_status ?? null,
    city_snapshot: proposal.request_city ?? DEFAULT_ADDRESS_LABEL,
    description: proposal.request_description ?? null,
    preferred_start_at: proposal.preferred_start_at ?? null,
    preferred_end_at: proposal.preferred_end_at ?? null,
    created_at: proposal.request_created_at ?? proposal.created_at ?? null,
    client_snapshot: proposal.client_name ?? null,
    attachments: Array.isArray(proposal.request_attachments)
      ? proposal.request_attachments
      : [],
  };

  return {
    id: String(proposal.id),
    requestId: proposal.request_id ?? null,
    title: buildTitleFromRequest(proposal.request_title, proposal.request_description),
    address: proposal.request_city || DEFAULT_ADDRESS_LABEL,
    status: normalizedStatus,
    statusLabel,
    createdAt: createdLabel,
    validUntil: validUntilLabel,
    amountLabel: formatCurrencyValue(proposal.quoted_price, proposal.currency || 'ARS'),
    rawProposal: proposal,
    requestType: proposal.request_type,
    clientName: proposal.client_name || 'Cliente',
    requestPreview,
  };
}