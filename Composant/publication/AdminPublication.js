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
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.1.133:3000";
const PRIMARY = "#2563EB";
const DANGER = "#DC2626";
const SUCCESS = "#10B981";
const CARD_BG = "#FFF";
const BG = "#F8FAFC";
const GRAY_TEXT = "#64748B";
const SCREEN_WIDTH = Dimensions.get("window").width;

// ===================================================================
//        COMPOSANT PRINCIPAL
// ===================================================================
export default function PublicationScreen({ navigation }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
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
  const scrollViewRef = useRef(null);

  // ===============================================================
  //    IMAGE PICKER → CHOIX IMAGE
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
  //                       FETCH INIT
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
  //                         USE EFFECT
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
  //                        CREATE PUBLICATION
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

      resetForm();
      Alert.alert("✅ Succès", "Publication créée avec succès !");
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de créer la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================================================
  //                        UPDATE PUBLICATION
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

      resetForm();
      Alert.alert("✅ Succès", "Publication modifiée avec succès !");
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de modifier la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================================================
  //                        DELETE PUBLICATION
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
  //                   EDIT PUBLICATION
  // ===============================================================
  const editPublication = (pub) => {
    setForm({
      nom: pub.nom || "",
      description: pub.description || "",
      prix: pub.prix?.toString() || "",
      prixPromo: pub.prixPromo?.toString() || "",
      image: pub.image || null,
      imageFile: null,
    });
    setFormVisible(true);
    setEditingId(pub.id);
    
    // Scroll vers le formulaire
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const handleFormSubmit = () => {
    if (editingId) {
      updatePublication(editingId);
    } else {
      createPublication();
    }
  };

  const resetForm = () => {
    setFormVisible(false);
    setForm({
      nom: "",
      description: "",
      prix: "",
      prixPromo: "",
      image: null,
      imageFile: null,
    });
    setEditingId(null);
  };

  // ===============================================================
  //                        RENDER FORM
  // ===============================================================
  const renderForm = () => (
    <View style={styles.form}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {editingId ? "✏️ Modifier la publication" : "➕ Nouvelle publication"}
        </Text>
        <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
          <Ionicons name="close-circle" size={28} color={GRAY_TEXT} />
        </TouchableOpacity>
      </View>

      {/* Image Picker */}
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {form.image ? (
          <>
            <Image
              source={{ uri: form.image }}
              style={styles.formImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.changeImageText}>Changer l'image</Text>
            </View>
          </>
        ) : (
          <View style={styles.imagePickerContent}>
            <Ionicons name="image-outline" size={48} color={PRIMARY} />
            <Text style={styles.imagePickerText}>
              Appuyez pour ajouter une image
            </Text>
            <Text style={styles.imagePickerSubtext}>JPG, PNG (max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Nom */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom du produit (optionnel)</Text>
        <TextInput
          placeholder="Ex: iPhone 15 Pro"
          style={styles.input}
          value={form.nom}
          onChangeText={(t) => setForm({ ...form, nom: t })}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          multiline
          placeholder="Décrivez votre produit..."
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(t) => setForm({ ...form, description: t })}
          textAlignVertical="top"
        />
      </View>

      {/* Prix et Prix Promo */}
      <View style={styles.priceContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Prix initial (€)</Text>
          <TextInput
            placeholder="99.00"
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.prix}
            onChangeText={(t) => setForm({ ...form, prix: t })}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>
            Prix promo (€) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="79.00"
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.prixPromo}
            onChangeText={(t) => setForm({ ...form, prixPromo: t })}
          />
        </View>
      </View>

      {/* Bouton Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleFormSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons
              name={editingId ? "checkmark-circle" : "add-circle"}
              size={22}
              color="#FFF"
            />
            <Text style={styles.submitBtnText}>
              {editingId ? "Mettre à jour" : "Publier"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ===============================================================
  //                        PUBLICATION CARD
  // ===============================================================
  const PublicationCard = ({ item }) => {
    const hasDiscount = item.prix && parseFloat(item.prix) > parseFloat(item.prixPromo);
    const discountPercent = hasDiscount
      ? Math.round(((item.prix - item.prixPromo) / item.prix) * 100)
      : 0;

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.cardImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={60} color="#CBD5E1" />
            </View>
          )}
          
          {/* Badge de réduction */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nom || "Produit sans nom"}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={3}>
            {item.description}
          </Text>

          {/* Prix */}
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.oldPrice}>{item.prix} €</Text>
            )}
            <Text style={styles.newPrice}>{item.prixPromo} €</Text>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => editPublication(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color={PRIMARY} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteCardBtn}
              onPress={() => deletePublication(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={DANGER} />
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ===============================================================
  //                        EMPTY STATE
  // ===============================================================
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={80} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Aucune publication</Text>
      <Text style={styles.emptyText}>
        Commencez par créer votre première publication
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => setFormVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
        <Text style={styles.emptyBtnText}>Créer une publication</Text>
      </TouchableOpacity>
    </View>
  );

  // ===============================================================
  //                        RENDER MAIN SCREEN
  // ===============================================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Publications</Text>
          <Text style={styles.headerSubtitle}>
            {publications.length} publication{publications.length > 1 ? "s" : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setFormVisible(!formVisible)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={formVisible ? "close" : "add"}
            size={28}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      {/* Form */}
      {formVisible && (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderForm()}
        </ScrollView>
      )}

      {/* Liste des publications */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={publications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PublicationCard item={item} />}
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
//                       STYLES
// ===================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: GRAY_TEXT,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: PRIMARY,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // FORM
  form: {
    margin: 15,
    padding: 20,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
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
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    color: DANGER,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    color: "#0F172A",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  priceContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },

  // IMAGE PICKER
  imagePicker: {
    backgroundColor: "#F8FAFC",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E2E8F0",
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
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginTop: 12,
  },
  imagePickerSubtext: {
    fontSize: 13,
    color: GRAY_TEXT,
    marginTop: 4,
  },

  // SUBMIT BUTTON
  submitBtn: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },

  // PUBLICATION CARD
  listContent: {
    padding: 15,
  },
  card: {
    marginBottom: 16,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImageContainer: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 200,
  },
  noImage: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: DANGER,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardDesc: {
    color: GRAY_TEXT,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
    fontSize: 16,
    marginRight: 10,
  },
  newPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY,
  },

  // CARD ACTIONS
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  editBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  deleteCardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnText: {
    color: DANGER,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: GRAY_TEXT,
  },

  // EMPTY STATE
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#334155",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: GRAY_TEXT,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});