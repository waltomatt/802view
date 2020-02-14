/*
 *  ESP8266 WiFi Traffic Analyzer
 *  Packet scanner
 *  by Matt Walton
 *  for University of Manchester Final Year Project
 */

#include <ESP8266WiFi.h>

#define MAX_DEVICES 100
#define MAX_CHANNEL 13
#define WRITE_DELAY 1000
#define CHANNEL_DELAY 10
#define BAUD_RATE 115200

#define DEBUG 0

void debug_print_mac(const unsigned char *mac) {
  char str[17]; 
  sprintf(str, "%2X:%2X:%2X:%2X:%2X:%2X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.println(str);
}

const uint8_t header[3] = {0xFF, 0x60, 0x55};

#include "esp_types.h"
#include "Write.h"
#include "Device.h"
#include "Frame.h"

uint8_t current_channel = 0;

void switch_channel() {
  // flick through the 802.11 channels
  current_channel++;
  if (current_channel > MAX_CHANNEL) current_channel=0;
  wifi_set_channel(current_channel);
}


void setup() {
  Serial.begin(BAUD_RATE);

  // Setup the WiFi chip for 'promiscuous mode', i.e intercepting frames
  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(0);
  WiFi.disconnect();
  
  wifi_set_promiscuous_rx_cb(frame_process);
  wifi_set_channel(0);
  wifi_promiscuous_enable(1);
}

unsigned long last_send = 0;
unsigned long last_channel_switch = 0;

void loop() {
  // Using millis comparison instead of delay to prevent hanging the CPU
  if (millis() - last_channel_switch > CHANNEL_DELAY) {
    last_channel_switch = millis();
    switch_channel();
  }

  if (millis() - last_send > WRITE_DELAY) {
    last_send = millis();
    wifi_promiscuous_enable(0);
    device_write_all();
    device_reset();
    wifi_promiscuous_enable(1);
  }
}
