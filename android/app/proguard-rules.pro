# Add project specific ProGuard / R8 rules here.
-keep public class com.getcapacitor.** { *; }
-keep public class com.o1fc.fitness.** { *; }

# Preserve WebView JavaScript Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Suppress harmless warnings for optional third-party components
-dontwarn com.google.android.gms.**
-dontwarn androidx.**
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

