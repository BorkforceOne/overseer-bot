// Firebase App (the core Firebase SDK) is always required and must be listed first
import { config } from '../../utils/config';
import * as path from 'path';
import { firestore } from "firebase-admin";
import { DataService } from "../app/data_service";

type Firestore = firestore.Firestore;

export interface Item {
  id: string,
  /** people who voted up on this item */
  upvoters: string[],
  /** people who voted down on this item */
  downvoters: string[],
}

export interface List {
  id: string,
  data: {
    name: string,
    items: {
      ids: string[];
      byId: {[id:string]: Item}
    }
  }
}

/** the collection for this bot */ 
const repo = 'list';
export class ListService {
  private readonly db: firestore.Firestore | null;

  constructor(
    private readonly dataService: DataService,
  ) {
    this.db = this.dataService.db;
  }

  public async init() {
  } 

  public onSnapshot(fn: (list: List) => void) {
    return this.db?.collection(repo).onSnapshot(e => {
      e.docs.map(d => ({
        id: d.id,
        data: d.data() as any,
      })).forEach(fn);
    });
  } 

  public async list(list: string): Promise<List | null> {
    if (!this.db) {
      return null;
    }
    let doc = await this.db.collection(repo).doc(list).get();
    if (!doc.exists) {
      await this.db.collection(repo).doc(list).create({
        name: list,
        items: {
          byId: {},
          ids: [],
        },
      });
      doc = await this.db.collection(repo).doc(list).get();
    }
    return {
      id: doc.id,
      data: doc.data() as any,
    };
  } 
}
