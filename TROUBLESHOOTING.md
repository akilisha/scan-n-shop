# 🔧 TradeHub Mobile Troubleshooting Guide

## Common Issues and Solutions

### 1. BarcodeScanner Import Errors

**Error**: `SyntaxError: The requested module does not provide an export named 'BarcodeScanner'`

**Solution**: ✅ **FIXED** - Use correct import syntax:

```typescript
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
```

### 2. Vite Cache Issues

**Error**: Module resolution problems after updating Capacitor plugins

**Solution**:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear dist folder
rm -rf dist

# Reinstall and sync
npm install
npm run build
npx cap sync
```

### 3. Camera Permissions

**Error**: "Camera permission denied" on device

**Solution**:

**Android**: Check `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS**: Check `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan barcodes</string>
```

### 4. Native Plugin Not Working

**Error**: Plugin functions not working on device

**Solution**:

```bash
# Ensure plugins are synced
npx cap sync

# For Android
npx cap open android
# Clean and rebuild in Android Studio

# For iOS
npx cap open ios
# Clean build in Xcode
```

### 5. Live Reload Issues

**Error**: Changes not reflecting on device

**Solution**:

```bash
# Stop current dev server
# Then run with live reload
npm run android:dev  # or ios:dev

# If still not working, use manual sync
npm run build
npx cap copy
```

### 6. Build Errors

**Error**: TypeScript or build errors

**Solution**:

```bash
# Check TypeScript
npx tsc --noEmit

# Clear everything and rebuild
rm -rf node_modules
rm -rf dist
npm install
npm run build
npx cap sync
```

### 7. Barcode Scanning Not Working

**Symptoms**: Scanner opens but doesn't detect codes

**Solutions**:

- Ensure good lighting
- Hold device steady
- Try different barcode types
- Check camera permissions
- Test with QR codes first (easier to scan)

### 8. Location Services Not Working

**Error**: Geolocation permission denied

**Solution**:

**Android**: Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS**: Add to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location to find nearby markets</string>
```

### 9. Haptic Feedback Not Working

**Error**: No vibration on device

**Solution**:

- Check device has vibration capability
- Ensure haptic permissions (usually automatic)
- Test on physical device (not simulator)

### 10. Push Notifications Not Working

**Error**: Notifications not received

**Solution**:

```bash
# Check notification permissions
# In app settings, ensure notifications are enabled

# For Android, ensure FCM is configured
# For iOS, ensure APNS certificates are valid
```

## Testing Commands

### Web Testing

```bash
npm run dev
# Open http://localhost:8080
```

### Android Testing

```bash
# With live reload
npm run android:dev

# Manual build and test
npm run android:build
```

### iOS Testing

```bash
# With live reload
npm run ios:dev

# Manual build and test
npm run ios:build
```

## Debug Commands

### Check Plugin Status

```bash
npx cap ls
```

### View Device Logs

```bash
# Android
npx cap run android --livereload --consolelogs

# iOS
npx cap run ios --livereload --consolelogs
```

### Clean Everything

```bash
# Nuclear option - clean everything
rm -rf node_modules
rm -rf dist
rm -rf android
rm -rf ios
npm install
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

## Performance Tips

### 1. Optimize Bundle Size

- Tree-shake unused Capacitor plugins
- Use dynamic imports for heavy features

### 2. Battery Optimization

- Stop location tracking when not needed
- Release camera resources after scanning
- Minimize background processing

### 3. Memory Management

- Clear large images from memory
- Limit offline storage size
- Clean up event listeners

## Getting Help

### 1. Check Capacitor Docs

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Plugin Documentation](https://capacitorjs.com/docs/plugins)

### 2. Community Resources

- [Capacitor GitHub](https://github.com/ionic-team/capacitor)
- [Ionic Forum](https://forum.ionicframework.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)

### 3. Debug Information to Collect

- Device model and OS version
- App version and Capacitor version
- Console logs and error messages
- Steps to reproduce the issue

---

**Need more help?** Check the specific error message and search for it in the Capacitor documentation or community forums!
