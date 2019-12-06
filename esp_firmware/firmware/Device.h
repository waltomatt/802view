#ifndef DEVICE_H
#define DEVICE_H

#define MAX_DEVICES 128

// header to mark the start of the packet
const uint8_t header[3] = {0xFF, 0x60, 0x55};
const uint8_t deviceID = 0;

struct Destination {
    uint16_t dst;
    uint8_t count;
    uint16_t data;

    Destination *next;
};

class Device {
    public:
        uint16_t id;
        uint8_t mac[6];

        uint16_t rssi_total;
        uint8_t rssi_count;

        // bit mask for which channels (bits 0-15 indicate channels 0-15)
        uint16_t channels;

        uint8_t device_count;
        
        Destination* dests; // linked list of packet destinations

        uint8_t is_ap;
        uint8_t ssid[32];

        Device* next; 

        Device(const uint8_t *mac);
        ~Device();
        void Write();
        void AddPacket(uint16_t dst, uint16_t len);


        static int count;
        static Device* head;
        static Device* tail;

        static Device* Lookup(const uint8_t *mac);
        static void WriteAll();
        static void Clear();
};

int Device::count = 0;
Device* Device::head = NULL;
Device* Device::tail = NULL;

// Class constructor

Device::Device(const uint8_t *mac) {
    this->id = Device::count++; // incrementing ID

    memcpy(this->mac, mac, 6); // set mac address
    
    this->rssi_total = 0;
    this->rssi_count = 0;

    this->channels = 0;

    this->device_count = 0;
    this->dests = NULL;

    this->is_ap = 0;
    memset(this->ssid, 0, 32); // set SSID to all 0's

    this->next = NULL;

    // Update our linked list
    if (Device::head == NULL) {
        Device::head = this;
        Device::tail = this;
    } else {
        Device::tail->next = this;
        Device::tail = this;
    }
}

// Deconstructor

Device::~Device() {
    // Remove all the dest structures
    Destination* dest = this->dests;
    Destination* to_remove;

    while (dest != NULL) {
        to_remove = dest;
        dest = dest->next;

        free(to_remove);
    }
}

Device* Device::Lookup(const uint8_t *mac) {
    // Search our linked list for an existing device first
    Device* found = NULL;
    Device* search = Device::head;
    
    while (search != NULL) {
        if (memcmp(search->mac, mac, 6) == 0) {
            found = search;
            break;
        } else {
            search = search->next;
        }
    }

    if (found) return found;

    // if we haven't found it, create a new device if we have enough space
    // TO-do: chekc if we have enough space
    return new Device(mac);
}

void Device::WriteAll() {
    Device* search = Device::head;

    Debug::Print("DUMPING! \n");
    

    while (search != NULL) {
        search->Write();
        search = search->next;
    }

    Serial.write(header, 3);
    Serial.write(deviceID);
    Serial.write(0x0);
}

// remove all the devices
void Device::Clear() {
    Device* search = Device::head;
    Device* to_remove; 

    while (search != NULL) {
        to_remove = search;
        search = search->next;
        delete to_remove;
    }

    Device::head = NULL;
    Device::tail = NULL;
    Device::count = 0;
}

void Device::AddPacket(uint16_t dst_id, uint16_t len) {
    Destination* search = this->dests;
    Destination* found = NULL;

    while (search != NULL) {
        if (search->dst == dst_id) {
            found = search;
            break;
        } else {
            if (search->next == NULL)
                break;
            else
                search = search->next;
        }
    }

    if (found == NULL) {
        found = new Destination();
        found->dst = dst_id;
        found->count = 0;
        found->data = 0;
        found->next = NULL;

        if (search == NULL)
            this->dests = found;
        else
            search->next = found;

        this->device_count++;
    }

    found->count++;
    found->data += len;
}

/*
 * Packet Structure!
 * 0xFF
 *  u8 len
 *  u8 device_id
 *  u16 id
 *  u8[6] mac
 *  u16 rssi_total
 *  u8 rssi_count
 *  u8 is_ap
 *  (char[32] ssid) <- optional, depends on is_ap
 *  u8 dev_count
 *  -PACKETS-
 */

void Device::Write() {
    uint8_t len = sizeof(header)
                    + sizeof(len)
                    + sizeof(deviceID)
                    + sizeof(this->id)
                    + sizeof(this->mac)
                    + sizeof(this->rssi_total)
                    + sizeof(this->rssi_count)
                    + sizeof(this->is_ap)
                    + sizeof(this->device_count);

    if (this->is_ap == 1)
        len += sizeof(this->ssid);

    len += (this->device_count * 5); // 5 bytes for each destination

    Debug::PrintMac(this->mac);
    Debug::Print("\n");

    if (DEBUG) return;

    Data_SendBuffer(const_cast<uint8_t*>(header), 3);
    Data_SendInt8(len);
    Data_SendInt8(deviceID);
    Data_SendInt16(this->id);

    Data_SendBuffer(const_cast<uint8_t*>(this->mac), 6); // write 6 byte mac address

    Data_SendInt16(this->rssi_total);
    Data_SendInt8(this->rssi_count);
    Data_SendInt8(this->is_ap);

    if (this->is_ap) {
        Data_SendBuffer(this->ssid, 32); // write 32 byte SSID
    }
        
    Data_SendInt8(this->device_count);

    Destination* dst = this->dests;

    while (dst != NULL) {
        Data_SendInt16(dst->dst);
        Data_SendInt8(dst->count);
        
        Data_SendInt16(dst->data);
        dst = dst->next;
    } 
}


#endif
