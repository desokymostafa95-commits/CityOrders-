import { Redirect } from 'expo-router';
import { getToken } from '../src/api/http';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AppIndex() {
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        async function checkToken() {
            try {
                const token = await getToken();
                setHasToken(!!token);
            } catch (e) {
                setHasToken(false);
            } finally {
                setLoading(false);
            }
        }
        checkToken();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // If token exists, go to home, otherwise go to login
    if (hasToken) {
        return <Redirect href="/(tabs)/home" />;
    }

    return <Redirect href="/(auth)/login" />;
}
