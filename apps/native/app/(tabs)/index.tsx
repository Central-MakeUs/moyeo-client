import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
    return <WebView style={styles.container} source={{ uri: 'http://192.168.0.8:3000' }} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Constants.statusBarHeight,
    },
});
