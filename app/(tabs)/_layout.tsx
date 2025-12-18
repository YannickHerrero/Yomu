import { Tabs, useSegments } from 'expo-router';
import { Book, Timer, RefreshCw, BarChart3 } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDictionaryStore } from '@/stores/useDictionaryStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { clearResults, triggerFocusSearch } = useDictionaryStore();

  const handleDictionaryTabPress = () => {
    // If already on dictionary tab, clear and focus
    if (segments[1] === 'dictionary') {
      clearResults();
      triggerFocusSearch();
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dictionary/index"
        options={{
          title: 'Dictionary',
          tabBarIcon: ({ color, size }) => <Book size={size} color={color} />,
        }}
        listeners={{
          tabPress: handleDictionaryTabPress,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Session',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <RefreshCw size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
