# arrange

## Install MongoDB

### For MacOS

Following this instruction: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/

```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew tap mongodb/brew
brew install mongodb-community@4.2
brew services start mongodb-community
```

Keep all settings on default.

### For Windows

Use the MSI installer. When problems starting the service occur, it can be caused by falsy default settings.
Have a look into https://stackoverflow.com/a/4663101/12127220 or simply create  `logs` and `data/db` directories in the installation path.


## Usage

Installation is done in that way.

```
npm i --save @hilderonny/arrange
```

Create an ```index.js``` file with the following content.

```js
const arrange = require('@hilderonny/arrange');
const server = new arrange.Server(
    process.env.PORT || 8080, 
    process.env.DBURL || '127.0.0.1:27017/mydatabase',
    process.env.TOKENSECRET || 'mytokensecret'
);
server.start();
```

Run the server with

```
node index.js
```

In the client HTML file of your project include arrange in this way.

```html
<html>
    <head>
        <script src="/arrange/arrange.js"></script>
        <script>
            // Now you can access arrange functions via the $arr object
            window.addEventListener('load', async function() {
                // Create arrange instance connected to the local server
                // To connect to a different server, use const arr = Arrange('https://mydomain.com')
                const arr = Arrange();
                // Login to arrange
                await arr.login('myusername', 'password');
                // Fetch a list of all entities of the "models" table
                let modellist = await arr.list('models');
            });
        </script>
    </head>
</html>
```

The API definition and usage examples can be found [here](client/README.md).

## Releases

|Version|Content|
|---|---|
|1.4.0|Moved to GitHub and updates dependencies|
|1.3.1|Bugfixes in client library|
|1.3.0|List API now supports result filters. Added client library documentation [here](client/README.md)|
|1.2.0|Added delete API|
|1.1.2|list and details API now return only publicly visible entities when user is not logged in|
|1.1.1|Newly created objects have the currently logged in user as owner|
|1.1.0|Implemented several APIs for first productive use including full tests|
|1.0.3|request.user._id is now a string for compatibility|
|1.0.2|Added APIs for user login and registration and authentication middleware|
|1.0.1|Initial NPM package without any functionality|

## Development

### Run tests

Locally on developer machine:

```sh
npm run testlocal
```

### Howto create NPM package

```
npm install npm@latest -g
npm init --scope=@hilderonny
npm adduser
npm publish --access public
```

For all following deployments to NPM you need to update the version in the ```package.json``` file and run ```npm publish```.

In dependent projects the lib can be updated to the newest version with ```npm up```.

## Links

* [Creating Node.js modules](https://docs.npmjs.com/creating-node-js-modules)
* [Before publishing to NPM](https://docs.npmjs.com/misc/developers#before-publishing-make-sure-your-package-installs-and-works)