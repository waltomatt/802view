#ifndef DEBUG_H
#define DEBUG_H

#define DEBUG 0

namespace Debug {
    void Print(const char* str) {
        if (DEBUG) Serial.print(str);
    }

    void PrintMac(const unsigned char *mac) {
        char str[17]; 
        sprintf(str, "%2X:%2X:%2X:%2X:%2X:%2X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
        Debug::Print(str);
    }
} 

#endif
