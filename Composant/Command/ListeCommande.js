import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ScrollView, ActivityIndicator,
  Platform, StatusBar
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

// 🎨 Palette de Couleurs Améliorée
const PRIMARY_COLOR = '#008080'; // Sarcelle foncé (Marque)
const ACCENT_COLOR = '#008080'; // Orange vif (Actions/Danger)
const BACKGROUND_COLOR = '#F0F2F5'; // Gris très clair (Arrière-plan général)
const CARD_BACKGROUND = '#FFFFFF'; // Blanc pur (Cartes, Modals)
const SUCCESS_COLOR = '#2E8B57'; // Vert forêt (Statut 'Terminé/Payé')
const WARNING_COLOR = '#FFC107'; // Jaune ambré (Statut 'En cours')
const DANGER_COLOR = '#D32F2F'; // Rouge (Supprimer)
const TEXT_COLOR = '#333333'; // Texte principal
const SECONDARY_TEXT_COLOR = '#666666'; // Texte secondaire

const BACKEND_URL = 'http://192.168.137.1:8000/commande';

export default function CommandList({ navigation }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [commandeItem, setCommandeItem] = useState({
    id: null,
    table_number: '',
    order_name: '',
    total_amount: '',
    payment_method: '',
    status: '',
    items: '[]', // Assurez-vous que c'est une chaîne JSON valide par défaut
    created_at: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // FORMATEUR DE DATE
  const formatDate = (dateString) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(BACKEND_URL);
      const formattedCommandes = response.data.map(item => ({
        ...item,
        table_number: String(item.table_number),
        total_amount: String(item.total_amount),
        // Assurez-vous que items est une chaîne JSON avant de le stocker
        items: item.items ? JSON.stringify(item.items) : '[]',
      }));
      setCommandes(formattedCommandes || []);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de récupérer les commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommandes(); }, []);

  const updateField = (field, value) => {
    setCommandeItem({ ...commandeItem, [field]: value });
  };

  const saveCommande = async () => {
    if (!commandeItem.table_number || !commandeItem.order_name) {
      return Alert.alert("Erreur", "Table et nom obligatoires");
    }

    try {
      setLoading(true);

      let parsedItems = [];
      try { parsedItems = JSON.parse(commandeItem.items); }
      catch {
        Alert.alert("Erreur JSON", "Items n'est pas un JSON valide.");
        setLoading(false);
        return;
      }

      const dataToSend = {
        table_number: parseInt(commandeItem.table_number),
        order_name: commandeItem.order_name,
        total_amount: parseFloat(commandeItem.total_amount) || 0,
        payment_method: commandeItem.payment_method || 'Inconnu',
        status: commandeItem.status || 'En cours',
        created_at: isEditing ? commandeItem.created_at : new Date().toISOString(),
        items: parsedItems,
      };

      if (isEditing) {
        await axios.put(`${BACKEND_URL}/${commandeItem.id}`, dataToSend);
      } else {
        await axios.post(BACKEND_URL, dataToSend);
      }

      setModalVisible(false);
      setCommandeItem({ id: null, table_number: '', order_name: '', total_amount: '', payment_method: '', status: '', items: '[]', created_at: '' });
      setIsEditing(false);
      fetchCommandes();
    } catch (e) {
      Alert.alert("Erreur", "Enregistrement impossible");
    } finally {
      setLoading(false);
    }
  };

  const deleteCommande = (id) => {
    Alert.alert('Confirmation', 'Supprimer cette commande ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await axios.delete(`${BACKEND_URL}/${id}`);
            fetchCommandes();
          } catch {
            Alert.alert("Erreur", "Suppression impossible");
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const editCommande = (item) => {
    setCommandeItem({
      ...item,
      table_number: String(item.table_number),
      total_amount: String(item.total_amount),
      items: item.items ? JSON.stringify(item.items) : '[]',
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const getStatusStyle = (status) => {
    const lower = status.toLowerCase();
    if (lower.includes('terminé') || lower.includes('payé'))
      return { color: SUCCESS_COLOR, borderColor: SUCCESS_COLOR };
    if (lower.includes('annulé') || lower.includes('echec'))
      return { color: DANGER_COLOR, borderColor: DANGER_COLOR };
    return { color: WARNING_COLOR, borderColor: WARNING_COLOR };
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>

          {/* Ligne 1: Titre et Table */}
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={1}>
              <Ionicons name="receipt-outline" size={18} color={PRIMARY_COLOR} /> {item.order_name}
            </Text>
            <View style={styles.tableBadge}>
              <Text style={styles.tableNumber}>Table {item.table_number}</Text>
            </View>
          </View>

          {/* Ligne 2: Montant et Statut */}
          <View style={[styles.row, { marginTop: 8, marginBottom: 5 }]}>
            <Text style={styles.totalAmount}>
              {parseFloat(item.total_amount).toFixed(2)} Ar
            </Text>
            <View style={[styles.statusBadge, { borderColor: statusStyle.borderColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
            </View>
          </View>

          {/* Ligne 3: Détails (Items et Paiement) */}
          <View style={styles.rowDetail}>
            <Text style={styles.detailText}>
              <Ionicons name="fast-food-outline" size={14} color={SECONDARY_TEXT_COLOR} /> {JSON.parse(item.items).length} plat(s)
            </Text>
            <Text style={styles.detailText}>
              <MaterialIcons name="credit-card" size={14} color={SECONDARY_TEXT_COLOR} /> {item.payment_method || 'Inconnu'}
            </Text>
          </View>

          {/* Ligne 4: DATE */}
          <Text style={styles.detailDate}>
            <Ionicons name="time-outline" size={12} color="#888" /> Commandé à: {formatDate(item.created_at)}
          </Text>

        </View>

        {/* Actions */}
        <View style={styles.iconColumn}>
          <TouchableOpacity onPress={() => editCommande(item)} style={[styles.iconBtn, { backgroundColor: PRIMARY_COLOR + '15' }]}>
            <Ionicons name="create-outline" size={24} color={PRIMARY_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteCommande(item.id)} style={[styles.iconBtn, { backgroundColor: DANGER_COLOR + '15' }]}>
            <Ionicons name="trash-outline" size={24} color={DANGER_COLOR} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* Barre Supérieure */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color={CARD_BACKGROUND} />
        </TouchableOpacity>
        <Text style={styles.topBarText}>Gestion des Commandes</Text>
      </View>

      {/* Liste / Indicateur de chargement */}
      {loading && commandes.length === 0 ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={commandes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          refreshing={loading}
          onRefresh={fetchCommandes}
          ListEmptyComponent={() => (
            <View style={styles.emptyList}>
              <Ionicons name="sad-outline" size={50} color={SECONDARY_TEXT_COLOR} />
              <Text style={styles.emptyText}>Aucune commande trouvée.</Text>
              <Text style={styles.emptySubText}>Appuyez sur '+' pour ajouter.</Text>
            </View>
          )}
        />
      )}

      {/* Bouton Ajouter */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setIsEditing(false);
          setCommandeItem({
            id: null, table_number: '', order_name: '', total_amount: '',
            payment_method: 'Espèces', status: 'En cours', items: '[]',
            created_at: new Date().toISOString()
          });
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-outline" size={30} color={CARD_BACKGROUND} />
      </TouchableOpacity>

      {/* Modal d'ajout/édition */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Modifier la commande" : "Nouvelle commande"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={30} color={DANGER_COLOR} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>

            {/* NOM */}
            <Text style={styles.inputLabel}>Nom de la commande *</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="person-circle-outline" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder="Ex: Table 5 - Famille Dupont"
                value={commandeItem.order_name}
                onChangeText={text => updateField('order_name', text)}
                style={styles.input}
              />
            </View>

            {/* TABLE */}
            <Text style={styles.inputLabel}>Numéro de table *</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="restaurant-outline" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder="Ex: 5"
                value={commandeItem.table_number}
                onChangeText={text => updateField('table_number', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            {/* MONTANT */}
            <Text style={styles.inputLabel}>Montant total (Ar)</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="cash-outline" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder="Ex: 150000.50"
                value={commandeItem.total_amount}
                onChangeText={text => updateField('total_amount', text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            {/* PAIEMENT */}
            <Text style={styles.inputLabel}>Moyen de paiement</Text>
            <View style={styles.inputGroup}>
              <MaterialIcons name="payment" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder="Ex: Espèces, Carte, MVola..."
                value={commandeItem.payment_method}
                onChangeText={text => updateField('payment_method', text)}
                style={styles.input}
              />
            </View>

            {/* STATUT */}
            <Text style={styles.inputLabel}>Statut de la commande</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="pulse-outline" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder="Ex: En cours, Terminé, Payé..."
                value={commandeItem.status}
                onChangeText={text => updateField('status', text)}
                style={styles.input}
              />
            </View>

            {/* ITEMS */}
            <Text style={styles.inputLabel}>Détails des Items (JSON)</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="code-slash-outline" size={22} color={PRIMARY_COLOR} style={styles.inputIcon} />
              <TextInput
                placeholder='Ex: [{"plat": "Pizza", "qte": 1}]'
                value={commandeItem.items}
                onChangeText={text => updateField('items', text)}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Boutons d'action */}
            <TouchableOpacity style={styles.saveBtn} onPress={saveCommande} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.saveText}>{isEditing ? "Mettre à jour" : "Ajouter"}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10, marginBottom: 30 }]} onPress={() => setModalVisible(false)} disabled={loading}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// 📐 Styles Améliorés
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },

  // --- Barre Supérieure ---
  topBar: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    height: Platform.OS === 'android' ? 90 + StatusBar.currentHeight : 100,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 3,
  },
  topBarText: { color: CARD_BACKGROUND, fontSize: 22, fontWeight: '900' },
  backBtn: { position: "absolute", left: 15, bottom: 15, padding: 5 },

  // --- Liste et Vues Vides ---
  flatListContent: { paddingVertical: 10, paddingBottom: 100 },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    padding: 20,
    backgroundColor: CARD_BACKGROUND,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: { fontSize: 18, color: TEXT_COLOR, marginTop: 15, fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: SECONDARY_TEXT_COLOR, marginTop: 5 },

  // --- Carte d'Item ---
  card: {
    flexDirection: 'row',
    backgroundColor: CARD_BACKGROUND,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    // Ombre douce pour un effet 'flottant'
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardInfo: { flex: 1, marginRight: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowDetail: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },

  title: { fontWeight: '800', fontSize: 18, color: TEXT_COLOR, flex: 1, marginRight: 10 },
  tableBadge: {
    backgroundColor: PRIMARY_COLOR + '30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableNumber: { fontWeight: 'bold', fontSize: 14, color: PRIMARY_COLOR },
  totalAmount: { fontWeight: '800', fontSize: 18, color: SUCCESS_COLOR },

  detailText: { fontSize: 13, color: SECONDARY_TEXT_COLOR, flex: 1 },
  detailDate: { fontSize: 12, color: '#888', marginTop: 5, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  iconColumn: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    marginVertical: 5,
  },

  // --- Bouton Flottant (Ajouter) ---
  addBtn: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT_COLOR, // Utilisation de l'ACCENT pour l'action principale
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },

  // --- Modal (Formulaire) ---
  modalContainer: { flex: 1, backgroundColor: BACKGROUND_COLOR, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: CARD_BACKGROUND,
  },
  modalScroll: { paddingHorizontal: 20, paddingTop: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: PRIMARY_COLOR },

  inputLabel: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: CARD_BACKGROUND,
    marginBottom: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: TEXT_COLOR },
  textArea: { height: 100, paddingVertical: 12 },

  saveBtn: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  saveText: { color: "#fff", fontWeight: 'bold', fontSize: 18 },

  cancelBtn: { padding: 16, borderRadius: 10, alignItems: 'center', backgroundColor: SECONDARY_TEXT_COLOR, marginTop: 10, elevation: 3 },
  cancelText: { color: "#fff", fontSize: 16, fontWeight: 'bold' }
});