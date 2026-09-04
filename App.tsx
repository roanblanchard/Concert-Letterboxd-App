import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { ConcertsProvider } from './src/store/ConcertsContext';

export default function App() {
  return (
    <ConcertsProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </ConcertsProvider>
  );
}

