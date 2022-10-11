import mysql from 'mysql';
import { getCredentials } from '../config/config';
// import {CREDS} from "../api";

let pools = {};
let connected = {};

let CREDS = getCredentials();
function connectWhenNeeded(config) {
    const connectionLimit = config.connectionLimit || 1;
    const connectTimeout = config.connectTimeout || 30 * 1000;
    const queryTimeout = config.queryTimeout || 60 * 30 * 1000; // long
    const acquireTimeout = config.acquireTimeout || 30 * 1000;
    let type = config && config.useReader ? 'reader' : 'writer';

    // const useDb = CREDS.MYSQL_CONFIG.database[0];

    // pools[type] = mysql.createPool({
    //     connectionLimit: connectionLimit || 1,
    //     host: useDb.host,
    //     user: useDb.user,
    //     password: useDb.password,
    //     database: useDb.database,
    //     typeCast: true,
    //     supportBigNumbers: true,
    //     multipleStatements: true,
    //     connectTimeout: connectTimeout,
    //     acquireTimeout: acquireTimeout,
    //     timeout: queryTimeout,
    //     charset: 'utf8mb4',
    // });

    pools[type] = mysql.createPool(CREDS.AURORA_DATABASE_URL);
    connected[type] = true;

    pools[type].on('error', function (err) {
        console.log('err code', err.code);
        console.error(err);
        //console.log('Database disconnect, restarting in 2 seconds');
        setTimeout(function () {
            if (err && err.code && err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('FORCE EXIT FROM connection timeout 30 seconds without activity');
                process.exit(1);
            }
        }, 2000);
    });
}

let batchQueue = function () {
    this.batchQueue = [];
    return this;
};

let DB = function (config) {
    this.useReader = config && config.useReader;
    this.forceWriter = config && config.forceWriter;
    this.connectionLimit = config.connectionLimit || 2;
    this.queryTimeout = config.queryTimeout || 60 * 30 * 1000; // long
    return this;
};

DB.prototype.update = function (table, pairs, where) {
    if (!where) {
        console.warn('DB.update missing a WHERE property');
    }
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: false,
    });
    //@ts-ignore
    const pool = pools.writer;
    return new Promise((resolve, reject) => {
        let args = [pairs];
        if (where) {
            where = 'WHERE ' + where;
        } else {
            where = '';
        }
        pool.query('UPDATE ' + table + ' SET ? ' + where, args, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

DB.prototype.insert = function (table, pairs, dupFlag, dupNoKeys) {
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: false,
    });
    //@ts-ignore
    const pool = pools.writer;
    let dup = dupFlag ? ' ON DUPLICATE KEY UPDATE ?' : '';
    return new Promise((resolve, reject) => {
        let pairs2 = pairs;
        if (dupNoKeys && dupNoKeys.length) {
            pairs2 = JSON.parse(JSON.stringify(pairs));
            dupNoKeys.forEach((key) => {
                delete pairs2[key];
            });
        }
        pool.query('INSERT INTO ' + table + ' SET ?' + dup, [pairs, pairs2], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results.insertId);
            }
        });
    });
};
DB.prototype.insertIgnore = function (table, pairs) {
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: false,
    });
    //@ts-ignore
    const pool = pools.writer;
    return new Promise((resolve, reject) => {
        pool.query('INSERT IGNORE INTO ' + table + ' SET ?', [pairs], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results.insertId);
            }
        });
    });
};

