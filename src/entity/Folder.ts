import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { File } from "./File";

@Entity()
export class Folder {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    folderName: string;

    @Column()
    status: string;

    @ManyToMany(type => File, file => file.folders)
    @JoinTable()
    files: File[];
}