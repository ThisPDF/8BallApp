# Magic 8 Ball - iOS App

A beautiful Magic 8 Ball predictor app for iOS built with React Native and Expo. Shake your phone to get answers to your yes/no questions!

## Features

✨ **Shake Detection** - Simply shake your phone to get an answer
📱 **Beautiful UI** - Dark theme with smooth animations
✅ **20+ Answers** - Traditional Magic 8 Ball responses
🎮 **Tap Alternative** - Can also tap the ball button if shake isn't available
🔀 **Yes/No Mode Toggle** - Switch to get only Yes or No answers
🌟 **Smooth Animations** - Rotating ball with scale effects

## Installation & Running

### On iOS Simulator

```bash
npm start
# Then press 'i' in the terminal
```

Or directly:

```bash
npm run ios
```

### On Physical iOS Device

1. Install **Expo Go** from Apple App Store
2. Run:

```bash
npm start
```

3. Scan the QR code with your phone camera or Expo Go app

## How to Use

1. **Shake Your Phone**: Shake your iOS device to spin the ball and reveal your answer
2. **Or Tap the Button**: Tap "Tap for Answer" button if shake isn't available
3. **Yes/No Mode**: Toggle the "Yes/No Mode" switch to get only Yes or No answers
4. **Read Your Answer**: Check the window on the ball for your response
5. **Ask Again**: Shake again to get another answer

### Yes/No Mode Feature

- **Toggle Switch**: Use the switch below the button to activate Yes/No mode
- **Simple Answers**: When activated, the app will only respond with "Yes" or "No"
- **Visual Indicator**: The hint text updates to show when Yes/No mode is active
- **Works Everywhere**: This feature works in Expo Go and all Expo managed workflows

## Customization

Edit `App.js` to customize:

- **Answers**: Modify the `ANSWERS` array (lines 10-32)
- **Colors**: Change style colors in the `StyleSheet` (lines 165+)
- **Shake Sensitivity**: Adjust `shakeThreshold` value (line 53)
- **Shake Cooldown**: Change `shakeCooldown` in milliseconds (line 54)

## Troubleshooting

- **Shake not detected on simulator?** Use the "Tap for Answer" button or press Cmd+Ctrl+Z
- **Permission issues?** Grant motion sensor permissions in Expo Go
- **Connection issues?** Ensure your device and computer are on the same network

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)