DB.prototype.delete = function (table, where, args) {
    if (where) {
        where = 'WHERE ' + where;
    } else {
        where = '';
    }
    if (where && where.indexOf('id =') > -1) {
        connectWhenNeeded({
            connectionLimit: this.connectionLimit,
            queryTimeout: this.queryTimeout,
            useReader: this.useReader || false,
        });
        //@ts-ignore
        const pool = pools.writer;
        return new Promise((resolve, reject) => {
            pool.query('DELETE FROM ' + table + ' ' + where, args || [], (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } else {
        console.error('failed delete: requires an id in query');
    }
};

DB.prototype.query = function (query, args) {
    // attempt to auto detect if a reader or writer node is needed
    let chk = (query || '').trim().slice(0, 14).toUpperCase();
    if (!this.useReader && !this.forceWriter) {
        this.useReader = chk.indexOf('SELECT ') > -1;
    }
    //console.log('chk', '*', chk, '*', chk.indexOf('REPLACE INTO'))
    if (
        chk.indexOf('DELETE') > -1 ||
        chk.indexOf('UPDATE') > -1 ||
        chk.indexOf('INSERT') > -1 ||
        chk.indexOf('REPLACE INTO') > -1
    ) {
        //console.log('no reader')
        this.useReader = false;
    }

    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: this.useReader || false,
    });

    //@ts-ignore
    const pool = this.useReader ? pools.reader : pools.writer;
    return new Promise((resolve, reject) => {
        pool.query(query, args, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

DB.prototype.batch = function (config) {
    if (typeof config !== 'object') {
        config = {};
    }
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: false,
    });
    //@ts-ignore
    const pool = pools.writer;
    //@ts-ignore
    let self = new batchQueue();

    self.insert = function (table, pairs, dupFlag) {
        let dup = dupFlag ? ' ON DUPLICATE KEY UPDATE ?' : '';
        let args = dupFlag ? [pairs, pairs] : [pairs];
        self.batchQueue.push(mysql.format('INSERT INTO ' + table + ' SET ?' + dup, args));
    };
    self.insertIgnore = function (table, pairs, dupFlag) {
        let dup = dupFlag ? ' ON DUPLICATE KEY UPDATE ?' : '';
        let args = dupFlag ? [pairs, pairs] : [pairs];
        self.batchQueue.push(mysql.format('INSERT IGNORE INTO ' + table + ' SET ?' + dup, args));
    };
    self.insertReplace = function (table, pairs) {
        self.batchQueue.push(mysql.format('REPLACE INTO ' + table + ' SET ?', pairs));
    };
    self.update = function (table, pairs, where) {
        let args = [pairs];
        if (where) {
            where = 'WHERE ' + where;
        } else {
            where = '';
        }
        self.batchQueue.push(mysql.format('UPDATE ' + table + ' SET ? ' + where, args));
    };
    self.delete = function (table, where, args) {
        if (where) {
            where = 'WHERE ' + where;
        } else {
            where = '';
        }
        if (where && where.indexOf('id =') > -1) {
            self.batchQueue.push(mysql.format('DELETE FROM ' + table + ' ' + where, args || []));
        } else {
            console.error('failed to batch a delete it requires an id in query');
        }
    };
    self.query = function (query, args) {
        self.batchQueue.push(mysql.format(query, args || []));
    };

    self.execute = function () {
        let n = config.batchSize || 100;
        return new Promise((resolve, reject) => {
            let loops = Math.ceil(self.batchQueue.length / n);
            let errors = false;
            let writes = 0;
            let out = 0,
                done = 0,
                complete = function () {
                    done++;
                    if (out === done) {
                        if (self.debug) {
                            console.log('batch executed', writes, 'writes');
                        }
                        resolve(!errors);
                    }
                };
            if (loops) {
                for (let i = 0; i < loops; i++) {
                    out++;
                    (function (i) {
                        let statements = '';
                        let ns = 0;
                        self.batchQueue.slice(i * n, i * n + n).forEach((statement) => {
                            statements += statement + ';';
                            ns++;
                            writes++;
                        });
                        pool.query(statements, (error, results, fields) => {
                            if (error) {
                                console.error(error);
                                reject(error);
                                errors = true;
                            } else {
                                if (self.debug) {
                                    if (i % 100 === 0) {
                                        console.log(
                                            'completed aurora batch execution',
                                            i,
                                            (i + 1) * n,
                                            'items',
                                            'of',
                                            loops * n,
                                            ns,
                                            'statements'
                                        );
                                    }
                                }
                                complete();
                            }
                        });
                    })(i);
                }
            } else {
                console.log('empty batch queue resolved');
                resolve(true);
            }
        });
    };
    return self;
};

function ago(last) {
    last = Math.round(last / 1000);
    let time = Math.round(Date.now() / 1000) - last;
    if (!last) {
        return 'n/a';
    } else if (time > 60 * 60 * 24 * 3) {
        return Math.round(time / (60 * 60 * 24)) + ' days';
    } else if (time > 60 * 60 * 3) {
        return Math.round(time / (60 * 60)) + ' hours';
    } else if (time > 60 * 3) {
        return Math.round(time / 60) + ' minutes';
    } else {
        return time + ' seconds';
    }
}

DB.prototype.fastBatch = function (config) {
    if (typeof config !== 'object') {
        config = {};
    }
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: false,
    });
    //@ts-ignore
    const pool = pools.writer;

    //@ts-ignore
    let self = new batchQueue();

    self.query = (query, args) => {
        return new Promise((resolve, reject) => {
            pool.query(query, args, (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    };

    const allowedTypes = ['INSERT', 'INSERT IGNORE', 'REPLACE INTO', 'UPDATE'];
    if (!config.table) {
        throw new Error('table required for fast batch');
    }
    if (allowedTypes.indexOf(config.type) < 0) {
        throw new Error('type required for fast batch');
    }

    self.keyMapSet = new Set();
    self.keyMap = [];
    self.initialKeyMap = false;

    self.add = function (pairs) {
        if (!self.initialKeyMap) {
            Object.keys(pairs).forEach((key, i) => {
                self.keyMapSet.add(key);
                self.initialKeyMap = true;
            });
            self.keyMap = Array.from(self.keyMapSet);
            //console.log(self.keyMap)
        }
        self.batchQueue.push(self.keyMap.map((key) => pairs[key]));
    };

    if (config.type === 'INSERT' || config.type === 'INSERT IGNORE' || config.type === 'REPLACE INTO') {
        self.prepare = (args) => {
            //console.log({ args })
            return `${config.type} ${config.table} (\`${self.keyMap.join('`,`')}\`) VALUES ${args
                .map((row) => {
                    return `(${mysql.format('?', [row])})`;
                })
                .join(',')}`;
        };
    }

    self.estCompleted = (started, loopTimes, i, loops) => {
        loopTimes.forEach((time) => {});
    };

    self.execute = async function () {
        let started = Date.now();
        let durations = [];
        let last_executed = started * 1;

        let n = config.batchSize || 100;
        let loops = Math.ceil(self.batchQueue.length / n);
        let total = self.batchQueue.length;
        let errors = false;
        let writes = 0;

        if (loops) {
            for (let i = 0; i < loops; i++) {
                let rows = self.batchQueue.splice(0, n);
                //console.log(rows)
                //console.log(self.prepare(rows))
                await self.query(self.prepare(rows));
                rows = null;
                let now = Date.now();
                durations.push(now - last_executed);
                let avg_duration = durations.reduce((a, b) => a + b) / durations.length;
                if (i % (loops / 10) === 0 || i % 100 === 0 || self.debug) {
                    console.log(
                        'completed aurora fast batch execution',
                        i,
                        'of',
                        loops,
                        'loops',
                        'records',
                        i * n,
                        'to',
                        (i + 1) * n,
                        'of',
                        total,
                        'total',
                        'elapsed time',
                        ago(started),
                        'avg time',
                        avg_duration + 'ms',
                        Math.round(avg_duration / 1000) + 's',
                        'est complete in',
                        ago(now - avg_duration * (loops - i))
                    );
                }
                last_executed = now * 1;
            }
            self.batchQueue = [];
            console.log('completed', total, 'fast batch items');
        } else {
            console.log('empty fast batch queue resolved');
        }
    };
    return self;
};

DB.prototype.select = function (table, fields, where, args) {
    connectWhenNeeded({
        connectionLimit: this.connectionLimit,
        queryTimeout: this.queryTimeout,
        useReader: this.useReader || false,
    });
    //@ts-ignore
    const pool = pools.reader || pools.writer;
    if (!Array.isArray(args)) {
        args = [];
    }
    if (!where) {
        where = '';
    } else {
        where = ' WHERE ' + where;
    }
    return new Promise((resolve, reject) => {
        pool.query('SELECT ' + fields + ' FROM ' + table + where, args, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

DB.prototype.escape = function (string) {
    return mysql.escape(string);
};

export default function aurora(config = {}) {
    //@ts-ignore
    return new DB(config);
}
