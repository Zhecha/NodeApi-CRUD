import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import * as Joi from "joi";


export const FoldersSchema = Joi.object().keys({
    folderName: Joi.array().items(Joi.string().alphanum().min(1).lowercase().trim().required()).required()
});

export const IndificateNumber = Joi.object().keys({
    folderName: Joi.array().items(Joi.string().alphanum().min(1).lowercase().trim().required()).required(),
    indificateNum: Joi.number().integer().positive().min(1).max(100).required(),
});

export const RenameFolder = Joi.object().keys({
    folderName: Joi.array().items(Joi.string().alphanum().min(1).lowercase().trim().required()).required(),
    newName: Joi.string().alphanum().min(1).lowercase().trim().required()
});