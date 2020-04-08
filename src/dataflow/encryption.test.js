import Encryption from "./encryption";
import {encryption} from '../config';
import {expect} from 'chai';
import crypto from 'crypto'

let instance = new Encryption(Object.assign({}, encryption.base, encryption.data));

test('encryption using defaults', () => {
    let str = instance.encrypt("hello world");
    console.log(str);
});

test('decryption using defaults', () => {
    let base = {"prop": 123, "binary": crypto.randomBytes(128)}
    let output = instance.decrypt(instance.encrypt(base));
    console.log(base, output);
    expect(output).to.deep.equal(base);

});
