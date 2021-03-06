import * as express from 'express'
import * as _ from 'lodash'
import { data } from '../data-import/data-storage'
import { IGroup } from '../data-import/data-import'
import * as path from 'path';
import * as request from 'request';

var shipNameToImageId = require('../public/ship-name-to-image-id.json');

export let router = express.Router({ mergeParams: true });
var result: Array<IGroup> = JSON.parse(data);

router.get('/', (req: express.Request, res: express.Response) => {
    let race = findRace(result, req);

    let response = _.map(race.ships, (ship) => {
        return {
            name: ship.name,
            group: ship.group,
            race: ship.race
        };
    });

    res.json(response);
});

router.get('/:shipId', (req: express.Request, res: express.Response) => {
    let race = findRace(result, req);

    res.send(_.find(race.ships, { name: req.params.shipId }));
});

router.get('/:shipName/image', (req: express.Request, res: express.Response) => {
    request.get({ url: 'https://www.fuzzwork.co.uk/api/typeid.php?typename=' + req.params.shipName, json: true }, (error, response, body) => {
        if (body && body.typeID) {
            res.redirect(`https://image.eveonline.com/Render/${body.typeID}_512.png`);
        } else {
            res.redirect(`https://image.eveonline.com/Render/1_512.png`);
        }
    });
});

router.post('/', (req: express.Request, res: express.Response) => {
    let group = _.find(result, (group) => {
        return group.name === req.body.group;
    });

    if (!group) {
        res.status(400).end(`group ${req.body.group} not found`);
        return;
    }

    let race = _.find(group.races, (race) => {
        return race.name === req.body.race;
    });

    if (!race) {
        res.status(400).end(`race ${req.body.race} not found`);
        return;
    }

    let ship = _.find(race.ships, (ship) => {
        return ship.name === req.body.name
    });

    if (ship || !req.body.name) {
        res.status(400).end(`ship with the name ${req.body.name} already exist`);
        return;
    }

    race.ships.push(req.body);
    res.status(201).json(req.body);
});

router.put('/', (req: express.Request, res: express.Response) => {
    let group = _.find(result, (group) => {
        return group.name === req.body.group;
    });

    if (!group) {
        res.status(400).end(`group ${req.body.group} not found`);
        return;
    }

    let race = _.find(group.races, (race) => {
        return race.name === req.body.race;
    });

    if (!race) {
        res.status(400).end(`race ${req.body.race} not found`);
        return;
    }

    let ship = _.find(race.ships, (ship) => {
        return ship.name === req.body.name
    });
    if (!ship) {
        res.status(400).end(`ship with the name ${req.body.name} not found`);
        return;
    }

    _.remove(race.ships, ship);
    race.ships.push(req.body);

    res.status(204).end();
});

function findRace(result, req) {
    let races = _.find(result, (group: IGroup) => {
        return group.name === req.params.groupId;
    }).races;

    return _.find(races, (race) => {
        return race.name === req.params.raceId;
    });
}

export const shipUpdateRouter = express.Router();
router.use('/', shipUpdateRouter);