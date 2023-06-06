import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import registerNNPushToken from "native-notify";
import * as Permissions from "expo-permissions";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const [sensorValue, setSensorValue] = useState(0);
  const responseListener = useRef(); //get data from firebase realtime database
  const db = firebase.database();
  const [newName, setnewName] = useState("");
  const [sensorFlag, setSensorFlag] = useState(false);
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  useEffect(() => {
    let ref = database.ref("/Sensor");
    ref.on("data", (snapshot) => {
      const data = snapshot.val();
      setSensorValue(data);
      if (newName > 150) {
        setSensorFlag(true);
      }
    });
  }, []);
  return (
    <View style={styles.container}>
      <Button onPress={async () => await schedulePushNotification()} title="" />
      <Text>Sensor Reading:{sensorValue}</Text>

      {sensorFlag ? (
        <Text>Alert! Substances may be consumed at this sensor's location</Text>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}
async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Alert",
      body: "Activity detected at sensor 1",
      data: { data: 128 },
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
