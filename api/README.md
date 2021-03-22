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
|`/api/schema/tables`|`GET`|List of all tables in the database|
|`/api/schema/tables/tablename`|`DELETE`|Deletes a table with the given `tablename`.|
|`/api/schema/tables/tablename`|`POST`|Creates a table with the given `tablename`.|
|`/api/schema/columns/tablename`|`GET`|List of all columns in the given `tablename` table.|
|`/api/schema/columns/tablename/columnname`|`DELETE`|Deletes a column with the given `columnname` in the `tablename`.|
|`/api/schema/columns/tablename/columnname/:datatype`|`POST`|Creates a table with the given `columnname` in the `tablename`|
