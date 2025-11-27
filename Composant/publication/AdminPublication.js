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
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";

// 🌐 Configuration
const API_URL = "http://192.168.1.133:3000";

// 🎨 Couleurs et Constantes
const PRIMARY = "#007BFF"; // Bleu standard
const DANGER = "#DC3545"; // Rouge pour suppression
const SUCCESS = "#28A745"; // Vert pour la création/succès
const BG = "#F8F9FA"; // Fond très clair
const CARD_BG = "#FFFFFF"; // Fond de carte blanc
const INPUT_BORDER = "#CED4DA";
const LIGHT_GREY = "#6C757D";
const RADIUS = 8;
const SPACING = 15;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_DURATION = 3000; // Durée d'affichage du toast en ms

// 📐 Fonction de formatage pour les prix
const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(Number(price))) return "N/A";
  return `${Number(price).toFixed(2)} €`;
};

// --- Toast Component (Notification temporaire) --------------------------------
const ToastComponent = ({ message, type, onHide }) => {
    const [visible, setVisible] = useState(false);
    
    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                onHide(); 
            }, TOAST_DURATION);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!visible || !message) return null;

    const backgroundColor = type === 'success' ? SUCCESS : DANGER;
    const iconName = type === 'success' ? 'checkmark-circle' : 'close-circle';

    return (
        <View style={styles.toastContainer}>
            <View style={[styles.toastBox, { backgroundColor }]}>
                <Ionicons name={iconName} size={20} color="#fff" />
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </View>
    );
};

// --- PublicationCard Component (Optimisé avec Debounce) -----------------------
const PublicationCard = React.memo(({ item, updatePublication, deletePublication }) => {
    const [localItem, setLocalItem] = useState(item);
    const timeoutRef = useRef(null);

    const handleInputChange = (field, text) => {
        let value = text;
        if (["prix", "prixPromo"].includes(field)) {
            const cleanedText = text.replace(/[^0-9.]/g, ''); 
            value = cleanedText === "" ? null : Number(cleanedText);
        }
        
        setLocalItem(prev => ({ ...prev, [field]: value }));
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (value === null && field !== 'prixPromo') {
                 updatePublication(item.id, field, null);
            } else if (value !== null && !isNaN(value)) {
                updatePublication(item.id, field, value);
            }
        }, 800);
    };
    
    useEffect(() => {
        setLocalItem(item); 
    }, [item]);


    const handleDeletePress = () => {
        Alert.alert(
          "Confirmation de suppression",
          `Êtes-vous sûr de vouloir supprimer la publication N°${item.id} ?`,
          [
            { text: "Annuler", style: "cancel" },
            { text: "Supprimer", onPress: () => deletePublication(item.id), style: "destructive" },
          ],
          { cancelable: true }
        );
    };
    
    const renderField = (field, label, keyboardType = "default", optional = false) => {
        const displayValue = localItem[field] !== null && localItem[field] !== undefined ? localItem[field].toString() : "";

        return (
          <View style={styles.cardFieldContainer}>
            <Text style={styles.cardLabel}>{label} {optional && <Text style={{ color: LIGHT_GREY }}>(Optionnel)</Text>}</Text>
            <TextInput
              style={styles.cardInput}
              value={displayValue}
              keyboardType={keyboardType}
              onChangeText={(text) => handleInputChange(field, text)}
              placeholder={`Entrer ${label.toLowerCase()}`}
            />
          </View>
        );
    };

    return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Publication N°{item.id}</Text>
            <TouchableOpacity onPress={handleDeletePress} style={styles.deleteBtnIcon}>
              <Ionicons name="trash-outline" size={24} color={DANGER} />
            </TouchableOpacity>
          </View>
          
          {localItem.image ? (
            <Image 
                source={{ uri: localItem.image }} 
                style={styles.cardImage} 
                resizeMode="cover"
                onError={() => console.log(`Erreur chargement image : ${localItem.image}`)}
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
                <Text style={{ color: LIGHT_GREY }}>Image non définie</Text>
            </View>
          )}

          {renderField("nom", "Nom du Produit", "default", true)}
          {renderField("description", "Description", "default")}
          {renderField("image", "URL de l'Image")}
          
          <View style={styles.priceContainerEdit}>
            <View style={{ flex: 1 }}>
                {renderField("prix", "Prix Initial (€)", "numeric", true)}
            </View>
            <View style={{ flex: 1, marginLeft: SPACING / 2 }}>
                {renderField("prixPromo", "Prix Promotionnel (€)", "numeric")}
            </View>
          </View>

          <View style={styles.priceDisplayContainer}>
            {item.prix && item.prix > item.prixPromo && <Text style={styles.originalPrice}>{formatPrice(item.prix)}</Text>}
            <Text style={styles.promoPrice}>{formatPrice(item.prixPromo)}</Text>
          </View>
        </View>
    );
});


