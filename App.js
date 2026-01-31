import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Volume manager - requires development build (not available in Expo Go)
let VolumeManager = null;
let VolumeManagerAvailable = false;

try {
  const volumeManagerModule = require("react-native-volume-manager");
  VolumeManager = volumeManagerModule.default || volumeManagerModule;
  
  if (VolumeManager && typeof VolumeManager.addVolumeListener === 'function') {
    VolumeManagerAvailable = true;
    console.log("✅ VolumeManager loaded successfully - Development build detected");
    console.log("📦 VolumeManager methods:", Object.keys(VolumeManager));
  } else {
    console.log("⚠️ VolumeManager loaded but addVolumeListener not available");
  }
} catch (e) {
  // Will be null in Expo Go, but will work in development build
  console.log("ℹ️ Volume manager not available (Expo Go mode) - Feature disabled");
  console.log("💡 To enable: Create a development build with 'npx expo prebuild' and 'npx expo run:ios'");
  VolumeManager = null;
  VolumeManagerAvailable = false;
}

const ANSWERS = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
];

const YES_NO_ANSWERS = [
  "Yes",
  "No",
];

export default function App() {
  const [answer, setAnswer] = useState("🎱 Shake!");
  const [isShaking, setIsShaking] = useState(false);
  const [yesNoMode, setYesNoMode] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const accelerationRef = useRef([]);
  const lastShakeTimeRef = useRef(0);
  const lastAccelRef = useRef(null);
  const deltaCountRef = useRef(0);
  const lastVolumeRef = useRef(null);
  const volumeDownPressTimeRef = useRef(null);
  const volumeCheckIntervalRef = useRef(null);

  const animateSpin = useCallback(() => {
    if (isShaking) {
      console.log("⚠️ animateSpin called but isShaking is true, returning");
      return;
    }
    setIsShaking(true);
    console.log("🎱 animateSpin called! yesNoMode:", yesNoMode);

    const answerPool = yesNoMode ? YES_NO_ANSWERS : ANSWERS;
    const newAnswer = answerPool[Math.floor(Math.random() * answerPool.length)];
    console.log("📝 Selected answer:", newAnswer, "from pool:", yesNoMode ? "YES_NO" : "ALL");

    Animated.sequence([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnswer(newAnswer);
      spinAnim.setValue(0);
      scaleAnim.setValue(1);
      setIsShaking(false);
      console.log("Animation complete!");
    });
  }, [isShaking, spinAnim, scaleAnim, yesNoMode]);

  useEffect(() => {
    let subscription;
    const shakeThreshold = 3; // Delta between readings
    let logCounter = 0;

    const setupAccelerometer = async () => {
      try {
        console.log("Setting up accelerometer...");
        await Accelerometer.setUpdateInterval(50); // More frequent readings

        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const currentAccel = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();

          logCounter++;
          if (logCounter % 10 === 0) {
            console.log(
              `Accel: ${currentAccel.toFixed(2)} (x:${x.toFixed(1)}, y:${y.toFixed(1)}, z:${z.toFixed(1)})`,
            );
          }

          // Detect change from last reading
          if (lastAccelRef.current !== null) {
            const delta = Math.abs(currentAccel - lastAccelRef.current);

            if (delta > shakeThreshold) {
              deltaCountRef.current++;
              if (logCounter % 10 === 0) {
                console.log(
                  `Delta: ${delta.toFixed(2)}, Count: ${deltaCountRef.current}`,
                );
              }
            } else {
              deltaCountRef.current = 0;
            }

            // Trigger animation when we detect multiple large deltas
            const timeSinceLastShake = now - lastShakeTimeRef.current;
            if (
              deltaCountRef.current >= 3 &&
              timeSinceLastShake > 800 &&
              !isShaking
            ) {
              console.log(
                `🎯 SHAKE DETECTED! Delta count: ${deltaCountRef.current}`,
              );
              lastShakeTimeRef.current = now;
              deltaCountRef.current = 0;
              animateSpin();
            }
          }

          lastAccelRef.current = currentAccel;
        });
        console.log("Accelerometer listener ready");
      } catch (error) {
        console.log("Sensor error:", error);
      }
    };

    setupAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [animateSpin, isShaking]);

  // Volume button detection - requires development build
  useEffect(() => {
    console.log("🔍 Setting up volume detection...");
    console.log("📊 VolumeManager available:", VolumeManagerAvailable ? "YES (Development Build)" : "NO (Expo Go)");
    
    if (!VolumeManagerAvailable || !VolumeManager) {
      console.log("ℹ️ Volume button feature disabled - requires development build");
      console.log("💡 To enable: Run 'npx expo prebuild' then 'npx expo run:ios' or 'npx expo run:android'");
      // Volume manager not available in Expo Go - feature gracefully disabled
      return;
    }

    let volumeListener = null;
    let lastVolume = null;

    try {
      console.log("🔧 Checking VolumeManager.addVolumeListener...");
      // Listen for volume changes
      if (VolumeManager.addVolumeListener) {
        console.log("✅ addVolumeListener exists, setting up listener...");
        volumeListener = VolumeManager.addVolumeListener((result) => {
          try {
            console.log("🔊 Volume event received:", JSON.stringify(result));
            const { volume, type } = result;
            const now = Date.now();

            console.log(`📊 Volume: ${volume}, Type: ${type}, LastVolume: ${lastVolume}, isShaking: ${isShaking}`);

            // Detect volume down button press
            const isVolumeDown = type === 'volume_down' || (lastVolume !== null && volume < lastVolume - 0.05);
            const isVolumeUp = type === 'volume_up' || (lastVolume !== null && volume > lastVolume + 0.05);
            
            console.log(`🔍 isVolumeDown: ${isVolumeDown}, isVolumeUp: ${isVolumeUp}`);

            if (isVolumeDown) {
              if (volumeDownPressTimeRef.current === null) {
                volumeDownPressTimeRef.current = now;
                console.log("🔽 Volume down detected, starting timer...", {
                  time: now,
                  volume: volume,
                  lastVolume: lastVolume
                });
                
                // Set timer for long press (500ms)
                setTimeout(() => {
                  console.log("⏰ Timer fired! Checking conditions...");
                  if (volumeDownPressTimeRef.current !== null) {
                    const pressDuration = Date.now() - volumeDownPressTimeRef.current;
                    console.log(`⏱️ Press duration: ${pressDuration}ms, isShaking: ${isShaking}`);
                    if (pressDuration >= 500 && !isShaking) {
                      console.log("✅ Volume down held - Yes/No mode!");
                      console.log("🔄 Setting yesNoMode to true...");
                      setYesNoMode(true);
                      console.log("🎱 Calling animateSpin...");
                      animateSpin();
                      // Reset after answer is shown
                      setTimeout(() => {
                        console.log("🔄 Resetting yesNoMode after 2s");
                        setYesNoMode(false);
                        volumeDownPressTimeRef.current = null;
                      }, 2000);
                    } else {
                      console.log("❌ Conditions not met:", {
                        pressDuration,
                        required: 500,
                        isShaking
                      });
                    }
                  } else {
                    console.log("⚠️ volumeDownPressTimeRef is null, timer cancelled");
                  }
                }, 500);
              } else {
                console.log("⚠️ Volume down already being tracked");
              }
            } else if (isVolumeUp) {
              // Volume up or released - reset
              console.log("🔺 Volume up detected, resetting...");
              if (volumeDownPressTimeRef.current !== null) {
                console.log("🔄 Clearing volumeDownPressTimeRef");
                volumeDownPressTimeRef.current = null;
                setYesNoMode(false);
              }
            } else {
              console.log("➡️ Volume stable or unknown change");
            }

            lastVolume = volume;
            console.log("💾 Updated lastVolume to:", lastVolume);
          } catch (err) {
            console.log("❌ Volume listener error:", err);
            console.log("❌ Error stack:", err.stack);
          }
        });
        console.log("✅ Volume listener set up successfully");
      } else {
        console.log("❌ addVolumeListener does not exist on VolumeManager");
        console.log("📦 Available methods:", Object.keys(VolumeManager));
      }
    } catch (error) {
      console.log("❌ Volume manager setup error:", error);
      console.log("❌ Error stack:", error.stack);
    }

    return () => {
      console.log("🧹 Cleaning up volume listener...");
      if (volumeListener && typeof volumeListener.remove === 'function') {
        volumeListener.remove();
        console.log("✅ Volume listener removed");
      }
      if (volumeDownPressTimeRef.current) {
        volumeDownPressTimeRef.current = null;
      }
    };
  }, [animateSpin, isShaking]);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔮 Magic 8 Ball</Text>

        <View style={styles.ballContainer}>
          <Animated.View
            style={[
              styles.ball,
              {
                transform: [{ rotate: rotation }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.ballInner}>
              <View style={styles.window}>
                <Text style={styles.answer}>{answer}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <TouchableOpacity
          style={[styles.button, isShaking && styles.buttonActive]}
          onPress={() => !isShaking && animateSpin()}
          disabled={isShaking}
        >
          <Text style={styles.buttonText}>
            {isShaking ? "🌟 Spinning..." : "🎯 Tap to Ask"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {isShaking ? "The spirits speak..." : "Shake or tap the button"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 52,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 50,
    textAlign: "center",
  },
  ballContainer: {
    marginVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ball: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#1a1a2e",
    shadowColor: "#6a5acd",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#16213e",
  },
  ballInner: {
    width: 245,
    height: 245,
    borderRadius: 122.5,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  window: {
    width: 200,
    height: 110,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#6a5acd",
    paddingHorizontal: 20,
    shadowColor: "#6a5acd",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  answer: {
    color: "#00ff88",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#6a5acd",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: "#6a5acd",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#8b7dd8",
  },
  buttonActive: {
    backgroundColor: "#4a3aad",
    shadowOpacity: 0.3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 15,
  },
});
