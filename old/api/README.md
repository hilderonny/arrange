# APIs

## Files

API for manipulating folders and files under the `/files` folder.

There is no GET method for retrieving a specific file because it can be fetched by directly addressing its URL via `/folder/filename.ext`.

|Endpoint|Method|Description|
|---|---|---|
|`/api/files/`|`GET`|List all folders and files of the `/files` folder recursively.|
|`/api/files/filepath`|`DELETE`|Deletes a file with the given `filepath`.|
|`/api/files/filepath`|`POST`|Uploads one file with multipart formdata to the given `filepath`.|

## Schema

API for manipulating database tables and columns.

|Endpoint|Method|Description|
|---|---|---|
|`/api/schema/query`|`POST`|Send query as text and retreive result as JSON|

## Hashmap

API for storing and retrieving data in memory for sharing between devices.

|Endpoint|Method|Description|
|---|---|---|
|`/api/hashmap`|`GET`|Get list of keys|
|`/api/hashmap/{key}`|`GET`|Get data of key `key`|
|`/api/hashmap/{key}`|`POST`|Send JSON to store in memory under key `key`|
|`/api/hashmap/{key}`|`DELETE`|Delete data of key `key`|
