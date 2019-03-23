import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { Folder } from "./Folder";

@Entity()
export class File {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fileName: string;
    
    @Column()
    status: string;

    @ManyToMany(type => Folder, folder => folder.files)
    folders: Folder[];

}