const fetch = require('node-fetch');

const SYSTEM_FUNCTIONS = '/system/functions';
const FUNCTIONS = '/function/';
const DEFAULT_URL = 'http://127.0.0.1:8080';

const DEFAULT_AGENT_SETTINGS = {
    keepAlive: true,
    keepAliveMsecs: 1500,
};

/**
 * Error class for NodeFaas, extends Node Error class
 * @constructor
 * @param {string} message - The error message.
 * @param {number} status - A status code either returned from Openfass or this lib (standard HTML response codes).
 * @param {string} statusText - A message relating to the returned status code
 */


async function remoteCall(gateway, func, data, { isJson = false, isBinaryResponse = false, method, compress = true, agent = undefined } = {}) {

    const options = {
        headers: {
            'Content-Type': isJson ? 'application/json' : undefined,
            'Accept-Encoding': (isBinaryResponse ? undefined : 'utf8'),
            'User-Agent': 'node-faas/1.0',
        },
        compress: compress,
        method: method ? method : 'GET',
        agent: agent,
    };

    if (data) {
        options.body = (typeof data === 'object' ? JSON.stringify(data) : data);
        options.method = method ? method : 'POST';
    }

    let res, ret;

    try {
        res = await fetch(gateway + func, options);
    } catch (e) {
        throw new NodeFaasError('Failed to make NodeFaas call: ' + e.message, (res && res.status ? res.status : 'No reponse'));
    }

    if (res.status === 200) {
        try {
            if (isJson) {
                ret = await res.json();
            } else {
                ret = await res.text();
            }

            return ret;

        } catch (e) {
            throw new NodeFaasError('Failed to complete NodeFaas call', 500, e.message);
        }
    } else if (res.status > 200 && res.status < 400) {
        return {
            status: res.status,
            statusText: res.statusText,
            body: await res.text(),
        };
    } else {
        throw new NodeFaasError('Failed status from NodeFaas call: ', res.status, await res.text());
    }
}

/**
 * NodeFaas - Library to Openfaas functions
 * @constructor
 * @param {string} gateway - The Openfaas server.
 * @param {string} username - (optional) Username for admin functions.
 * @param {string} password - (optional) Password for admin functions.
 */
class NodeFaas {

    constructor(gateway = DEFAULT_URL, { username, password, agentSettings = DEFAULT_AGENT_SETTINGS } = {}) {
        let url = gateway.split('//');
        let agentType = this.agent = url[0] === 'https:' ? require('https') : require('http');
        this.agent = new agentType.Agent(agentSettings);

        this.gateway = gateway;

        if (username) {
            this.secureGateway = url[0] + '//' + username + (password ? ':' + password : '') + '@' + url[1];
        } else {
            this.secureGateway = undefined;
        }
    }

    /**
    * invoke - Execute a function on the Openfaas server
    * @param {string} func - The function to execute.
    * @param {string|object} data - The data to pass to the function.
    * @param {object} config- { isJson: {true|false}, isBinaryResponse: {true|false} }
    * @returns {string|object} - Returns the data request in a string or object format
    */
    async invoke(func, data, { isJson = false, isBinaryResponse = false } = {}) {
        return await remoteCall(this.gateway, FUNCTIONS + func, data, { isJson, isBinaryResponse, agent: this.agent });
    }

    async list({ isJson = true } = {}) {
        return await remoteCall(this.secureGateway || this.gateway, SYSTEM_FUNCTIONS, undefined, { isJson, agent: this.agent });
    }

    async inspect(func) {
        const list = await this.list();
        for (let i = 0; i < list.length; i++) {
            if (list[i].name === func) {
                return list[i];
            }
        }
    }

    async deploy(func, image, { network = 'func_functions' } = {}) {
        return await remoteCall(this.secureGateway || this.gateway, SYSTEM_FUNCTIONS, { service: func, image, network }, { isJson: true, agent: this.agent });
    }

    async remove(name) {
        return await remoteCall(this.secureGateway || this.gateway, SYSTEM_FUNCTIONS, { functionName: name }, { isJson: true, method: 'DELETE', agent: this.agent });
    }
}

module.exports = NodeFaas;
