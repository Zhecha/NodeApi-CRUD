import {getRepository, Index} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Folder} from "../entity/Folder";
import * as fs from "fs";
import * as path from "path";
import {checkFoldersSchema, checkSortResources, checkRenameFolder, checkExpandResources, checkLimit, checkOffset} from '../checks/Validate';
import { File } from "../entity/File";
const Joi = require('joi');
import {config} from "../../config/config";


export class FolderController {
    
    private folderRepository = getRepository(Folder);
    private fileRepository = getRepository(File);

    async mkdir(pathstr: String, root) {

        var dirs = pathstr.split('/');
        var dir = dirs.shift();
        root = (root || '') + dir + "/";
        const folder = await this.folderRepository.findOne({folderName: root.slice(0,root.length-1)})
        try {
            if( folder === undefined ) {
                const folder = new Folder();
                folder.folderName = root.slice(0,root.length-1);
                folder.status = "Created";
                folder.date = Date.now().toLocaleString();
                this.folderRepository.save(folder);
            }
        }
        catch (e) {
            return new Error(e);
        }
        return !dirs.length || this.mkdir(dirs.join('/'), root);
    }

    async readFolders(request: Request, response: Response, next: NextFunction) {
        let offsetObj = {offset: 0};
        let limitObj = {limit: 0};
        offsetObj.offset = Number(request.query.offset);
        limitObj.limit = Number(request.query.limit);
        if(!checkLimit(limitObj,response)){
            request.query.limit = undefined;
        }
        if(!checkOffset(offsetObj,response)){
            request.query.offset = undefined;
        }
        if((request.query.offset == undefined) && ( request.query.limit == undefined)){
            const folders =  await this.folderRepository.find();
            if( folders.length === 0){
                response.status(404).json({
                    message: 'Folders doesn\'t exist'
                });
                return;
            }
            return folders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
        }
        if(request.query.limit == undefined){
            request.query.offset = Number(request.query.offset);
            const folders =  await this.folderRepository.find({skip: request.query.offset});
            if( folders.length === 0){
                response.status(404).json({
                    message: 'Folders doesn\'t exist'
                });
                return;
            }
            return folders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
        }
        if(request.query.offset == undefined){
            request.query.limit = Number(request.query.limit);
            const folders =  await this.folderRepository.find({take: request.query.limit});
            if( folders.length === 0){
                response.status(404).json({
                    message: 'Folders doesn\'t exist'
                });
                return;
            }
            return folders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
        };
        request.query.offset = Number(request.query.offset);
        request.query.limit = Number(request.query.limit);
        const folders =  await this.folderRepository.find({skip: request.query.offset,take: request.query.limit});
        if( folders.length === 0){
            response.status(404).json({
                message: 'Folders doesn\'t exist'
            });
            return;
        };
        return folders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
    }

