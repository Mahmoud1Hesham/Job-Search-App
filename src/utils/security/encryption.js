import CryptoJS from "crypto-js";
export const generateEncryption = ({ plainText = "", signature = 'ENCRYPTION_SIGNATURE' } = {}) => {
    const encryption = CryptoJS.AES.encrypt(plainText, signature).toString()
    return encryption;
}

export const decryptEncryption = ({ cypherText = "", signature = 'ENCRYPTION_SIGNATURE' } = {}) => {
    const decrypt = CryptoJS.AES.decrypt(cypherText,signature).toString(CryptoJS.enc.Utf8)
    return decrypt;
}

