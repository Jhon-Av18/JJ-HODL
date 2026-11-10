import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from
'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig'; 
// Ajusta el path si es diferente
//import { useNavigation } from '@react-navigation/native';}
import { useNavigation } from '@react-navigation/native';
export default function Login() {
const [correo, setCorreo] = useState('');
const [contrasena, setContrasena] = useState('');
const navigation = useNavigation();
const handleLogin = async () => {
 try {
 await signInWithEmailAndPassword(auth, correo, contrasena);
 } catch (error) {
 Alert.alert('Error al iniciar sesión', error.message);
 }
};
return (
 <View style={styles.container}>
 <Text style={styles.titulo}>Iniciar Sesión</Text>
 <TextInput
 placeholder="Correo electrónico"
 value={correo}
 onChangeText={setCorreo}
 style={styles.input}
 autoCapitalize="none"
 keyboardType="email-address"
 />
 <TextInput
 placeholder="Contraseña"
 value={contrasena}
 onChangeText={setContrasena}
 style={styles.input}
 secureTextEntry
 />
 <Button title="Ingresar" onPress={handleLogin} />
 <View style={{ marginTop: 10 }}>
 <Button title="¿No tienes cuenta? Regístrate" onPress={() =>
navigation.navigate('Registro')} />
 </View>
 </View>
);
}
const styles = StyleSheet.create({
container: {
 flex: 1,
 justifyContent: 'center',
 padding: 20,
},
titulo: {
 fontSize: 24,
 marginBottom: 20,
 textAlign: 'center'
},
input: {
 borderWidth: 1,
 borderColor: '#ccc',
 padding: 12,
 marginBottom: 12,
 borderRadius: 6,
},
});