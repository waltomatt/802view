uint8_t checksum = 0;

void write_reset_checksum() {
  checksum = 0;
}

uint8_t write_checksum() {
  return checksum;
}

void write_uint8(uint8_t data) {
  checksum = (checksum + data) % 256;
  Serial.write(data);
}

void write_buffer(uint8_t *data, uint8_t len) {
  for (int i=0; i<len; i++)
    write_uint8(data[i]);
}

void write_uint16(uint16_t val) {
  write_uint8((val >> 8) & 0xFF);
  write_uint8(val & 0xFF);
}
