/* @flow */

const Ajv = require('ajv');
const process = require('process');
const c32check = require('c32check');

import os from 'os';
import fs from 'fs';

export const NAME_PATTERN = 
  '^([0-9a-z_.+-]{3,37})$'

export const NAMESPACE_PATTERN = 
  '^([0-9a-z_-]{1,19})$'

export const ADDRESS_CHARS = 
  '[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{1,35}';

export const C32_ADDRESS_CHARS = '[0123456789ABCDEFGHJKMNPQRSTVWXYZ]+';

export const ADDRESS_PATTERN = `^(${ADDRESS_CHARS})$`;

export const ID_ADDRESS_PATTERN = `^ID-${ADDRESS_CHARS}$`;

export const STACKS_ADDRESS_PATTERN = `^(${C32_ADDRESS_CHARS})$`;

// hex private key
export const PRIVATE_KEY_PATTERN = 
  '^([0-9a-f]{64,66})$';

// hex private key, no compression
export const PRIVATE_KEY_UNCOMPRESSED_PATTERN = 
  '^([0-9a-f]{64})$';

// m,pk1,pk2,...,pkn
export const PRIVATE_KEY_MULTISIG_PATTERN =
  '^([0-9]+),([0-9a-f]{64,66},)*([0-9a-f]{64,66})$';

// segwit:p2sh:m,pk1,pk2,...,pkn
export const PRIVATE_KEY_SEGWIT_P2SH_PATTERN =
  `^segwit:p2sh:([0-9]+),([0-9a-f]{64,66},)*([0-9a-f]{64,66})$`;

// any private key pattern we support 
export const PRIVATE_KEY_PATTERN_ANY = 
  `${PRIVATE_KEY_PATTERN}|${PRIVATE_KEY_MULTISIG_PATTERN}|${PRIVATE_KEY_SEGWIT_P2SH_PATTERN}`;

export const PUBLIC_KEY_PATTERN = 
  '^([0-9a-f]{66,130})$'

export const INT_PATTERN = '^-?[0-9]+$'

export const ZONEFILE_HASH_PATTERN = '^([0-9a-f]{40})$'

export const URL_PATTERN = "^http[s]?://.+$"

export const SUBDOMAIN_PATTERN =
  '^([0-9a-z_+-]{1,37})\.([0-9a-z_.+-]{3,37})$'

export const TXID_PATTERN = 
  '^([0-9a-f]{64})$'

export const PATH_PATTERN = '^[/]+.+$'

export const BOOLEAN_PATTERN = '^(0|1|true|false)$'

const LOG_CONFIG_DEFAULTS = {
  level: 'warn',
  handleExceptions: true,
  timestamp: true,
  stringify: true,
  colorize: true,
  json: true
}

const CONFIG_DEFAULTS = {
  blockstackAPIUrl: 'https://core.blockstack.org',
  blockstackNodeUrl: 'https://node.blockstack.org:6263',
  broadcastServiceUrl: 'https://broadcast.blockstack.org',
  utxoServiceUrl: 'https://blockchain.info',
  logConfig: LOG_CONFIG_DEFAULTS
};

const CONFIG_REGTEST_DEFAULTS = {
  blockstackAPIUrl: 'http://localhost:16268',
  blockstackNodeUrl: 'http://localhost:16264',
  broadcastServiceUrl: 'http://localhost:16269',
  utxoServiceUrl: 'http://localhost:18332',
  logConfig: LOG_CONFIG_DEFAULTS
};

const PUBLIC_TESTNET_HOST = 'testnet.blockstack.org';

const CONFIG_TESTNET_DEFAULTS = {
  blockstackAPIUrl: `http://${PUBLIC_TESTNET_HOST}:16268`,
  blockstackNodeUrl: `http://${PUBLIC_TESTNET_HOST}:16264`,
  broadcastServiceUrl: `http://${PUBLIC_TESTNET_HOST}:16269`,
  utxoServiceUrl: `http://${PUBLIC_TESTNET_HOST}:18332`,
  logConfig: Object.assign({}, LOG_CONFIG_DEFAULTS, { level: 'debug' })
};

export const DEFAULT_CONFIG_PATH = '~/.blockstack-cli.conf'
export const DEFAULT_CONFIG_REGTEST_PATH = '~/.blockstack-cli-regtest.conf'
export const DEFAULT_CONFIG_TESTNET_PATH = '~/.blockstack-cli-testnet.conf'

