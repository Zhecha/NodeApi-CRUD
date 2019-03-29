const Joi = require("joi");
 

export const RenameFile = Joi.object().keys({
    fileName: Joi.string().alphanum().min(1).lowercase().trim().required()
});

export const FilterFile = Joi.object().keys({
    type: Joi.string().valid('text','audio','image').required()
});

export const SortResources = Joi.object().keys({
    sortBy: Joi.string().valid("-date","+date").required()
});