import {getRepository, Index, createQueryBuilder, getTreeRepository , getManager,getConnection} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Folder} from "../entity/Folder";
import * as fs from "fs";
import * as path from "path";
import {checkRenameFile, checkFilterFile,checkLimit,checkOffset,checkFoldersSchema, checkType} from '../checks/Validate';
import { File } from "../entity/File";
const Joi = require('joi');
var multer = require('multer');
import {config} from "../../config/config";
import { ClientResponse } from "http";



export class FileController {

    private fileRepository = getRepository(File);
    private folderRepository = getRepository(Folder);
    private folderTreeRepository = getTreeRepository(Folder);

    async createFile(request:Request, response: Response ){
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
                response.status(400).json({
                    message: "Error uploading file"
                });
                return;
            } else {
                const files = folder.files;
                for (let i = 0; i < files.length; i++){
                    for(let j = 0; j < request.files.length; j++){
                        if(files[i].fileName === request.files[j].originalname){
                            response.status(409).json({
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

    async createFolder(request: Request, response: Response){
        let folderObj = {folderName: ''};
        folderObj.folderName = request.body.folderName;
        if(!checkFoldersSchema(folderObj,response)){
            return;
        };
        let folderParent = await this.folderRepository.findOne({id : request.params.foldersId}); 
        const folder = new Folder();
        folder.folderName = request.body.folderName;
        folder.status = "Created";
        folder.date = Date.now().toLocaleString();
        folder.parentFolder = folderParent;
        let {id, folderName, status, date} = folder;
        getManager().save(folder);
        response.status(201).json({
            message: 'Folder successfuly created',
            folder: {id, folderName, status, date}
        })
        return;
    }

    async createResource(request: Request, response: Response, next: NextFunction){
        let typeEntity = {type : ''};
        if(request.body.length !== undefined){
            typeEntity.type = request.body.type;
            if(!checkType(typeEntity,response)){
                response.status(400).json({
                    message: "Invalid request data"
                });
                return;
            };
        }
        request.body.type === "folder" ?  this.createFolder(request,response) : this.createFile(request,response);
        return;
    }

    async deleteFile(request: Request, response: Response){
        const folder = await this.folderRepository.findOne({id: request.params.foldersId});
        const file = await this.fileRepository.findOne({id : request.params.resourcesId});
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

    async deleteFolder(child: Folder, response: Response){
        console.log(child);
        await this.folderRepository.delete({id: child.id}).then((res) => console.log(res)).catch(err => console.log("Error lala", err));
    }


    async deleteResource(request: Request, response: Response, next: NextFunction){
        let arrFolderChildren = [];
        let folder = await this.folderRepository.findOne({id : request.params.foldersId});
        if( folder !== undefined){
            let children = await this.folderTreeRepository.findDescendantsTree(folder);
            if( (children.files.length === 0) && (children.childFolders.length === 0)){
                response.json({
                    data: []
                });
                return;
            };
            const childFoldersArray = children.childFolders.map(({id, folderName, status, date, files, childFolders}) => ({id, folderName, status, date, files, childFolders}));
            arrFolderChildren = arrFolderChildren.concat(childFoldersArray);
            arrFolderChildren = arrFolderChildren.concat(children.files.map(({id, fileName, status,type, date}) => ({id, fileName, status,type , date})));
            console.log(arrFolderChildren);
            for (let child of arrFolderChildren){
                if(child.id == request.params.resourcesId){
                    return !child.type ? await this.deleteFolder(child,response) : this.deleteFile(request,response);
                }
            }
            response.status(404).json({
                message: "Resource doesn\'t exist"
            });
            return;

        } else {
            response.status(404).json({
                message: 'Folder not found'
            });
            return;
        }
    }

    async renameFile(request: Request, response: Response, next: NextFunction){
        const folder = await this.folderRepository.findOne({id : request.params.foldersId});
        const file = await this.fileRepository.findOne({id: request.params.resourcesId});
        let files = folder.files;
        let flagExistFile = false;
        if(!checkRenameFile(request.body,response)){
            return;
        }
        if(files.length === 0){
            response.json({
                data:[]
            });
            return;
        }
        for(let i = 0; i < files.length; i++){
            if( files[i].id == request.params.resourcesId ){
                flagExistFile = true;
            }
        }
        if(flagExistFile){
            for(let i = 0; i < files.length; i++){
                if(files[i].fileName === (request.body.fileName + path.extname(file.fileName))){
                    response.status(409).json({
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
        } else {
            response.status(404).json({
                message: 'File not found'
            });
            return;
        }
    }

}
