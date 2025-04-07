import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useAuth } from 'lib/auth/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { loading, isAuthenticated, user } = useAuth();
    const navigation = useNavigation();
    const [redirecting, setRedirecting] = useState(false);
    const [waitingForAuth, setWaitingForAuth] = useState(true);

    const route = useRoute(); // Get the current route

    useEffect(() => {
        // Track if we're waiting for authentication
        let authCheckTimer: NodeJS.Timeout;

        if (loading) {
            // Give some grace period for authentication to complete
            authCheckTimer = setTimeout(() => {
                setWaitingForAuth(false);
            }, 2000); // 2 seconds grace period
        } else {
            setWaitingForAuth(false);
        }

        return () => {
            if (authCheckTimer) {
                clearTimeout(authCheckTimer);
            }
        };
    }, [loading, isAuthenticated]);

    useEffect(() => {
        // Only redirect if auth check is complete, not authenticated, and not already redirecting
        if (!loading && !waitingForAuth && !isAuthenticated && !redirecting) {
            setRedirecting(true);
            // Get current route name and pass it in the redirect URL
            const path = route.name;
            navigation.navigate('Login' as never);
        }
    }, [loading, isAuthenticated, user, navigation, redirecting, waitingForAuth, route]);

    // Show loading if still checking auth or waiting for auth
    if (loading || waitingForAuth) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
