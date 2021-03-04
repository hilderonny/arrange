# APIs

## Files

API for manipulating folders and files under the `/files` folder.

There is no GET method for retrieving a specific file because it can be fetched by directly addressing its URL via `/folder/filename.ext`.

|Endpoint|Method|Description|
|---|---|---|
|`/api/files/`|`GET`|List all folders and files of the `/files` folder recursively.|
|`/api/files/filepath`|`DELETE`|Deletes a file with the given filepath.|
|`/api/files/filepath`|`POST`|Uploads one file with multipart formdata to the given filepath.|
