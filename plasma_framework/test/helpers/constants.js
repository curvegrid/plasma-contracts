const PROTOCOL = {
    MVP: 1,
    MORE_VP: 2,
};

const TX_TYPE = {
    PAYMENT: 1,
    PAYMENT_V2: 2,
    FEE: 3,
};

const OUTPUT_TYPE = {
    PAYMENT: 1,
    FEE_CLAIM: 2,
};

const EMPTY_BYTES = '0x';
const EMPTY_BYTES_32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const VAULT_ID = {
    ETH: 1,
    ERC20: 2,
};

const CHILD_BLOCK_INTERVAL = 1000;
const SAFE_GAS_STIPEND = 2300;


const DUMMY_INPUT_1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
const DUMMY_INPUT_2 = '0x0000000000000000000000000000000000000000000000000000000000000002';

module.exports = {
    EMPTY_BYTES,
    EMPTY_BYTES_32,
    PROTOCOL,
    TX_TYPE,
    OUTPUT_TYPE,
    CHILD_BLOCK_INTERVAL,
    VAULT_ID,
    SAFE_GAS_STIPEND,
    DUMMY_INPUT_1,
    DUMMY_INPUT_2,
};
