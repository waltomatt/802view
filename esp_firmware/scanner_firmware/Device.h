/*
 * We store each device we encounter as a 'Device' struct, and each connection in a 'Connection' struct
 * in a global buffer called 'devices'
 * I calculated the maximum amount of devices we can store in any period is 100
 */

struct Connection  {
  uint8_t dst;
  uint8_t count;
  uint16_t data;
};

struct Device {
  uint8_t id;
  uint8_t mac[6];

  uint16_t rssi_total;
  uint8_t rssi_count;

  uint16_t channels;
  uint8_t conn_count;

  Connection connections[MAX_DEVICES];
  uint8_t is_ap;
  uint8_t ssid[32];
};

Device devices[MAX_DEVICES];
uint8_t device_count = 0;


uint8_t init_device(const uint8_t *mac) {
  if (device_count == MAX_DEVICES) return -1;

  // 'initialize' the next device by resetting all the values
  uint8_t i = device_count++;
  devices[i].id = i;

  memcpy(devices[i].mac, mac, 6);
  devices[i].rssi_total = 0;
  devices[i].rssi_count = 0;

  devices[i].channels = 0;
  devices[i].conn_count = 0;
  devices[i].is_ap = 0;
  memset(devices[i].ssid, 0, 32);
  
  return i;
}

int device_get(const uint8_t *mac) {
  int found = -1;

  // search for a device by mac address
  for (int i=0; i<device_count; i++) {
    if (memcmp(devices[i].mac, mac, 6) == 0) {
      found = i;
      break;
    }
  }


  if (found >= 0) {
    return found;
  } else {
    // device not found, create new one
    return init_device(mac);
  }
}

void device_write_debug(uint8_t id) {
  // Print everything out in a human readable format for debugging
  Serial.print("ID: ");
  Serial.print(id);
  Serial.println();
  Serial.print("MAC: ");
  debug_print_mac(devices[id].mac);

  Serial.print("RSSI: ");
  Serial.print(devices[id].rssi_total);
  Serial.print(" ");
  Serial.print("Channels: ");
  Serial.println(devices[id].channels);
  Serial.println(devices[id].rssi_count);
  Serial.print("Is_AP: ");
  Serial.print(devices[id].is_ap);
  Serial.println();
  
  if (devices[id].is_ap == 1) {
    for (int i=0; i<32; i++)
      Serial.print((char)devices[id].ssid[i]);
      
    Serial.println();
  }

  Serial.print("Dests:");
  Serial.println(devices[id].conn_count);
  
  for (int i=0; i<devices[id].conn_count; i++) {
    Connection conn = devices[id].connections[i];
    Serial.print("\t");
    Serial.print(conn.dst);
    Serial.print(" c=");
    Serial.print(conn.count);
    Serial.print(", d=");
    Serial.print(conn.data);
    Serial.println();
  }
  
  Serial.println();
}

void device_write(uint8_t id) {

  if (DEBUG) {
    device_write_debug(id);
  } else {
    // Write packet
    write_uint8(devices[id].id);
    
    write_buffer(devices[id].mac, 6);
    if (devices[id].rssi_count == 0)
      write_uint16(0);
    else
      write_uint16(devices[id].rssi_total / devices[id].rssi_count);

    write_uint16(devices[id].channels);
    write_uint8(devices[id].is_ap);
    
    if (devices[id].is_ap) {
      write_buffer(devices[id].ssid, 32);
    }
    
    write_uint8(devices[id].conn_count);
    
    for (int i=0; i<devices[id].conn_count; i++) {
      Connection conn = devices[id].connections[i];
      write_uint8(conn.dst);
      write_uint8(conn.count);
      write_uint16(conn.data);
    }
  }
}

void device_write_all() {
  Serial.write(header, 3);
  write_reset_checksum();
  write_uint8(device_count);
  
  for (int i=0; i<device_count; i++) {
    device_write(i);
  }
  Serial.write(write_checksum());
}

int device_get_connection(uint8_t dev_id, uint8_t dst) {
  int found = -1;

  // search for a connection by destination ID
  for (int i=0; i<devices[dev_id].conn_count; i++) {
    if (devices[dev_id].connections[i].dst == dst) {
      found = i;
      break;
    }
  }

  if (found >= 0) {
    return (uint8_t)found;
  }

  if (devices[dev_id].conn_count == MAX_DEVICES) return -1;

  // If we can't find one, then initialize a new struct
  uint8_t dst_id = devices[dev_id].conn_count++;
  devices[dev_id].connections[dst_id].dst = dst;
  devices[dev_id].connections[dst_id].count = 0;
  devices[dev_id].connections[dst_id].data = 0;

  return dst_id;
}

void device_add_packet(uint8_t src_id, uint8_t dst_id, uint16_t len) {

  int dest = device_get_connection(src_id, dst_id);
  if (dest >= 0) {

    if (DEBUG) {
      Serial.print("Adding packet ");
      Serial.print(src_id);
      Serial.print(" -> ");
      Serial.print(dst_id);
      Serial.print(" | ");
      Serial.print(dest);
      Serial.print("/");
      Serial.print(devices[src_id].conn_count);
      Serial.println();
    }
    
    // Record data from a received data packet
    devices[src_id].connections[dest].count++;
    devices[src_id].connections[dest].data += len;
  }
}
  

void device_reset() {
  // We can simply 'clear' the devices by setting the count to 0
  device_count = 0;
}
