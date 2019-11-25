#include <ESP8266WiFi.h>
#define MAX_CHANNEL 13 // max wifi channel

void rxcb(uint8_t *buf, uint16_t len) {
  char txAddr[6];
  char rxAddr[6];

  for (int i=0; i<6; i++) {
    txAddr[i] = buf[58 + i];
    rxAddr[i] = buf[64 + i];
  }

  Serial.write("\ntx:");
  Serial.write(txAddr, 6);
  Serial.write("\nrx:");
  Serial.write(rxAddr, 6);
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);

  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(0);
  WiFi.disconnect();
  wifi_set_promiscuous_rx_cb(rxcb);
  wifi_set_channel(5);
  wifi_promiscuous_enable(1);

  Serial.println("starting...");

}

void loop() {
  // put your main code here, to run repeatedly:

}
