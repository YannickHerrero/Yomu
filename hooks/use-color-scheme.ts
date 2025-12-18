import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const { mode } = useThemeStore();

  if (mode === 'system') {
    return systemColorScheme;
  }

  return mode;
}
