import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const MONEDAS_INICIALES = 100;
const COSTO_POKEBOLA = 10;
const BONO_DIARIO = 50;
const UN_DIA = 24 * 60 * 60 * 1000;
const TOTAL_POKEMON = 1025;

const SPRITE = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const ARTWORK = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// La rareza depende de la experiencia base que da PokeAPI
const obtenerRareza = (exp) => {
  if (exp >= 260) return { nombre: 'Legendario', color: '#d4a017', prob: 0.2 };
  if (exp >= 180) return { nombre: 'Épico', color: '#8e44ad', prob: 0.4 };
  if (exp >= 100) return { nombre: 'Raro', color: '#2980b9', prob: 0.65 };
  return { nombre: 'Común', color: '#7f8c8d', prob: 0.9 };
};

const precioVenta = (exp) => Math.max(1, Math.floor(exp / 8));

export default function Original() {
  const uid = auth.currentUser?.uid;

  const [monedas, setMonedas] = useState(0);
  const [coleccion, setColeccion] = useState([]);
  const [ultimoBono, setUltimoBono] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [lanzando, setLanzando] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCargando(false);
      return;
    }
    const cargar = async () => {
      try {
        const docRef = doc(db, 'usuarios', uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().monedas !== undefined) {
          const data = snap.data();
          setMonedas(data.monedas);
          setColeccion(data.coleccion || []);
          setUltimoBono(data.ultimoBono || null);
        } else {
          await setDoc(
            docRef,
            { monedas: MONEDAS_INICIALES, coleccion: [], ultimoBono: null },
            { merge: true }
          );
          setMonedas(MONEDAS_INICIALES);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudieron cargar tus datos.');
      }
      setCargando(false);
    };
    cargar();
  }, [uid]);

  const lanzarPokebola = async () => {
    if (lanzando) return;
    if (monedas < COSTO_POKEBOLA) {
      Alert.alert('Sin monedas', 'Reclama tu bono diario o vende algún Pokémon.');
      return;
    }
    setLanzando(true);
    setResultado(null);
    try {
      const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      const exp = data.base_experience || 50;
      const rareza = obtenerRareza(exp);
      const atrapado = Math.random() < rareza.prob;

      const nuevasMonedas = monedas - COSTO_POKEBOLA;
      const nuevaColeccion = atrapado
        ? [...coleccion, { id: data.id, nombre: data.name, exp }]
        : coleccion;

      await updateDoc(doc(db, 'usuarios', uid), {
        monedas: nuevasMonedas,
        coleccion: nuevaColeccion,
      });

      setMonedas(nuevasMonedas);
      setColeccion(nuevaColeccion);
      setResultado({ id: data.id, nombre: data.name, rareza, atrapado });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'La pokébola no pudo lanzarse. Intenta de nuevo.');
    }
    setLanzando(false);
  };

  const reclamarBono = async () => {
    const ahora = Date.now();
    const ultimo = ultimoBono ? new Date(ultimoBono).getTime() : 0;
    const transcurrido = ahora - ultimo;
    if (transcurrido < UN_DIA) {
      const horas = Math.ceil((UN_DIA - transcurrido) / (60 * 60 * 1000));
      Alert.alert('Aún no', `Tu próximo bono estará listo en unas ${horas} hora(s).`);
      return;
    }
    try {
      const fecha = new Date(ahora).toISOString();
      const nuevasMonedas = monedas + BONO_DIARIO;
      await updateDoc(doc(db, 'usuarios', uid), {
        monedas: nuevasMonedas,
        ultimoBono: fecha,
      });
      setMonedas(nuevasMonedas);
      setUltimoBono(fecha);
      Alert.alert('¡Bono reclamado!', `Ganaste ${BONO_DIARIO} monedas.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo reclamar el bono.');
    }
  };

  const vender = (indice) => {
    const p = coleccion[indice];
    const precio = precioVenta(p.exp);
    Alert.alert(
      `Vender ${p.nombre.toUpperCase()}`,
      `Recibirás ${precio} monedas. ¿Quieres venderlo o lo guardas (HODL)?`,
      [
        { text: 'Guardar', style: 'cancel' },
        {
          text: 'Vender',
          onPress: async () => {
            try {
              const nuevaColeccion = coleccion.filter((_, i) => i !== indice);
              const nuevasMonedas = monedas + precio;
              await updateDoc(doc(db, 'usuarios', uid), {
                monedas: nuevasMonedas,
                coleccion: nuevaColeccion,
              });
              setColeccion(nuevaColeccion);
              setMonedas(nuevasMonedas);
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo vender.');
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unicos = new Set(coleccion.map((p) => p.id)).size;
  const valorColeccion = coleccion.reduce((t, p) => t + precioVenta(p.exp), 0);

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Pokéhodl</Text>

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>🪙 Monedas: {monedas}</Text>
        <Text style={styles.resumenTexto}>
          📖 Pokédex: {unicos} / {TOTAL_POKEMON}
        </Text>
        <Text style={styles.resumenTexto}>
          💎 Valor de tu colección: {valorColeccion} monedas
        </Text>
      </View>

      <View style={styles.fila}>
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#e74c3c' }]}
          onPress={lanzarPokebola}
          disabled={lanzando}
        >
          <Text style={styles.botonTexto}>
            {lanzando ? 'Lanzando...' : `Lanzar pokébola (${COSTO_POKEBOLA})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#27ae60' }]}
          onPress={reclamarBono}
        >
          <Text style={styles.botonTexto}>Bono diario (+{BONO_DIARIO})</Text>
        </TouchableOpacity>
      </View>

      {lanzando && <ActivityIndicator style={{ marginTop: 20 }} size="large" />}

      {resultado && !lanzando && (
        <View style={[styles.encuentro, { borderColor: resultado.rareza.color }]}>
          <Image source={{ uri: ARTWORK(resultado.id) }} style={styles.imagenGrande} />
          <Text style={styles.nombreGrande}>
            #{resultado.id} {resultado.nombre.toUpperCase()}
          </Text>
          <Text style={{ color: resultado.rareza.color, fontWeight: 'bold' }}>
            {resultado.rareza.nombre} · {Math.round(resultado.rareza.prob * 100)}% de captura
          </Text>
          <Text style={resultado.atrapado ? styles.atrapado : styles.escapo}>
            {resultado.atrapado ? '🎉 ¡Lo atrapaste!' : '💨 ¡Se escapó!'}
          </Text>
        </View>
      )}

      <Text style={styles.subtitulo}>Mi colección ({coleccion.length})</Text>
      {coleccion.length === 0 ? (
        <Text style={{ textAlign: 'center' }}>
          Aún no tienes Pokémon. ¡Lanza tu primera pokébola!
        </Text>
      ) : (
        <View style={styles.grilla}>
          {coleccion.map((p, i) => {
            const rareza = obtenerRareza(p.exp);
            return (
              <TouchableOpacity
                key={`${p.id}-${i}`}
                style={[styles.carta, { borderColor: rareza.color }]}
                onPress={() => vender(i)}
              >
                <Image source={{ uri: SPRITE(p.id) }} style={styles.sprite} />
                <Text style={styles.cartaNombre} numberOfLines={1}>
                  {p.nombre}
                </Text>
                <Text style={{ color: rareza.color, fontSize: 11 }}>{rareza.nombre}</Text>
                <Text style={{ fontSize: 11 }}>🪙 {precioVenta(p.exp)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <Text style={styles.pista}>Toca un Pokémon para venderlo.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  subtitulo: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  resumen: { backgroundColor: 'aliceblue', padding: 15, borderRadius: 10, marginBottom: 15 },
  resumenTexto: { fontSize: 16, marginBottom: 4 },
  fila: { flexDirection: 'row', gap: 10 },
  boton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  botonTexto: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  encuentro: {
    marginTop: 20,
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  imagenGrande: { width: 160, height: 160 },
  nombreGrande: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  atrapado: { color: 'green', fontSize: 18, marginTop: 8 },
  escapo: { color: 'crimson', fontSize: 18, marginTop: 8 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  carta: {
    width: '30%',
    borderWidth: 2,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  sprite: { width: 64, height: 64 },
  cartaNombre: { fontSize: 12, fontWeight: 'bold' },
  pista: { textAlign: 'center', color: '#888', marginTop: 12, marginBottom: 30 },
});