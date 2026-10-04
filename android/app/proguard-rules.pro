# ProGuard rules for Oblivion 1 Fitness Club
# Preserve MainActivity and Capacitor entry points
-keep class com.o1fc.fitness.MainActivity { *; }
-keep public class * extends com.getcapacitor.BridgeActivity
-keep public class * extends com.getcapacitor.Plugin
-keep class com.getcapacitor.** { *; }
