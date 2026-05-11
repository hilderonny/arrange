# Websockets

Messages over websockets contain one byte of type information and the rest as payload in any data structure (defined by application).

## Messages from client to server

|First byte|Meaning|
|-|-|
|`0x10`|Join room. `8` bytes room number|
|`0x20`|Leave room. `8` bytes room number|
|`0x30`|Send broadcast message into room. `8` bytes room number followed by payload|
|`0x40`|Send direct message to client. `8` bytes client ID followed by payload|

## Messages from server to client

|First byte|Meaning|
|-|-|
|`0x01`|`8` bytes of assigned client ID. Sent directly after connecting|
|`0x31`|Broadcast message from client. `8` bytes sender client ID, `8` bytes room ID, followed by payload|
|`0x41`|Direct message from client. `8` bytes sender client ID followed by payload|
