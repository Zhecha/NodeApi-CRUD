import * as Joi from "joi";


export const FoldersSchema = Joi.object().keys({
    folderName: Joi.array().items(Joi.string().alphanum().min(1).lowercase().trim().required()).required()
});

export const Expand = Joi.object().keys({
    expand: Joi.string().valid("true").required(),
});

export const RenameFolder = Joi.object().keys({
    folderName: Joi.string().alphanum().min(1).lowercase().trim().required()
});

export const Limit = Joi.object().keys({
    limit: Joi.number().integer().positive().required()
});

export const Offset = Joi.object().keys({
    offset: Joi.number().integer().positive().required()
});