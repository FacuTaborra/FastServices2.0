import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NewRequestCard from '../../components/ProviderRequestCards/NewRequestCard';
import ChatRequestCard from '../../components/ProviderRequestCards/ChatRequestCard';
import ReviewModal from '../../components/ReviewModal/ReviewModal';
import ProjectRequestCard from '../../components/ProviderRequestCards/ProjectRequestCard';
import Spinner from '../../components/Spinner/Spinner';
import styles from './ProviderRequestsScreen.styles';
import data from '../../data/providerRequests';


export default function ProviderRequestsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('nuevas');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1000);
  };

  const filtered = () => {
    const current = data[activeTab];
    return current.filter(
      (i) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.address && i.address.toLowerCase().includes(search.toLowerCase())),
    );
  };

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
          onAccept={() => {}}
          onReject={() => {}}
        />
      );
    }
    if (activeTab === 'chats') {
      return (
        <ChatRequestCard
          item={item}
          onPress={() => navigation.navigate('Chat', { isProvider: true, request: item })}
          detail={() => navigation.navigate('RequestDetail', { requestId: item.id, showButton: false })}
        />
      );
    }
    if (activeTab === 'proyectos') {
      return (
        <ProjectRequestCard
          item={item}
          onPress={() => openReview(item)}
          onPressChat={() => navigation.navigate('Chat')}
          detail={() => navigation.navigate('RequestDetail', { requestId: item.id, showButton: false })}
        />
      );
    }
  };

  const openReview = (item) => {
    if (item.status === 'calificada') {
      setSelectedReview(item);
      setReviewVisible(true);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Solicitudes</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setShowSearch((v) => !v)}>
            <Ionicons name="search" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.iconMargin}>
            <Ionicons name="filter" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#4776a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      )}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nuevas' && styles.tabButtonActive]}
          onPress={() => setActiveTab('nuevas')}
        >
          <Text style={[styles.tabText, activeTab === 'nuevas' && styles.tabTextActive]}>Nuevas</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.nuevas.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>Presupuestos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'proyectos' && styles.tabButtonActive]}
          onPress={() => setActiveTab('proyectos')}
        >
          <Text style={[styles.tabText, activeTab === 'proyectos' && styles.tabTextActive]}>Proyectos</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sin solicitudes nuevas por ahora</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal transparent visible={filterModal} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterModal(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption} onPress={() => setFilterModal(false)}>
              <Text>Ordenar por fecha</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => setFilterModal(false)}>
              <Text>Ordenar por precio</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ReviewModal
        visible={reviewVisible}
        onClose={() => {
          setReviewVisible(false);
          setSelectedReview(null);
        }}
        item={selectedReview}
      />
    </View>
  );
}