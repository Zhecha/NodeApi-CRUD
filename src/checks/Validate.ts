import {FoldersSchema, Expand, RenameFolder, Limit, Offset} from "../checks/CheckFolders";
import {Request, Response} from "express";
import {RenameFile, FilterFile, SortResources} from '../checks/CheckFile';
const Joi = require('joi');

export function checkFoldersSchema (obj: Request, response: Response){
    if(!obj.hasOwnProperty('folderName')){
        response.status(400).send({
            message: 'Invalid property name'
        })
        return false;
    } else {
        obj.folderName = obj.folderName.split('/');
        return Joi.validate(obj, FoldersSchema, (err, value) => {
            if (err) {
                response.status(403).send({
                    message: 'Invalid request data',
                });
                return false;
            }
            return true;
        })
    }
}

export function checkLimit (obj: Request, response: Response){
    if(!obj.hasOwnProperty('limit')){
        return false;
    } else {
        return Joi.validate(obj, Limit, (err, value) => {
            if (err) {
                return false;
            }
            return true;
        })
    }
}

export function checkOffset (obj: Request, response: Response){
    if(!obj.hasOwnProperty('offset')){
        return false;
    } else {
        return Joi.validate(obj, Offset, (err, value) => {
            if (err) {
                return false;
            }
            return true;
        })
    }
}

export function checkExpandResources (obj: Request, response: Response){
    if(!obj.hasOwnProperty('expand')){
        return false;
    } else {
        return Joi.validate(obj, Expand, (err, value) => {
            if (err) {
                return false;
            }
            return true;
        })
    }
}

export function checkSortResources (obj: Request, response: Response){
    if(!obj.hasOwnProperty('sortBy')){
        return false;
    } else {
        return Joi.validate(obj, SortResources, (err, value) => {
            if (err) {
                return false;
            }
            return true;
        })
    }
}


export function checkRenameFolder(obj: Request, response: Response){
    if(!obj.hasOwnProperty('folderName')){
        response.status(400).send({
            message: 'Invalid property name'
        })
        return false;
    } else {
        return Joi.validate(obj, RenameFolder, (err, value) => {
            if (err) {
                response.status(403).send({
                    message: 'Invalid request data',
                });
                return false;
            }
            return true;
        })
    }
}

export function checkRenameFile(obj: Request, response: Response){
    if(!obj.hasOwnProperty('fileName')){
        response.status(400).send({
            message: 'Invalid property name'
        })
        return false;
    } else {
        return Joi.validate(obj, RenameFile, (err, value) => {
            if (err) {
                response.status(403).send({
                    message: 'Invalid request data',
                });
                return false;
            }
            return true;
        })
    }
}

export function checkFilterFile(obj: Request, response: Response){
    if(!obj.hasOwnProperty('type')){
        return false;
    } else {
        return Joi.validate(obj, FilterFile, (err, value) => {
            if (err) {
                return false;
            }
            return true;
        })
    }
}




