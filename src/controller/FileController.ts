import {getRepository, Index, createQueryBuilder} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Folder} from "../entity/Folder";
import * as fs from "fs";
import * as path from "path";
import {checkRenameFile, checkFilterFile,checkLimit,checkOffset} from '../checks/Validate';
import { File } from "../entity/File";
const Joi = require('joi');
var multer = require('multer');
import {config} from "../../config/config";



export class FileController {

    private fileRepository = getRepository(File);
    private folderRepository = getRepository(Folder);

    async createFile(request: Request, response: Response, next: NextFunction){

        const url = path.posix.join(__dirname,config.storage);
        const self = this;
        const folder = await this.folderRepository.findOne({id: request.params.foldersId});
        var storage = multer.diskStorage({
            destination: function (req, file, callback) {
              callback(null,url)
            },
            filename: function (req, file, callback) {
              callback(null, file.originalname.slice(0,file.originalname.lastIndexOf('.')) + folder.id + path.extname(file.originalname));
            }
        });
        var upload = multer({ storage : storage}).array('fileName',3);

        upload(request,response,function(err) {
            if(err) {
                return response.status(403).json({
                            message: "Error uploading file"
                        });
            } else {
                const files = folder.files;
                for (let i = 0; i < files.length; i++){
                    for(let j = 0; j < request.files.length; j++){
                        if(files[i].fileName === request.files[j].originalname){
                            response.status(403).json({
                                message: 'File already exist'
                            });
                            return;
                        }
                    }
                }
                for(let i = 0 ; i < request.files.length; i++){
                    const file = new File();
                    file.fileName = request.files[i].originalname;
                    file.status = "Created";
                    file.type = request.files[i].mimetype.split('/').shift();
                    file.date = Date.now().toLocaleString();
                    file.folder = folder;
                    self.fileRepository.save(file);
                }
                response.status(201).json({
                    message:"File is uploaded"
                });
                return;
            }
        });


    }

