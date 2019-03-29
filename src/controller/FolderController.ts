import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Folder} from "../entity/Folder";
import * as fs from "fs";
import * as path from "path";
import {FoldersSchema, IndificateNumber, RenameFolder} from "../checks/CheckCreateFolder";
const Joi = require('joi');
import * as rimraf from "rimraf";
import { ClientResponse } from "http";


export class FolderController {
    
    private folderRepository = getRepository(Folder);

    private storage = "./../db/";

    async mkdir(pathstr: String, root) {

        var dirs = pathstr.split('/');
        var dir = dirs.shift();
        root = (root || '') + dir + "/";
        try {
            if(!fs.existsSync(root)){
                fs.mkdirSync(root);
                const folder = new Folder();
                folder.folderName = root.split('/').slice(1,-1).join('/');
                folder.status = "Created";
                folder.files = [];
                this.folderRepository.save(folder);
            }
        }
        catch (e) {
            if(!fs.statSync(root).isDirectory()) throw new Error(e);
        }
        return !dirs.length || this.mkdir(dirs.join('/'), root);
    }

    async allFoldersRootDirectory(request: Request, response: Response, next: NextFunction) {
        return this.folderRepository.find();
    }

    async saveAndCreateFolders(request: Request, response: Response, next: NextFunction) {
        if(!request.query.hasOwnProperty('folderName')){
            response.json({
                status: 'error',
                message: 'Invalid property name'
            })
        } else {
            request.query.folderName = request.query.folderName.split('/');
            Joi.validate(request.query, FoldersSchema, (err, value) => {
                if (err) {
                    response.status(422).json({
                        status: 'error',
                        message: 'Invalid request data',
                        data: request.query
                    });
                } else {
                    request.query.folderName = request.query.folderName.join('/');
                    const url = path.posix.join(__dirname,this.storage + request.query.folderName);
                    this.mkdir(url,'');
                    response.json({
                        status: 'success',
                        message: 'Folder(s) is created',
                        data: value
                    });
                }
            })
        }
    }

    async removeFolders(request: Request, response: Response, next: NextFunction) {
        if(!request.query.hasOwnProperty('folderName')){
            response.json({
                status: 'error',
                message: 'Invalid property name'
            })
        } else {
            request.query.folderName = request.query.folderName.split('/');
            Joi.validate(request.query, FoldersSchema, (err, value) => {
                if (err) {
                    response.status(422).json({
                        status: 'error',
                        message: 'Invalid request data',
                        data: request.query
                    });
                } else {
                    request.query.folderName = request.query.folderName.join('/');
                    const url = path.posix.join(__dirname,this.storage + request.query.folderName);
                    rimraf(url, function(err) {
                        if(err){
                            response.json({
                                status: 'error',
                                message: 'Error delete',
                            });
                        };
                    });
                    let deleteString: string = request.query.folderName;
                    this.folderRepository.find({folderName: deleteString})
                        .then((folder) => {
                            if (folder.length == 0){
                                response.json({
                                    status: 'error',
                                    message: 'Folder not found',
                                });
                            } else {
                                this.folderRepository.remove(folder)
                                    .then(() => {
                                        response.json({
                                            status: 'success',
                                            message: 'Delete successfuly',
                                        });
                                    });
                            }
                        })
                        .catch((err) => {
                            response.json({
                                status: 'error',
                                err: err
                            });
                        })
                }
            })
        }
    }


    async getFoldersInFirstLevel(request: Request, response: Response, next: NextFunction){
        
        let arrFoldersInFirstLvl = [];
        this.folderRepository.find()
            .then(folders => {
                for(let elem of folders){
                    let folderLength = elem.folderName.split('/').length;
                    if( 2 == folderLength){
                        arrFoldersInFirstLvl.push(elem);
                    }
                }
                if(arrFoldersInFirstLvl.length == 0){
                    response.status(403).json({
                        status: 'error',
                        message: 'Folder is empty'
                    })
                } else {
                    response.status(200).json({
                        arrFoldersInFirstLvl
                    })
                }
        })
    }

    async getFoldersWithIndentidications (request: Request, response: Response, next: NextFunction){

        if((!request.query.hasOwnProperty('folderName'))&& (!request.query.hasOwnProperty('indificateNum'))){
            response.json({
                status: 'error',
                message: 'Invalid property name'
            })
        } else {
            request.query.folderName = request.query.folderName.split('/');
            request.query.indificateNum = Number(request.query.indificateNum);
            Joi.validate(request.query, IndificateNumber, (err, value) => {
                if (err) {
                    response.status(422).json({
                        status: 'error',
                        message: 'Invalid request data',
                        data: request.query
                    });
                } else {
                    request.query.folderName = request.query.folderName.join('/');
                    let arrFoldersInCyclomaty = [];
                    this.folderRepository.find()
                        .then(folders => {
                            for(let elem of folders){
                                if((elem.folderName.indexOf(request.query.folderName) !== -1) && (elem.folderName.indexOf(request.query.folderName) == 0)){
                                    let folderLength = elem.folderName.split('/').length;
                                    let requestLength = request.query.folderName.split('/').length;
                                    if(folderLength == requestLength + request.query.indificateNum){
                                        arrFoldersInCyclomaty.push(elem);
                                    }
                                }
                            }
                            if(arrFoldersInCyclomaty.length == 0){
                                response.status(403).json({
                                    status: 'error',
                                    message: 'Folder doesn\'t have cyclomaty'
                                })
                            } else {
                                response.status(200).json({
                                    arrFoldersInCyclomaty
                                })
                            }
                        })
                }
            })    
        }
    }

    async renameFolder (request: Request, response: Response, next: NextFunction){
        
        if((!request.query.hasOwnProperty('folderName')) && (!request.query.hasOwnProperty('newName'))){
            response.json({
                status: 'error',
                message: 'Invalid property name'
            })
        } else {
            request.query.folderName = request.query.folderName.split('/');
            Joi.validate(request.query, RenameFolder, (err, value) => {
                if (err) {
                    response.status(422).json({
                        status: 'error',
                        message: 'Invalid request data',
                        data: request.query
                    });
                } else {
                    request.query.folderName = request.query.folderName.join('/');
                    const url = path.posix.join(__dirname,this.storage + request.query.folderName);
                    this.folderRepository.find()
                        .then(folders => {
                            for(let elem of folders){
                                if((elem.folderName.indexOf(request.query.folderName) !== -1) && (elem.folderName.indexOf(request.query.folderName) == 0)){
                                    let folderLength = elem.folderName.split('/').length;
                                    let requestLength = request.query.folderName.split('/').length;
                                    if(folderLength == requestLength){
                                        let folderName = elem.folderName.split('/').slice();
                                        folderName.pop();
                                        folderName.push(request.query.newName);
                                        const newUrl = path.posix.join(__dirname,this.storage + folderName.join('/'));
                                        if(fs.existsSync(url)){
                                            fs.renameSync(url, newUrl);
                                            elem.folderName = folderName.join('/');
                                            response.status(200).json({
                                                status: 'success',
                                                message: 'Folder renamed'
                                            });
                                        } else {
                                            response.status(422).json({
                                                status: 'error',
                                                message: 'Folder doesn\'t exist'
                                            });
                                        }
                                    }
                                    if(folderLength > requestLength){
                                        let oldName = request.query.folderName.split('/').pop();
                                        let arrFolders = elem.folderName.split('/').slice();
                                        let newArrFolders = arrFolders.map((value) => {
                                            if(value == oldName)
                                                value = request.query.newName;
                                        })
                                    }
                                }
                            };
                            
                        })
                }
            })    
        }

    }

    

}