    async readFolder(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id: request.params.foldersId});
        if(folder !== undefined){
            const {id, folderName, status, date} = folder;
            return {id, folderName, status, date};
        }
        else {
            response.status(404).json({
                message: 'Folder not found'
            });
            return;
        }
    }

    async createFolders(request: Request, response: Response, next: NextFunction) {
        if(checkFoldersSchema(request.body,response)){
            request.body.folderName = request.body.folderName.join('/');
            return this.mkdir(request.body.folderName,'') ? response.status(201).json({
                message: 'Folder(s) is created',
            }) : undefined;
        }
    }

    async deleteFolder(request: Request, response: Response, next: NextFunction) {

        const folder = await this.folderRepository.findOne({id : request.params.foldersId});
        const self = this;
        if( folder !== undefined ){
            let folders = await this.folderRepository.find();
                    folders.forEach((elem) => {
                        if((elem.folderName.indexOf(folder.folderName) !== -1) && (elem.folderName.indexOf(folder.folderName) == 0)){
                            let folderLength = elem.folderName.split('/').length;
                            let requestLength = folder.folderName.split('/').length;
                            if(folderLength == requestLength){
                                if(elem.files.length !== 0){
                                    for(let i = 0; i < elem.files.length; i++){
                                        const url = path.posix.join(__dirname, config.storage + elem.files[i].fileName.slice(0,elem.files[i].fileName.lastIndexOf('.')) + elem.id + path.extname(elem.files[i].fileName));
                                        fs.stat(url, (err, stats) => {
                                            if(err)
                                                return err;
                                            fs.unlink(url, (err) => {
                                                if(err)
                                                    return err;
                                                self.fileRepository.remove(elem.files[i]).then(() => console.log("Deleted"));  
                                            })
                                        })
                                    };
                                } else {
                                    self.folderRepository.remove(elem);
                                }
                            }
                            if(folderLength > requestLength){
                                if(elem.files.length !== 0){
                                    for(let i = 0; i < elem.files.length; i++){
                                        const url = path.posix.join(__dirname, config.storage + elem.files[i].fileName.slice(0,elem.files[i].fileName.lastIndexOf('.')) + elem.id + path.extname(elem.files[i].fileName));
                                        fs.stat(url, (err, stats) => {
                                            if(err)
                                                return err;
                                            fs.unlink(url, (err) => {
                                                if(err)
                                                    return err;
                                                self.fileRepository.remove(elem.files[i]).then(() => console.log("Deleted"));;    
                                            })
                                        })
                                    }; 
                                } else {
                                    self.folderRepository.remove(elem);
                                }
                            };
                            self.folderRepository.remove(elem);
                        }
                    });
                    response.status(200).json({
                        message: 'Folder deleted',
                    });
        } else {
            response.status(404).json({
                message: 'Folder not found',
            });
        }
    }

    sortFunction(a: any,b: any): number {
        if( a.date < b.date )
            return -1;
        if( a.date > b.date )
            return 1;
        return 0;
    }

    async readFolderResourse(request: Request, response: Response, next: NextFunction){
        let expanD ={expand: ''};
        let sort = {sortBy: ''};
        sort.sortBy = request.query.sortBy;
        expanD.expand = request.query.expand;
        if(!checkSortResources(sort,response))
            request.query.sortBy = undefined;
        if(checkExpandResources(expanD,response)){
            let arrFolderResources = [];
            let folder = await this.folderRepository.findOne({id : request.params.foldersId});
            if( folder !== undefined){
                this.folderRepository.find()
                    .then((folders) => {    
                        folders.forEach((elem) => {
                            if((elem.folderName.indexOf(folder.folderName) !== -1) && (elem.folderName.indexOf(folder.folderName) == 0)){
                                let oldFolderLength = folder.folderName.split('/').length;
                                let newFolderLength = elem.folderName.split('/').length;
                                if((oldFolderLength + 1) === newFolderLength){
                                    const {id, folderName, status, date} = elem;
                                    arrFolderResources.push({id, folderName, status, date});
                                }
                            }
                        });
                        arrFolderResources = arrFolderResources.concat(folder.files);
                        if( arrFolderResources.length == 0)
                            response.status(404).json({
                                message: 'Folder is empty'
                            })
                        else {
                            if(request.query.sortBy !== undefined){
                                let sign = request.query.sortBy.slice(0,1);
                                sign === '+' ? arrFolderResources.sort(this.sortFunction) : arrFolderResources.sort(this.sortFunction).reverse();
                            };
                            response.status(200).json({
                                message: 'Folders resources',
                                data: arrFolderResources
                            });
                        }
                    });
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
            }
        } else {
            let arrFolderIDS = [];
            let folder = await this.folderRepository.findOne({id : request.params.foldersId});
            if( folder !== undefined){
                this.folderRepository.find()
                .then((folders) => {
                    folders.forEach((elem) => {
                        if((elem.folderName.indexOf(folder.folderName) !== -1) && (elem.folderName.indexOf(folder.folderName) == 0)){
                            let oldFolderLength = folder.folderName.split('/').length;
                            let newFolderLength = elem.folderName.split('/').length;
                            if((oldFolderLength + 1) == newFolderLength){
                                const {id, folderName, status, date} = elem;
                                arrFolderIDS.push({id, folderName, status, date});
                            }
                        }
                    });
                    arrFolderIDS = arrFolderIDS.concat(folder.files);
                    if( arrFolderIDS.length === 0)
                        response.status(404).json({
                            message: 'Folder is empty'
                        })
                    else {
                        if(request.query.sortBy !== undefined){
                            let sign = request.query.sortBy.slice(0,1);
                            sign === '+' ? arrFolderIDS.sort(this.sortFunction) : arrFolderIDS.sort(this.sortFunction).reverse();
                        }
                        arrFolderIDS = arrFolderIDS.map((elem) => elem.id);
                        response.status(200).json({
                            message: 'Folder of id\'s',
                            data: arrFolderIDS
                        })
                    }
                });
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
            }
        }
    }

    async renameFolder (request: Request, response: Response, next: NextFunction){
        let flag = false;
        if(checkRenameFolder(request.body,response)){
            const folder = await this.folderRepository.findOne({id : request.params.foldersId});
            if ( folder !== undefined ) {
                this.folderRepository.find()
                .then(folders => {
                    for(let elem of folders){
                        if((elem.folderName.indexOf(folder.folderName) !== -1) && (elem.folderName.indexOf(folder.folderName) == 0)){
                            let folderLength = elem.folderName.split('/').length;
                            let requestLength = folder.folderName.split('/').length;
                            if(folderLength == requestLength){
                                let folderName = elem.folderName.split('/').slice();
                                folderName.pop();
                                folderName.push(request.body.folderName);
                                if(!flag){
                                    for(let elem1 of folders){
                                        if((elem1.folderName.length === folderName.join('/').length ) && (elem1.folderName.indexOf(folderName.join('/')) == 0)){
                                            response.status(403).json({
                                                message: 'Folder with this name exist'
                                            });
                                            return;
                                        }
                                    }
                                }
                                flag = true;
                                elem.folderName = folderName.join('/');
                                this.folderRepository.save(elem);
                            }
                            if(folderLength > requestLength){
                                let indexOldName = folder.folderName.split('/').length - 1;
                                let arrFolders = elem.folderName.split('/').slice();
                                arrFolders[indexOldName] = request.body.folderName;
                                let tempArrFolder = arrFolders.slice(0,indexOldName + 1);
                                if(!flag){
                                    for(let elem1 of folders){
                                        if((elem1.folderName.indexOf(tempArrFolder.join('/')) !== -1) && (elem1.folderName.indexOf(tempArrFolder.join('/')) == 0)){
                                            response.status(403).json({
                                                message: 'Folder with this name exist'
                                            });
                                            return;
                                        }
                                    }
                                }
                                flag = true;
                                elem.folderName = arrFolders.join('/');
                                this.folderRepository.save(elem);
                            }
                        }
                    };
                    response.status(200).json({
                        message: 'Folder renamed'
                    })
                })
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
            }
        }

    }

    

}