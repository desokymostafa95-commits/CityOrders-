import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/context';

export default function Index() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!token) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
