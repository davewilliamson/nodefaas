# nodefaas
Node OpenFaas connector that utilises async/await and [node-fetch](https://www.npmjs.com/package/node-fetch)

This library is inspired by the work of [Austin Frey](https://www.npmjs.com/package/openfaas).

### Installation
```
npm i nodefass
```

### Basic Usage
```
const faas = new NodeFaas();

console.log(await faas.invoke('figlet', 'Hello World'));
```

### Advanced Usage
```
const FAAS_HOST = 'http://127.0.0.1:8080';

const FAAS_OPTIONS = {
    username: '{your admin username}',
    password: '{your admin password}',
    agentSettings: {  // Settings as per Node HTTP/HTTPS agent, e.g.:
        keepAlive: true,
        keepAliveMsecs: 1500,
    }; 
};

const faas = new NodeFaas(FAAS_HOST, FAAS_OPTIONS);

let response;
try {
    response = await faas.deploy('my-figlet', 'functions/figlet:latest');
    console.log(await faas.invoke('my-figlet', 'Hello World'));
    console.log(await faas.inspect('my-figlet'));
    response = await faas.remove('my-figlet');
} catch (e) {
    console.error(e);
}

```
### Error Handling
All errors are thrown with a NodeFaasError object that extends the node Error object:
```
class NodeFaasError extends Error {
    constructor(message, status, statusText) {
        super(message);
        this.name = "NodeFaasError";
        this.status = status;                   // HTML Status codes
        this.statusText = statusText;
    }
}
```

### Available Functions
##### invoke
```
faas.invoke(funcName, data, {options});
```
* funcName = the name of the FAAS function you want to invoke
* data = a string or object that you want to pass to the function
* options = an object that defines the return:
  * isJson: true | false - Sets expected return type as JSON
  * isBinaryResponse: true | false - Sets expected return type as Binary

Returns the data from the FAAS function

##### list
```
faas.list();
```

Returns a list of the available FAAS functions in a JSON object


##### inspect
```
faas.inspect(funcName);
```
* funcName - the name of the FAAS function you want to inspect


Returns statistics about a specific function as a JSON object

##### deploy
```
faas.deploy(funcName, image, {options});
```
* funcName - the name of the function you want to deploy (e.g. 'figlet-test')
* image - the name of the image you want to deploy (e.g. 'functions/figlet:latest')
* options {optional}
  * network - defaults to 'func_functions'

Returns deployment status

##### remove
```
faas.remove(funcName);
```
* the name of the function you want to remove (e.g. 'figlet-test')

Returns removal status


-----
### Tests
I have yet to create any unit tests for this project!

In the root of the project there is a file called
```
test-figlet.js
```

This file deploys a figlet to your server, runs some speed tests against it, and then removes it.

To execute this file, you will need to add an ```.env``` file to the root of the project (sample below)
```
FAASHOST = http://127.0.0.1:8080
FAASUSERNAME = admin
FAASPASSWORD = adminpasswordadminpassword
FAASITERATIONS = 1000
```

Once run, it will output something similar to the following:
```
...
Running test: 999
Time to run 1 figlet: 5.67ms
Time to run 10 figlets: 48.61ms
{
  name: 'nodefaas-figlet-99d9f6e3-e881-4131-9267-505c29766b98',
  image: 'functions/figlet:latest',
  invocationCount: 10803,
  replicas: 20,
  envProcess: '',
  availableReplicas: 1,
  labels: {
    faas_function: 'nodefaas-figlet-99d9f6e3-e881-4131-9267-505c29766b98'
  },
  annotations: { 'prometheus.io.scrape': 'false' },
  namespace: 'openfaas-fn'
}
Average time to run 1000 iterations:
Executing one: 22.76ms
Executing 10: 60.22ms
Removing test figlet
{ status: 202, statusText: 'Accepted', body: '' }
```