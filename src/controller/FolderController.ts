import {getRepository, Index, getManager} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Folder} from "../entity/Folder";
import * as fs from "fs";
import * as path from "path";
import {checkFoldersSchema, checkSortResources, checkRenameFolder, checkExpandResources, checkLimit, checkOffset,checkFilterFile} from '../checks/Validate';
import { File } from "../entity/File";
const Joi = require('joi');
import {config} from "../../config/config";


export class FolderController {
    
    private folderRepository = getRepository(Folder);
    private fileRepository = getRepository(File);
    private folderTreeRepository = getManager().getTreeRepository(Folder);

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
                response.json({
                    message: 'Folders doesn\'t exist',
                    data: []
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

    async createFolder(request: Request, response: Response, next: NextFunction) {
        if(!checkFoldersSchema(request.body,response)){
            return;
        };
        request.body.folderName = request.body.folderName.join('/');
        const folder = new Folder();
        folder.folderName = request.body.folderName;
        folder.status = "Created";
        folder.date = Date.now().toLocaleString();
        let {id, folderName, status, date} = folder;
        this.folderRepository.save(folder);
        response.status(201).json({
            message: 'Folder successfuly created',
            folder: {id, folderName, status, date}
        })
        return;
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

    async paginateResources(request:Request, response: Response, arr: Array<any>){
        let offsetObj = {offset: 0};
        let limitObj = {limit: 0};
        let filterObj = {type: ''};
        offsetObj.offset = Number(request.query.offset);
        limitObj.limit = Number(request.query.limit);
        filterObj.type = request.query.type;
        if(!checkLimit(limitObj,response)){
            request.query.limit = undefined;
        }
        if(!checkOffset(offsetObj,response)){
            request.query.offset = undefined;
        }
        if((request.query.offset == undefined) && ( request.query.limit == undefined)){
            if(!checkFilterFile(filterObj,response)){
                return ;
            };
            const folder = await this.folderRepository.findOne({id: request.params.foldersId});
            const files = folder.files;
            let filesArray = [];
            for(let i = 0; i < files.length; i++){
                if( files[i].type == request.query.type){
                    filesArray.push(files[i]);
                }
            }
            if( filesArray.length === 0){
                response.status(404).json({
                    message: 'Files with this type doesn\'t exist'
                });
                return ;
            }
            return filesArray.map(({id, fileName, status, type, date})=>({id, fileName, status, type, date}));
        } else {
            if(request.query.limit == undefined){
                request.query.offset = Number(request.query.offset);
                arr.splice(0,request.query.offset);
                if( arr.length === 0){
                    response.status(404).json({
                        message: 'Resources doesn\'t exist'
                    });
                    return ; 
                }
                return arr;
            }
            if(request.query.offset == undefined){
                request.query.limit = Number(request.query.limit);
                arr = arr.slice(0,request.query.limit);
                return arr;
            };
            request.query.offset = Number(request.query.offset);
            request.query.limit = Number(request.query.limit);
            arr.splice(0,request.query.offset);
            arr = arr.slice(0,request.query.limit);
            if( arr.length === 0){
                response.status(404).json({
                    message: 'Resources doesn\'t exist'
                });
                return ;
            };
            return arr;
        };
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
                let children = await this.folderTreeRepository.findDescendantsTree(folder);
                if( (children.files.length === 0) && (children.childFolders.length === 0)){
                    response.status(404).json({
                        message: 'Children don\'t exsits'
                    });
                    return;
                };
                const childFoldersArray = children.childFolders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
                arrFolderResources = arrFolderResources.concat(childFoldersArray);
                arrFolderResources = arrFolderResources.concat(children.files);
                if(request.query.sortBy !== undefined){
                    let sign = request.query.sortBy.slice(0,1);
                    sign === '+' ? arrFolderResources.sort(this.sortFunction) : arrFolderResources.sort(this.sortFunction).reverse();
                };
                let arrayPaginateResources =  await this.paginateResources(request,response,arrFolderResources);
                if(arrayPaginateResources !== undefined)
                    arrFolderResources = arrayPaginateResources;
                response.status(200).json({
                    message: 'Folder resources',
                    data: arrFolderResources
                });
                return;
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
                return;
            }
        } else {
            let arrFolderIDS = [];
            let folder = await this.folderRepository.findOne({id : request.params.foldersId});
            if( folder !== undefined){
                let children = await this.folderTreeRepository.findDescendantsTree(folder);
                if( (children.files.length === 0) && (children.childFolders.length === 0)){
                    response.status(404).json({
                        message: 'Children don\'t exsits'
                    });
                    return;
                };
                const childFoldersArray = children.childFolders.map(({id, folderName, status, date}) => ({id, folderName, status, date}));
                arrFolderIDS = arrFolderIDS.concat(childFoldersArray);
                arrFolderIDS = arrFolderIDS.concat(children.files);
                if(request.query.sortBy !== undefined){
                    let sign = request.query.sortBy.slice(0,1);
                    sign === '+' ? arrFolderIDS.sort(this.sortFunction) : arrFolderIDS.sort(this.sortFunction).reverse();
                }
                let arrayPaginateResources =  await this.paginateResources(request,response,arrFolderIDS);
                if(arrayPaginateResources !== undefined)
                    arrFolderIDS = arrayPaginateResources;
                arrFolderIDS = arrFolderIDS.map((elem) => elem.id);
                response.status(200).json({
                    message: 'Folder of id\'s',
                    data: arrFolderIDS
                })
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
            }
        }
    }

    async renameFolder (request: Request, response: Response, next: NextFunction){
        if(checkRenameFolder(request.body,response)){
            const folder = await this.folderRepository.findOne({id : request.params.foldersId});
            if ( folder !== undefined ) {
                folder.folderName = request.body.folderName;
                await this.folderRepository.save(folder);
                response.status(200).json({
                    message: 'Folder renamed'
                });
                return;
            } else {
                response.status(404).json({
                    message: 'Folder not found'
                })
            }
        }

    }

    

}