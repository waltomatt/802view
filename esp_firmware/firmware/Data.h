#ifndef DATA_H
#define DATA_H

#define DATA_BUFFER_SIZE 10000


// implement a FIFO for our buffer
char data_buffer[DATA_BUFFER_SIZE];

uint16_t front = 0;
uint16_t rear = 0;
uint16_t size = 0;



void Data_QueueByte(uint8_t byte) {
    /*
    if (size < DATA_BUFFER_SIZE) {
        if (rear == DATA_BUFFER_SIZE-1) {
            rear = 0; // loop back round
        }

        data_buffer[rear] = byte;
        rear++;
        size++;
    }
    */
    while (Serial.availableForWrite() == 0)
    {
        delay(1);
    }

    Serial.write(byte);
}

uint8_t Data_DeQueueByte() {
    uint8_t val = data_buffer[front];
    size--;
    front++;

    return val;
}


void Data_SendInt8(uint8_t byte) {
    Data_QueueByte(byte);
}

void Data_SendInt16(uint16_t val) {
    Data_QueueByte((val >> 8) & 0xFF);
    Data_QueueByte((val & 0xFF));
}

void Data_SendBuffer(uint8_t* bytes, uint8_t len) {
    for (int i=0; i<len; i++) {
        Data_QueueByte(bytes[i]);
    }   
}

void Data_DoSend() {
    while (Serial.availableForWrite() > 1) {
    
        if (size > 0) {
            uint8_t byte = Data_DeQueueByte();
            Serial.write(byte);
        } else {
            break;
        }
    }
}

#endif