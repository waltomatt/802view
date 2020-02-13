

void frame_process_rssi(uint8_t id, int8_t rssi) {
  uint8_t p_rssi = 0 - rssi; // make positive

  devices[id].rssi_total += p_rssi;
  devices[id].rssi_count++;
}

void frame_process_channels(uint8_t id, uint8_t chan) {
  devices[id].channels = (devices[id].channels & (0x1 << chan+1));
}

void frame_process_mgmt(uint8_t *buffer, uint8_t len) {
  const MgmtFrame *frame = (MgmtFrame *)buffer;
  const MacHeader *mac = (MacHeader*) &(frame->mac);
  // check for beacon frame
  if (mac->ctrl[0].subtype == 0x8) { 
    
    // We have a beacon frame from an access point
    // Broadcasting info about it
    // addr2 will be source address

    int ap_id = device_get(mac->addr2);

    // Update RSSI & channels
    
    if (ap_id >= 0) {

      frame_process_rssi(ap_id, frame->rx.rssi);
      frame_process_channels(ap_id, frame->rx.channel);
    
      uint8_t tag_number = frame->buf[12];
      uint8_t ssid_length = frame->buf[13];
  
      // check valid SSID
      if (tag_number == 0x0 && ssid_length < 32) {
          if (ssid_length > 0) {
            // set SSID, following by null bytes
            int i;
            for (int i=0; i<ssid_length; i++) devices[ap_id].ssid[i] = frame->buf[14 + i];
            for (i=i; i<32; i++) devices[ap_id].ssid[i] = 0x0;
          }
      } 
  
      devices[ap_id].is_ap = 1;
    }        

  }
}

void frame_process_data(uint8_t *buffer, uint8_t len) {
  const DataFrame *frame = (DataFrame *)buffer;
  const MacHeader *mac = (MacHeader*) &(frame->mac);

  if (frame->cnt < 1) return; // no good packets here

  if (mac->ctrl[0].type == 0x2) { // only data frames
    int src_id = device_get(mac->addr1);
    int dst_id = device_get(mac->addr2);
    
    if (src_id >= 0 && dst_id >= 0) {
      frame_process_rssi(src_id, frame->rx.rssi);
      frame_process_channels(src_id, frame->rx.channel);
      frame_process_channels(dst_id, frame->rx.channel);

      device_add_packet(src_id, dst_id, frame->lenseq[0].len);
      if (frame->cnt == 2)
        device_add_packet(src_id, dst_id, frame->lenseq[1].len);
    }
  }
}

void frame_process(uint8_t *buffer, uint16_t len) {
  if (len <= 12) return; // ctrl / incomplete frames, discard

  if (len == 128) {
    frame_process_mgmt(buffer, len);
  } else {
    frame_process_data(buffer, len);
  }
}
