/*
 *  ESP8266 WiFi Traffic Analyzer
 *  JSON encoder / transmitter
 *  by Matt Walton
 *  for University of Manchester Final Year Project
 */
 
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

WebSocketsClient ws;

#define MAX_JSON_LEN 10000

const char wifi_ssid[]= "why_fi?";
const char wifi_pass[] = "HowHardCanItBe?321";
const char device_id[] = "1";
const char secret[] = "agoodsecret123";
const char host[] = "192.168.5.31";
int port = 8082;

bool ws_connected = false;

// header to mark the start of the packet
const uint8_t header[3] = {0xff, 0x60, 0x55};

void sendJSON(StaticJsonDocument<MAX_JSON_LEN> doc) {
  char str[MAX_JSON_LEN];

  size_t len = serializeJson(doc, str);
  ws.sendTXT(str, len);
}

void authenticate() {
  // Construct the authentication packet

  // size from arduinojson assistant
  StaticJsonDocument<MAX_JSON_LEN> doc;
  doc["s"] = secret;
  doc["i"] = device_id;

  sendJSON(doc);

  ws_connected = true;
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    authenticate();
  } else if (type == WStype_DISCONNECTED) {
    ws_connected = false;
  }
}

uint8_t checksum = 0;

uint8_t readByte() {
  uint8_t buf;
  Serial.readBytes(&buf, 1);
  checksum = (checksum + buf) % 256;
  return buf;
}

void resetChecksum() {
  checksum = 0;
}

uint16_t readUint16() {
  uint8_t ub = readByte();
  uint8_t lb = readByte();

  uint16_t num = (ub << 8) + lb;
  return num;
}

void checkForHeader() {
  if (Serial.find(header, 3)) {
    receiveData();
  }
}

void receiveData() {
  // read from the serial port
  // wait for length

  uint8_t id = readByte();

  unsigned char mac[6];
  Serial.readBytes(mac, 6);

  char macStr[18]; 
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  uint16_t rssi = readUint16();
  uint16_t channels = readUint16();
  
  boolean isAp = (readByte() == 1);

  char ssid[32];

  if (isAp) {
    Serial.readBytes(ssid, 32);
  }

  uint8_t devs = readByte();

  size_t jsonSize = (JSON_OBJECT_SIZE(6) + JSON_ARRAY_SIZE(devs) + devs*JSON_OBJECT_SIZE(3) + 63);
  DynamicJsonDocument doc(jsonSize);
  doc["i"] = id;
  doc["m"] = macStr;
  doc["r"] = rssi;
  doc["c"] = channels;
  doc["a"] = isAp;
  doc["s"] = ssid;

  JsonArray connects = doc.createNestedArray("co");

  for (int i=0; i<devs; i++) {
    JsonObject dev = connects.createNestedObject();
    dev["i"] = readByte();
    dev["c"] = readByte();
    dev["d"] = readUint16();
  }

  

  String str;
  
  size_t len = serializeJson(doc, str);
  ws.sendTXT(str.c_str(), len);

}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.setTimeout(200);
  
  WiFi.begin(wifi_ssid, wifi_pass);

  Serial.println("Connecting");
  // wait for WiFi connection
  while(WiFi.status() != WL_CONNECTED) {
    delay(100);
  }

  
  ws.begin(host, port, "/");
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(3000);
  
}

void loop() {
  ws.loop();

  // check for incoming serial data
  if (ws_connected)
    checkForHeader();
}