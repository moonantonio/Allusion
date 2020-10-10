import { IFile } from '../entities/File';
import { ID } from '../entities/ID';
import { ITag } from '../entities/Tag';
import { dbConfig, DB_NAME } from './config';
import DBRepository, { dbInit, dbDelete, FileOrder } from './DBRepository';
import { ITagCollection, ROOT_TAG_COLLECTION_ID } from '../entities/TagCollection';
import { ILocation } from '../entities/Location';
import { SearchCriteria, IStringSearchCriteria } from '../entities/SearchCriteria';

import Dexie from 'dexie';
import { exportDB, importInto, ExportOptions, ImportOptions } from 'dexie-export-import';
import { writeFile, readFile, pathExists } from 'fs-extra';
import path from 'path';

/**
 * The backend of the application serves as an API, even though it runs on the same machine.
 * This helps code organization by enforcing a clear seperation between backend/frontend logic.
 * Whenever we want to change things in the backend, this should have no consequences in the frontend.
 * The backend has access to the database, which is exposed to the frontend through a set of endpoints.
 */
export default class Backend {
  private db: Dexie;
  private fileRepository: DBRepository<IFile>;
  private tagRepository: DBRepository<ITag>;
  private tagCollectionRepository: DBRepository<ITagCollection>;
  private locationRepository: DBRepository<ILocation>;

  constructor() {
    // Initialize database tables
    const db = dbInit(dbConfig, DB_NAME);
    this.db = db;
    this.fileRepository = new DBRepository('files', db);
    this.tagRepository = new DBRepository('tags', db);
    this.tagCollectionRepository = new DBRepository('tagCollections', db);
    this.locationRepository = new DBRepository('locations', db);
  }

  async init(): Promise<void> {
    // Create a root 'Hierarchy' collection if it does not exist
    const colCount = await this.tagCollectionRepository.count();
    if (colCount === 0) {
      await this.createTagCollection({
        id: ROOT_TAG_COLLECTION_ID,
        name: 'Hierarchy',
        description: '',
        dateAdded: new Date(),
        subCollections: [],
        tags: [],
        color: '',
      });
    }
  }

  async exportLocation(location: ILocation): Promise<void> {
    console.log('Backend: Exporting location...', location);

    // Only export tags (and collections) used in this location: First find which ones that are
    const locationFiles = await this.fileRepository.collection
      .where('locationId')
      .equals(location.id)
      .toArray();
    const tagsUsedInLocation = new Set<ID>();
    locationFiles.forEach((file) => file.tags.forEach((tagId) => tagsUsedInLocation.add(tagId)));

    const allCollections = await this.tagCollectionRepository.getAll({});
    const allCollectionsWithParent = allCollections.map((col) => ({
      ...col,
      parent: allCollections.find((otherCol) => otherCol.subCollections.includes(col.id))?.id,
    }));
    const collectionsUsedInLocation = new Set<ID>();
    allCollectionsWithParent.forEach((col) => {
      if (!collectionsUsedInLocation.has(col.id)) {
        console.log(
          col,
          col.tags.some((tagId) => tagsUsedInLocation.has(tagId)),
        );
        if (col.tags.some((tagId) => tagsUsedInLocation.has(tagId))) {
          // Add this collection and its parent(s) too
          let it: typeof col | undefined = col;
          while (it?.parent) {
            if (collectionsUsedInLocation.has(it.id)) break;
            collectionsUsedInLocation.add(it.id);
            it = allCollectionsWithParent.find((c) => c.id === it!.parent);
          }
        }
      }
    });
    console.log(allCollectionsWithParent, collectionsUsedInLocation);

    const opts: ExportOptions = {
      prettyJson: true,
      progressCallback: (prog) => {
        console.log(prog);
        return true;
      },
      filter: (table, value) => {
        console.log({ table, value });
        if (table === this.fileRepository.collectionName) {
          // Only export files in this location
          return (value as IFile).locationId === location.id;
        } else if (table === this.locationRepository.collectionName) {
          // Only export this location
          return (value as ILocation).id === location.id;
        } else if (table === this.tagRepository.collectionName) {
          // Only export tags and tag-collections used in this location
          return tagsUsedInLocation.has((value as ITag).id);
        } else if (table === this.tagCollectionRepository.collectionName) {
          return collectionsUsedInLocation.has((value as ITagCollection).id);
        }
        return true;
      },
    };

    const exportBlob = await exportDB(this.db as any, opts); // not sure why db isn't correctly reconized
    exportBlob.text().then((text) => console.log('Exported data', JSON.parse(text)));
    const buf = await exportBlob.arrayBuffer();
    await writeFile(path.join(location.path, 'allusion.json'), Buffer.from(buf));
  }