// CLI usage
const CLI_ARGS = {
  type: 'object',
  properties: {
    announce: {
      type: "array",
      items: [
        {
          name: 'message_hash',
          type: "string",
          realtype: 'zonefile_hash',
          pattern: ZONEFILE_HASH_PATTERN,
        },
        {
          name: 'owner_key',
          type: "string",
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 2,
      maxItems: 2,
      help: 'Broadcast a message on the blockchain for subscribers to read.  ' +
      'The MESSAGE_HASH argument must be the hash of a previously-announced zone file.  ' +
      'The OWNER_KEY used to sign the transaction must correspond to the Blockstack ID ' +
      'to which other users have already subscribed.  OWNER_KEY can be a single private key ' +
      'or a serialized multisig private key bundle.\n' + 
      '\n' +
      'Examples:\n' + 
      '    $ # Tip: You can obtain the owner key with the get_owner_keys command\n' +
      '    $ export OWNER_KEY="136ff26efa5db6f06b28f9c8c7a0216a1a52598045162abfe435d13036154a1b01"\n' +
      '    $ blockstack-cli announce 737c631c7c5d911c6617993c21fba731363f1cfe "$OWNER_KEY"\n' +
      '\n' +
      '    $ export OWNER_KEY="2,136ff26efa5db6f06b28f9c8c7a0216a1a52598045162abfe435d13036154a1b01,1885cba486a42960499d1f137ef3a475725ceb11f45d74631f9928280196f67401,2418981c7f3a91d4467a65a518e14fafa30e07e6879c11fab7106ea72b49a7cb01"\n' +
      '    $ blockstack-cli announce 737c631c7c5d911c6617993c21fba731363f1cfe "$OWNER_KEY"\n',
      group: 'Peer Services'
    },
    authenticator: {
      type: "array",
      items: [
        {
          name: 'app_gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
          pattern: '.+',
        },
        {
          name: 'profileGaiaHub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'port',
          type: 'string',
          realtype: 'portnum',
          pattern: '^[0-9]+',
        },
      ],
      minItems: 2,
      maxItems: 4,
      help: 'Run an authentication endpoint for the set of names owned ' +
      'by the given backup phrase.  Send applications the given Gaia hub URL on sign-in, ' +
      'so the application will use it to read/write user data.\n' +
      '\n' +
      'You can supply your encrypted backup phrase instead of the raw backup phrase.  If so, ' +
      'then you will be prompted for your password before any authentication takes place.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export BACKUP_PHRASE="oak indicate inside poet please share dinner monitor glow hire source perfect"\n' +
      '    $ export APP_GAIA_HUB="https://1.2.3.4"\n' +
      '    $ export PROFILE_GAIA_HUB="https://hub.blockstack.org"\n' +
      '    $ blockstack-cli authenticator "$APP_GAIA_HUB" "$BACKUP_PHRASE" "$PROFILE_GAIA_HUB" 8888\n' +
      '    Press Ctrl+C to exit\n' +
      '    Authentication server started on 8888\n',
      group: 'Authentication',
    },
    balance: {
      type: "array",
      items: [ 
        {
          name: 'address',
          type: "string",
          realtype: 'address',
          pattern: `${ADDRESS_PATTERN}|${STACKS_ADDRESS_PATTERN}`,
        }
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Query the balance of an account.  Returns the balances of each kind of token ' +
      'that the account owns.  The balances will be in the *smallest possible units* of the ' +
      'token (i.e. satoshis for BTC, microStacks for Stacks, etc.).\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ blockstack-cli balance 16pm276FpJYpm7Dv3GEaRqTVvGPTdceoY4\n' +
      '    {\n' +
      '      "BTC": "123456"\n' +
      '      "STACKS": "123456"\n' +
      '    }\n' +
      '    $ blockstack-cli balance SPZY1V53Z4TVRHHW9Z7SFG8CZNRAG7BD8WJ6SXD0\n' +
      '    {\n' +
      '      "BTC": "123456"\n' +
      '      "STACKS": "123456"\n' +
      '    }\n',
      group: 'Account Management',
    },
    convert_address: {
      type: "array",
      items: [
        {
          name: "address",
          type: "string",
          realtype: "address",
          pattern: `${ADDRESS_PATTERN}|${STACKS_ADDRESS_PATTERN}`
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Convert a Bitcoin address to a Stacks address and vice versa.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ blockstack-cli convert_address 12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD\n' +
      '    {\n' +
      '      "STACKS": "SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW",\n' +
      '      "BTC": "12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD"\n' +
      '    }\n' +
      '    $ blockstack-cli convert_address SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW\n' +
      '    {\n' +
      '      "STACKS": "SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW",\n' +
      '      "BTC": "12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD"\n' +
      '    }\n',
      group: 'Account Management',
    },
    decrypt_keychain: {
      type: "array",
      items: [
        {
          name: "encrypted_backup_phrase",
          type: "string",
          realtype: "encrypted_backup_phrase",
          pattern: "^[^ ]+$",
        },
        {
          name: 'password',
          type: 'string',
          realtype: 'password',
          pattern: '.+',
        },
      ],
      minItems: 1,
      maxItems: 2,
      help: 'Decrypt an encrypted backup phrase with a password.  Decrypts to a 12-word ' +
      'backup phrase if done correctly.  The password will be prompted if not given.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ # password is "asdf"\n' +
      '    $ blockstack-cli decrypt_keychain "bfMDtOucUGcJXjZo6vkrZWgEzue9fzPsZ7A6Pl4LQuxLI1xsVF0VPgBkMsnSLCmYS5YHh7R3mNtMmX45Bq9sNGPfPsseQMR0fD9XaHi+tBg=\n' +
      '    Enter password:\n' +
      '    section amount spend resemble spray verify night immune tattoo best emotion parrot',
      group: "Key Management",
    },
    encrypt_keychain: {
      type: "array",
      items: [
        {
          name: "backup_phrase",
          type: "string",
          realtype: "backup_phrase",
          pattern: ".+",
        },
        {
          name: 'password',
          type: 'string',
          realtype: 'password',
          pattern: '.+',
        },
      ],
      minItems: 1,
      maxItems: 2,
      help: "Encrypt a 12-word backup phrase, which can be decrypted later with the " +
      "decrypt_backup_phrase command.  The password will be prompted if not given.\n" +
      '\n' +
      'Example:\n' +
      '\n' +
      '     $ # password is "asdf"\n' +
      '     $ blockstack-cli encrypt_keychain "section amount spend resemble spray verify night immune tattoo best emotion parrot"\n' +
      '     Enter password:\n' +
      '     Enter password again:\n' +
      '     M+DnBHYb1fgw4N3oZ+5uTEAua5bAWkgTW/SjmmBhGGbJtjOtqVV+RrLJEJOgT35hBon4WKdGWye2vTdgqDo7+HIobwJwkQtN2YF9g3zPsKk=',
      group: "Key Management",
    },
    gaia_dump_bucket: {
      type: "array",
      items: [
        {
          name: 'name_or_id_address',
          type: 'string',
          realtype: 'name_or_id_address',
          pattern: `${ID_ADDRESS_PATTERN}|${NAME_PATTERN}|${SUBDOMAIN_PATTERN}` 
        },
        {
          name: 'app_origin',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
        },
        {
          name: 'dump_dir',
          type: 'string',
          realtype: 'path',
          pattern: PATH_PATTERN,
        }
      ],
      minItems: 5,
      maxItems: 5,
      help: 'Download the contents of a Gaia hub bucket to a given directory.  The GAIA_HUB argument ' +
      'must correspond to the *write* endpoint of the Gaia hub -- that is, you should be able to fetch ' +
      '$GAIA_HUB/hub_info.  If DUMP_DIR does not exist, it will be created.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export BACKUP_PHRASE="section amount spend resemble spray verify night immune tattoo best emotion parrot\n' +
      '    $ blockstack-cli gaia_dump_bucket hello.id.blockstack https://sample.app https://hub.blockstack.org "$BACKUP_PHRASE" ./backups\n' +
      '    Download 3 files...\n' +
      '    Download hello_world to ./backups/hello_world\n' +
      '    Download dir/format to ./backups/dir\\x2fformat\n' +
      '    Download /.dotfile to ./backups/\\x2f.dotfile\n' +
      '    3\n',
      group: "Gaia",
    },
    gaia_getfile: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'blockstack_id',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
        {
          name: 'app_origin',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'filename',
          type: 'string',
          realtype: 'filename',
          pattern: '.+',
        },
        {
          name: 'app_private_key',
          type: 'string',
          realtype: 'private_key',
          pattern: PRIVATE_KEY_UNCOMPRESSED_PATTERN,
        },
        {
          name: 'decrypt',
          type: 'string',
          realtype: 'boolean',
          pattern: BOOLEAN_PATTERN,
        },
        {
          name: 'verify',
          type: 'string',
          realtype: 'boolean',
          pattern: BOOLEAN_PATTERN,
        },
      ],
      minItems: 3,
      maxItems: 6,
      help: 'Get a file from another user\'s Gaia hub.  Prints the file data to stdout.  If you ' +
      'want to read an encrypted file, and/or verify a signed file, then you must pass an app ' +
      'private key, and pass 1 for DECRYPT and/or VERIFY.  If the file is encrypted, and you do not ' +
      'pass an app private key, then this command downloads the ciphertext.  If the file is signed, ' +
      'and you want to download its data and its signature, then you must run this command twice -- ' +
      'once to get the file contents at FILENAME, and once to get the signature (whose name will be FILENAME.sig).\n' +
      '\n' +
      'Note that Gaia is a key-value store, and has no notion of directories.  Any directory-separator characters like / or \\ in FILENAME ' +
      'will be treated as string literals.\n' +
      '\n' +
      'Example without encryption:\n' +
      '\n' + 
      '    $ # Get an unencrypted, unsigned file\n' +
      '    $ blockstack-cli gaia_getfile ryan.id http://publik.ykliao.com statuses.json\n' +
      '    [{"id":0,"text":"Hello, Blockstack!","created_at":1515786983492}]\n' +
      '\n' +
      'Example with encryption:\n' +
      '\n' +
      '    $ # Get an encrypted file without decrypting\n' +
      '    $ blockstack-cli gaia_getfile ryan.id https://app.graphitedocs.com documentscollection.json\n' +
      '' +
      '    $ # Get an encrypted file, and decrypt it\n' +
      '    $ # Tip: You can obtain the app key with the get_app_keys command\n' +
      '    $ export APP_KEY="3ac770e8c3d88b1003bf4a0a148ceb920a6172bdade8e0325a1ed1480ab4fb19"\n' +
      '    $ blockstack-cli gaia_getfile ryan.id https://app.graphitedocs.com documentscollection.json "$APP_KEY" 1 0\n',
      group: 'Gaia',
    },
    gaia_putfile: {
      type: "array",
      items: [
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'app_private_key',
          type: 'string',
          realtype: 'private_key',
          pattern: PRIVATE_KEY_UNCOMPRESSED_PATTERN,
        },
        {
          name: 'data_path',
          type: 'string',
          realtype: 'path',
          pattern: '.+',
        },
        {
          name: 'gaia_filename',
          type: 'string',
          realtype: 'filename',
          pattern: PATH_PATTERN,
        },
        {
          name: 'encrypt',
          type: 'string',
          realtype: 'boolean',
          pattern: BOOLEAN_PATTERN,
        },
        {
          name: 'sign',
          type: 'string',
          realtype: 'boolean',
          pattern: BOOLEAN_PATTERN,
        },
      ],
      minItems: 4,
      maxItems: 6,
      help: 'Put a file into a given Gaia hub, authenticating with the given app private key.  ' +
      'Optionally encrypt and/or sign the data with the given app private key.',
      group: 'Gaia',
    },
    gaia_listfiles: {
      type: "array",
      items: [
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'app_private_key',
          type: 'string',
          realtype: 'private_key',
          pattern: PRIVATE_KEY_UNCOMPRESSED_PATTERN,
        },
      ],
      minItems: 2,
      maxItems: 2,
      help: 'List all the files in a Gaia hub, authenticating with the given app private key.',
      group: 'Gaia',
    },
    gaia_restore_bucket: {
      type: "array",
      items: [
        {
          name: 'name_or_id_address',
          type: 'string',
          realtype: 'name_or_id_address',
          pattern: `${ID_ADDRESS_PATTERN}|${NAME_PATTERN}|${SUBDOMAIN_PATTERN}` 
        },
        {
          name: 'app_origin',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
        },
        {
          name: 'dump_dir',
          type: 'string',
          realtype: 'path',
          pattern: PATH_PATTERN,
        }
      ],
      minItems: 5,
      maxItems: 5,
      help: 'Upload the contents of a previously-dumped Gaia bucket to a new Gaia hub.  The GAIA_HUB argument ' +
      'must correspond to the *write* endpoint of the Gaia hub -- that is, you should be able to fetch ' +
      '$GAIA_HUB/hub_info.  DUMP_DIR must contain the file contents created by a previous successful run of the gaia_dump_bucket command, ' +
      'and both NAME_OR_ID_ADDRESS and APP_ORIGIN must be the same as they were when it was run.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export BACKUP_PHRASE="section amount spend resemble spray verify night immune tattoo best emotion parrot"\n' +
      '    $ blockstack-cli gaia_restore_bucket hello.id.blockstack https://sample.app https://new.gaia.hub "$BACKUP_PHRASE" ./backups\n' +
      '    Uploaded ./backups/hello_world to https://new.gaia.hub/hub/1Lr8ggSgdmfcb4764woYutUfFqQMjEoKHc/hello_world\n' +
      '    Uploaded ./backups/dir\\x2fformat to https://new.gaia.hub/hub/1Lr8ggSgdmfcb4764woYutUfFqQMjEoKHc/dir/format\n' +
      '    Uploaded ./backups/\\x2f.dotfile to https://new.gaia.hub/hub/1Lr8ggSgdmfcb4764woYutUfFqQMjEoKHc//.dotfile\n' +
      '    3\n',
      group: "Gaia",
    },
    gaia_sethub: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'blockstack_id',
          pattern: `^${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
        {
          name: 'owner_gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'app_origin',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'app_gaia_hub',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
        },
      ],
      minItems: 5,
      maxItems: 5,
      help: 'Set the Gaia hub for a particular application for a Blockstack ID.',
      group: 'Gaia',
    },
    get_account_history: {
      type: "array",
      items: [
        {
          name: 'address',
          type: "string",
          realtype: 'address',
          pattern: STACKS_ADDRESS_PATTERN,
        },
        {
          name: 'startblock',
          type: "string",
          realtype: "integer",
          pattern: "^[0-9]+$",
        },
        {
          name: 'endblock',
          type: "string",
          realtype: "integer",
          pattern: "^[0-9]+$",
        },
        {
          name: 'page',
          type: "string",
          realtype: "integer",
          pattern: "^[0-9]+$",
        },
      ],
      minItems: 4,
      maxItems: 4,
      help: 'Query the history of account debits and credits over a given block range.  ' +
      'Returns the history one page at a time.  An empty result indicates that the page ' +
      'number has exceeded the number of historic operations in the given block range.',
      group: 'Account Management',
    },
    get_account_at: {
      type: "array",
      items: [
        {
          name: 'address',
          type: "string",
          realtype: 'address',
          pattern: STACKS_ADDRESS_PATTERN,
        },
        {
          name: 'blocknumber',
          type: "string",
          realtype: 'integer',
          pattern: "^[0-9]+$",
        },
      ],
      minItems: 2,
      maxItems: 2,
      help: 'Query the list of token debits and credits on a given address that occurred ' +
      'at a particular block height.  Does not include BTC debits and credits.',
      group: 'Account Management',
    },
    get_address: {
      type: 'array',
      items: [
        {
          name: 'private_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        }
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the address of a private key or multisig private key bundle.  Gives the BTC and STACKS addresses\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ blockstack-cli get_address f5185b9ca93bdcb5753fded3b097dab8547a8b47d2be578412d0687a9a0184cb01\n' +
      '    {\n' +
      '      "BTC": "1JFhWyVPpZQjbPcXFtpGtTmU22u4fhBVmq",\n' +
      '      "STACKS": "SP2YM3J4KQK09V670TD6ZZ1XYNYCNGCWCVVKSDFWQ"\n' +
      '    }\n' +
      '    $ blockstack-cli get_address 1,f5185b9ca93bdcb5753fded3b097dab8547a8b47d2be578412d0687a9a0184cb01,ff2ff4f4e7f8a1979ffad4fc869def1657fd5d48fc9cf40c1924725ead60942c01\n' +
      '    {\n' +
      '      "BTC": "363pKBhc5ipDws1k5181KFf6RSxhBZ7e3p",\n' +
      '      "STACKS": "SMQWZ30EXVG6XEC1K4QTDP16C1CAWSK1JSWMS0QN"\n' +
      '    }',
      group: 'Key Management',
    },
    get_blockchain_record: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: `^${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the low-level blockchain-hosted state for a Blockstack ID.  This command ' +
      'is used mainly for debugging and diagnostics.  You should not rely on it to be stable.',
      group: 'Querying Blockstack IDs'
    },
    get_blockchain_history: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the low-level blockchain-hosted history of operations on a Blocktack ID.  ' +
      'This command is used mainly for debugging and diagnostics, and is not guaranteed to ' +
      'be stable across releases.',
      group: 'Querying Blockstack IDs',
    },
    get_confirmations: {
      type: "array",
      items: [
        {
          name: 'txid',
          type: 'string',
          realtype: 'transaction_id',
          pattern: TXID_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the number of confirmations for a transaction.',
      group: 'Peer Services',
    },
    get_namespace_blockchain_record: {
      type: "array",
      items: [
        {
          name: 'namespace_id',
          type: "string",
          realtype: 'namespace_id',
          pattern: NAMESPACE_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the low-level blockchain-hosted state for a Blockstack namespace.  This command ' +
      'is used mainly for debugging and diagnostics, and is not guaranteed to be stable across ' +
      'releases.',
      group: 'Namespace Operations',
    },
    get_app_keys: {
      type: "array",
      items: [
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
        },
        {
          name: 'name_or_id_address',
          type: 'string',
          realtype: 'name-or-id-address',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}|${ID_ADDRESS_PATTERN}`,
        },
        {
          name: 'app_origin',
          type: 'string',
          realtype: 'url',
          pattern: URL_PATTERN,
        },
      ],
      minItems: 3,
      maxItems: 3,
      help: 'Get the application private key from a 12-word backup phrase and a name or ID-address.  ' +
      'This is the private key used to sign data in Gaia, and its address is the Gaia bucket ' +
      'address.  If you provide your encrypted backup phrase, you will be asked to decrypt it.  ' +
      'If you provide a name instead of an ID-address, its ID-address will be queried automatically ' +
      '(note that this means that the name must already be registered).  Note that this command does NOT ' +
      'verify whether or not the name or ID-address was created by the backup phrase.  You should do this yourself ' +
      'via the "get_owner_keys" command if you are not sure.\n' +
      'There are two derivation paths emitted by this command:  a "keyInfo" path and a "legacyKeyInfo"' +
      'path.  You should use the one that matches the Gaia hub read URL\'s address, if you have already ' +
      'signed in before.  If not, then you should use the "keyInfo" path when possible.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export BACKUP_PHRASE="one race buffalo dynamic icon drip width lake extra forest fee kit"\n' +
      '    $ blockstack-cli get_app_keys "$BACKUP_PHRASE" ID-19veSw4r1aUG4GcrZFQUD7YZa1v2es2j6s https://my.cool.dapp\n' +
      '    {\n' +
      '      "keyInfo": {\n' +
      '        "privateKey": "TODO",\n' +
      '        "address": "TODO"\n' +
      '      },\n' +
      '      "legacyKeyInfo": {\n' +
      '        "privateKey": "90f9ec4e13fb9a00243b4c1510075157229bda73076c7c721208c2edca28ea8b",\n' +
      '        "address": "1Lr8ggSgdmfcb4764woYutUfFqQMjEoKHc"\n' +
      '      },\n' +
      '      "ownerKeyIndex": 0\n' +
      '    }',
      group: 'Key Management',
    },
    get_owner_keys: {
      type: "array",
      items: [
        {
          name: 'backup_phrase',
          type: "string",
          realtype: '12_words_or_ciphertext',
        },
        {
          name: 'index',
          type: "string",
          realtype: 'integer',
          pattern: "^[0-9]+$",
        }
      ],
      minItems: 1,
      maxItems: 2,
      help: 'Get the list of owner private keys and ID-addresses from a 12-word backup phrase.  ' +
      'Pass non-zero values for INDEX to generate the sequence of ID-addresses that can be used ' +
      'to own Blockstack IDs.  If you provide an encrypted 12-word backup phrase, you will be ' +
      'asked for your password to decrypt it.',
      group: 'Key Management',
    },
    get_payment_key: {
      type: "array",
      items: [
        {
          name: 'backup_phrase',
          type: "string",
          realtype: '12_words_or_ciphertext',
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the payment private key from a 12-word backup phrase.  If you provide an ' +
      'encrypted backup phrase, you will be asked for your password to decrypt it.',
      group: 'Key Management',
    },
    get_zonefile: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the current zone file for a Blockstack ID',
      group: 'Peer Services',
    },
    help: {
      type: 'array',
      items: [
        {
          name: 'command',
          type: 'string',
          realtype: 'command',
        },
      ],
      minItems: 0,
      maxItems: 1,
      help: 'Get the usage string for a CLI command',
      group: 'CLI',
    },
    lookup: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get and authenticate the profile and zone file for a Blockstack ID',
      group: 'Querying Blockstack IDs',
    },
    names: {
      type: "array",
      items: [
        {
          name: 'id_address',
          type: "string",
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the list of Blockstack IDs owned by an ID-address.',
      group: 'Querying Blockstack IDs',
    },
    make_keychain: {
      type: "array",
      items: [
        {
          name: 'backup_phrase',
          type: 'string',
          realtype: '12_words_or_ciphertext',
        },
      ],
      minItems: 0,
      maxItems: 1,
      help: 'Generate the owner and payment private keys, optionally from a given 12-word ' +
      'backup phrase.  If no backup phrase is given, a new one will be generated.  If you provide ' +
      'your encrypted backup phrase, you will be asked to decrypt it.',
      group: 'Key Management',
    },
    make_zonefile: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'blockstack_id',
          pattern: `^${NAME_PATTERN}|${SUBDOMAIN_PATTERN}$`,
        },
        {
          name: 'id_address',
          type: 'string',
          realtype: 'ID-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'gaia_url_prefix',
          type: 'string',
          realtype: 'url',
          pattern: '.+',
        },
        {
          name: 'resolver_url',
          type: 'string',
          realtype: 'url',
          pattern: '.+',
        },
      ],
      minItems: 3,
      maxItems: 4,
      help: "Generate a zone file for a Blockstack ID with the given profile URL.  If you know " +
      "the ID-address for the Blockstack ID, the profile URL usually takes the form of:\n" + 
      "\n" +
      "     {GAIA_URL_PREFIX}/{ADDRESS}/profile.json\n" +
      "\n" +
      "where {GAIA_URL_PREFIX} is the *read* endpoint of your Gaia hub (e.g. https://gaia.blockstack.org/hub) and " +
      "{ADDRESS} is the base58check part of your ID-address (i.e. the string following 'ID-').",
      group: "Peer Services",
    },
    name_import: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'id_address',
          type: "string",
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'gaia_url_prefix',
          type: "string",
          realtype: 'url',
          pattern: '.+',
        },
        {
          name: 'reveal_key',
          type: "string",
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
          pattern: '.+',
        },
        {
          name: 'zonefile_hash',
          type: 'string',
          realtype: 'zonefile_hash',
          pattern: ZONEFILE_HASH_PATTERN,
        },
      ],
      minItems: 4,
      maxItems: 6,
      help: 'Import a name into a namespace you revealed.  The REVEAL_KEY must be the same as ' +
      'the key that revealed the namespace.  You can only import a name into a namespace if ' +
      'the namespace has not yet been launched (i.e. via `namespace_ready`), and if the ' +
      'namespace was revealed less than a year ago (52595 blocks ago).\n' +
      '\n' +
      'A zone file will be generated for this name automatically, if "ZONEFILE" is not given.  By default, ' +
      'the zone file will have a URL to the name owner\'s profile prefixed by GAIA_URL_PREFIX.  If you ' +
      'know the *write* endpoint for the name owner\'s Gaia hub, you can find out the GAIA_URL_PREFIX ' +
      'to use with "curl $GAIA_HUB/hub_info".\n' +
      '\n' +
      'If you specify an argument for "ZONEFILE," then the GAIA_URL_PREFIX argument is ignored in favor of ' +
      'your custom zone file on disk.\n' +
      '\n' +
      'If you specify a valid zone file hash for "ZONEFILE_HASH," then it will be used in favor of ' +
      'both ZONEFILE and GAIA_URL_PREFIX.  The zone file hash will be incorporated directly into the ' +
      'name-import transaction.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export REVEAL_KEY="bfeffdf57f29b0cc1fab9ea197bb1413da2561fe4b83e962c7f02fbbe2b1cd5401"\n' +
      '    $ export ID_ADDRESS="ID-18e1bqU7B5qUPY3zJgMLxDnexyStTeSnvV"\n' +
      '    $ blockstack-cli name_import example.id "$ID_ADDRESS" https://gaia.blockstack.org/hub "$REVEAL_KEY"',
      group: 'Namespace Operations',
    },
    namespace_preorder: {
      type: 'array',
      items: [
        {
          name: 'namespace_id',
          type: 'string',
          realtype: 'namespace_id',
          pattern: NAMESPACE_PATTERN,
        },
        {
          name: 'reveal_address',
          type: 'string',
          realtype: 'address',
          pattern: ADDRESS_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 3,
      maxItems: 3,
      help: 'Preorder a namespace.  This is the first of three steps to creating a namespace.  ' +
      'Once this transaction is confirmed, you will need to use the `namespace_reveal` command ' +
      'to reveal the namespace (within 24 hours, or 144 blocks).',
      group: 'Namespace Operations',
    },
    namespace_reveal: {
      type: 'array',
      items: [
        {
          name: 'namespace_id',
          type: 'string',
          realtype: 'namespace_id',
          pattern: NAMESPACE_PATTERN,
        },
        {
          name: 'reveal_address',
          type: 'string',
          realtype: 'address',
          pattern: ADDRESS_PATTERN,
        },
        {
          // version
          name: 'version',
          type: 'string',
          realtype: '2-byte-integer',
          pattern: INT_PATTERN,
        },
        {
          // lifetime
          name: 'lifetime',
          type: 'string',
          realtype: '4-byte-integer',
          pattern: INT_PATTERN,
        },
        {
          // coeff
          name: 'coefficient',
          type: 'string',
          realtype: '1-byte-integer',
          pattern: INT_PATTERN,
        },
        {
          // base
          name: 'base',
          type: 'string',
          realtype: '1-byte-integer',
          pattern: INT_PATTERN,
        },
        {
          // buckets
          name: 'price_buckets',
          type: 'string',
          realtype: 'csv-of-16-nybbles',
          pattern: '^([0-9]{1,2},){15}[0-9]{1,2}$'
        },
        {
          // non-alpha discount
          name: 'nonalpha_discount',
          type: 'string',
          realtype: 'nybble',
          pattern: INT_PATTERN,
        },
        {
          // no-vowel discount
          name: 'no_vowel_discount',
          type: 'string',
          realtype: 'nybble',
          pattern: INT_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 10,
      maxItems: 10,
      help: 'Reveal a preordered namespace, and set the price curve and payment options.  ' +
      'This is the second of three steps required to create a namespace, and must be done ' +
      'shortly after the associated "namespace_preorder" command.',
      group: 'Namespace Operations'
    },
    namespace_ready: {
      type: 'array',
      items: [
        {
          name: 'namespace_id',
          type: 'string',
          realtype: 'namespace_id',
          pattern: NAMESPACE_PATTERN,
        },
        {
          name: 'reveal_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 2,
      maxItems: 2,
      help: 'Launch a revealed namespace.  This is the third and final step of creating a namespace.  ' +
      'Once launched, you will not be able to import names anymore.',
      group: 'Namespace Operations'
    },
    price: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: NAME_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the price of a name',
      group: 'Querying Blockstack IDs',
    },
    price_namespace: {
      type: "array",
      items: [
        {
          name: 'namespace_id',
          type: "string",
          realtype: 'namespace_id',
          pattern: NAMESPACE_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Get the price of a namespace',
      group: 'Namespace Operations',
    },
    profile_sign: {
      type: "array",
      items: [
        {
          name: 'profile',
          type: "string",
          realtype: 'path',
        },
        {
          name: 'owner_key',
          type: "string",
          realtype: 'private_key',
          pattern: PRIVATE_KEY_PATTERN
        }
      ],
      minItems: 2,
      maxItems: 2,
      help: 'Sign a profile on disk with a given owner private key.  Print out the signed profile JWT.',
      group: 'Profiles',
    },
    profile_store: {
      type: "array",
      items: [
        {
          name: 'user_id',
          type: "string",
          realtype: 'name-or-id-address',
          pattern: `${NAME_PATTERN}|${SUBDOMAIN_PATTERN}|${ID_ADDRESS_PATTERN}`,
        },
        {
          name: 'profile',
          type: "string",
          realtype: 'path',
        },
        {
          name: 'owner_key',
          type: "string",
          realtype: 'private_key',
          pattern: PRIVATE_KEY_PATTERN
        },
        {
          name: 'gaia_hub',
          type: "string",
          realtype: 'url',
        }
      ],
      minItems: 4,
      maxItems: 4,
      help: 'Store a profile on disk to a Gaia hub.  USER_ID can be either a Blockstack ID or ' +
      'an ID-address.  The GAIA_HUB argument must be the *write* endpoint for the user\'s Gaia hub ' +
      '(e.g. https://hub.blockstack.org).  You can verify this by ensuring that you can run \'curl ' +
      '"$GAIA_HUB/hub_info"\' successfully.',
      group: 'Profiles'
    },
    profile_verify: {
      type: "array",
      items: [
        {
          name: 'profile',
          type: "string",
          realtype: 'path',
        },
        {
          name: 'id_address',
          type: 'string',
          realtype: 'id-address',
          pattern: `${ID_ADDRESS_PATTERN}|${PUBLIC_KEY_PATTERN}`,
        }
      ],
      minItems: 2,
      maxItems: 2,
      help: 'Verify a profile on disk using a name or a public key (ID_ADDRESS).',
      group: 'Profiles',
    },
    renew: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'new_id_address',
          type: 'string',
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        },
        {
          name: 'zonefile_hash',
          type: 'string',
          realtype: 'zonefile_hash',
          pattern: ZONEFILE_HASH_PATTERN,
        },
      ],
      minItems: 3,
      maxItems: 6,
      help: 'Renew a name.  Optionally transfer it to a new owner address (NEW_ID_ADDRESS), ' +
      'and optionally load up and give it a new zone file on disk (ZONEFILE).  You will need ' +
      'to later use "zonefile_push" to replicate the zone file to the Blockstack peer network ' +
      'once the transaction confirms.',
      group: 'Blockstack ID Management',
    },
    register: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: PRIVATE_KEY_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        },
      ],
      minItems: 4,
      maxItems: 5,
      help: 'If you are trying to register a name for a *private key*, use this command.\n' +
      '\n' +
      'Register a name to a single name-owning private key.  After successfully running this command, ' +
      'and after waiting a couple hours, your name will be ready to use and will resolve to a ' + 
      'signed empty profile hosted on the given Gaia hub (GAIA_HUB).\n' +
      '\n' +
      'Behind the scenes, this will generate and send two transactions ' +
      'and generate and replicate a zone file with the given Gaia hub URL (GAIA_HUB).  ' +
      'Note that the GAIA_HUB argument must correspond to the *write* endpoint of the Gaia hub ' +
      '(i.e. you should be able to run \'curl "$GAIA_HUB/hub_info"\' and get back data).  If you ' +
      'are using Blockstack PBC\'s default Gaia hub, pass "https://hub.blockstack.org" for this ' +
      'argument.\n' +
      '\n' +
      'By default, this command generates a zone file automatically that points to the Gaia hub\'s ' +
      'read endpoint (which is queried on-the-fly from GAIA_HUB).  If you instead want to have a custom zone file for this name, ' +
      'you can specify a path to it on disk with the ZONEFILE argument.\n' +
      '\n' +
      'If this command completes successfully, your name will be ready to use once both transactions have 7+ confirmations.  ' +
      'You can use the "get_confirmations" command to track the confirmations ' +
      'on the transaction IDs returned by this command.\n' +
      '\n' +
      'WARNING: You should *NOT* use the payment private key (PAYMENT_KEY) while the name is being confirmed.  ' +
      'If you do so, you could double-spend one of the pending transactions and lose your name.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export OWNER="136ff26efa5db6f06b28f9c8c7a0216a1a52598045162abfe435d13036154a1b01"\n' +
      '    $ export PAYMENT="bfeffdf57f29b0cc1fab9ea197bb1413da2561fe4b83e962c7f02fbbe2b1cd5401"\n' +
      '    $ blockstack-cli register example.id "$OWNER" "$PAYMENT" https://hub.blockstack.org',
      group: 'Blockstack ID Management',
    },
    register_addr: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'id-address',
          type: 'string',
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'gaia_url_prefix',
          type: 'string',
          realtype: 'url',
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        }
      ],
      minItems: 4,
      maxItems: 4,
      help: 'If you are trying to register a name for an *ID-address*, use this command.\n' +
      '\n' +
      'Register a name to someone\'s ID-address.  After successfully running this ' +
      'command and waiting a couple of hours, the name will be registered on-chain and have a ' +
      'zone file with a URL to where the owner\'s profile should be.  This command does NOT ' + 
      'generate, sign, or replicate a profile for the name---the name owner will need to do this ' +
      'separately, once the name is registered.\n' +
      '\n' +
      'Behind the scenes, this command will generate two ' +
      'transactions, and generate and replicate a zone file with the given Gaia hub read URL ' +
      '(GAIA_URL_PREFIX).  Note that the GAIA_URL_PREFIX argument must correspond to the *read* endpoint of the Gaia hub ' +
      '(e.g. if you are using Blockstack PBC\'s default Gaia hub, this is "https://gaia.blockstack.org/hub"). ' +
      'If you know the *write* endpoint of the name owner\'s Gaia hub, you can find the right value for ' +
      'GAIA_URL_PREFIX by running "curl $GAIA_HUB/hub_info".\n' +
      '\n' +
      'No profile will be generated or uploaded by this command.  Instead, this command generates ' +
      'a zone file that will include the URL to a profile based on the GAIA_URL_PREFIX argument.\n' +
      '\n' +
      'The zone file will be generated automatically from the GAIA_URL_PREFIX argument.  If you need ' +
      'to use a custom zone file, you can pass the path to it on disk via the ZONEFILE argument.\n' +
      '\n' +
      'If this command completes successfully, the name will be ready to use in a couple of ' +
      'hours---that is, once both transactions have 7+ confirmations. ' +
      'You can use the "get_confirmations" command to track the confirmations.\n' +
      '\n' +
      'WARNING: You should *NOT* use the payment private key (PAYMENT_KEY) while the name is being confirmed.  ' +
      'If you do so, you could double-spend one of the pending transactions and lose the name.\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export ID_ADDRESS="ID-18e1bqU7B5qUPY3zJgMLxDnexyStTeSnvV"\n' +
      '    $ export PAYMENT="bfeffdf57f29b0cc1fab9ea197bb1413da2561fe4b83e962c7f02fbbe2b1cd5401"\n' +
      '    $ blockstack-cli register_addr example.id "$ID_ADDRESS" "$PAYMENT" https://gaia.blockstack.org/hub',
      group: 'Blockstack ID Management',
    },
    register_subdomain: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'blockstack_id',
          pattern: SUBDOMAIN_PATTERN,
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: PRIVATE_KEY_PATTERN,
        },
        {
          name: 'gaia_hub',
          type: 'string',
          realtype: 'url',
        },
        {
          name: 'registrar',
          type: 'string',
          realtype: 'url',
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        },
      ],
      minItems: 4,
      maxItems: 5,
      help: 'Register a subdomain.  This will generate and sign a subdomain zone file record ' +
      'with the given GAIA_HUB URL and send it to the given subdomain registrar (REGISTRAR).\n' +
      '\n' +
      'This command generates, signs, and uploads a profile to the GAIA_HUB url.  Note that the GAIA_HUB ' +
      'argument must correspond to the *write* endpoint of your Gaia hub (i.e. you should be able ' +
      'to run \'curl "$GAIA_HUB/hub_info"\' successfully).  If you are using Blockstack PBC\'s default ' +
      'Gaia hub, this argument should be "https://hub.blockstack.org".\n' +
      '\n' +
      'WARNING: At this time, no validation will occur on the registrar URL.  Be sure that the URL ' +
      'corresponds to the registrar for the on-chain name before running this command!\n' +
      '\n' +
      'Example:\n' +
      '\n' +
      '    $ export OWNER="6e50431b955fe73f079469b24f06480aee44e4519282686433195b3c4b5336ef01"\n' +
      '    $ # NOTE: https://registrar.blockstack.org is the registrar for personal.id!\n' + 
      '    $ blockstack-cli register_subdomain hello.personal.id "$OWNER" https://hub.blockstack.org https://registrar.blockstack.org\n',
      group: 'Blockstack ID Management',
    },
    revoke: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 3,
      maxItems: 3,
      help: 'Revoke a name.  This renders it unusable until it expires (if ever).',
      group: 'Blockstack ID Management',
    },
    send_btc: {
      type: "array",
      items: [
        {
          name: 'recipient_address',
          type: 'string',
          realtype: 'address',
          pattern: ADDRESS_PATTERN,
        },
        {
          name: 'amount',
          type: 'string',
          realtype: 'satoshis',
          pattern: INT_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 3,
      maxItems: 3,
      help: 'Send some Bitcoin (in satoshis) from a payment key to an address.  Up to the given ' +
      'amount will be spent, but likely less---the actual amount sent will be the amount given, ' +
      'minus the transaction fee.  For example, if you want to send 10000 satoshis but the ' +
      'transaction fee is 2000 satoshis, then the resulting transaction will send 8000 satoshis ' +
      'to the given address.  This is to ensure that this command does not *over*-spend your ' +
      'Bitcoin.  If you want to check the amount before spending, pass the -x flag to see the ' +
      'raw transaction.',
      group: 'Account Management'
    },
    send_tokens: {
      type: "array",
      items: [
        {
          name: 'address',
          type: 'string',
          realtype: 'address',
          pattern: STACKS_ADDRESS_PATTERN,
        },
        {
          name: 'type',
          type: 'string',
          realtype: 'token-type',
          pattern: `^${NAMESPACE_PATTERN}$|^STACKS$`
        },
        {
          name: 'amount',
          type: 'string',
          realtype: 'integer',
          pattern: '^[0-9]+$',
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'memo',
          type: 'string',
          realtype: 'string',
          pattern: '^.{0,34}$',
        },
      ],
      minItems: 4,
      maxItems: 5,
      help: 'Send tokens to the given ADDRESS.  The only supported TOKEN-TYPE is "STACKS".  Optionally ' +
      'include a memo string (MEMO) up to 34 characters long.',
      group: 'Account Management',
    },
    transfer: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'new_id_address',
          type: 'string',
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'keep_zonefile',
          type: 'string',
          realtype: 'true-or-false',
          pattern: '^true$|^false$',
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 5,
      maxItems: 5,
      help: 'Transfer a Blockstack ID to a new address (NEW_ID_ADDRESS).  Optionally preserve ' +
      'its zone file (KEEP_ZONEFILE).',
      group: 'Blockstack ID Management',
    },
    tx_preorder: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'id_address',
          type: 'string',
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
      ],
      minItems: 3,
      maxItems: 3,
      help: 'Generate and send NAME_PREORDER transaction, for a Blockstack ID to be owned ' +
      'by a given ID_ADDRESS.',
      group: 'Blockstack ID Management',
    },
    tx_register: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'id_address',
          type: 'string',
          realtype: 'id-address',
          pattern: ID_ADDRESS_PATTERN,
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        },
        {
          name: 'zonefile_hash',
          type: 'string',
          realtype: 'zoenfile_hash',
          pattern: ZONEFILE_HASH_PATTERN,
        },
      ],
      minItems: 3,
      maxItems: 5,
      help: 'Generate and send a NAME_REGISTRATION transaction, assigning the given BLOCKSTACK_ID ' +
      'to the given ID_ADDRESS.  Optionally pair the Blockstack ID with a zone file (ZONEFILE) or ' +
      'the hash of the zone file (ZONEFILE_HASH).  You will need to push the zone file to the peer ' +
      'network after the transaction confirms (i.e. with "zonefile_push").',
      group: 'Blockstack ID Management',
    },
    update: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: 'string',
          realtype: 'on-chain-blockstack_id',
          pattern: NAME_PATTERN,
        },
        {
          name: 'zonefile',
          type: 'string',
          realtype: 'path',
        },
        {
          name: 'owner_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'payment_key',
          type: 'string',
          realtype: 'private_key',
          pattern: `${PRIVATE_KEY_PATTERN_ANY}`
        },
        {
          name: 'zonefile_hash',
          type: 'string',
          realtype: 'zonefile_hash',
          pattern: ZONEFILE_HASH_PATTERN,
        },
      ],
      minItems: 4,
      maxItems: 5,
      help: 'Update the zonefile for an on-chain Blockstack ID.  Once the transaction confirms, ' +
      'you will need to push the zone file to the Blockstack peer network with "zonefile_push."',
      group: 'Blockstack ID Management'
    },
    whois: {
      type: "array",
      items: [
        {
          name: 'blockstack_id',
          type: "string",
          realtype: 'blockstack_id',
          pattern: NAME_PATTERN + "|"+ SUBDOMAIN_PATTERN,
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Look up the zone file and owner of a Blockstack ID',
      group: 'Querying Blockstack IDs',
    },
    zonefile_push: {
      type: "array",
      items: [
        {
          name: 'zonefile',
          type: "string",
          realtype: 'path',
        },
      ],
      minItems: 1,
      maxItems: 1,
      help: 'Push a zone file on disk to the Blockstack peer network.  The zone file must ' +
      'correspond to a zone file hash that has already been announced, i.e. via a NAME_UPDATE, ' +
      'NAME_REGISTRATION, NAME_RENEWAL, or NAME_IMPORT transaction.  This command does *not* ' + 
      'let you upload arbitrary zone files.',
      group: 'Peer Services',
    },
  },
  additionalProperties: false,
  strict: true
};

// usage string for built-in options
export const USAGE = `Usage: ${process.argv[1]} [options] command [command arguments]
Options can be:
    -c                  Path to a config file (defaults to
                        ${DEFAULT_CONFIG_PATH})

    -d                  Print verbose debugging output

    -e                  Estimate the BTC cost of an transaction (in satoshis).
                        Do not generate or send any transactions.

    -t                  Use the public testnet instead of mainnet.

    -i                  Use integration test framework instead of mainnet.

    -U                  Unsafe mode.  No safety checks will be performed.

    -x                  Do not broadcast a transaction.  Only generate and
                        print them to stdout.

    -B BURN_ADDR        Use the given namespace burn address instead of the one
                        obtained from the Blockstack network (DANGEROUS)

    -D DENOMINATION     Denominate the price to pay in the given units
                        (DANGEROUS)

    -C CONSENSUS_HASH   Use the given consensus hash instead of one obtained
                        from the network

    -F FEE_RATE         Use the given transaction fee rate instead of the one
                        obtained from the Bitcoin network

    -G GRACE_PERIOD     Number of blocks in which a name can be renewed after it
                        expires (DANGEROUS)

    -H URL              Use an alternative Blockstack Core API endpoint.

    -I URL              Use an alternative Blockstack Core Indexer endpoint.

    -N PAY2NS_PERIOD    Number of blocks in which a namespace receives the registration
                        and renewal fees after it is created (DANGEROUS)

    -P PRICE            Use the given price to pay for names or namespaces
                        (DANGEROUS)

    -T URL              Use an alternative Blockstack transaction broadcaster.
`;

/*
 * Format help
 */
function formatHelpString(indent: number, limit: number, helpString: string) : string {
  const lines = helpString.split('\n');
  let buf = "";
  let pad = "";
  for (let i = 0; i < indent; i++) {
    pad += ' ';
  }

  for (let i = 0; i < lines.length; i++) {
    let linebuf = pad.slice();
    const words = lines[i].split(/ /).filter((word) => word.length > 0);
    if (words.length == 0) {
      buf += '\n';
      continue;
    }

    if (words[0] === '$' || lines[i].substring(0, 4) === '    ') {
      // literal line
      buf += lines[i] + '\n';
      continue;
    }

    for (let j = 0; j < words.length; j++) {
      if (words[j].length === 0) {
        // explicit line break 
        linebuf += '\n';
        break;
      }

      if (linebuf.split('\n').slice(-1)[0].length + 1 + words[j].length > limit) {
        linebuf += '\n';
        linebuf += pad;
      }
      linebuf += words[j] + ' ';
    }

    buf += linebuf + '\n';
  }
  return buf;
}

/*
 * Format command usage lines.
 * Generate two strings:
 * raw string: 
 *    COMMAND ARG_NAME ARG_NAME ARG_NAME [OPTINONAL ARG NAME]
 * keyword string:
 *    COMMAND --arg_name TYPE
 *            --arg_name TYPE
 *            [--arg_name TYPE]
 */
function formatCommandHelpLines(commandName: string, commandArgs: Array<Object>) : Object {
  let rawUsage = '';
  let kwUsage = '';
  let kwPad = '';
  const commandInfo = CLI_ARGS.properties[commandName];

  rawUsage = `  ${commandName} `;
  for (let i = 0; i < commandArgs.length; i++) {
    if (!commandArgs[i].name) {
      console.log(commandName);
      console.log(commandArgs[i]);
      throw new Error(`BUG: command info is missing a "name" field`);
    }
    if (i + 1 <= commandInfo.minItems) {
      rawUsage += `${commandArgs[i].name.toUpperCase()} `;
    }
    else {
      rawUsage += `[${commandArgs[i].name.toUpperCase()}] `;
    }
  }

  kwUsage = `  ${commandName} `;
  for (let i = 0; i < commandName.length + 3; i++) {
    kwPad += ' ';
  }
  
  for (let i = 0; i < commandArgs.length; i++) {
    if (!commandArgs[i].realtype) {
      console.log(commandName)
      console.log(commandArgs[i])
      throw new Error(`BUG: command info is missing a "realtype" field`);
    }
    if (i + 1 <= commandInfo.minItems) {
      kwUsage += `--${commandArgs[i].name} ${commandArgs[i].realtype.toUpperCase()}`;
    }
    else {
      kwUsage += `[--${commandArgs[i].name} ${commandArgs[i].realtype.toUpperCase()}]`;
    }
    kwUsage += '\n';
    kwUsage += kwPad;
  }

  return {'raw': rawUsage, 'kw': kwUsage};
}

/*
 * Get the set of commands grouped by command group
 */
function getCommandGroups() : Object {
  let groups = {};
  const commands = Object.keys(CLI_ARGS.properties);
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const group = CLI_ARGS.properties[command].group;
    const help = CLI_ARGS.properties[command].help;
    
    if (!groups.hasOwnProperty(group)) {
      groups[group] = [Object.assign({}, CLI_ARGS.properties[command], {
        'command': command
      })];
    }
    else {
      groups[group].push(Object.assign({}, CLI_ARGS.properties[command], {
        'command': command
      }));
    }
  }
  return groups;
}

/*
 * Make all commands list
 */
export function makeAllCommandsList() : string {
  const groups = getCommandGroups();
  const groupNames = Object.keys(groups).sort();

  let res = `All commands (run '${process.argv[1]} help COMMAND' for details):\n`;
  for (let i = 0; i < groupNames.length; i++) {
    res += `  ${groupNames[i]}: `;
    let cmds = [];
    for (let j = 0; j < groups[groupNames[i]].length; j++) {
      cmds.push(groups[groupNames[i]][j].command);
    }

    // wrap at 80 characters
    const helpLineSpaces = formatHelpString(4, 70, cmds.join(' '));
    const helpLineCSV = '    ' + helpLineSpaces.split('\n    ')
      .map((line) => line.trim().replace(/ /g, ', ')).join('\n    ') + '\n';

    res += '\n' + helpLineCSV;
    res += '\n';
  }
  return res.trim();
}

/*
 * Make a usage string for a single command
 */
export function makeCommandUsageString(command: string) : string {
  let res = "";
  const commandInfo = CLI_ARGS.properties[command];
  if (!commandInfo || command === 'help') {
    return makeAllCommandsList();
  }

  const groups = getCommandGroups();
  const groupNames = Object.keys(groups).sort();
  const help = commandInfo.help;
  
  const cmdFormat = formatCommandHelpLines(command, commandInfo.items);
  const formattedHelp = formatHelpString(2, 78, help);

  // make help string for one command 
  res += `Command: ${command}\n`;
  res += `Usage:\n`;
  res += `${cmdFormat.raw}\n`;
  res += `${cmdFormat.kw}\n`;
  res += formattedHelp;
  return res;
}

/*
 * Make the usage documentation
 */
export function makeUsageString(usageString: string) : string {
  let res = `${USAGE}\n\nCommand reference\n`;
  const groups = getCommandGroups();
  const groupNames = Object.keys(groups).sort();

  for (let i = 0; i < groupNames.length; i++) {
    const groupName = groupNames[i];
    const groupCommands = groups[groupName];

    res += `Command group: ${groupName}\n\n`;
    for (let j = 0; j < groupCommands.length; j++) {
      const command = groupCommands[j].command;
      const help = groupCommands[j].help;

      const commandInfo = CLI_ARGS.properties[command];

      const cmdFormat = formatCommandHelpLines(command, commandInfo.items);
      const formattedHelp = formatHelpString(4, 76, help);

      res += cmdFormat.raw;
      res += '\n';
      res += cmdFormat.kw;
      res += '\n';
      res += formattedHelp;
      res += '\n';
    }
    res += '\n';
  }    
  
  return res;
}

/*
 * Print usage
 */
export function printUsage() {
  console.error(makeUsageString(USAGE));
}

/*
 * Implement just enough getopt(3) to be useful.
 * Only handles short options.
 * Returns an object whose keys are option flags that map to true/false,
 * or to a value.
 * The key _ is mapped to the non-opts list.
 */
export function getCLIOpts(argv: Array<string>, 
                           opts: string = 'deitUxC:F:B:P:D:G:N:H:T:I:') : Object {
  let optsTable = {};
  let remainingArgv = [];
  let argvBuff = argv.slice(0);

  for (let i = 0; i < opts.length; i++) {
    if (opts[i] == ':') {
      continue;
    }
    if (i+1 < opts.length && opts[i+1] == ':') {
      optsTable[opts[i]] = null;
    }
    else {
      optsTable[opts[i]] = false;
    }
  }

  for (let opt of Object.keys(optsTable)) {
    for (let i = 0; i < argvBuff.length; i++) {
      if (argvBuff[i] === null) {
        break;
      }
      if (argvBuff[i] === '--') {
        break;
      }

      const argvOpt = `-${opt}`;
      if (argvOpt === argvBuff[i]) {
        if (optsTable[opt] === false) {
          // boolean switch
          optsTable[opt] = true;
          argvBuff[i] = '';
        }
        else {
          // argument
          optsTable[opt] = argvBuff[i+1];
          argvBuff[i] = '';
          argvBuff[i+1] = '';
        }
      }
    }
  }

  for (let i = 0; i < argvBuff.length; i++) {
    if (argvBuff[i].length > 0) {
      if (argvBuff[i] === '--') {
        continue;
      }
      remainingArgv.push(argvBuff[i])
    }
  }

  optsTable['_'] = remainingArgv;
  return optsTable;
}


/*
 * Use the CLI schema to get all positional and keyword args
 * for a given command.
 */
export function getCommandArgs(command: string, argsList: Array<string>) {
  let commandProps = CLI_ARGS.properties[command].items;
  if (!Array.isArray(commandProps)) {
    commandProps = [commandProps];
  }

  let orderedArgs = [];
  let foundArgs = {};

  // scan for keywords 
  for (let i = 0; i < argsList.length; i++) {
    if (argsList[i].startsWith('--')) {
      // positional argument 
      const argName = argsList[i].slice(2);
      let argValue = null;

      // dup?
      if (foundArgs.hasOwnProperty(argName)) {
        return {
          'status': false,
          'error': `duplicate argument ${argsList[i]}`,
        };
      }

      for (let j = 0; j < commandProps.length; j++) {
        if (!commandProps[j].hasOwnProperty('name')) {
          continue;
        }
        if (commandProps[j].name === argName) {
          // found!
          // end of args?
          if (i + 1 >= argsList.length) {
            return {
              'status': false,
              'error': `no value for argument ${argsList[i]}`
            };
          }

          argValue = argsList[i+1];
        }
      }

      if (argValue) {
        // found something!
        i += 1;
        foundArgs[argName] = argValue;
      }
      else {
        return {
          'status': false,
          'error': `no such argument ${argsList[i]}`,
        };
      }
    }
    else {
      // positional argument
      orderedArgs.push(argsList[i]);
    }
  }

  // merge foundArgs and orderedArgs back into an ordered argument list
  // that is conformant to the CLI specification.
  let mergedArgs = [];
  let orderedArgIndex = 0;

  for (let i = 0; i < commandProps.length; i++) {
    if (!commandProps[i].hasOwnProperty('name')) {
      // positional argument
      if (orderedArgIndex >= orderedArgs.length) {
        break;
      }
      mergedArgs.push(orderedArgs[orderedArgIndex]);
      orderedArgIndex += 1;
    }
    else if (!foundArgs.hasOwnProperty(commandProps[i].name)) {
      // positional argument 
      if (orderedArgIndex >= orderedArgs.length) {
        break;
      }
      mergedArgs.push(orderedArgs[orderedArgIndex]);
      orderedArgIndex += 1;
    }
    else {
      // keyword argument 
      mergedArgs.push(foundArgs[commandProps[i].name]);
    }
  }

  return {
    'status': true,
    'arguments': mergedArgs
  };
}

/*
 * Check command args
 */
type checkArgsSuccessType = {
  'success': true,
  'command': string,
  'args': Array<string>
};

type checkArgsFailType = {
  'success': false,
  'error': string,
  'command': string,
  'usage': boolean
};

export function checkArgs(argList: Array<string>) 
  : checkArgsSuccessType | checkArgsFailType {
  if (argList.length <= 2) {
     return {
       'success': false,
       'error': 'No command given',
       'usage': true,
       'command': '',
     }
  }

  const commandName = argList[2];
  const allCommandArgs = argList.slice(3);

  if (!CLI_ARGS.properties.hasOwnProperty(commandName)) {
     return {
       'success': false,
       'error': `Unrecognized command '${commandName}'`,
       'usage': true,
       'command': commandName,
     };
  }

  const parsedCommandArgs = getCommandArgs(commandName, allCommandArgs);
  if (!parsedCommandArgs.status) {
    return {
      'success': false,
      'error': parsedCommandArgs.error,
      'usage': true,
      'command': commandName,
    };
  }

  const commandArgs = parsedCommandArgs.arguments;

  const commands = new Object();
  commands[commandName] = commandArgs;

  const ajv = Ajv();
  const valid = ajv.validate(CLI_ARGS, commands);
  if (!valid) {
     // console.error(ajv.errors);
     return {
       'success': false,
       'error': 'Invalid command arguments',
       'usage': true,
       'command': commandName,
     };
  }

  return {
    'success': true, 
    'command': commandName, 
    'args': commandArgs
  };
}

/**
 * Load the config file and return a config dict.
 * If no config file exists, then return the default config.
 *
 * @configPath (string) the path to the config file.
 * @networkType (sring) 'mainnet', 'regtest', or 'testnet'
 */
export function loadConfig(configFile: string, networkType: string) : Object {
  if (networkType !== 'mainnet' && networkType !== 'testnet' && networkType != 'regtest') {
    throw new Error("Unregognized network")
  }

  let configData = null;
  let configRet = null;

  if (networkType === 'mainnet') {
    configRet = Object.assign({}, CONFIG_DEFAULTS);
  } else if (networkType === 'regtest') {
    configRet = Object.assign({}, CONFIG_REGTEST_DEFAULTS);
  } else {
    configRet = Object.assign({}, CONFIG_TESTNET_DEFAULTS);
  }

  try {
    configData = JSON.parse(fs.readFileSync(configFile).toString());
    Object.assign(configRet, configData);
  }
  catch (e) {
    ;
  }

  return configRet;
}

