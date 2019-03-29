import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { File } from "./File";
import { type } from "os";

@Entity()
export class Folder {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    folderName: string;

    @Column()
    status: string;

    @Column()
    date: string;

    @OneToMany(type => File, file => file.folder, {
        cascade: true,
        eager: true
    })
    files: File[];
}