  async importLocation(location: ILocation): Promise<void> {
    console.log('Backend: Importing location...', location);
    const opts: ImportOptions = {
      overwriteValues: true, // todo: only overwrite if modifiedDate is later than our database?
      progressCallback: (prog) => {
        console.log(prog);
        return true;
      },
      filter: (table, value) => {
        if (table === this.locationRepository.collectionName) {
          value.path = location.path; // not sure if this works
        }
        return true;
      },
    };

    const exportedData = await readFile(path.join(location.path, 'allusion.json'));
    const blob = new Blob([exportedData]);
    // TODO: Manually go through importedData and import that instead, not the raw blob:
    // const importedData = JSON.parse(await blob.text());
    // Merge files changes in case file was modified on both ends
    // Merge duplicates files in case they were added on both clients (with a different ID)
    // Should check the modified date of the allusion.json file (or put it in the file itself)
    // And also the modifiedDate of individual Files/tags/collections
    // TODO: Also, add any collection without a parent to the root Hierarchy collection
    await importInto(this.db as any, blob, opts);

    // Reset the original location path (?)
    // const insertedLoc = this.locationRepository.update();

    // De-dupe the collections: Tags and subcollections are added to existing lists when importing
    const collections = await this.tagCollectionRepository.getAll({});
    for (const col of collections) {
      col.subCollections = col.subCollections.filter(
        (subCol, i) => col.subCollections.lastIndexOf(subCol) !== i,
      );
      col.tags = col.tags.filter((tag, i) => col.tags.lastIndexOf(tag) !== i);
      await this.tagCollectionRepository.update(col);
    }

    // TODO: a 'isSyncEnabled' field - automatically import/export on change/every x minutes

    // TODO: Store 'latestSync' date in local storage, per location
    // we'll inevitably also need features like 'merge tags' and 'merge collections'

    // Todo: check for duplicate / unreferenced entries (tags/files/collections)

    // Todo: return summary of changes (difference)

    // TODO: When creating a location, check if there is an "allusion.json" file, and use that to initialize
    // Implemented this ^

    // TODO: If a file is created on two different clients, it will get a unique ID for both of them
    // This will not be accepted by the bulkPut in the import function; should be manually resolved:
    // - if error occurs, check manually for duplicate entries and resolve them
    // - otherwise, provide option to user to replace the collection with the new data, or to keep the current data
  }

  /** @deprecated not used, alternative solution to the dexie-import-export lib */
  async exportLocationAttempt2(location: ILocation) {
    // Manually import/export: https://dexie.org/docs/ExportImport/dexie-export-import#background--why
    const db = this.db;
    // TODO: Only export data from this location, not all tables
    // TODO: Take care with dates
    const tableData = db.transaction('r', db.tables, () =>
      Promise.all(
        db.tables.map((table) =>
          table.toArray().then((rows) => ({ table: table.name, rows: rows })),
        ),
      ),
    );
    console.log(tableData);
    // write to file
  }

  /** @deprecated not used, alternative solution to the dexie-import-export lib */
  async importLocationAttempt2(data: any) {
    const db = this.db;
    return db.transaction('rw', db.tables, () => {
      return Promise.all(
        data.map((t: any) =>
          db
            .table(t.table)
            .clear()
            .then(() => db.table(t.table).bulkAdd(t.rows)),
        ),
      );
    });
  }

  async fetchTags(): Promise<ITag[]> {
    console.log('Backend: Fetching tags...');
    return this.tagRepository.getAll({});
  }

  async fetchTagCollections(): Promise<ITagCollection[]> {
    console.log('Backend: Fetching tags collections...');
    return this.tagCollectionRepository.getAll({});
  }

  async fetchFiles(order: keyof IFile, fileOrder: FileOrder): Promise<IFile[]> {
    console.log('Backend: Fetching files...');
    return this.fileRepository.getAll({ order, fileOrder });
  }

  async fetchFilesByID(ids: ID[]): Promise<IFile[]> {
    console.log('Backend: Fetching files by ID...');
    const files = await Promise.all(ids.map((id) => this.fileRepository.get(id)));
    return files.filter((f) => f !== undefined) as IFile[];
  }

  async searchFiles(
    criteria: SearchCriteria<IFile> | [SearchCriteria<IFile>],
    order: keyof IFile,
    fileOrder: FileOrder,
    matchAny?: boolean,
  ): Promise<IFile[]> {
    console.log('Backend: Searching files...', criteria, { matchAny });
    return this.fileRepository.find({ criteria, order, fileOrder, matchAny });
  }

  async createTag(tag: ITag): Promise<ITag> {
    console.log('Backend: Creating tag...', tag);
    return await this.tagRepository.create(tag);
  }

