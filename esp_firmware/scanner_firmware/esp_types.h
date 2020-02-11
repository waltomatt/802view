#ifndef TYPES_H
#define TYPES_H

// Structure from the ESP8266 manual
// This is the header that the WiFi chipset prepends to the frame
struct RxControl {
  signed rssi:8; // signal intensity of packet
  unsigned rate:4;
  unsigned is_group:1;
  unsigned:1;
  unsigned sig_mode:2; // 0:is 11n packet; 1:is not 11n packet;
  unsigned legacy_length:12; // if not 11n packet, shows length of packet.
  unsigned damatch0:1;
  unsigned damatch1:1;
  unsigned bssidmatch0:1;
  unsigned bssidmatch1:1;
  unsigned MCS:7; // if is 11n packet, shows the modulation and code used (range from 0 to 76)
  unsigned CWB:1; // if is 11n packet, shows if is HT40 packet or not
  unsigned HT_length:16;// if is 11n packet, shows length of packet.
  unsigned Smoothing:1;
  unsigned Not_Sounding:1;
  unsigned:1;
  unsigned Aggregation:1;
  unsigned STBC:2;
  unsigned FEC_CODING:1; // if is 11n packet, shows if is LDPC packet or not.
  unsigned SGI:1;
  unsigned rxend_state:8;
  unsigned ampdu_cnt:8;
  unsigned channel:4; //which channel this packet in.
  unsigned:12;
};

struct FrameControl {
    unsigned protocol:2; // always 0
    unsigned type:2; // 00=mgmt,01=ctrl,10=data
    unsigned subtype:4; // 1000: beacon
    unsigned to_ds:1; // To distribution system (ap)
    unsigned from_ds:1; // from distribution system (ap)
    unsigned more_frag:1;
    unsigned retry:1;
    unsigned power_mgmt:1;
    unsigned more_data:1;
    unsigned protected_frame:1;
    unsigned order:1;
};

struct MacHeader {
    struct FrameControl ctrl[1];
    uint8_t addr1[6];
    uint8_t addr2[6];
    uint8_t addr3[6];
};

struct LenSeq{
  uint16_t len; // length of packet
  uint16_t seq; // serial number of packet, the high 12bits are serial number, low 14 bits are Fragment number (usually be 0)
  uint8_t addr3[6]; // the third address in packet
};

struct DataFrame {
    struct RxControl rx;
    struct MacHeader mac;
    uint8_t buffer[12]; // stuff in the header we don't need
    uint16_t cnt; // how many packets are in this buffer (it groups em together)
    struct LenSeq lenseq[1];
};

struct MgmtFrame {
    struct RxControl rx;
    struct MacHeader mac;
    uint8_t buf[90];
    uint16_t count;
    uint16_t len; // length of 
};

#endif