// ----------------------------------------------------
// Composant principal PublicationScreen
// ----------------------------------------------------
export default function PublicationScreen({ navigation }) {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    
    // NOUVEAUX ÉTATS POUR LE TOAST
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState('success'); 

    const canGoBack = navigation.canGoBack(); 

    const [form, setForm] = useState({
        nom: "",
        description: "",
        prix: "",
        prixPromo: "",
        image: "",
    });

    const socketRef = useRef(null);
    const flatListRef = useRef(null);

    // Fonction d'affichage du Toast
    const showToast = (message, type) => {
        setToastMessage(message);
        setToastType(type);
    };

    // Fonction de masquage (appelée par le composant Toast)
    const hideToast = () => {
        setToastMessage(null);
    };

    // ---- Fetch initial & Socket.io ----
    const getPublications = async () => {
        try {
            const res = await axios.get(`${API_URL}/publications`);
            setPublications(res.data);
        } catch (err) {
            console.log("Erreur fetch :", err.message);
            Alert.alert("Erreur de Connexion", "Impossible de charger les publications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPublications();

        socketRef.current = io(API_URL, { transports: ["websocket"] });

        socketRef.current.on("publication_created", (pub) => {
            setPublications((prev) => [pub, ...prev]);
            flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        });

        socketRef.current.on("publication_updated", (pub) =>
            setPublications((prev) =>
                prev.map((p) => (p.id === pub.id ? pub : p))
            )
        );

        socketRef.current.on("publication_deleted", ({ id }) =>
            setPublications((prev) => prev.filter((p) => p.id !== id))
        );

        return () => socketRef.current.disconnect();
    }, []);
    
    // ---- CRUD Operations ----
    
    const createPublication = async () => {
        const { nom, description, prix, prixPromo, image } = form;

        if (!description || !prixPromo || !image) {
            Alert.alert("Champs manquants", "La description, le prix promo et l'URL de l'image sont obligatoires !");
            return;
        }

        const numericPrix = prix ? Number(prix) : null;
        const numericPrixPromo = Number(prixPromo);

        if (isNaN(numericPrixPromo) || (prix && isNaN(numericPrix))) {
            Alert.alert("Erreur de format", "Les champs Prix et Prix Promo doivent être des nombres valides.");
            return;
        }
        
        if (numericPrixPromo <= 0) {
            Alert.alert("Erreur", "Le Prix Promotionnel doit être supérieur à zéro.");
            return;
        }

        try {
            await axios.post(`${API_URL}/publications`, {
                nom,
                description,
                prix: numericPrix, 
                prixPromo: numericPrixPromo,
                image,
            });

            setForm({ nom: "", description: "", prix: "", prixPromo: "", image: "" });
            setFormVisible(false); 
            showToast("Publication créée avec succès ! 🎉", "success");
            
        } catch (err) {
            console.log("Erreur création :", err.response?.data || err.message);
            showToast("Erreur lors de la création de la publication.", "error");
        }
    };

    const updatePublication = async (id, field, value) => {
        const finalValue = ["prix", "prixPromo"].includes(field) && value === null && field !== 'image' ? null : value;
        
        if (finalValue !== null && typeof finalValue === 'number' && isNaN(finalValue)) {
            console.log(`Update annulée pour ${field}: valeur non numérique.`);
            return; 
        }
        
        try {
            await axios.patch(`${API_URL}/publications/${id}`, {
                [field]: finalValue,
            });
            // Le socket gère la mise à jour, pas de toast ici pour éviter l'interruption à chaque frappe
        } catch (err) {
            console.log(`Erreur update ${id}/${field}:`, err.response?.data || err.message);
        }
    };

    const deletePublication = async (id) => {
        try {
            await axios.delete(`${API_URL}/publications/${id}`);
            showToast(`La publication N°${id} a été supprimée.`, "success");
        } catch (err) {
            console.log(`Erreur suppression ${id}:`, err.response?.data || err.message);
            showToast(`Erreur lors de la suppression de la publication N°${id}.`, "error");
        }
    };
    
    // Rendu des champs du formulaire de création
    const renderFormFields = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Ajouter une nouvelle publication</Text>
            
            <TextInput
                placeholder="Nom du Produit (Optionnel)"
                style={styles.input}
                value={form.nom}
                onChangeText={(text) => setForm({ ...form, nom: text })}
            />
            <TextInput
                placeholder="Description (Obligatoire)"
                style={[styles.input, styles.multilineInput]}
                multiline
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
            />
            <TextInput
                placeholder="URL de l'Image (Obligatoire)"
                style={styles.input}
                value={form.image}
                onChangeText={(text) => setForm({ ...form, image: text })}
            />
            <View style={styles.priceInputGroup}>
                <TextInput
                    placeholder="Prix Initial (€) (Optionnel)"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                    value={form.prix}
                    onChangeText={(text) => setForm({ ...form, prix: text.replace(/[^0-9.]/g, '') })}
                />
                <TextInput
                    placeholder="Prix Promo (€) (Obligatoire)"
                    style={[styles.input, styles.halfInput, { borderColor: SUCCESS }]}
                    keyboardType="numeric"
                    value={form.prixPromo}
                    onChangeText={(text) => setForm({ ...form, prixPromo: text.replace(/[^0-9.]/g, '') })}
                />
            </View>
            
            <TouchableOpacity style={styles.btn} onPress={createPublication}>
                <Text style={styles.btnTxt}>Créer la Publication</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                {/* BOUTON RETOUR */}
                {canGoBack && (
                    <TouchableOpacity
                        style={styles.headerIconBtnBack}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back-outline" size={30} color={PRIMARY} />
                    </TouchableOpacity>
                )}

                <Text style={[styles.headerTitle, !canGoBack && { marginLeft: 0 }]}>
                    📢  Publications
                </Text>

                {/* BOUTON AJOUTER/FERMER LE FORMULAIRE */}
                <TouchableOpacity
                    style={[styles.headerIconBtn, { backgroundColor: formVisible ? DANGER : PRIMARY, borderRadius: 50 }]}
                    onPress={() => setFormVisible(!formVisible)}
                >
                    <Ionicons 
                        name={formVisible ? "close-outline" : "add-outline"} 
                        size={30} 
                        color="#fff" 
                    />
                </TouchableOpacity>
            </View>
            
            {/* FORMULAIRE (Affiché/Masqué) */}
            {formVisible && renderFormFields()}
            
            <View style={styles.separator} />
            
            {/* LISTE DES PUBLICATIONS */}
            <Text style={styles.listTitle}>Liste des Publications ({publications.length})</Text>

            {loading ? (
                <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: SPACING * 2 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={publications}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <PublicationCard 
                            item={item}
                            updatePublication={updatePublication}
                            deletePublication={deletePublication}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyList}>
                            <Text style={styles.emptyText}>Aucune publication trouvée.</Text>
                            <Text style={styles.emptyTextHint}>Cliquez sur le bouton '+' pour en ajouter une.</Text>
                        </View>
                    )}
                />
            )}
            
            {/* TOAST (NOTIFICATION) */}
            <ToastComponent 
                message={toastMessage} 
                type={toastType} 
                onHide={hideToast} 
            />
        </View>
    );
}

