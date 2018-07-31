/* parser */
function parseSigFox(data) {
    var buffer = hex2Bytes(data);
    if (!buffer) {
        return null;
    }

    var recordType = buffer[0] & 0x0f;

    switch (recordType) {
        case 0:
            return parsePositionalData(buffer);
        case 1:
            return parseDownlinkAck(buffer);
        case 2:
            return parseDeviceStats(buffer);
        default:
            return null;
    }
}

function parsePositionalData(buffer) {
    var flags = buffer[0] & 0xf0;
    var inTrip = (flags & 0x10) > 0;
    var lastFixFailed = (flags & 0x20) > 0;

    var latitudeRaw = parseLittleEndianInt32(buffer, 1);
    var longitudeRaw = parseLittleEndianInt32(buffer, 5);
    var headingRaw = buffer[9];
    var speedRaw = buffer[10];
    var batteryRaw = buffer[11];

    return {
        MessageType: 0,
        InTrip: inTrip,
        LastFixFailed: lastFixFailed,
        Latitude: latitudeRaw * 1e-7,
        Longitude: longitudeRaw * 1e-7,
        Heading: headingRaw * 2,
        SpeedKmH: speedRaw,
        BatteryVoltage: (batteryRaw * 25) / 1000.0
    };
}

function parseDownlinkAck(buffer) {
    var flags = buffer[0] & 0xf0;
    var downlinkAccepted = (flags & 0x10) > 0;

    var firmwareMajor = buffer[2];
    var firmwareMinor = buffer[3];

    var data = [];
    for (var i = 0; i < 8; i++) {
        data.push(i + 4);
    }

    return {
        MessageType: 1,
        DownlinkAccepted: downlinkAccepted,
        FirmWareVersion: firmwareMajor + '.' + firmwareMinor,
        DownlinkData: data
    };
}

function parseDeviceStats(buffer) {
    var uptimeWeeks = parseLittleEndianInt16Bits(buffer, 0, 4, 9);
    var txCountRaw = parseLittleEndianInt16Bits(buffer, 1, 5, 11);
    var rxCountRaw = buffer[3];
    var tripCountRaw = parseLittleEndianInt16Bits(buffer, 4, 0, 13);
    var gpsSuccessRaw = parseLittleEndianInt16Bits(buffer, 5, 5, 10);
    var gpsFailuresRaw = parseLittleEndianInt16Bits(buffer, 6, 7, 8);
    var averageFixTime = parseLittleEndianInt16Bits(buffer, 7, 7, 9);
    var averageFailTime = parseLittleEndianInt16Bits(buffer, 9, 0, 9);
    var averageFreshenTime = parseLittleEndianInt16Bits(buffer, 10, 1, 8);
    var wakeupsPerTrip = buffer[11] >> 1;

    return {
        MessageType: 2,
        UptimeWeeks: uptimeWeeks,
        TxCount: txCountRaw * 32,
        RxCount: rxCountRaw * 32,
        TripCount: tripCountRaw,
        GpsSuccessCount: gpsSuccessRaw * 32,
        GpsFailureCount: gpsFailuresRaw * 32,
        AverageFixTimeSeconds: averageFixTime,
        AverageFailTimeSeconds: averageFailTime,
        AverageFreshenTimeSeconds: averageFreshenTime,
        WakeUpsPerTrip: wakeupsPerTrip
    };
}

/* additional methods */
function hex2Bytes(val) {
    if (!val) {
        return [];
    }

    val = val.trim();
    if (val.startsWith('0x')) {
        val = val.substring(2);
    }

    var numBytes = val.length / 2;
    var bytes = [];

    for (var i = 0; i < numBytes; i++) {
        bytes.push(parseInt(val.substring(i * 2, (i * 2) + 2), 16));
    }
    return bytes;
}

function parseLittleEndianInt32(buffer, offset) {
    return (buffer[offset + 3] << 24) +
        (buffer[offset + 2] << 16) +
        (buffer[offset + 1] << 8) +
        (buffer[offset]);
}

function parseLittleEndianInt16(buffer, offset) {
    return (buffer[offset + 1] << 8) +
        (buffer[offset]);
}

function parseLittleEndianInt16Bits(buffer, offset, bitOffset, bitLength) {
    var temp = parseLittleEndianInt16(buffer, offset);
    temp = temp >> bitOffset;
    var mask = 0xffff >> (16 - bitLength);
    return temp & mask;
}

/* 2018-07-31 15:56:21 */
console.log(parseSigFox('3043d0d0ebe6641e5a0000d5'));