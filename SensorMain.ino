#define sensorPin 4
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define API_KEY ""
#define DATABASE_URL ""
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
unsigned long sendDataPrevMillis = 0;
int count = 0;
bool signupOK = false;
int sensorData=0;
int tryCount=0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED){
    tryCount++;
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    vTaskDelay(4000);
    if(tryCount==10){
      ESP.restart();
    }
    Serial.print(".");
    delay(300);

  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
  
  config.api_key = API_KEY;

  config.database_url = DATABASE_URL;
  if(Firebase.signUp(&config,&auth,"","")){
    Serial.println("auth Finished");
    signupOK = true;
  }else{
    Serial.print(config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.setDoubleDigits(5);
  Firebase.reconnectWiFi(true);
  }
void loop() {
  sensorData = readSensor();
  if (Firebase.ready()&&signupOK&& (millis()-sendDataPrevMillis>5000||sendDataPrevMillis==0)){
    Firebase.RTDB.setInt(&fbdo,"Sensor/data",sensorData);
  }
}
int readSensor() {
  unsigned int sensorValue = analogRead(sensorPin);  // Read the analog value from sensor
  unsigned int outputValue = map(sensorValue, 0, 1023, 0, 255); // map the 10-bit data to 8-bit data
  return sensorValue;             // Return analog moisture value
}
