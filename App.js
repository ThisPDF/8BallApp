import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function App() {
  const [answer, setAnswer] = useState("🎱 Shake!");
  const [isShaking, setIsShaking] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const accelerationRef = useRef([]);
  const lastShakeTimeRef = useRef(0);
  const lastAccelRef = useRef(null);
  const deltaCountRef = useRef(0);

  const animateSpin = useCallback(() => {
    if (isShaking) return;
    setIsShaking(true);
    console.log("🎱 Shake detected! Animating...");

    const newAnswer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

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
  }, [isShaking, spinAnim, scaleAnim]);

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
