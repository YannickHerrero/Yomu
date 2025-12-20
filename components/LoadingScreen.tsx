import { View, Text, StyleSheet, PlatformColor, Pressable, Image } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Host, LinearProgress } from '@expo/ui/swift-ui';
import { IconSymbol } from '@/components/ui/icon-symbol';

type LoadingScreenProps = {
  message: string;
  error: string | null;
  onRetry: () => void;
  onLayout?: () => void;
};

export function LoadingScreen({ message, error, onRetry, onLayout }: LoadingScreenProps) {
  const isError = error !== null;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
          />
        </View>

        {/* Status Message */}
        <Text style={styles.message}>
          {isError ? 'Failed to initialize' : message}
        </Text>

        {/* Progress or Error */}
        {isError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <GlassView style={styles.retryButton} isInteractive>
              <Pressable onPress={onRetry} style={styles.retryPressable}>
                <IconSymbol name="arrow.clockwise" size={18} color={PlatformColor('label')} />
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </GlassView>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Host style={styles.progressHost}>
              <LinearProgress />
            </Host>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  message: {
    fontSize: 17,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: 200,
    alignItems: 'center',
  },
  progressHost: {
    width: 200,
    height: 8,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
});
