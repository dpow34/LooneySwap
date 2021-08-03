module.exports = function(){
    const express = require('express');
    const router = express.Router();
    const {Datastore} = require('@google-cloud/datastore');

    const datastore = new Datastore();

    const USERS = "Users";
    const TXNS = "Txns";
    
    const NUM_PER_PAGE = 10;

    const fromDatastore = function (item){
        item.id = item[Datastore.KEY].name;
        return item;
    }

    /* ------------- Model Functions ------------- */
    const post_user = async function (address){
        const key = datastore.key([USERS, address.toLowerCase()]);
        await datastore.save({ "key": key, "data": {}});
        return key;
    }
    
    const get_users = async function (){
        let q = datastore.createQuery(USERS);
        let entities = await datastore.runQuery(q);
        entities = entities[0].map(fromDatastore);
        return entities;
    }

    const get_user_txns = async function (req){
        let q = datastore.createQuery(TXNS).filter('owner', req.params.address.toLowerCase()).order('timeStamp', {
            descending: true
          });
        const results = {};
        if(Object.keys(req.query).includes("cursor")) {
            q = q.start(req.query.cursor);
        }
        const entities = await datastore.runQuery(q);
        results.results = entities[0].map(fromDatastore);
        if(entities[1].moreResults != Datastore.NO_MORE_RESULTS){
            results.next = `${req.protocol}://${req.get("host")}${req.baseUrl}?cursor=${entities[1].endCursor}`
        }
        return results;
    }

    /* ------------- Controller Functions ------------- */
    router.get('/', async function(req, res){
        const users = await get_users()
        res.status(200).json(users);
    });

    router.post('/', async function(req, res){
        if(req.body.address){
            const key = datastore.key([USERS, req.body.address.toLowerCase()]);
            datastore.get(key, async (err, entity) => {
                if(!entity) {
                    const key = await post_user(req.body.address.toLowerCase())
                    datastore.get(key, async (err, entity) => {
                        if(!entity) {
                            console.log(`Error getting created user: ${key.id}`);
                        } else {
                            entity = fromDatastore(entity);
                            res.status(201).send(entity);
                        }
                    });
                } else {
                    res.status(404).send(JSON.parse('{"Error": "A user with this address already exists"}'));
                }
            });
        } else {
            res.status(400).send(JSON.parse('{"Error": "The request object is missing an address"}'));
        }
    });

    router.get('/:address', async function(req, res){
        const key = datastore.key([USERS, req.params.address.toLowerCase()]);
        datastore.get(key, async (err, entity) => {
            if(!entity) {
                res.status(404).send(JSON.parse('{"Error": "No user with this address exists"}'));
            } else {
                entity = fromDatastore(entity);
                entity.txns = await get_user_txns(req);
                res.status(200).send(entity);
            }
        });
    });

    router.get('/:address/txns', async function(req, res){
        const key = datastore.key([USERS, req.params.address.toLowerCase()]);
        datastore.get(key, async (err, entity) => {
            if(!entity) {
                res.status(404).send(JSON.parse('{"Error": "No user with this address exists"}'));
            } else {
                txns = await get_user_txns(req);
                res.status(200).send(txns);
            }
        });
    });

    return router;
}();