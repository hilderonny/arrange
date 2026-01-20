# arrange

## Usage

```sh
docker run --name myarrangeserver -d -v /LOCALDATAPATH:/app/data -v /LOCALWEBROOT:/app/html -v /LOCALWEBSUBFOLDER:/app/html/subfolder -p 3000:3000 hilderonny2024/arrange:0.0.1
```

## Integration

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from './arrange/js/arrange.js'
        </script>
    </head>
</html>
```

## API

```
GET /api/autologin
GET /api/logout
POST /api/login
POST /api/register

GET /api/files/{userid}/{filepath...}
POST /api/files/{userid}/{filepath...}
DELETE /api/files/{userid}/{path...}
```

## /js/arrange.js

```js
logout()

deletePrivatePath(path)
deletePublicPath(path)
getPrivateFile(filePath)
getPublicFile(filePath)
postPrivateFile(filePath, fileContent)
postPublicFile(filePath, fileContent)
```

## Development

```sh
gh release create v0.0.1
docker build --platform=linux/amd64,linux/arm64 -f docker/Dockerfile -t hilderonny2024/arrange:latest -t hilderonny2024/arrange:0.0.1 .
docker scout quickview local://hilderonny2024/arrange:0.0.1
docker push hilderonny2024/arrange:0.0.1
docker push hilderonny2024/arrange:latest
```
