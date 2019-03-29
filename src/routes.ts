import {FolderController} from "./controller/FolderController";
import { FileController } from "./controller/FileController";

export const Routes = [{
    method: "get",
    route: "/api/v1/folders",
    controller: FolderController,
    action: "readFolders"
}, {
    method: "get",
    route: "/api/v1/folders/:foldersId",
    controller: FolderController,
    action: "readFolder"
}, {
    method: "get",
    route: "/api/v1/folders/:foldersId/resources",
    controller: FolderController,
    action: "readFolderResourse"
}, {
    method: "post", 
    route: "/api/v1/folders",
    controller: FolderController,
    action: "createFolders"
}, {
    method: "delete", 
    route: "/api/v1/folders/:foldersId",
    controller: FolderController,
    action: "deleteFolder"
}, {
    method: 'put', 
    route: '/api/v1/folders/:foldersId',
    controller: FolderController,
    action: 'renameFolder'
}, {
    method: 'post',
    route: '/api/v1/folders/:foldersId/files',
    controller: FileController,
    action: 'createFile'
}, {
    method: 'get',
    route: '/api/v1/folders/:foldersId/files',
    controller: FileController,
    action: 'readFiles'
}, {
    method: 'get',
    route: '/api/v1/folders/:foldersId/files/:filesId',
    controller: FileController,
    action: 'readFile'
}, {
    method: 'delete',
    route: '/api/v1/folders/:foldersId/files/:filesId',
    controller: FileController,
    action: 'deleteFile'
}, {
    method: 'delete',
    route: '/api/v1/folders/:foldersId/files',
    controller: FileController,
    action: 'deleteFiles'
}, {
    method: 'put',
    route: '/api/v1/folders/:foldersId/files/:filesId',
    controller: FileController,
    action: 'renameFile'
}];