#include <ESP8266WiFi.h>
#include "esp_types.h"
#include "Device.h"

#define DEVICE_ID 1 // unique ID for each ESP chip
#define MAX_CHANNEL 13 // max wifi channel

int current_channel = 0;

void process_beacon(uint8_t *buf, uint16_t len) {
  const rx_beacon *pkt = (rx_beacon *) buf;
  const MacHeader *mac = (MacHeader *) &pkt->mac;

  Device* src_dev = Device::Lookup(mac->src_addr);

  uint8_t ssid_len = pkt->buf[15];

  // if valid SSID length, extract SSID. I'm not sure if this is STRICTLY correct to the standard but it'll do for now
  if (ssid_len <= 32) {
    int i;    
    for (i=0; i<ssid_len; i++) src_dev->ssid[i] = pkt->buf[16+i];
    for (i=i; i<32; i++) src_dev->ssid[i] = 0x0;
  }

  int16_t rssi = pkt->rx_ctrl.rssi;
  src_dev->rssi_total += (0 - rssi);
  src_dev->rssi_count++;
  
}

void process_client(uint8_t *buf, uint16_t len) {
  const rx_client *pkt = (rx_client *) buf;
  const MacHeader *mac = (MacHeader *) &pkt->mac;

  Device* src_dev = Device::Lookup(mac->src_addr);
  Device* dst_dev = Device::Lookup(mac->dst_addr);
  

  int16_t rssi = pkt->rx_ctrl.rssi;
  src_dev->rssi_total += (0 - rssi);
  src_dev->rssi_count++;

  src_dev->packet_count[dst_dev->id]++;

  uint16_t pkt_len = pkt->lenseq[0].len; // TODO: Do more research on 802.11 frame to make sure this is right..
  src_dev->data_total[dst_dev->id] += pkt_len; 
}

// len <= 12 -> RC Control (???)
// len == 128 -> BEACON
// len else -> Client frame
void rxcb(uint8_t *buf, uint16_t len) {
  if (len <= 12) return; // invalid/incomplete frame
  if (len == 128) {
    process_beacon(buf, len);

  } else {
    process_client(buf, len);
  }
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(0);
  WiFi.disconnect();
  wifi_set_promiscuous_rx_cb(rxcb);
  wifi_set_channel(0);
  wifi_promiscuous_enable(1);

}

void switch_channel() {
  current_channel++;
  if (current_channel > MAX_CHANNEL) current_channel = 0;
  wifi_set_channel(current_channel);
}

int timePassed = 0;

void loop() {
  // put your main code here, to run repeatedly:
  delay(10);
  timePassed+= 10;
  switch_channel();

  if (timePassed > 500) {
    timePassed = 0;
    Device::DumpAll();
  }
}
