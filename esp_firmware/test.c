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
};

typedef unsigned char uint8_t;

struct MacHeader {
    struct FrameControl ctrl[1];
    unsigned char addr1[6];
    unsigned char addr2[6];
    unsigned char addr3[6];
};

typedef struct FrameControl FrameControl;

int main(int argc, char** argv) {
    char buf[2] = {0x80, 0x00};

    const FrameControl* ctrl = (FrameControl *)buf;
    printf("%d\n", sizeof(struct MacHeader));

    if (ctrl->subtype == 0x08) printf("HEELLYA!!\n");

    return 0; 
}