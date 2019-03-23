import {FolderController} from "./controller/FolderController";

export const Routes = [{
    method: "get",
    route: "/getFolders",
    controller: FolderController,
    action: "allFoldersRootDirectory"
}, {
    method: "get",
    route: "/getFoldersInFirstLevel",
    controller: FolderController,
    action: "getFoldersInFirstLevel"
}, {
    method: "post",
    route: "/createFolders",
    controller: FolderController,
    action: "saveAndCreateFolders"
}, {
    method: "delete",
    route: "/deleteFolders",
    controller: FolderController,
    action: "removeFolders"
}, {
    method: 'get',
    route: '/getFoldersWithIndentidications',
    controller: FolderController,
    action: 'getFoldersWithIndentidications'
}, {
    method: 'put',
    route: '/renameFolder',
    controller: FolderController,
    action: 'renameFolder'
}];