import {createCipheriv, createDecipheriv, createHash} from 'crypto';
import BSON from "bson";

/**
 * This is what does all the encryption heavy lifting
 *
 * @property wraps          {int}       The number of times you would like to re-encrypt the packet
 * @property algorithm      {string}    The encryption algo inside of node to use for encryption/decryption (when applicable)
 * @property key            {string}    The encryption key used
 * @property iv             {string}    The initialization vector for encryption when applicable
 * @property codec          {string}    The name of the codec to encode the buffered data into
 * @property keyLength      {int}       The length of the key required for the provided encryption method
 * @property ivLength       {int}       The length of the iv for the provided encryption
 * @property hashAlgorithm  {string}    The name of the hash algo used to process the key/iv provided
 */
export default class Encryption {

    constructor({wraps, algorithm, key, iv, keyLength, ivLength, hashAlgorithm, codec}) {
        Object.assign(this, arguments[0]);
        this.key = this.hash(key).substr(0, keyLength);
        this.iv = this.hash(iv).substr(0, ivLength);
    }

    /**
     * Here we will do our best to encrypt data, which may include binary data, using the provided configuration
     * @param data {*}
     */
    encrypt(data) {
        data = BSON.serialize(data);
        return this._crypt(data, createCipheriv);
    }

    /**
     * When applicable (when using a decryptable form of encryption), decrypt the packet based on provided data
     * @param data
     */
    decrypt(data) {
        data = this._crypt(data, createDecipheriv);
        return BSON.deserialize(data, {
            promoteBuffers: true
        });
    }

    _crypt(data, f) {
        for (let step = 0; step < this.wraps; step++) {
            let codec = f(this.algorithm, this.key, this.iv);
            let output = codec.update(data);
            data = Buffer.concat([output, codec.final()])
        }
        return data;
    }

    hash(data) {
        var hash = createHash(this.hashAlgorithm);
        data = hash.update(data, 'utf-8');
        return data.digest('hex');
    }

}