  async createTagCollection(collection: ITagCollection): Promise<ITagCollection> {
    console.log('Backend: Creating tag collection...', collection);
    return this.tagCollectionRepository.create(collection);
  }

  async createFile(file: IFile): Promise<IFile> {
    console.log('Backend: Creating file...', file);
    return await this.fileRepository.create(file);
  }

  async saveTag(tag: ITag): Promise<ITag> {
    console.log('Backend: Saving tag...', tag);
    return await this.tagRepository.update(tag);
  }

  async saveTagCollection(tagCollection: ITagCollection): Promise<ITagCollection> {
    console.log('Backend: Saving tag collection...', tagCollection);
    return await this.tagCollectionRepository.update(tagCollection);
  }

  async saveFile(file: IFile): Promise<IFile> {
    console.log('Backend: Saving file...', file);
    return await this.fileRepository.update(file);
  }

  async removeTag(tag: ITag): Promise<void> {
    console.log('Removing tag...', tag);
    // We have to make sure files tagged with this tag should be untagged
    // Get all files with this tag
    const filesWithTag = await this.fileRepository.find({
      criteria: { key: 'tags', value: tag.id, operator: 'contains', valueType: 'array' },
    });
    // Remove tag from files
    filesWithTag.forEach((file) => file.tags.splice(file.tags.indexOf(tag.id)));
    // Update files in db
    await this.fileRepository.updateMany(filesWithTag);
    // Remove tag from db
    await this.tagRepository.remove(tag);
  }

  async removeTagCollection(tagCollection: ITagCollection): Promise<void> {
    console.log('Removing tag collection...', tagCollection);
    // Get all sub collections
    const subCollections = await Promise.all(
      tagCollection.subCollections.map((col) => this.tagCollectionRepository.get(col)),
    );
    // Remove subcollections
    await Promise.all(subCollections.map((col) => col && this.removeTagCollection(col)));
    // Get all tags
    const tags = await Promise.all(tagCollection.tags.map((tag) => this.tagRepository.get(tag)));
    // Remove tags properly
    await Promise.all(tags.map((tag) => tag && this.removeTag(tag)));
    // Remove tag collection itself from db
    await this.tagCollectionRepository.remove(tagCollection);
  }

  async removeFile(file: IFile): Promise<void> {
    console.log('Removing file...', file);
    await this.fileRepository.remove(file);
  }

  async removeFiles(files: IFile[]): Promise<void> {
    console.log('Removing files...', files);
    await this.fileRepository.removeMany(files);
  }

  async countFiles(
    criteria: SearchCriteria<IFile> | [SearchCriteria<IFile>],
    matchAny?: boolean,
  ): Promise<number> {
    console.log('Get number of files...', criteria, matchAny);
    return this.fileRepository.count({
      criteria,
      matchAny,
    });
  }

  async getWatchedDirectories(order: keyof ILocation, fileOrder: FileOrder): Promise<ILocation[]> {
    console.log('Backend: Getting watched directories...');
    return this.locationRepository.getAll({ order, fileOrder });
  }

  async createLocation(dir: ILocation): Promise<ILocation> {
    console.log('Backend: Creating watched directory...');

    const exportExists = await pathExists(path.join(dir.path, 'allusion.json'));
    if (exportExists) {
      console.log('Found export!');
      await this.importLocation(dir);
      return dir;
    } else {
      return this.locationRepository.create(dir);
    }
  }

  async saveLocation(dir: ILocation): Promise<ILocation> {
    console.log('Backend: Saving watched directory...', dir);
    return await this.locationRepository.update(dir);
  }

  async removeLocation(dir: ILocation): Promise<void> {
    console.log('Backend: Removing watched directory...');
    return this.locationRepository.remove(dir);
  }

  // Creates many files at once, and checks for duplicates in the path they are in
  async createFilesFromPath(path: string, files: IFile[]): Promise<IFile[]> {
    console.log('Backend: Creating files...', path, files);
    // Search for file paths that start with 'path', so those can be filtered out
    const criteria: IStringSearchCriteria<IFile> = {
      valueType: 'string',
      operator: 'contains', // Fixme: should be startWith, but doesn't work for some reason :/ 'path' is not an index for 'files' collection?!
      key: 'absolutePath',
      value: path,
    };
    const existingFilesInPath: IFile[] = await this.fileRepository.find({ criteria });
    const newFiles = files.filter((file) =>
      existingFilesInPath.every((f) => f.absolutePath !== file.absolutePath),
    );
    return this.fileRepository.createMany(newFiles);
  }

  async clearDatabase(): Promise<void> {
    console.log('Clearing database...');
    return dbDelete(DB_NAME);
  }
}
