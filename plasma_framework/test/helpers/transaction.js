const rlp = require('rlp');
const { BN } = require('openzeppelin-test-helpers');
const { EMPTY_BYTES_32, TX_TYPE } = require('../helpers/constants.js');

class GenericTransactionOutput {
    constructor(type, amount, outputGuard, token) {
        this.outputType = type;
        this.outputGuard = outputGuard;
        this.token = token;
        this.amount = amount;
    }

    formatForRlpEncoding() {
        if (this.amount instanceof BN) {
            return [this.outputType, this.outputGuard, this.token, web3.utils.numberToHex(this.amount)];
        }
        return [this.outputType, this.outputGuard, this.token, this.amount];
    }

    rlpEncoded() {
        return rlp.encode(this.formatForRlpEncoding());
    }

    static parseFromContractOutput(output) {
        const amount = parseInt(output.amount, 10);
        const outputType = parseInt(output.outputType, 10);
        return new GenericTransactionOutput(outputType, amount, output.outputGuard, output.token);
    }
}

class PaymentTransactionOutput extends GenericTransactionOutput {}

class GenericTransaction {
    constructor(transactionType, inputs, outputs, metaData = EMPTY_BYTES_32) {
        this.transactionType = transactionType;
        this.inputs = inputs;
        this.outputs = outputs;
        this.metaData = metaData;
    }

    rlpEncoded() {
        const tx = [this.transactionType];

        tx.push(GenericTransaction.formatInputsForRlpEncoding(this.inputs));
        tx.push(GenericTransaction.formatForRlpEncoding(this.outputs));
        tx.push(this.metaData);

        return rlp.encode(tx);
    }

    static formatInputsForRlpEncoding(items) {
        return items.map((item) => {
            if (Number.isInteger(item) || item instanceof Number || item instanceof BN) {
                const hex = web3.utils.numberToHex(item);
                return `0x${hex.replace('0x', '').padStart(64, '0')}`;
            }
            return item;
        });
    }

    static formatForRlpEncoding(items) {
        return items.map(item => item.formatForRlpEncoding());
    }

    isDeposit() {
        return this.inputs === [];
    }
}

class PaymentTransaction extends GenericTransaction {}

class PlasmaDepositTransaction extends PaymentTransaction {
    constructor(output, metaData = EMPTY_BYTES_32) {
        super(TX_TYPE.PAYMENT, [], [output], metaData);
    }
}

module.exports = {
    PaymentTransaction,
    PlasmaDepositTransaction,
    PaymentTransactionOutput,
    GenericTransaction,
    GenericTransactionOutput,
};
