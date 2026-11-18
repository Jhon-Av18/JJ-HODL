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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { COLORES, cargarDigimon, tierDe, nivelDe, alAzar } from '../digimonApi';

// La API no trae estadísticas, así que las calculamos a partir del nombre y el nivel.
// Así cada Digimon siempre tiene las mismas estadísticas.
const hash = (texto) => {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) % 100003;
  }
  return h;
};

const estadisticas = (d) => {
  const tier = tierDe(d.level);
  const h = hash(d.name);
  const base = 30 + tier * 18;
  return {
    hp: base * 4 + (h % 40),
    atk: base + (h % 13),
    def: Math.round(base * 0.5) + (Math.floor(h / 3) % 9),
    vel: tier * 10 + (h % 50),
  };
};

const calcularDanio = (atacante, defensor, especial, defendiendo) => {
  let dano = atacante.atk * (0.85 + Math.random() * 0.3) - defensor.def * 0.5;
  if (especial) {
    dano = atacante.atk * 1.8 * (0.9 + Math.random() * 0.2) - defensor.def * 0.3;
  }
  if (defendiendo) dano *= 0.4;
  return Math.max(4, Math.round(dano));
};

const colorBarra = (porcentaje) => {
  if (porcentaje > 50) return COLORES.verde;
  if (porcentaje > 25) return COLORES.naranja;
  return COLORES.rojo;
};

function Panel({ d, st, hp, etiqueta }) {
  const nivel = nivelDe(d.level);
  const pct = Math.max(0, (hp / st.hp) * 100);
  return (
    <View style={[styles.panel, { borderColor: nivel.color }]}>
      <Image source={{ uri: d.img }} style={styles.panelImg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.panelEtiqueta}>{etiqueta}</Text>
        <Text style={styles.panelNombre}>{d.name}</Text>
        <Text style={{ color: nivel.color, fontSize: 12, fontWeight: 'bold' }}>
          {nivel.emoji} {d.level}
        </Text>
        <View style={styles.barraFondo}>
          <View
            style={[styles.barraRelleno, { width: `${pct}%`, backgroundColor: colorBarra(pct) }]}
          />
        </View>
        <Text style={styles.hpTexto}>
          HP {Math.max(0, hp)} / {st.hp}
        </Text>
      </View>
    </View>
  );
}

