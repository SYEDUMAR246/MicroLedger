# MicroLedger for Android

The Capacitor app packages the React interface on the phone. There is no development-server URL in the Android configuration. Manual entry, Type, budgets, bills, goals, onboarding, companions and receipt OCR work without hosting. OCR bundles ML Kit's Latin text model; English/PKR receipts must have a readable labelled total. Review extracted details before saving. Voice uses the phone's installed speech service and may need internet access.

## Build a test APK on Windows

Install Node 22 or newer, Java 21 and Android Studio with Android SDK Platform 36 and Build Tools 36.0.0. Complete Android Studio's license prompts. Then run `npm ci` followed by `npm run android:build` from the repository. The script uses the SDK under `%LOCALAPPDATA%\Android\Sdk` or `ANDROID_HOME`, and Java 21 from Eclipse Adoptium or the ignored `.tools` folder. Set `JAVA_HOME` for other Java installations.

The APK is written to `outputs\MicroLedger-test.apk`. It is a debug-signed testing build, not a Play Store release. It supports Android 7.0 and newer. Send this APK to your phone, open it and allow installation from the particular app you used to open the file when Android asks. Preserve the debug signing key if you need later test builds to install as updates. Production distribution needs a separate, securely retained release signing key and a release build.

## Phone verification

- Complete setup, customize a companion and record a Manual expense.
- Type `Lunch at KFC Rs. 1,450`, review and save.
- In Scan, test a sample receipt and a clear camera/gallery receipt. Repeat scanning with airplane mode enabled.
- Check voice input or its unavailable/cancel path.
- Create a category, bill and goal. Delete each and exercise Undo within five seconds.
- Export a backup using Android's share sheet, save it outside the app and restore it.
- Close and reopen the app; check saved entries, settings and budget. Check Back, keyboard, dark mode and screen rotation.

Ledger data is held in the app's private WebView storage. Uninstalling the app or clearing its storage removes that data. Export backups regularly. Installing this Android build does not import data from a desktop browser; use backup export/restore to transfer it.
