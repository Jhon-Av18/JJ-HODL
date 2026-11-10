import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
export default function Logout() {
useEffect(() => {
 signOut(auth);
}, []);
return (
 <View style={{ flex: 1, justifyContent: 'center', alignItems:
'center' }}>
 <ActivityIndicator size="large" />
 </View>
);
}