# ProGuard / R8 rules for Oblivion 1 Fitness Club.
#
# Capacitor ships its own consumer rules (@CapacitorPlugin classes, @PluginMethod, permission and
# activity callbacks, Plugin subclasses, @JavascriptInterface), and they apply automatically.
# Do not add blanket keeps for whole packages such as com.getcapacitor.** or
# com.revenuecat.purchases.**: they stop R8 from obfuscating that code and Google Play wants at
# least 25% of the app obfuscated. Add a targeted rule only when a release build shows a break.

# The launcher activity is referenced by name from AndroidManifest.xml.
-keep class com.o1fc.fitness.MainActivity { *; }

# Plugins read annotations and generic types by reflection.
-keepattributes *Annotation*,Signature,Exceptions
