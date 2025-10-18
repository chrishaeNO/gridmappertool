'use client';
import { collection, addDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type GridMapData = {
    imageUrl: string;
    gridCellSize: number;
    gridUnit: string;
    dpi: number;
    gridColor: string;
    labelColor: string;
    backgroundColor: string;
    gridThickness: number;
    gridOffset: { x: number; y: number };
    name: string;
};

export function addGridMap(db: Firestore, mapData: GridMapData) {
    const gridMapsCollection = collection(db, 'gridMaps');
    const promise = addDoc(gridMapsCollection, {
        ...mapData,
        shared: true,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    });

    promise.catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: 'gridMaps',
                operation: 'create',
                requestResourceData: mapData,
            })
        );
    });
    
    return promise;
}
