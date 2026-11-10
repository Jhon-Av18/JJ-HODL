import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from
'@react-navigation/native-stack';
import { createBottomTabNavigator } from
'@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import Login from './componentes/Login';
import Registro from './componentes/Registro';
import Home from './componentes/Home';
import Original from './componentes/Original';
import Perfil from './componentes/Perfil';
import Logout from './componentes/Logout';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
export default function App() {
const [usuario, setUsuario] = useState(null);
const [cargando, setCargando] = useState(true);
useEffect(() => {
 const unsubscribe = onAuthStateChanged(auth, (user) => {
 setUsuario(user);
 setCargando(false);
 });
 return unsubscribe;
}, []);
if (cargando) {
 return (
 <View style={{ flex: 1, justifyContent: 'center', alignItems:
'center' }}>
 <ActivityIndicator size="large" />
 </View>
 );
}
return (
 <NavigationContainer>
 <Tab.Navigator screenOptions={{ headerShown: false }}>
 {usuario ? (
 <>
 <Tab.Screen name="Home" component={Home} />
 <Tab.Screen name="Original" component={Original} />
 <Tab.Screen name="Perfil" component={Perfil} />
 <Tab.Screen name="Logout" component={Logout} />
 </>
 ) : (
 <>
 <Tab.Screen name="Login" component={Login} />
 <Tab.Screen name="Registro" component={Registro} />
 </>
 )}
 </Tab.Navigator>
 </NavigationContainer>
);
}
