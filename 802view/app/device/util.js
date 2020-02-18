exports.filter = function(mac) {
    // the standard says that if the least significant bit of the first octal is a 1, it is a multicast or broadcast address
    return ((parseInt(mac.split(":")[0], 16) & 1) == 1)
}