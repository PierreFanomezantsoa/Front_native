// ===================================================================
//      PUBLICATION SCREEN OPTIMISÉ + UI/UX MODERNE
// ===================================================================

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Modal, // <-- NOUVEAU: Import de Modal
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

// ===================================================================
//        CONSTANTES DE STYLE ET API (Plus claires)
// ===================================================================
const API_URL = "http://192.168.137.118:3000"; // URL à adapter
const COLOR_PALETTE = {
  primary: "#4F46E5", // Indigo plus vibrant
  secondary: "#10B981", // Vert succès
  danger: "#EF4444", // Rouge danger
  background: "#F9FAFB", // Fond très clair
  cardBg: "#FFFFFF",
  textBase: "#1F2937",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};
const SCREEN_WIDTH = Dimensions.get("window").width;

// ===================================================================
//        COMPOSANT: PublicationCard (Amélioré)
// (NON MODIFIÉ, MAIS INCLUS POUR LA CLARTÉ)
// ===================================================================
const PublicationCard = React.memo(({ item, editAction, deleteAction }) => {
  const prixInitial = parseFloat(item.prix);
  const prixPromo = parseFloat(item.prixPromo);
  const hasDiscount = !isNaN(prixInitial) && !isNaN(prixPromo) && prixInitial > prixPromo;
  const discountPercent = hasDiscount
    ? Math.round(((prixInitial - prixPromo) / prixInitial) * 100)
    : 0;

  return (
    <View style={cardStyles.card}>
      {/* Image */}
      <View style={cardStyles.cardImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={cardStyles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={cardStyles.noImage}>
            <Ionicons name="image-outline" size={60} color={COLOR_PALETTE.textMuted} />
          </View>
        )}
        
        {/* Badge de réduction */}
        {hasDiscount && discountPercent > 0 && (
          <View style={cardStyles.discountBadge}>
            <Text style={cardStyles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={cardStyles.cardBody}>
        <Text style={cardStyles.cardTitle} numberOfLines={2}>
          {item.nom || "Produit sans nom"}
        </Text>
        <Text style={cardStyles.cardDesc} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Prix */}
        <View style={cardStyles.priceRow}>
          {hasDiscount && (
            <Text style={cardStyles.oldPrice}>{item.prix} €</Text>
          )}
          <Text style={cardStyles.newPrice}>{item.prixPromo} €</Text>
        </View>

        {/* Actions (Rendues plus compactes et icôniques) */}
        <View style={cardStyles.cardActions}>
          <TouchableOpacity
            style={cardStyles.actionButton}
            onPress={() => editAction(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={COLOR_PALETTE.primary} />
            <Text style={cardStyles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cardStyles.actionButton, cardStyles.deleteButton]}
            onPress={() => deleteAction(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={COLOR_PALETTE.danger} />
            <Text style={[cardStyles.actionButtonText, cardStyles.deleteButtonText]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// ===================================================================
//        COMPOSANT: PublicationFormModal (NOUVEAU)
// ===================================================================
const PublicationFormModal = ({ 
  modalVisible, 
  onClose, 
  form, 
  setForm, 
  editingId, 
  handleFormSubmit, 
  submitting, 
  pickImage 
}) => {
  const scrollViewRef = useRef(null);

  // Le rendu du formulaire est déplacé ici (légèrement modifié pour le contexte Modal)
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={modalStyles.centeredView}
      >
        <View style={modalStyles.modalView}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={formStyles.form}>
              <View style={formStyles.formHeader}>
                <Text style={formStyles.formTitle}>
                  {editingId ? "✏️ Modifier le produit" : "➕ Publier un nouveau produit"}
                </Text>
                <TouchableOpacity onPress={onClose} style={formStyles.closeBtn}>
                  <Ionicons name="close-circle-outline" size={32} color={COLOR_PALETTE.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Image Picker */}
              <TouchableOpacity
                style={formStyles.imagePicker}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {form.image ? (
                  <>
                    <Image
                      source={{ uri: form.image }}
                      style={formStyles.formImage}
                      resizeMode="cover"
                    />
                    <View style={formStyles.imageOverlay}>
                      <Ionicons name="camera" size={24} color="#FFF" />
                      <Text style={formStyles.changeImageText}>Changer l'image</Text>
                    </View>
                  </>
                ) : (
                  <View style={formStyles.imagePickerContent}>
                    <Ionicons name="cloud-upload-outline" size={48} color={COLOR_PALETTE.primary} />
                    <Text style={formStyles.imagePickerText}>
                      Appuyez pour ajouter une image (16:9 recommandé)
                    </Text>
                    <Text style={formStyles.imagePickerSubtext}>JPG, PNG</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Nom */}
              <View style={formStyles.inputGroup}>
                <Text style={formStyles.label}>Nom du produit (optionnel)</Text>
                <TextInput
                  placeholder="Ex: iPhone 15 Pro"
                  style={formStyles.input}
                  value={form.nom}
                  onChangeText={(t) => setForm({ ...form, nom: t })}
                />
              </View>

              {/* Description */}
              <View style={formStyles.inputGroup}>
                <Text style={formStyles.label}>
                  Description <Text style={formStyles.required}>*</Text>
                </Text>
                <TextInput
                  multiline
                  placeholder="Décrivez votre produit... (Points clés, fonctionnalités)"
                  style={[formStyles.input, formStyles.textArea]}
                  value={form.description}
                  onChangeText={(t) => setForm({ ...form, description: t })}
                  textAlignVertical="top"
                />
              </View>

              {/* Prix et Prix Promo */}
              <View style={formStyles.priceContainer}>
                <View style={[formStyles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={formStyles.label}>Prix initial (€)</Text>
                  <TextInput
                    placeholder="99.00"
                    style={formStyles.input}
                    keyboardType="decimal-pad"
                    value={form.prix}
                    onChangeText={(t) => setForm({ ...form, prix: t.replace(',', '.') })}
                  />
                </View>

                <View style={[formStyles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={formStyles.label}>
                    Prix promo (€) <Text style={formStyles.required}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="79.00"
                    style={[formStyles.input, { borderColor: COLOR_PALETTE.primary }]} // Mise en évidence du champ obligatoire
                    keyboardType="decimal-pad"
                    value={form.prixPromo}
                    onChangeText={(t) => setForm({ ...form, prixPromo: t.replace(',', '.') })}
                  />
                </View>
              </View>

              {/* Bouton Submit */}
              <TouchableOpacity
                style={[formStyles.submitBtn, submitting && formStyles.submitBtnDisabled]}
                onPress={handleFormSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons
                      name={editingId ? "save" : "send"}
                      size={22}
                      color="#FFF"
                    />
                    <Text style={formStyles.submitBtnText}>
                      {editingId ? "Mettre à jour le produit" : "Publier le produit"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


// ===================================================================
//        COMPOSANT PRINCIPAL (Mis à jour)
// ===================================================================
export default function PublicationScreen({ navigation }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false); // Utilisé pour le Modal
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    prix: "",
    prixPromo: "",
    image: null,
    imageFile: null,
  });

  const flatListRef = useRef(null);

  // Nouvelle fonction pour ouvrir le formulaire (maintenant le modal)
  const openForm = (pub = null) => {
    if (pub) {
      // Mode édition
      setForm({
        nom: pub.nom || "",
        description: pub.description || "",
        prix: pub.prix?.toString() || "",
        prixPromo: pub.prixPromo?.toString() || "",
        image: pub.image || null,
        imageFile: null,
      });
      setEditingId(pub.id);
    } else {
      // Mode ajout
      resetFormState();
    }
    setFormVisible(true); // Ouvre le Modal
  };
  
  // Fonction de fermeture et de réinitialisation pour le Modal
  const resetForm = () => {
    setFormVisible(false); // Ferme le Modal
    setEditingId(null);
    resetFormState();
  };

  const resetFormState = () => {
    setForm({
      nom: "",
      description: "",
      prix: "",
      prixPromo: "",
      image: null,
      imageFile: null,
    });
  }


  // ===============================================================
  //    IMAGE PICKER → CHOIX IMAGE (Fonctionnalité inchangée)
  // ===============================================================
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert(
        "Permission requise",
        "L'accès à la galerie est nécessaire pour sélectionner une image."
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setForm({
        ...form,
        image: asset.uri,
        imageFile: {
          uri: asset.uri,
          type: "image/jpeg",
          name: `pub_${Date.now()}.jpg`,
        },
      });
    }
  };

  // ===============================================================
  //             FETCH INIT (Fonctionnalité inchangée)
  // ===============================================================
  const getPublications = async () => {
    try {
      const res = await axios.get(`${API_URL}/publications`);
      setPublications(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les publications.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================================
  //                  USE EFFECT (Fonctionnalité inchangée)
  // ===============================================================
  useEffect(() => {
    getPublications();

    const socket = io(API_URL, { transports: ["websocket"] });

    socket.on("publication_created", (pub) => {
      setPublications((p) => [pub, ...p]);
      // Scroll vers le haut pour voir la nouvelle publication
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    });

    socket.on("publication_updated", (pub) =>
      setPublications((p) => p.map((x) => (x.id === pub.id ? pub : x)))
    );

    socket.on("publication_deleted", ({ id }) =>
      setPublications((p) => p.filter((x) => x.id !== id))
    );

    return () => socket.disconnect();
  }, []);

  // ===============================================================
  //                CREATE PUBLICATION (Fonctionnalité mise à jour)
  // ===============================================================
  const createPublication = async () => {
    if (!form.description || !form.prixPromo) {
      return Alert.alert(
        "Champs requis",
        "La description et le prix promo sont obligatoires."
      );
    }

    if (!form.imageFile) {
      return Alert.alert(
        "Image requise",
        "Veuillez sélectionner une image pour votre publication."
      );
    }

    setSubmitting(true);
    let data = new FormData();
    data.append("nom", form.nom);
    data.append("description", form.description);
    data.append("prix", form.prix);
    data.append("prixPromo", form.prixPromo);
    data.append("image", form.imageFile);

    try {
      await axios.post(`${API_URL}/publications`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm(); // Ferme le modal et réinitialise le formulaire
      Alert.alert("✅ Succès", "Publication créée avec succès !");
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de créer la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================================================
  //                UPDATE PUBLICATION (Fonctionnalité mise à jour)
  // ===============================================================
  const updatePublication = async (id) => {
    if (!form.description || !form.prixPromo) {
      return Alert.alert(
        "Champs requis",
        "La description et le prix promo sont obligatoires."
      );
    }

    setSubmitting(true);
    let data = new FormData();
    data.append("nom", form.nom);
    data.append("description", form.description);
    data.append("prix", form.prix);
    data.append("prixPromo", form.prixPromo);
    if (form.imageFile) {
      data.append("image", form.imageFile);
    }

    try {
      await axios.put(`${API_URL}/publications/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm(); // Ferme le modal et réinitialise le formulaire
      Alert.alert("✅ Succès", "Publication modifiée avec succès !");
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de modifier la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================================================
  //                  DELETE PUBLICATION (Fonctionnalité inchangée)
  // ===============================================================
  const deletePublication = (id) => {
    Alert.alert(
      "Confirmer la suppression",
      "Voulez-vous vraiment supprimer cette publication ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/publications/${id}`);
              Alert.alert("✅ Supprimé", "Publication supprimée avec succès.");
            } catch (err) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          },
        },
      ]
    );
  };

  // ===============================================================
  //                 EDIT PUBLICATION (Utilise openForm)
  // ===============================================================
  const editPublication = (pub) => {
    openForm(pub);
  };

  const handleFormSubmit = () => {
    if (editingId) {
      updatePublication(editingId);
    } else {
      createPublication();
    }
  };


  // ===============================================================
  //                  EMPTY STATE (Amélioré visuellement)
  // ===============================================================
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="pricetags-outline" size={80} color={COLOR_PALETTE.border} />
      <Text style={styles.emptyTitle}>Rien à afficher ici</Text>
      <Text style={styles.emptyText}>
        Créez et gérez les offres spéciales de vos produits.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => openForm()} // Utilise openForm
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
        <Text style={styles.emptyBtnText}>Ajouter une publication</Text>
      </TouchableOpacity>
    </View>
  );

  // ===============================================================
  //                  RENDER MAIN SCREEN
  // ===============================================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLOR_PALETTE.primary} /> 
      
      {/* Header (Visuel plus impactant) */}
      <View style={headerStyles.header}>
        <View>
          <Text style={headerStyles.headerTitle}>Tableau de Bord des Offres</Text>
          <Text style={headerStyles.headerSubtitle}>
            Gérez vos {publications.length} publication{publications.length > 1 ? "s" : ""} active{publications.length > 1 ? "s" : ""}.
          </Text>
        </View>

        <TouchableOpacity
          style={headerStyles.addBtn}
          onPress={() => {
            if (formVisible) resetForm(); // Ferme le modal si déjà ouvert
            else openForm(); // Ouvre le modal
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={formVisible ? "close" : "add"}
            size={28}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      {/* MODAL du Formulaire */}
      <PublicationFormModal
        modalVisible={formVisible}
        onClose={resetForm}
        form={form}
        setForm={setForm}
        editingId={editingId}
        handleFormSubmit={handleFormSubmit}
        submitting={submitting}
        pickImage={pickImage}
      />

      {/* Liste des publications */}
      <Text style={styles.listSectionTitle}>Publications en cours</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={publications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PublicationCard 
                item={item} 
                editAction={editPublication} 
                deleteAction={deletePublication} 
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            publications.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ===================================================================
//         STYLES (Séparés par Composant pour la clarté)
// ===================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_PALETTE.background,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR_PALETTE.textBase,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 5,
  },
  listContent: {
    padding: 15,
    paddingBottom: 40, // Espace pour le bas
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLOR_PALETTE.textMuted,
  },

  // EMPTY STATE
  emptyListContainer: {
    flexGrow: 1, // Pour que EmptyState puisse se centrer
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: COLOR_PALETTE.cardBg,
    margin: 15,
    borderRadius: 16,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLOR_PALETTE.textBase,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLOR_PALETTE.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR_PALETTE.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  emptyBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

// ===================================================================
//         STYLES - MODAL (NOUVEAU)
// ===================================================================
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)', // Arrière-plan sombre
  },
  modalView: {
    margin: 20,
    backgroundColor: COLOR_PALETTE.background, // Le fond du modal lui-même peut être la couleur de fond
    borderRadius: 20,
    padding: 0, // Les paddings seront gérés par le formStyles.form
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '85%', // Limite la hauteur du modal
    width: SCREEN_WIDTH * 0.9, // Prend 90% de la largeur de l'écran
  },
});

// ===================================================================
//         STYLES - HEADER (INCHANGÉ)
// ===================================================================
const headerStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 15,
    backgroundColor: COLOR_PALETTE.primary,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 5,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLOR_PALETTE.secondary, // Couleur d'accentuation
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: COLOR_PALETTE.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});

// ===================================================================
//         STYLES - FORM (Adaptés pour le Modal)
// ===================================================================
const formStyles = StyleSheet.create({
  form: {
    // Les marges de 15 sont retirées ici car elles sont gérées par le modalStyles.modalView
    margin: 0, 
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLOR_PALETTE.cardBg, // Fond du formulaire à l'intérieur du modal
    // Les bordures et ombres sont déplacées vers modalStyles.modalView
    borderWidth: 0, 
    borderColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    width: SCREEN_WIDTH * 0.9 - 40, // Adaptation à la taille du modal
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLOR_PALETTE.textBase,
  },
  closeBtn: {
    padding: 4,
  },

  // INPUT
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLOR_PALETTE.textMuted,
    marginBottom: 8,
  },
  required: {
    color: COLOR_PALETTE.danger,
  },
  input: {
    backgroundColor: COLOR_PALETTE.background,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.border,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    color: COLOR_PALETTE.textBase,
    fontWeight: "500",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  priceContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },

  // IMAGE PICKER
  imagePicker: {
    backgroundColor: COLOR_PALETTE.background,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLOR_PALETTE.border,
    borderStyle: "dashed",
  },
  formImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  changeImageText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  imagePickerContent: {
    alignItems: "center",
    padding: 10,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLOR_PALETTE.textBase,
    marginTop: 12,
    textAlign: 'center',
  },
  imagePickerSubtext: {
    fontSize: 13,
    color: COLOR_PALETTE.textMuted,
    marginTop: 4,
  },

  // SUBMIT BUTTON
  submitBtn: {
    backgroundColor: COLOR_PALETTE.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },
});

// ===================================================================
//         STYLES - CARD (INCHANGÉ)
// ===================================================================
const cardStyles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: COLOR_PALETTE.cardBg,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.border,
  },
  cardImageContainer: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 180, // Légèrement plus court pour un look moderne
  },
  noImage: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLOR_PALETTE.background,
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLOR_PALETTE.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLOR_PALETTE.textBase,
    marginBottom: 6,
  },
  cardDesc: {
    color: COLOR_PALETTE.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline", // Alignement pour rendre les prix plus lisibles
    marginBottom: 16,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: COLOR_PALETTE.textMuted,
    fontSize: 16,
    marginRight: 12,
    fontWeight: '500',
  },
  newPrice: {
    fontSize: 28, // Prix promo plus grand
    fontWeight: "900", // Très gras
    color: COLOR_PALETTE.primary,
  },

  // CARD ACTIONS
  cardActions: {
    flexDirection: "row",
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8, // Ajout d'un peu d'espace avec le prix
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF", // Light Indigo
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2", // Light Red
    borderColor: "#FEE2E2",
  },
  actionButtonText: {
    color: COLOR_PALETTE.primary,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  deleteButtonText: {
    color: COLOR_PALETTE.danger,
  }
});