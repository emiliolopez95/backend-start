import qs from 'querystring';
import fetch from 'node-fetch';
import { number, object, string, z, ZodError } from 'zod';
import crypto from 'crypto';
// import { usePrisma } from '../api';
import { Console } from 'console';
const roundTo = {
    Minute: function (date) {
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    MinuteEnd: function (date) {
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
    Hour: function (date) {
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    HourEnd: function (date) {
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
    Day: function (date) {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    DayEnd: function (date) {
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
    Week: function (date) {
        var dow = date.getDay();
        date.setDate(date.getDate() - dow);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    WeekEnd: function (date) {
        var dow = date.getDay();
        date.setDate(date.getDate() - dow + 6);
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
    Month: function (date) {
        date.setDate(1);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    MonthEnd: function (date) {
        date.setDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
    Year: function (date) {
        date.setMonth(1);
        date.setDate(1);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.round(date.getTime() / 1000);
    },
    YearEnd: function (date) {
        date.setMonth(12);
        date.setDate(31);
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return Math.round(date.getTime() / 1000);
    },
};

function timerLog(config = {}) {
    var self = this;
    this.keys = {};
    this.mark = function (key) {
        if (!self.keys[key]) {
            self.keys[key] = {
                started: Date.now(),
            };
            console.log(key, 'started');
        } else {
            self.keys[key].complete = Date.now();
            self.keys[key].duration = duration((self.keys[key].complete - self.keys[key].started) / 1000);
            console.log(key, 'done in', self.keys[key].duration);
        }
        return self;
    };
    self.status = setInterval(() => {
        let waitingOn = Object.keys(self.keys)
            .filter((key) => !self.keys[key].complete)
            .map((key) => `${key} (${duration((Date.now() - self.keys[key].started) / 1000)})`)
            .join(',');
        if (waitingOn) {
            console.log('waiting on', waitingOn);
        } else {
            clearInterval(self.status);
        }
    }, 10000);
    this.summary = () => {
        Object.keys(self.keys).forEach((key) => {
            console.log('key', key, 'took', self.keys[key].duration);
        });
        clearInterval(self.status);
    };
    return this;
}

function timerSimple() {
    var self = this;
    this.mark = function () {
        if (!self.started) {
            self.started = Date.now();
        } else {
            self.complete = Date.now();
            self.duration = duration((self.complete - self.started) / 1000);
        }
        return self;
    };
    return this;
}

function ago(last) {
    var time = Math.round(Date.now() / 1000) - last;
    if (!last) {
        return 'n/a';
    } else if (time > 60 * 60 * 24 * 3) {
        return Math.round(time / (60 * 60 * 24)) + 'd';
    } else if (time > 60 * 60 * 3) {
        return Math.round(time / (60 * 60)) + 'h';
    } else if (time > 60 * 3) {
        return Math.round(time / 60) + 'm';
    } else {
        return time + 's';
    }
}

function duration(seconds) {
    if (seconds > 60 * 60 * 24 * 3) {
        return Math.round(seconds / (60 * 60 * 24)) + 'd';
    } else if (seconds > 60 * 60 * 3) {
        return Math.round(seconds / (60 * 60)) + 'h';
    } else if (seconds > 60 * 3) {
        return Math.round(seconds / 60) + 'm';
    } else {
        return seconds + 's';
    }
}

function delay(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('');
        }, seconds * 1000);
    });
}
function pad(n) {
    return n < 10 ? '0' + n : n;
}
function urlSafe(str) {
    return (str || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9\-.]/gi, '-')
        .replace(/--/g, '-')
        .replace(/--/g, '-')
        .replace(/-$/, '');
}

function objetEqual(object1, object2, ignoreKeys, onlyKeys) {
    if (!object1 && !object2) {
        return true;
    }

    if (!object1 || !object2) {
        return false;
    }

    let obj1 = { ...object1 };
    let obj2 = { ...object2 };

    if (ignoreKeys && ignoreKeys.length) {
        ignoreKeys.forEach((key) => {
            delete obj1[key];
            delete obj2[key];
        });
    }

    if (onlyKeys && onlyKeys.length) {
        Object.keys(obj1).forEach((key) => {
            if (onlyKeys.indexOf(key) < 0) {
                delete obj1[key];
            }
        });

        Object.keys(obj2).forEach((key) => {
            if (onlyKeys.indexOf(key) < 0) {
                delete obj2[key];
            }
        });
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (obj1[key] != obj2[key]) {
            return false;
        }
    }
    return true;
}
export async function helloWorld() {
    console.log('HELLO WORLD!');
}
export async function promiseConcurrentChunks({
    arrayOfInputs,
    func,
    perChunk,
    minSeconds,
    useDelay,
    chunkFinally,
    verbose,
}) {
    console.log('CONCURRENT BATCH');
    let array = arrayOfInputs.map((input) => {
        let p = () => func(input);
        return p;
    });

    let chunks = getArrayChunks({ array: array, perChunk: perChunk });

    let allResponses = [];
    for (let [i, chunk] of chunks.entries()) {
        let startMs = new Date().getTime();
        let responses = await Promise.all(
            chunk.map(async (func) => {
                await (() => func())();
            })
        );
        allResponses = [...allResponses, ...responses];
        if (chunkFinally) {
            await chunkFinally();
        }
        let actualMs;
        let msPassed;
        let actualMsUpdated = false;
        while (true) {
            let finishMs = new Date().getTime();
            msPassed = finishMs - startMs;
            if (!actualMsUpdated) {
                actualMs = msPassed;
                actualMsUpdated = true;
            }
            if (msPassed < minSeconds * 1000) {
                await delay(minSeconds / 10);
            } else {
                break;
            }
        }

        if (useDelay) {
            await delay(useDelay);
        }

        if (verbose) {
            console.log(
                `Actual time: ${actualMs / 1000}s, Total time: ${msPassed / 1000}s Handled ${i + 1}/${
                    chunks.length
                } chunks,  ${(i + 1) * perChunk}/${chunks.length * perChunk} items. ${
                    Math.round(((i + 1) / chunks.length) * 100 * 100) / 100 + '%'
                }`
            );
        }
    }
}

const promiseConcurrent = async (queue, concurrency, verbose) => {
    let total = queue.length * 1;
    let handled = 0;
    let index = 0;
    const results = [];

    const execThread = async () => {
        while (index < queue.length) {
            const curIndex = index++;
            // Use of `curIndex` is important because `index` may change after await is resolved
            results[curIndex] = await queue[curIndex]();
            handled++;
            if (verbose) {
                console.log(
                    'promise handled',
                    handled,
                    'of',
                    total,
                    Math.round((handled / total) * 100 * 100) / 100 + '%'
                );
            }
        }
    };

    // Start threads
    const threads = [];
    for (let thread = 0; thread < concurrency; thread++) {
        threads.push(execThread());
    }
    await Promise.all(threads);
    return results;
};

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getSum(acc, currVal) {
    return acc + Math.abs(currVal);
}

let getAvg = (array) => {
    return array.reduce(getSum, 0) / array.length;
};

let getStd = (array, avg) => {
    let variance =
        array.map((i) => Math.pow(Math.abs(i) - avg, 2)).reduce((acc, currVal) => acc + currVal, 0) /
        (array.length - 1);
    return Math.sqrt(variance);
};

function getArrayChunks({ array, perChunk }) {
    let resultsChunks = array.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / perChunk);

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
        }

        resultArray[chunkIndex].push(item);

        return resultArray;
    }, []);
    return resultsChunks;
}

function daysBetween(from = 0, timestamp = 0) {
    if (!from) {
        from = Math.round(Date.now() / 1000);
    }
    if (from >= timestamp) {
        return 0;
    }
    return Math.round((timestamp - from) / (60 * 60 * 24));
}

async function apiRequest(data) {
    data.key = 'lunar_api_v2_ops_key';
    let querystring = qs.stringify(data);
    let url = `https://api.lunarcrush.com/v2/assets?${querystring}`;
    console.log('url', url);
    const response = await fetch(url).then((res) => res.json());
    return response;
}

function anyInputToDate(dateOrUnixTime) {
    const type = typeof dateOrUnixTime;
    //@ts-ignore
    const type2 = typeof dateOrUnixTime * 1;
    //
    let date = dateOrUnixTime;
    //@ts-ignore
    if (type === 'number' || type2 === 'number' || type === 'string') {
        //@ts-ignore
        if (type === 'string' && type2 === 'number') {
            // possibly a string date e.g. 2021-02-01 00:00:00
            date = new Date(dateOrUnixTime);
        } else if (type === 'string' && isNaN(dateOrUnixTime)) {
            // possibly a formatted date
            date = new Date(dateOrUnixTime);
        } else if (dateOrUnixTime > 10000000000) {
            // probably miliseconds
            date = new Date(dateOrUnixTime);
        } else {
            // unixtime
            date = new Date(dateOrUnixTime * 1000);
        }
    }
    if (!(date instanceof Date)) {
        //console.warn('could not turn', dateOrUnixTime, 'into date')
        return '';
    }
    return date;
}

function num(num) {
    //@ts-ignore
    return (((num || '') + '').replace(/[^0-9.-]/gi, '') || 0) * 1;
}

function tableLimits({ config, defaultLimit = 20, maxLimit = 100 }) {
    let limit = num(config.limit) || defaultLimit;
    if (limit > maxLimit) {
        limit = maxLimit;
    }
    const page = num(config.page) || 1;

    return {
        limit,
        page,
    };
}

function limitsQuery({ config }) {
    let { limit, page } = tableLimits({ config });
    let q = `LIMIT ${(page - 1) * limit}, ${limit}`;
    return q;
}

function parseAirtableTime(airtabletime) {
    let parts = airtabletime.split(' ');
    let partsDate = parts[0].split('/');
    let date = `${partsDate[1]}/${partsDate[0]}/${partsDate[2]} ${parts[1]}`;
    // @ts-ignore
    let useDate = Math.floor(new Date(date) / 1000);
    return useDate;
}

const time = {
    anyInputToDate,
    ISODateString: function (d) {
        return (
            d.getUTCFullYear() +
            '-' +
            pad(d.getUTCMonth() + 1) +
            '-' +
            pad(d.getUTCDate()) +
            'T' +
            pad(d.getUTCHours()) +
            ':' +
            pad(d.getUTCMinutes()) +
            ':' +
            pad(d.getUTCSeconds()) +
            'Z'
        );
    },
    tinyTimeStamp: function (d) {
        return (
            d.getUTCFullYear() +
            '-' +
            pad(d.getUTCMonth() + 1) +
            '-' +
            pad(d.getUTCDate()) +
            ' ' +
            pad(d.getUTCHours()) +
            ':' +
            pad(d.getUTCMinutes()) +
            ':' +
            pad(d.getUTCSeconds())
        );
    },
    roundTo: roundTo,
    nowSeconds: function () {
        return Math.round(Date.now() / 1000);
    },
    duration,
    ago,
    daysBetween,
    parseAirtableTime,
};
let time_map = {
    '1d': 60 * 60 * 24,
    '1w': 60 * 60 * 24 * 7,
    '1m': 60 * 60 * 24 * 30,
    '3m': 60 * 60 * 24 * 90,
    '6m': 60 * 60 * 24 * 180,
    '1y': 60 * 60 * 24 * 365,
    '2y': 60 * 60 * 24 * 365,
    all: 0,
};

//@ts-ignore
time.intervalToUnixTime = function (interval) {
    let _time = time_map[interval] ? time.roundTo.Hour(new Date((time.nowSeconds() - time_map[interval]) * 1000)) : 0;
    return _time;
};

const TIMEOUT = 'TIMEOUT';
const onTimeout = async (seconds) => {
    await delay(seconds);
    return TIMEOUT;
};

async function throwOnTimeout({ func, timeout }) {
    let promises = [func, () => onTimeout(timeout)];
    let res = await Promise.race(
        promises.map(async (func) => {
            return await (() => func())();
        })
    );
    if (res == TIMEOUT) {
        throw new Error('TIMEOUT!');
    } else {
        return res;
    }
}

function isPositiveInt(num, includeZero = false) {
    if (isInt(num)) {
        let integer = Number.parseInt(num);
        let useCompare = includeZero ? -1 : 0;
        let isPositive = integer > useCompare;
        return isPositive;
    }
}

function isInt(num) {
    let isInt = Number.isInteger(+num);
    return isInt;
}

export let zValidNumber = z.number().or(z.string().regex(/^\d+$/).transform(Number));

export function getSearchQuery({ searchArray, search }) {
    let useSearch = `'${search}'`.substring(1).slice(0, -1);
    let searchQuery = '(\n';
    searchArray.forEach((item, i) => {
        let isFirst = i === 0;
        let isLast = i === searchArray.length - 1;

        if (!isFirst) {
            searchQuery = ` ${searchQuery} OR `;
        }
        searchQuery = ` ${searchQuery} ${item} LIKE '%${useSearch}%'`;
        if (isLast) {
            searchQuery = `${searchQuery}\n)`;
        }
        searchQuery = `${searchQuery}`;
    });
    return searchQuery;
}

export default {
    urlSafe,
    delay,
    isInt,
    isPositiveInt,
    number: function (num) {
        if (typeof num !== 'number') {
            //@ts-ignore
            return (((num || '') + '').replace(/[^0-9.-]/gi, '') || 0) * 1;
        } else {
            return num;
        }
    },
    timerLog,
    time,
    array: {
        getAvg,
        getStd,
    },
    objetEqual,
    randomIntFromInterval,
    getArrayChunks,
    promiseConcurrent,
    // promiseConcurrentChunks,
    apiRequest,
    timerSimple,
    limitsQuery,
    tableLimits,
    num,
    throwOnTimeout,
};