// ----------------------------------------------------
// Styles
// ----------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, padding: SPACING, backgroundColor: BG },

    // --- Header ---
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING,
        paddingTop: 10,
        justifyContent: 'space-between',
    },
    headerTitle: { 
        fontSize: 22, 
        fontWeight: "700", 
        flex: 1,
        textAlign: 'center', 
    },
    headerIconBtn: { padding: 8, borderRadius: 50 },
    headerIconBtnBack: { padding: 8, borderRadius: 50, marginRight: 10 },

    // --- Formulaire ---
    formContainer: { 
        backgroundColor: CARD_BG, 
        padding: SPACING, 
        borderRadius: RADIUS, 
        marginBottom: SPACING 
    },
    formTitle: { 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: SPACING / 2, 
        color: PRIMARY 
    },
    input: {
        backgroundColor: CARD_BG,
        padding: 12,
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        marginBottom: 10,
        fontSize: 16,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    priceInputGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    btn: {
        backgroundColor: PRIMARY,
        padding: 14,
        borderRadius: RADIUS,
        marginTop: 5,
    },
    btnTxt: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
    
    // --- Séparateur et Titre de Liste ---
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: INPUT_BORDER,
        marginVertical: SPACING / 2,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: SPACING,
        textAlign: 'center',
    },

    // --- Carte de Publication (CRUD) ---
    card: {
        marginBottom: SPACING,
        backgroundColor: CARD_BG,
        padding: SPACING,
        borderRadius: RADIUS,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3, 
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING / 2,
    },
    cardTitle: { fontWeight: "700", fontSize: 16, color: PRIMARY },
    
    cardImage: {
        width: '100%',
        height: 150,
        borderRadius: RADIUS,
        marginBottom: SPACING,
        backgroundColor: INPUT_BORDER,
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: RADIUS,
        marginBottom: SPACING,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Champs modifiables dans la carte
    cardFieldContainer: {
        marginBottom: 10,
    },
    cardLabel: {
        fontSize: 12,
        color: LIGHT_GREY,
        marginBottom: 4,
        fontWeight: '500',
    },
    cardInput: {
        backgroundColor: "#F2F4F7",
        padding: 10,
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        fontSize: 14,
    },
    priceContainerEdit: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Affichage des prix
    priceDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: INPUT_BORDER,
    },
    originalPrice: {
        textDecorationLine: 'line-through', 
        color: LIGHT_GREY,
        fontSize: 14,
        marginRight: 10,
    },
    promoPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DANGER,
    },
    deleteBtnIcon: {
        padding: 5,
    },
    
    // Liste Vide
    emptyList: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: LIGHT_GREY,
    },
    emptyTextHint: {
        fontSize: 14,
        color: INPUT_BORDER,
        marginTop: 5,
    },
    
    // --- Styles pour le Toast ---
    toastContainer: {
        position: 'absolute',
        bottom: 30, 
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: SPACING,
        zIndex: 100, 
    },
    toastBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: RADIUS * 2, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        maxWidth: SCREEN_WIDTH * 0.9,
    },
    toastText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
});