// Structures from the ESP8266 manual

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

struct MacHeader {
  uint16_t frame_ctrl;
  uint16_t duration;

  uint8_t dst_addr[6];
  uint8_t src_addr[6];
  uint8_t bss_id[6];
};

struct LenSeq{
  uint16_t len; // length of packet
  uint16_t seq; // serial number of packet, the high 12bits are serial number, low 14 bits are Fragment number (usually be 0)
  uint8_t addr3[6]; // the third address in packet
};

// Structure for when we get a client packet (len != 128)
struct rx_client {
  struct RxControl rx_ctrl;
  struct MacHeader mac;
  u8 buf[14]; // rest of head of ieee80211 packet
  u16 cnt; // number count of packet
  struct LenSeq lenseq[1]; //length of packet
};

// structure for when we get a beacon packet
struct rx_beacon {
  struct RxControl rx_ctrl;
  struct MacHeader mac;
  u8 buf[90];
  u16 cnt;
  u16 len; //length of packet
};