export default function Batalla() {
  const uid = auth.currentUser?.uid;

  const [lista, setLista] = useState([]);
  const [coleccion, setColeccion] = useState([]);
  const [monedas, setMonedas] = useState(0);
  const [victorias, setVictorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);
  const [elegido, setElegido] = useState(null);
  const [combate, setCombate] = useState(null);
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
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) {
          const data = snap.data();
          setMonedas(data.monedas || 0);
          setVictorias(data.victorias || 0);
          setDerrotas(data.derrotas || 0);
          setColeccion((data.coleccion || []).filter((d) => d && d.name && d.level));
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudieron cargar tus datos.');
      }
      setCargando(false);
    };
    cargar();
  }, [uid]);

  const iniciarBatalla = () => {
    const mio = coleccion[elegido];
    if (!mio || !lista.length) return;
    // El rival es de tu mismo nivel o uno más arriba o más abajo
    const cambio = [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
    const tier = Math.min(5, Math.max(0, tierDe(mio.level) + cambio));
    const candidatos = lista.filter((d) => tierDe(d.level) === tier);
    const rival = alAzar(candidatos.length ? candidatos : lista);
    const stJ = estadisticas(mio);
    const stR = estadisticas(rival);
    setCombate({
      jugador: { d: mio, st: stJ },
      rival: { d: rival, st: stR },
      hpJ: stJ.hp,
      hpR: stR.hp,
      cdJ: 0,
      cdR: 0,
      log: [`¡Un ${rival.name} salvaje te desafía!`],
      fin: null,
      premio: 0,
    });
  };

  const jugarTurno = async (accion) => {
    if (!combate || combate.fin || ocupado) return;
    if (accion === 'especial' && combate.cdJ > 0) return;

    const { jugador, rival } = combate;
    let { hpJ, hpR, cdJ, cdR } = combate;
    const log = [];

    // Decisión del rival: casi siempre ataca
    const azar = Math.random();
    let accionR = 'ataque';
    if (azar > 0.9) accionR = 'defender';
    else if (azar > 0.7 && cdR === 0) accionR = 'especial';

    const defR = accionR === 'defender';
    if (accion === 'defender') log.push(`🛡️ ${jugador.d.name} se protege.`);
    if (defR) log.push(`🛡️ ${rival.d.name} se protege.`);

    const actuarJugador = () => {
      if (accion === 'defender') return;
      const esp = accion === 'especial';
      const dano = calcularDanio(jugador.st, rival.st, esp, defR);
      hpR = Math.max(0, hpR - dano);
      if (esp) cdJ = 3;
      log.push(`${esp ? '💥 Especial' : '⚔️ Ataque'} de ${jugador.d.name}: -${dano} HP`);
    };

    const actuarRival = () => {
      if (accionR === 'defender') return;
      const esp = accionR === 'especial';
      const dano = calcularDanio(rival.st, jugador.st, esp, accion === 'defender');
      hpJ = Math.max(0, hpJ - dano);
      if (esp) cdR = 3;
      log.push(`${esp ? '💥 Especial' : '⚔️ Ataque'} de ${rival.d.name}: -${dano} HP`);
    };

    // Actúa primero el más veloz
    const orden = jugador.st.vel >= rival.st.vel ? ['J', 'R'] : ['R', 'J'];
    for (const quien of orden) {
      if (hpJ <= 0 || hpR <= 0) break;
      if (quien === 'J') actuarJugador();
      else actuarRival();
    }
    cdJ = Math.max(0, cdJ - 1);
    cdR = Math.max(0, cdR - 1);

    let fin = null;
    if (hpR <= 0) fin = 'victoria';
    else if (hpJ <= 0) fin = 'derrota';

    let premio = 0;
    if (fin === 'victoria') {
      const tJ = tierDe(jugador.d.level);
      const tR = tierDe(rival.d.level);
      premio = 8 + 6 * tR + (tR > tJ ? 10 : 0);
      log.push(`🏆 ¡Ganaste! +${premio} monedas`);
    } else if (fin === 'derrota') {
      log.push(`💀 ${jugador.d.name} fue derrotado.`);
    }

    setCombate({
      ...combate,
      hpJ,
      hpR,
      cdJ,
      cdR,
      log: [...combate.log, ...log].slice(-6),
      fin,
      premio,
    });

    // Al terminar, guardamos el resultado en Firestore
    if (fin) {
      setOcupado(true);
      try {
        const nuevasMonedas = monedas + premio;
        const nuevasV = victorias + (fin === 'victoria' ? 1 : 0);
        const nuevasD = derrotas + (fin === 'derrota' ? 1 : 0);
        await updateDoc(doc(db, 'usuarios', uid), {
          monedas: nuevasMonedas,
          victorias: nuevasV,
          derrotas: nuevasD,
        });
        setMonedas(nuevasMonedas);
        setVictorias(nuevasV);
        setDerrotas(nuevasD);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo guardar el resultado.');
      }
      setOcupado(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORES.cian} />
      </View>
    );
  }

  const encabezado = (
    <>
      <Text style={styles.titulo}>ARENA DIGITAL</Text>
      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>🏆 {victorias}</Text>
        <Text style={styles.resumenTexto}>💀 {derrotas}</Text>
        <Text style={styles.resumenTexto}>🪙 {monedas}</Text>
      </View>
    </>
  );

  // Pantalla de combate
  if (combate) {
    const { jugador, rival, hpJ, hpR, cdJ, fin } = combate;
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        {encabezado}

        <Panel d={rival.d} st={rival.st} hp={hpR} etiqueta="RIVAL" />
        <Text style={styles.vs}>⚔️ VS ⚔️</Text>
        <Panel d={jugador.d} st={jugador.st} hp={hpJ} etiqueta="TU DIGIMON" />

        <View style={styles.registro}>
          {combate.log.map((linea, i) => (
            <Text key={i} style={styles.registroTexto}>
              {linea}
            </Text>
          ))}
        </View>

        {!fin ? (
          <View style={styles.fila}>
            <TouchableOpacity
              style={[styles.accion, { backgroundColor: COLORES.cian }]}
              onPress={() => jugarTurno('ataque')}
            >
              <Text style={styles.accionTexto}>⚔️ ATACAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accion,
                { backgroundColor: cdJ > 0 ? COLORES.borde : COLORES.naranja },
              ]}
              onPress={() => jugarTurno('especial')}
              disabled={cdJ > 0}
            >
              <Text style={[styles.accionTexto, cdJ > 0 && { color: COLORES.gris }]}>
                {cdJ > 0 ? `💥 ESPECIAL (${cdJ})` : '💥 ESPECIAL'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accion, { backgroundColor: COLORES.verde }]}
              onPress={() => jugarTurno('defender')}
            >
              <Text style={styles.accionTexto}>🛡️ DEFENDER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={[styles.resultado, { color: fin === 'victoria' ? COLORES.verde : COLORES.rojo }]}>
              {fin === 'victoria' ? '🎉 ¡VICTORIA!' : '💀 DERROTA'}
            </Text>
            <View style={styles.fila}>
              <TouchableOpacity
                style={[styles.accion, { backgroundColor: COLORES.cian }]}
                onPress={iniciarBatalla}
                disabled={ocupado}
              >
                <Text style={styles.accionTexto}>OTRA BATALLA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.accion, { backgroundColor: COLORES.borde }]}
                onPress={() => setCombate(null)}
                disabled={ocupado}
              >
                <Text style={[styles.accionTexto, { color: COLORES.texto }]}>CAMBIAR DIGIMON</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Text style={styles.pista}>
          Especial: golpe fuerte, se recarga en 3 turnos. Defender reduce mucho el daño del turno.
        </Text>
      </ScrollView>
    );
  }

  // Pantalla de selección
  const ordenada = coleccion
    .map((d, i) => ({ d, i }))
    .sort((a, b) => tierDe(b.d.level) - tierDe(a.d.level));

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      {encabezado}

      {coleccion.length === 0 ? (
        <Text style={styles.vacio}>
          Aún no tienes Digimon para pelear. Ve a la pestaña Digievolución y abre un Digihuevo.
        </Text>
      ) : (
        <>
          <Text style={styles.seccion}>Elige a tu luchador</Text>
          <View style={styles.grilla}>
            {ordenada.map(({ d, i }) => {
              const nivel = nivelDe(d.level);
              const activo = elegido === i;
              return (
                <TouchableOpacity
                  key={`${d.name}-${i}`}
                  style={[
                    styles.carta,
                    { borderColor: nivel.color },
                    activo && { backgroundColor: COLORES.borde },
                  ]}
                  onPress={() => setElegido(i)}
                >
                  <Image source={{ uri: d.img }} style={styles.sprite} />
                  <Text style={styles.cartaNombre} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text style={{ color: nivel.color, fontSize: 11 }}>{d.level}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.boton,
              { backgroundColor: elegido === null ? COLORES.borde : COLORES.cian },
            ]}
            onPress={iniciarBatalla}
            disabled={elegido === null}
          >
            <Text style={[styles.botonTexto, elegido === null && { color: COLORES.gris }]}>
              {elegido === null ? 'ELIGE UN DIGIMON' : '⚔️ BUSCAR RIVAL'}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
    marginBottom: 12,
  },
  resumen: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORES.panel,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  resumenTexto: { color: COLORES.texto, fontSize: 16, fontWeight: 'bold' },
  seccion: { color: COLORES.cian, fontSize: 17, fontWeight: 'bold', marginBottom: 10 },
  vacio: { color: COLORES.gris, textAlign: 'center', marginTop: 20 },
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
  boton: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold', letterSpacing: 1 },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    backgroundColor: COLORES.panel,
    gap: 12,
  },
  panelImg: { width: 90, height: 90, resizeMode: 'contain' },
  panelEtiqueta: { color: COLORES.gris, fontSize: 11, letterSpacing: 2 },
  panelNombre: { color: COLORES.texto, fontSize: 18, fontWeight: 'bold' },
  barraFondo: {
    height: 10,
    backgroundColor: COLORES.borde,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6,
  },
  barraRelleno: { height: 10, borderRadius: 5 },
  hpTexto: { color: COLORES.gris, fontSize: 12, marginTop: 3 },
  vs: { color: COLORES.naranja, textAlign: 'center', fontWeight: 'bold', marginVertical: 10 },
  registro: {
    backgroundColor: '#05080f',
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 12,
    marginVertical: 14,
    minHeight: 110,
  },
  registroTexto: { color: COLORES.verde, fontFamily: 'monospace', fontSize: 12, marginBottom: 3 },
  fila: { flexDirection: 'row', gap: 8 },
  accion: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  accionTexto: { color: COLORES.fondo, fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  resultado: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  pista: { color: COLORES.gris, textAlign: 'center', marginTop: 16, marginBottom: 30, fontSize: 12 },
});