    async readFiles(request: Request, response: Response, next: NextFunction){
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
                const folder = await this.folderRepository.findOne({id : request.params.foldersId});
                if( folder !== undefined){
                    if( folder.files.length !== 0){
                        return folder.files;
                    } else {
                        response.status(404).json({
                            message: 'Files not found'
                        });
                        return;
                    }
                } else {
                    response.status(404).json({
                        message: 'Folder not found'
                    });
                    return;
                }
            };
            const files = await this.fileRepository.find({folder: {id: request.params.foldersId},type: request.query.type});
            if( files.length === 0){
                response.status(404).json({
                    message: 'Files with this type doesn\'t exist'
                });
                return;
            }
            return files;
        } else {
            if(request.query.limit == undefined){
                request.query.offset = Number(request.query.offset);
                const files =  await this.fileRepository.find({relations: ["folder"],where:{folder:{id: request.params.foldersId}},skip: request.query.offset});
                if( files.length === 0){
                    response.status(404).json({
                        message: 'Files doesn\'t exist'
                    });
                    return;
                }
                let [{id, fileName, status, type, date}] = files;
                return [{id, fileName, status, type, date}];
            }
            if(request.query.offset == undefined){
                request.query.limit = Number(request.query.limit);
                const files =  await this.fileRepository.find({relations: ["folder"],where:{folder:{id: request.params.foldersId}},take: request.query.limit});
                if( (files.length === 0)){
                    response.status(404).json({
                        message: 'Files doesn\'t exist'
                    });
                    return;
                };
                return files.map(({id, fileName, status, type, date}) => ({id, fileName, status, type, date}));
            };
            request.query.offset = Number(request.query.offset);
            request.query.limit = Number(request.query.limit);
            const files =  await this.fileRepository.find({relations: ["folder"],where:{folder:{id: request.params.foldersId}},skip: request.query.offset,take: request.query.limit});
            if( files.length === 0){
                response.status(404).json({
                    message: 'Files doesn\'t exist'
                });
                return;
            };
            return files.map(({id, fileName, status, type, date}) => ({id, fileName, status, type, date}));
        };


    }

    async readFile(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id : request.params.foldersId});
        const file = await this.fileRepository.findOne({id : request.params.filesId});
        if( folder !== undefined ){
            if( folder.files.length !== 0){
                let files = folder.files;
                if(file !== undefined){
                    for( let i = 0; i < files.length; i++){
                        if(files[i].id === file.id){
                            return folder.files[i];
                        }
                    }
                } else {
                    response.status(404).json({
                        message: 'File not found'
                    });
                    return;
                }
            } else {
                response.status(404).json({
                    message: 'Files doesn\'t exist'
                });
                return;
            }
        } else {
            response.status(404).json({
                message:' Folder not found'
            });
            return;
        }
    }

    async deleteFile(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id: request.params.foldersId});
        const file = await this.fileRepository.findOne({id : request.params.filesId});
        const self = this;
        if( folder !== undefined ){
            if( folder.files.length !== 0){
                let files = folder.files;
                if(file !== undefined){
                    for( let i = 0; i < files.length; i++){
                        if(files[i].id === file.id){
                            const url = path.posix.join(__dirname, config.storage + file.fileName.slice(0,file.fileName.lastIndexOf('.')) + folder.id + path.extname(file.fileName));
                            fs.stat(url, (err, stats) => {
                                if(err)
                                    return err;
                                fs.unlink(url, (err) => {
                                    if(err)
                                        return err;
                                    self.fileRepository.remove(folder.files[i]);
                                    response.status(200).json({
                                        message: 'File deleted'
                                    });
                                    return;      
                                })
                            })
                        }
                    }
                } else {
                    response.status(404).json({
                        message: 'File not found'
                    });
                    return;
                }
            } else {
                response.status(404).json({
                    message: 'Files doesn\'t exist'
                });
                return;
            }
        } else {
            response.status(404).json({
                message:' Folder not found'
            });
            return;
        }
    }


    async deleteFiles(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id: request.params.foldersId});
        const file = await this.fileRepository.findOne({id : request.params.filesId});
        const self = this;
        if( folder !== undefined ){
            if( folder.files.length !== 0){
                for(let i = 0; i < folder.files.length; i++){
                    const url = path.posix.join(__dirname, config.storage + folder.files[i].fileName.slice(0,folder.files[i].fileName.lastIndexOf('.')) + folder.id + path.extname(folder.files[i].fileName));
                    fs.stat(url, (err, stats) => {
                        if(err)
                            return err;
                        fs.unlink(url, (err) => {
                            if(err)
                                return err;
                            self.fileRepository.remove(folder.files[i]);    
                        })
                    })
                }
                response.status(200).json({
                    message: 'File\'s deleted'
                });
                return;  
            } else {
                response.status(404).json({
                    message: 'Files doesn\'t exist'
                });
                return;
            }
        } else {
            response.status(404).json({
                message:' Folder not found'
            });
            return;
        }
    }

    async renameFile(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id : request.params.foldersId});
        const file = await this.fileRepository.findOne({id : request.params.filesId});
        let files = folder.files;
        if(!checkRenameFile(request.body,response)){
            return;
        }
        if(files.length === 0){
            response.status(404).json({
                message: 'File\'s don\'t exist'
            });
            return;
        }
        for(let i = 0; i < files.length; i++){
            if(files[i].fileName === (request.body.fileName + path.extname(file.fileName))){
                response.status(403).json({
                    message: 'File with this name exist'
                })
                return;
            }
        }
        for(let i = 0 ; i < files.length; i++){
            if(files[i].fileName === file.fileName){
                const url = path.posix.join(__dirname, config.storage + files[i].fileName.slice(0,files[i].fileName.lastIndexOf('.')) + folder.id + path.extname(files[i].fileName));
                fs.stat(url, (err, stats) => {
                    if(err)
                        return err;
                    const newUrl = path.posix.join(__dirname,config.storage + request.body.fileName + folder.id + path.extname(files[i].fileName));
                    fs.rename(url, newUrl,(err) => {
                        if(err)
                            return err;
                        files[i].fileName = request.body.fileName + path.extname(files[i].fileName);
                        this.fileRepository.save(files[i]);
                        response.status(200).json({
                            message: "File renamed"
                        });
                        return;    
                    });
                })
            }
        }
    }

}