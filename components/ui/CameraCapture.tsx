import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PlatformColor,
  Pressable,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 3:4 horizontal aspect ratio (width > height)
const ASPECT_RATIO = 4 / 3; // width / height for a 3:4 horizontal (landscape) frame

// Calculate overlay dimensions - make it as wide as possible with padding
const OVERLAY_PADDING = 24;
const OVERLAY_WIDTH = SCREEN_WIDTH - OVERLAY_PADDING * 2;
const OVERLAY_HEIGHT = OVERLAY_WIDTH / ASPECT_RATIO;

type CameraCaptureProps = {
  isVisible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export function CameraCapture({ isVisible, onCapture, onClose }: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      // Take the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo) {
        setIsCapturing(false);
        return;
      }

      // Calculate crop region based on photo dimensions and overlay position
      // The overlay is centered on screen, we need to map that to photo coordinates
      const photoWidth = photo.width;
      const photoHeight = photo.height;

      // Camera preview fills the screen, so we calculate the scale
      // The camera view fills the screen width and crops top/bottom
      const previewAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      const photoAspect = photoWidth / photoHeight;

      let cropX: number, cropY: number, cropWidth: number, cropHeight: number;

      if (photoAspect > previewAspect) {
        // Photo is wider - height matches, width is cropped
        const visibleWidth = photoHeight * previewAspect;
        const offsetX = (photoWidth - visibleWidth) / 2;
        const scale = photoHeight / SCREEN_HEIGHT;

        // Calculate overlay position in photo coordinates
        const overlayTop = (SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2;
        const overlayLeft = OVERLAY_PADDING;

        cropX = offsetX + overlayLeft * scale;
        cropY = overlayTop * scale;
        cropWidth = OVERLAY_WIDTH * scale;
        cropHeight = OVERLAY_HEIGHT * scale;
      } else {
        // Photo is taller - width matches, height is cropped
        const visibleHeight = photoWidth / previewAspect;
        const offsetY = (photoHeight - visibleHeight) / 2;
        const scale = photoWidth / SCREEN_WIDTH;

        // Calculate overlay position in photo coordinates
        const overlayTop = (SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2;
        const overlayLeft = OVERLAY_PADDING;

        cropX = overlayLeft * scale;
        cropY = offsetY + overlayTop * scale;
        cropWidth = OVERLAY_WIDTH * scale;
        cropHeight = OVERLAY_HEIGHT * scale;
      }

      // Ensure crop bounds are within image
      cropX = Math.max(0, Math.min(cropX, photoWidth - cropWidth));
      cropY = Math.max(0, Math.min(cropY, photoHeight - cropHeight));
      cropWidth = Math.min(cropWidth, photoWidth - cropX);
      cropHeight = Math.min(cropHeight, photoHeight - cropY);

      // Crop and resize the image
      const croppedImage = await manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: Math.round(cropX),
              originY: Math.round(cropY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
          { resize: { width: 1200 } }, // Resize to standard width
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      onCapture(croppedImage.uri);
    } catch (error) {
      console.error('Failed to capture photo:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture]);

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  if (!isVisible) return null;

  // Permission not determined yet
  if (!permission) {
    return (
      <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={PlatformColor('label')} />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <IconSymbol name="camera.fill" size={48} color={PlatformColor('secondaryLabel')} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to take context photos for your cards.
            </Text>
            <View style={styles.permissionButtons}>
              <Pressable onPress={onClose} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRequestPermission} style={[styles.permissionButton, styles.permissionButtonPrimary]}>
                <Text style={[styles.permissionButtonText, styles.permissionButtonTextPrimary]}>
                  Grant Permission
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Camera Preview */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />

        {/* Overlay mask */}
        <View style={styles.overlay} pointerEvents="none">
          {/* Top dark area */}
          <View style={styles.overlayTop} />
          
          {/* Middle row with left, clear center, right */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.overlayCenter}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom dark area */}
          <View style={styles.overlayBottom} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="white" />
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </Pressable>

          {/* Spacer for layout balance */}
          <View style={styles.spacer} />
        </View>

        {/* Hint text */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Position the content within the frame</Text>
        </View>
      </View>
    </Modal>
  );
}

// Calculate overlay positions
const overlayTop = (SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    height: overlayTop,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    height: OVERLAY_HEIGHT,
    flexDirection: 'row',
  },
  overlaySide: {
    width: OVERLAY_PADDING,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayCenter: {
    flex: 1,
    // Transparent - this is the capture area
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'white',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  spacer: {
    width: 50,
    height: 50,
  },
  hintContainer: {
    position: 'absolute',
    top: overlayTop - 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: PlatformColor('systemBackground'),
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: PlatformColor('secondarySystemFill'),
  },
  permissionButtonPrimary: {
    backgroundColor: PlatformColor('label'),
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
  permissionButtonTextPrimary: {
    color: PlatformColor('systemBackground'),
  },
});
