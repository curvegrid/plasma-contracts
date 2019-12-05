const rlp = require('rlp');
const { expect } = require('chai');
const { constants, expectRevert } = require('openzeppelin-test-helpers');
const { PaymentTransaction, PaymentTransactionOutput } = require('../../helpers/transaction.js');
const { TX_TYPE, OUTPUT_TYPE, DUMMY_INPUT_1 } = require('../../helpers/constants.js');

const PaymentTransactionModelMock = artifacts.require('PaymentTransactionModelMock');

const OUTPUT_GUARD = `0x${Array(40).fill(1).join('')}`;
const EMPTY_BYTES32 = `0x${Array(64).fill(0).join('')}`;
const OUTPUT = new PaymentTransactionOutput(OUTPUT_TYPE.PAYMENT, 100, OUTPUT_GUARD, constants.ZERO_ADDRESS);

contract('PaymentTransactionModel', ([alice]) => {
    const MAX_INPUT_NUM = 4;
    const MAX_OUTPUT_NUM = 4;

    before(async () => {
        this.test = await PaymentTransactionModelMock.new();
    });

    it('should decode payment transaction', async () => {
        const transaction = new PaymentTransaction(TX_TYPE.PAYMENT, [DUMMY_INPUT_1], [OUTPUT, OUTPUT], EMPTY_BYTES32);
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());

        const actual = await this.test.decode(encoded);
        const decoded = new PaymentTransaction(
            parseInt(actual.txType, 10),
            parseInputs(actual.inputs),
            parseOutputs(actual.outputs),
            actual.metaData,
        );

        expect(JSON.stringify(decoded)).to.equal(JSON.stringify(transaction));
    });

    it('should decode payment transaction with 4 inputs and 4 outputs', async () => {
        const transaction = new PaymentTransaction(
            TX_TYPE.PAYMENT,
            [DUMMY_INPUT_1, DUMMY_INPUT_1, DUMMY_INPUT_1, DUMMY_INPUT_1],
            [OUTPUT, OUTPUT, OUTPUT, OUTPUT],
            EMPTY_BYTES32,
        );
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());

        const actual = await this.test.decode(encoded);
        const decoded = new PaymentTransaction(
            parseInt(actual.txType, 10),
            parseInputs(actual.inputs),
            parseOutputs(actual.outputs),
            actual.metaData,
        );

        expect(JSON.stringify(decoded)).to.equal(JSON.stringify(transaction));
    });

    it('should fail when decoding transaction have more inputs than MAX_INPUT limit', async () => {
        const inputsExceedLimit = Array(MAX_INPUT_NUM + 1).fill(DUMMY_INPUT_1);
        const transaction = new PaymentTransaction(TX_TYPE.PAYMENT, inputsExceedLimit, [], EMPTY_BYTES32);
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());

        await expectRevert(
            this.test.decode(encoded),
            'Transaction inputs num exceeds limit',
        );
    });

    it('should fail when decoding transaction have more outputs than MAX_OUTPUT limit', async () => {
        const outputsExceedLimit = Array(MAX_OUTPUT_NUM + 1).fill(OUTPUT);
        const transaction = new PaymentTransaction(TX_TYPE.PAYMENT, [DUMMY_INPUT_1], outputsExceedLimit, EMPTY_BYTES32);
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());

        await expectRevert(
            this.test.decode(encoded),
            'Transaction outputs num exceeds limit',
        );
    });

    it('should fail when transaction does not contain metadata', async () => {
        const transaction = new PaymentTransaction(TX_TYPE.PAYMENT, [DUMMY_INPUT_1], [OUTPUT, OUTPUT], EMPTY_BYTES32);

        const genericFormat = [
            transaction.transactionType,
            transaction.inputs,
            PaymentTransaction.formatForRlpEncoding(transaction.outputs),
        ];

        const encoded = web3.utils.bytesToHex(rlp.encode(genericFormat));

        await expectRevert(
            this.test.decode(encoded),
            'Invalid encoding of transaction',
        );
    });

    it('should fail when decoding invalid transaction', async () => {
        const encoded = web3.utils.bytesToHex(rlp.encode([0, 0]));

        await expectRevert(
            this.test.decode(encoded),
            'Invalid encoding of transaction',
        );
    });

    it('should fail when the transaction contains a null input', async () => {
        const transaction = new PaymentTransaction(
            TX_TYPE.PAYMENT, [DUMMY_INPUT_1, EMPTY_BYTES32], [OUTPUT, OUTPUT], EMPTY_BYTES32,
        );
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());
        await expectRevert(this.test.decode(encoded), 'Null input not allowed');
    });

    it('should fail when the transaction type is zero', async () => {
        const transaction = new PaymentTransaction(0, [DUMMY_INPUT_1], [OUTPUT], EMPTY_BYTES32);
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());
        await expectRevert(this.test.decode(encoded), 'Transaction type must not be 0');
    });

    it('should fail when an output type is zero', async () => {
        const zeroOutputType = new PaymentTransactionOutput(0, 100, OUTPUT_GUARD, constants.ZERO_ADDRESS);
        const transaction = new PaymentTransaction(
            TX_TYPE.PAYMENT, [DUMMY_INPUT_1], [OUTPUT, zeroOutputType], EMPTY_BYTES32,
        );
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());
        await expectRevert(this.test.decode(encoded), 'Output type must not be 0');
    });

    it('should fail when an output amount is zero', async () => {
        const zeroOutputAmount = new PaymentTransactionOutput(
            OUTPUT_TYPE.PAYMENT, 0, OUTPUT_GUARD, constants.ZERO_ADDRESS,
        );
        const transaction = new PaymentTransaction(
            TX_TYPE.PAYMENT, [DUMMY_INPUT_1], [OUTPUT, zeroOutputAmount], EMPTY_BYTES32,
        );
        const encoded = web3.utils.bytesToHex(transaction.rlpEncoded());
        await expectRevert(this.test.decode(encoded), 'Output amount must not be 0');
    });

    describe('decodeOutput', () => {
        it('should decode output', async () => {
            const expected = new PaymentTransactionOutput(
                OUTPUT_TYPE.PAYMENT, 100, OUTPUT_GUARD, constants.ZERO_ADDRESS,
            );
            const encoded = web3.utils.bytesToHex(rlp.encode(expected.formatForRlpEncoding()));

            const output = await this.test.decodeOutput(encoded);
            const actual = PaymentTransactionOutput.parseFromContractOutput(output);

            expect(JSON.stringify(actual)).to.equal(JSON.stringify(expected));
        });

        it('should fail when output has less than 4 items', async () => {
            const encoded = web3.utils.bytesToHex(rlp.encode([0, 0, 0]));
            await expectRevert(this.test.decodeOutput(encoded), 'Output must have 4 items');
        });

        it('should fail when output has more than 4 items', async () => {
            const encoded = web3.utils.bytesToHex(rlp.encode([0, 0, 0, 0, 0]));
            await expectRevert(this.test.decodeOutput(encoded), 'Output must have 4 items');
        });
    });

    describe('owner', () => {
        it('should parse the owner address from output guard when output guard holds the owner info directly', async () => {
            expect(await this.test.getOutputOwner(
                OUTPUT_TYPE.PAYMENT, alice, constants.ZERO_ADDRESS, 100,
            )).to.equal(alice);
        });
    });
});

function parseInputs(inputs) {
    return inputs.map(input => web3.eth.abi.decodeParameter('bytes32', input));
}

function parseOutputs(outputs) {
    return outputs.map(PaymentTransactionOutput.parseFromContractOutput);
}
