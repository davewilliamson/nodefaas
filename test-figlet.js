require('dotenv').config();
const hirestime = require('hirestime');
const uuid = require('uuid');
const NodeFaas = require('./');

const FUNC_NAME = 'nodefaas-figlet-' + uuid.v4();

process.env.FAASITERATIONS = process.env.FAASITERATIONS || 100;

const faas = new NodeFaas(process.env.FAASHOST, { username: process.env.FAASUSERNAME, password: process.env.FAASPASSWORD });

const allRunOne = [];
const allRunMany = [];

async function test(num) {

    console.log(`Running test: ${num}`);

    try {
        const oneFigTime = hirestime();
        const a0 = await faas.invoke(FUNC_NAME, 'Hello World');
        let onems = oneFigTime();
        allRunOne.push(onems);
        console.log(`Time to run 1 figlet: ${onems}ms`);

        const getElapsed = hirestime();
        let elapsed;

        let a1 = faas.invoke(FUNC_NAME, 'Hello World One');
        let a2 = faas.invoke(FUNC_NAME, 'Hello World Two');
        let a3 = faas.invoke(FUNC_NAME, 'Hello World Three');
        let a4 = faas.invoke(FUNC_NAME, 'Hello World Four');
        let a5 = faas.invoke(FUNC_NAME, 'Hello World Five');
        let a6 = faas.invoke(FUNC_NAME, 'Hello World Six');
        let a7 = faas.invoke(FUNC_NAME, 'Hello World Seven');
        let a8 = faas.invoke(FUNC_NAME, 'Hello World Eight');
        let a9 = faas.invoke(FUNC_NAME, 'Hello World Nine');
        let a10 = faas.invoke(FUNC_NAME, 'Hello World Ten');


        await a1;
        await a2;
        await a3;
        await a4;
        await a5;
        await a6;
        await a7;
        await a8;
        await a9;
        await a10;

        elapsed = getElapsed();
        allRunMany.push(elapsed);
        console.log(`Time to run 10 figlets: ${elapsed}ms`);

        console.log(await faas.inspect(FUNC_NAME));
    } catch (e) {
        console.dir(e);
    }
}

async function tester() {

    console.log('Deploying test figlet');
    try {
        console.log(await faas.deploy(FUNC_NAME, 'functions/figlet:latest'));
        console.log(await faas.inspect(FUNC_NAME));
        console.log('Waiting for Figlet-test to be ready');
        await faas.invoke(FUNC_NAME, 'Hello World');
    } catch (e) {
        console.dir(e);
        process.exit(1);
    }

    for (let x = 0; x < process.env.FAASITERATIONS; x++) {
        await test(x);
    }

    let onesum = 0;
    let manysum = 0;

    for (var i = 0; i < allRunOne.length; i++) {
        onesum += allRunOne[i];
    }

    for (var i = 0; i < allRunMany.length; i++) {
        manysum += allRunMany[i];
    }

    const oneavg = onesum / allRunOne.length;
    const manyavg = manysum / allRunMany.length;

    console.log(`Average time to run ${process.env.FAASITERATIONS} iterations:`);
    console.log(`Executing one: ${oneavg.toFixed(2)}ms`);
    console.log(`Executing 10: ${manyavg.toFixed(2)}ms`);

    try {
        console.log('Removing test figlet');
        console.log(await faas.remove(FUNC_NAME));
    } catch (e) {
        console.dir(e);
        process.exit(1);
    }
}

tester();