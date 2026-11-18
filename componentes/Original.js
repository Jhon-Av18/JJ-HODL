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
import {
  COLORES,
  NIVELES,
  cargarDigimon,
  tierDe,
  nivelDe,
  valorDe,
  alAzar,
} from '../digimonApi';

const MONEDAS_INICIALES = 100;
const COSTO_HUEVO = 10;
const BONO_DIARIO = 50;
const UN_DIA = 24 * 60 * 60 * 1000;
const FUSION = 3; // cuántos Digimon del mismo nivel se necesitan para digievolucionar

// Probabilidad (en %) de que un Digihuevo traiga cada nivel, de Fresh a Ultimate.
// Mega no sale de los huevos: solo se consigue digievolucionando.
const PESOS = [35, 30, 22, 10, 3];

const tierAlAzar = () => {
  let r = Math.random() * 100;
  for (let i = 0; i < PESOS.length; i++) {
    if (r < PESOS[i]) return i;
    r -= PESOS[i];
  }
  return 0;
};

export default function Original() {
  const uid = auth.currentUser?.uid;

  const [lista, setLista] = useState([]);
  const [monedas, setMonedas] = useState(0);
  const [coleccion, setColeccion] = useState([]);
  const [ultimoBono, setUltimoBono] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCargando(false);
      return;
    }
    const cargar = async () => {
      try {
        setLista(await cargarDigimon());

        const docRef = doc(db, 'usuarios', uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().monedas !== undefined) {
          const data = snap.data();
          setMonedas(data.monedas);
          // Ignoramos datos viejos que no tengan la forma esperada
          setColeccion((data.coleccion || []).filter((d) => d && d.name && d.level));
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

  // Guarda en Firestore y actualiza la pantalla
  const guardar = async (nuevasMonedas, nuevaColeccion, extra = {}) => {
    await updateDoc(doc(db, 'usuarios', uid), {
      monedas: nuevasMonedas,
      coleccion: nuevaColeccion,
      ...extra,
    });
    setMonedas(nuevasMonedas);
    setColeccion(nuevaColeccion);
  };

  const abrirHuevo = async () => {
    if (ocupado) return;
    if (!lista.length) {
      Alert.alert('Sin catálogo', 'Aún no se cargó la lista de Digimon.');
      return;
    }
    if (monedas < COSTO_HUEVO) {
      Alert.alert('Sin monedas', 'Reclama tu bono diario o libera algún Digimon.');
      return;
    }
    setOcupado(true);
    setResultado(null);
    try {
      const tier = tierAlAzar();
      const candidatos = lista.filter((d) => tierDe(d.level) === tier);
      const d = alAzar(candidatos.length ? candidatos : lista);
      const nuevo = { name: d.name, img: d.img, level: d.level };
      await guardar(monedas - COSTO_HUEVO, [...coleccion, nuevo]);
      setResultado({ tipo: 'huevo', digimon: nuevo });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo abrir el Digihuevo.');
    }
    setOcupado(false);
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
      await guardar(monedas + BONO_DIARIO, coleccion, { ultimoBono: fecha });
      setUltimoBono(fecha);
      Alert.alert('¡Bono reclamado!', `Ganaste ${BONO_DIARIO} monedas.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo reclamar el bono.');
    }
  };

  const ejecutarFusion = async (tier) => {
    setOcupado(true);
    setResultado(null);
    try {
      const indices = coleccion
        .map((d, i) => ({ d, i }))
        .filter((x) => tierDe(x.d.level) === tier)
        .slice(0, FUSION)
        .map((x) => x.i);
      if (indices.length < FUSION) {
        setOcupado(false);
        return;
      }
      const candidatos = lista.filter((d) => tierDe(d.level) === tier + 1);
      if (!candidatos.length) {
        Alert.alert('Error', 'No hay Digimon del siguiente nivel en el catálogo.');
        setOcupado(false);
        return;
      }
      const d = alAzar(candidatos);
      const nuevo = { name: d.name, img: d.img, level: d.level };
      const restante = coleccion.filter((_, i) => !indices.includes(i));
      await guardar(monedas, [...restante, nuevo]);
      setResultado({ tipo: 'fusion', digimon: nuevo });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo completar la digievolución.');
    }
    setOcupado(false);
  };

  const fusionar = (tier) => {
    if (ocupado) return;
    Alert.alert(
      'Digievolución',
      `Se usarán ${FUSION} Digimon de nivel ${NIVELES[tier].etiqueta} para obtener uno de nivel ${NIVELES[tier + 1].etiqueta}. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Digievolucionar', onPress: () => ejecutarFusion(tier) },
      ]
    );
  };

  const liberar = (indice) => {
    if (ocupado) return;
    const d = coleccion[indice];
    const valor = valorDe(d.level);
    Alert.alert(
      `Liberar a ${d.name}`,
      `Recibirás ${valor} monedas. ¿Lo liberas o lo conservas?`,
      [
        { text: 'Conservar', style: 'cancel' },
        {
          text: 'Liberar',
          onPress: async () => {
            setOcupado(true);
            try {
              await guardar(
                monedas + valor,
                coleccion.filter((_, i) => i !== indice)
              );
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo liberar.');
            }
            setOcupado(false);
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORES.cian} />
      </View>
    );
  }

  const conteo = [0, 0, 0, 0, 0, 0];
  coleccion.forEach((d) => {
    conteo[tierDe(d.level)] += 1;
  });
  const unicos = new Set(coleccion.map((d) => d.name)).size;
  const ordenada = coleccion
    .map((d, i) => ({ d, i }))
    .sort((a, b) => tierDe(b.d.level) - tierDe(a.d.level));

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>DIGIEVOLUCIÓN</Text>

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>🪙 Monedas: {monedas}</Text>
        <Text style={styles.resumenTexto}>🎴 Digimon: {coleccion.length}</Text>
        <Text style={styles.resumenTexto}>
          📖 Digidex: {unicos} / {lista.length}
        </Text>
      </View>

      <View style={styles.fila}>
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: COLORES.cian }]}
          onPress={abrirHuevo}
          disabled={ocupado}
        >
          <Text style={styles.botonTexto}>
            {ocupado ? 'PROCESANDO...' : `🥚 DIGIHUEVO (${COSTO_HUEVO})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: COLORES.naranja }]}
          onPress={reclamarBono}
        >
          <Text style={styles.botonTexto}>BONO DIARIO +{BONO_DIARIO}</Text>
        </TouchableOpacity>
      </View>

      {ocupado && <ActivityIndicator style={{ marginTop: 16 }} color={COLORES.cian} />}

      {resultado && !ocupado && (
        <View
          style={[styles.resultado, { borderColor: nivelDe(resultado.digimon.level).color }]}
        >
          <Text style={styles.resultadoTitulo}>
            {resultado.tipo === 'huevo'
              ? '🥚 ¡El Digihuevo eclosionó!'
              : '🧬 ¡Digievolución exitosa!'}
          </Text>
          <Image source={{ uri: resultado.digimon.img }} style={styles.imagenGrande} />
          <Text style={styles.nombreGrande}>{resultado.digimon.name}</Text>
          <Text style={{ color: nivelDe(resultado.digimon.level).color, fontWeight: 'bold' }}>
            {nivelDe(resultado.digimon.level).emoji} {resultado.digimon.level}
          </Text>
        </View>
      )}

      <Text style={styles.seccion}>🧬 Laboratorio de digievolución</Text>
      <Text style={styles.ayuda}>
        Junta {FUSION} Digimon del mismo nivel para obtener uno del nivel siguiente. Los Mega
        solo se consiguen así.
      </Text>
      {NIVELES.map((n) => {
        const cant = conteo[n.tier];
        const lleno = cant >= FUSION;
        return (
          <View key={n.tier} style={[styles.filaNivel, { borderColor: n.color }]}>
            <Text style={[styles.nivelNombre, { color: n.color }]}>
              {n.emoji} {n.etiqueta}
            </Text>
            <Text style={styles.nivelCant}>
              {n.tier < 5 ? `${Math.min(cant, 99)} (${Math.min(cant, FUSION)}/${FUSION})` : cant}
            </Text>
            {n.tier < 5 ? (
              <TouchableOpacity
                style={[styles.botonFusion, { backgroundColor: lleno ? n.color : COLORES.borde }]}
                onPress={() => fusionar(n.tier)}
                disabled={!lleno || ocupado}
              >
                <Text style={[styles.botonFusionTexto, { color: lleno ? COLORES.fondo : COLORES.gris }]}>
                  FUSIONAR
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.maximo}>Nivel máximo</Text>
            )}
          </View>
        );
      })}

      <Text style={styles.seccion}>Mi colección ({coleccion.length})</Text>
      {coleccion.length === 0 ? (
        <Text style={styles.vacio}>Aún no tienes Digimon. ¡Abre tu primer Digihuevo!</Text>
      ) : (
        <View style={styles.grilla}>
          {ordenada.map(({ d, i }) => {
            const nivel = nivelDe(d.level);
            return (
              <TouchableOpacity
                key={`${d.name}-${i}`}
                style={[styles.carta, { borderColor: nivel.color }]}
                onPress={() => liberar(i)}
              >
                <Image source={{ uri: d.img }} style={styles.sprite} />
                <Text style={styles.cartaNombre} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={{ color: nivel.color, fontSize: 11 }}>{d.level}</Text>
                <Text style={{ color: COLORES.gris, fontSize: 11 }}>🪙 {nivel.valor}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <Text style={styles.pista}>Toca un Digimon para liberarlo por monedas.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 18, paddingTop: 50, backgroundColor: COLORES.fondo },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORES.cian,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 14,
  },
  resumen: {
    backgroundColor: COLORES.panel,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  resumenTexto: { color: COLORES.texto, fontSize: 15, marginBottom: 3 },
  fila: { flexDirection: 'row', gap: 10 },
  boton: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  resultado: {
    marginTop: 18,
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORES.panel,
  },
  resultadoTitulo: { color: COLORES.texto, fontWeight: 'bold', fontSize: 16 },
  imagenGrande: { width: 150, height: 150, resizeMode: 'contain', marginVertical: 10 },
  nombreGrande: { color: COLORES.texto, fontSize: 22, fontWeight: 'bold' },
  seccion: { color: COLORES.cian, fontSize: 17, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  ayuda: { color: COLORES.gris, marginBottom: 10 },
  filaNivel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: COLORES.panel,
  },
  nivelNombre: { flex: 1, fontWeight: 'bold' },
  nivelCant: { color: COLORES.texto, marginRight: 10 },
  botonFusion: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  botonFusionTexto: { fontWeight: 'bold', fontSize: 11 },
  maximo: { color: COLORES.gris, fontSize: 11 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  carta: {
    width: '31%',
    borderWidth: 2,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    backgroundColor: COLORES.panel,
  },
  sprite: { width: 64, height: 64, resizeMode: 'contain' },
  cartaNombre: { color: COLORES.texto, fontSize: 12, fontWeight: 'bold' },
  vacio: { color: COLORES.gris, textAlign: 'center' },
  pista: { color: COLORES.gris, textAlign: 'center', marginTop: 12, marginBottom: 30 },
});