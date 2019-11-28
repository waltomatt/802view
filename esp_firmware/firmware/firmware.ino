#include <ESP8266WiFi.h>
#include <GDBStub.h>

#include "Device.h"
#include "Frame.h"


#define MAX_CHANNEL 13 // max wifi channel

int current_channel = 0;



void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  gdbstub_init();

  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(0);
  WiFi.disconnect();
  wifi_set_promiscuous_rx_cb(process_frame);
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
    Device::WriteAll();
    Device::Clear();
  }
}
