#ifndef FRAME_H
#define FRAME_H

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

void process_rssi(Device* dev, int8_t rssi) {
    uint8_t p_rssi = 0 - rssi; // make positive

    dev->rssi_total += p_rssi;
    dev->rssi_count++;
}

void process_channels(Device* dev, uint8_t channel) {
    dev->channels = (dev->channels & (0x1 << channel + 1));
}

void process_mgmt(uint8_t *buffer, uint8_t len) {    
    const MgmtFrame *frame = (MgmtFrame *)buffer;
    const MacHeader *mac = (MacHeader*) &(frame->mac);

    // check for beacon frame
    if (mac->ctrl[0].subtype == 0x8) { 

        Debug::Print("BEACON ");
        Debug::PrintMac(mac->addr2);
        Debug::Print("\n");

        // We have a beacon frame from an access point
        // Broadcasting info about it
        // addr2 will be source address

        Device *ap = Device::Lookup(mac->addr2);

        if (ap != NULL) {
            uint8_t tag_number = frame->buf[12];
            uint8_t ssid_length = frame->buf[13];

            // check valid SSID
            if (tag_number == 0x0 && ssid_length < 32) {
                if (ssid_length > 0) {
                    // set SSID, following by null bytes
                    int i;
                    for (int i=0; i<ssid_length; i++) ap->ssid[i] = frame->buf[14 + i];
                    for (i=i; i<32; i++) ap->ssid[i] = 0x0;
                }
            } 

            ap->is_ap = 1;
        }        

        // Update RSSI & channels
        process_rssi(ap, frame->rx.rssi);
        process_channels(ap, frame->rx.channel);
    }
}

void process_data(uint8_t *buffer, uint8_t len) {
    const DataFrame *frame = (DataFrame *)buffer;
    const MacHeader *mac = (MacHeader*) &(frame->mac);

    if (frame->cnt < 1) return; // no good packets here

    if (mac->ctrl[0].type == 0x2) { // only data frames

        // get the transmitter & receiver address

        Device *src = Device::Lookup(mac->addr1);
        Device *dst = Device::Lookup(mac->addr2);


        if (src != NULL && dst != NULL) {

            Debug::Print("DATA ");
            Debug::PrintMac(src->mac);
            Debug::Print(" -> ");
            Debug::PrintMac(dst->mac);
            Debug::Print("\n");

            // Update RSSI & channels
            process_rssi(src, frame->rx.rssi);
            process_channels(src, frame->rx.channel);
            process_channels(dst, frame->rx.channel);

            src->AddPacket(dst->id, frame->lenseq[0].len);
            if (frame->cnt == 2)
                src->AddPacket(dst->id, frame->lenseq[1].len);

        }
    }
}

void process_frame(uint8_t *buffer, uint16_t len) {
    if (len <= 12) return; // ctrl / incomplete frames, discard

    if (len == 128) {
        process_mgmt(buffer, len);
    } else {
        process_data(buffer, len);
    }
}

#endif
