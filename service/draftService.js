const redis = require("redis"),
    util = require('util');

require('util.promisify').shim();

const promisify = util.promisify,
    draftHashKey = 'draft';

class DraftService {

    constructor() {
        this.redisClient = redis.createClient();
        this.multi = this.redisClient.multi();
        this.hsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);
        this.hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);
        this.hvalsAsync = promisify(this.redisClient.hvals).bind(this.redisClient);
        this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    }


    /**
     * for Redis custom autoIncrement
     * @param draftId
     * @param callback
     * @returns {*}
     */

    getAutoIncrement(draftId, callback)
    {
        if ( ! draftId )
        {
            return this.getAsync('draft_ids').then((id) => {
                id = +id;
                id += 1;
                this.redisClient.set('draft_ids', id);
                return callback(id);
            });
        }

        return callback(draftId);
    }

    /**
     * create Draft
     * @param room
     * @param userId
     * @param mailBoxId
     * @param draftId
     * @param data
     * @returns {*}
     */
    addDraft( room, userId, mailBoxId, draftId, data )
    {
        return this.getAutoIncrement(draftId, (id) => {
            const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
            return this.hsetAsync(key, id, data).then(() => data);
        });
    }

    /**
     * remove draft
     * @param room
     * @param userId
     * @param mailBoxId
     * @param draftHash
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */

    removeDraft( room, userId, mailBoxId, draftHash )
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        return this.hdelAsync(key, draftHash).then(() => !!1);
    }

    /**
     * get Drafts By user id and malbox id
     * @param room
     * @param userId
     * @param mailBoxId
     */
    getDrafts(room, userId, mailBoxId)
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        this.hvalsAsync(key).then((data) => data);
    }
}

module.exports = new DraftService();