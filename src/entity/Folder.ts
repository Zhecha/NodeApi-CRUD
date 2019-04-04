import { Entity,Tree, Column, PrimaryGeneratedColumn, OneToMany,TreeChildren, TreeParent, TreeLevelColumn } from "typeorm";
import { File } from "./File";

@Entity()
@Tree("nested-set")
export class Folder {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    folderName: string;

    @Column()
    status: string;

    @Column()
    date: string;

    @TreeParent()
    parentFolder: Folder;

    @TreeChildren({cascade:true })
    childFolders: Folder[];

    @OneToMany(type => File, file => file.folder, {
        cascade: true,
        eager: true
    })
    files: File[];
}