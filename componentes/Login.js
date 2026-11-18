import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase/firebaseConfig';
import { COLORES, mensajeAuth } from '../digimonApi';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [entrando, setEntrando] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    setEntrando(true);
    try {
      await signInWithEmailAndPassword(auth, correo.trim().toLowerCase(), contrasena);
    } catch (error) {
      Alert.alert('No se pudo entrar', mensajeAuth(error.code));
    }
    setEntrando(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.logo}>DIGI-HODL</Text>
      <Text style={styles.subtitulo}>{'> identifícate, Digielegido_'}</Text>

      <TextInput
        placeholder="Correo electrónico"
        placeholderTextColor={COLORES.gris}
        value={correo}
        onChangeText={setCorreo}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        placeholderTextColor={COLORES.gris}
        value={contrasena}
        onChangeText={setContrasena}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={entrando}>
        <Text style={styles.botonTexto}>{entrando ? 'CONECTANDO...' : 'ENTRAR AL DIGIMUNDO'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.enlace}>¿Aún no eres Digielegido? Regístrate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORES.fondo,
  },
  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: COLORES.cian,
    textAlign: 'center',
    letterSpacing: 4,
  },
  subtitulo: {
    color: COLORES.naranja,
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORES.cian,
    backgroundColor: COLORES.panel,
    color: COLORES.texto,
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
  },
  boton: {
    backgroundColor: COLORES.cian,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold', letterSpacing: 1 },
  enlace: { color: COLORES.naranja, textAlign: 'center', marginTop: 20 },
});