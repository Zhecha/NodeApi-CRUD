import "reflect-metadata";
import {createConnection, Any} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import {File} from "./entity/File";
import {Folder} from "./entity/Folder";
import {config} from "../config/config";

createConnection({
    type: "postgres",
    host: config.host,
    port: config.portDB,
    username: config.usernameDB,
    password: config.passwordDB,
    database: config.database,
    entities: [
        __dirname + "/entity/*.ts"
    ],
    synchronize: true,
    logging: false

}).then(async connection => {

    const app = express();
    app.use(bodyParser.json());

    Routes.forEach(route => {
        (app as any)[route.method](route.route,(req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });

    app.listen(config.port);

    console.log("Express server has started on port 3000");

}).catch(error => console.log(error));
