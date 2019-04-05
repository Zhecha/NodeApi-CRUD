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
    action: "createFolder"
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
    route: '/api/v1/folders/:foldersId/resources',
    controller: FileController,
    action: 'createResource'
}, {
    method: 'delete',
    route: '/api/v1/folders/:foldersId/resources/:resourcesId',
    controller: FileController,
    action: 'deleteResource'
}, {
    method: 'put',
    route: '/api/v1/folders/:foldersId/resources/:resourcesId',
    controller: FileController,
    action: 'renameResource'
}];
