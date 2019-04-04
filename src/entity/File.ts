import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Folder } from "./Folder";
import { type } from "os";

@Entity()
export class File {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fileName: string;
    
    @Column()
    status: string;

    @Column()
    type: string;

    @Column()
    date: string;

    @ManyToOne(type => Folder, folder => folder.files, { onDelete:"CASCADE" })
    @JoinColumn()
    folder: Folder;
}